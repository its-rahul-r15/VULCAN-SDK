import { ZodSchema, ZodError } from 'zod'
import type { ToolDefinition, RunContextLite } from '../types/index.js'

// ─────────────────────────────────────────────
// Tool Class
// ─────────────────────────────────────────────

export class Tool<TInput = unknown, TOutput = unknown>
  implements ToolDefinition<TInput, TOutput>
{
  readonly name: string
  readonly description: string
  readonly inputSchema: ZodSchema<TInput>
  readonly timeoutMs: number
  readonly errorHandler?: (error: Error, input: TInput) => TOutput | string
  readonly requiresApproval?: boolean | ((input: TInput) => boolean)
  private readonly _execute: (input: TInput, context: RunContextLite) => Promise<TOutput>

  constructor(config: ToolConfig<TInput, TOutput>) {
    this.name = config.name
    this.description = config.description
    this.inputSchema = config.inputSchema
    this.timeoutMs = config.timeoutMs ?? 30_000
    this._execute = config.execute
    this.errorHandler = config.errorHandler
    this.requiresApproval = config.requiresApproval
  }

  /**
   * Execute the tool with Zod input validation and timeout enforcement.
   * Returns structured ToolExecutionResult with success/error state.
   */
  async execute(rawInput: TInput, context: RunContextLite): Promise<TOutput> {
    // 1. Validate input against schema
    const parseResult = this.inputSchema.safeParse(rawInput)
    if (!parseResult.success) {
      const validationError = formatZodError(parseResult.error)
      throw new ToolValidationError(this.name, validationError, rawInput)
    }

    const validatedInput = parseResult.data

    // 2. Execute with timeout
    try {
      const result = await withTimeout(
        this._execute(validatedInput, context),
        this.timeoutMs,
        `Tool '${this.name}' timed out after ${this.timeoutMs}ms`,
      )
      return result
    } catch (error) {
      if (error instanceof ToolValidationError || error instanceof ToolTimeoutError) {
        throw error
      }
      const err = error instanceof Error ? error : new Error(String(error))
      // Try the custom error handler if provided
      if (this.errorHandler) {
        const handled = this.errorHandler(err, validatedInput)
        // If handled returns TOutput, return it; if string wrap it
        if (typeof handled === 'string') {
          return handled as unknown as TOutput
        }
        return handled
      }
      throw new ToolExecutionError(this.name, err)
    }
  }

  /**
   * Converts this tool to the OpenAI function calling JSON schema format.
   * Used by the OpenAI provider.
   */
  toOpenAISchema(): OpenAIFunctionSchema {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: zodToJsonSchema(this.inputSchema),
      },
    }
  }

  /**
   * Converts to Anthropic tool format.
   */
  toAnthropicSchema(): AnthropicToolSchema {
    return {
      name: this.name,
      description: this.description,
      input_schema: zodToJsonSchema(this.inputSchema),
    }
  }

  /**
   * Converts to Gemini function declaration format.
   */
  toGeminiSchema(): GeminiFunctionSchema {
    return {
      name: this.name,
      description: this.description,
      parameters: zodToJsonSchema(this.inputSchema),
    }
  }

  /** Static factory for cleaner ergonomics */
  static create<I, O>(config: ToolConfig<I, O>): Tool<I, O> {
    return new Tool<I, O>(config)
  }
}

// ─────────────────────────────────────────────
// Tool Config Interface
// ─────────────────────────────────────────────

export interface ToolConfig<TInput, TOutput> {
  /** Unique tool name — must be snake_case */
  name: string
  /** Human-readable description sent to the model */
  description: string
  /** Zod schema for input validation */
  inputSchema: ZodSchema<TInput>
  /** Async execution function */
  execute: (input: TInput, context: RunContextLite) => Promise<TOutput>
  /** Optional custom error handler — return a value instead of throwing */
  errorHandler?: (error: Error, input: TInput) => TOutput | string
  /** Execution timeout in milliseconds (default: 30000) */
  timeoutMs?: number
  /** Require Human-in-the-Loop approval before executing this tool */
  requiresApproval?: boolean | ((input: any) => boolean)
}

// ─────────────────────────────────────────────
// Error Classes
// ─────────────────────────────────────────────

export class ToolValidationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly validationMessage: string,
    public readonly input: unknown,
  ) {
    super(`Tool '${toolName}' input validation failed: ${validationMessage}`)
    this.name = 'ToolValidationError'
  }
}

export class ToolExecutionError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly cause: Error,
  ) {
    super(`Tool '${toolName}' execution failed: ${cause.message}`)
    this.name = 'ToolExecutionError'
    this.stack = cause.stack
  }
}

export class ToolTimeoutError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly timeoutMs: number,
  ) {
    super(`Tool '${toolName}' timed out after ${timeoutMs}ms`)
    this.name = 'ToolTimeoutError'
  }
}

// ─────────────────────────────────────────────
// JSON Schema Types (for provider compatibility)
// ─────────────────────────────────────────────

export interface OpenAIFunctionSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface AnthropicToolSchema {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface GeminiFunctionSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}

// ─────────────────────────────────────────────
// Utility: Zod → JSON Schema
// ─────────────────────────────────────────────

/**
 * Converts a Zod schema to a JSON Schema compatible object.
 * This is a lightweight converter covering the most common Zod types.
 */
export function zodToJsonSchema(schema: ZodSchema): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._def

  switch (def.typeName) {
    case 'ZodObject': {
      const shape = def.shape() as Record<string, ZodSchema>
      const properties: Record<string, unknown> = {}
      const required: string[] = []

      for (const [key, fieldSchema] of Object.entries(shape)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldDef = (fieldSchema as any)._def
        const isOptional = fieldDef.typeName === 'ZodOptional'
        const innerSchema = isOptional ? fieldDef.innerType : fieldSchema
        properties[key] = zodToJsonSchema(innerSchema as ZodSchema)
        if (!isOptional) required.push(key)
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false,
      }
    }

    case 'ZodString': {
      const result: Record<string, unknown> = { type: 'string' }
      if (def.description) result.description = def.description as string
      return result
    }

    case 'ZodNumber': {
      return { type: 'number' }
    }

    case 'ZodBoolean': {
      return { type: 'boolean' }
    }

    case 'ZodArray': {
      return {
        type: 'array',
        items: zodToJsonSchema(def.type as ZodSchema),
      }
    }

    case 'ZodEnum': {
      return { type: 'string', enum: def.values as string[] }
    }

    case 'ZodOptional': {
      return zodToJsonSchema(def.innerType as ZodSchema)
    }

    case 'ZodNullable': {
      const inner = zodToJsonSchema(def.innerType as ZodSchema)
      return { ...inner, nullable: true }
    }

    case 'ZodLiteral': {
      return { type: typeof def.value, enum: [def.value] }
    }

    case 'ZodUnion': {
      return {
        oneOf: (def.options as ZodSchema[]).map((o) => zodToJsonSchema(o)),
      }
    }

    default:
      return { type: 'string', description: 'Unknown type — treated as string' }
  }
}

// ─────────────────────────────────────────────
// Utility: Timeout wrapper
// ─────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ToolTimeoutError('unknown', ms))
    }, ms)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((err: unknown) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

// ─────────────────────────────────────────────
// Utility: Format Zod errors
// ─────────────────────────────────────────────

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')} — ${issue.message}`)
    .join('; ')
}
