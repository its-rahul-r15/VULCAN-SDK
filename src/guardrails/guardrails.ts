import type {
  Guardrail,
  GuardrailPayload,
  GuardrailResult,
  GuardrailType,
  RunContextLite,
} from '../types/index.js'
import { ZodSchema } from 'zod'

// ─────────────────────────────────────────────
// Base Guardrail Helper
// ─────────────────────────────────────────────

abstract class BaseGuardrail implements Guardrail {
  abstract readonly name: string
  abstract readonly type: GuardrailType | GuardrailType[]
  abstract check(payload: GuardrailPayload): Promise<GuardrailResult>

  protected pass(modifiedContent?: string): GuardrailResult {
    return { passed: true, modifiedContent }
  }

  protected fail(reason: string): GuardrailResult {
    return { passed: false, reason }
  }
}

// ─────────────────────────────────────────────
// Built-in Guardrails
// ─────────────────────────────────────────────

/**
 * Blocks inputs/outputs exceeding a character limit.
 */
export class MaxLengthGuardrail extends BaseGuardrail {
  readonly name: string
  readonly type: GuardrailType | GuardrailType[]

  constructor(
    private readonly maxChars: number,
    options: { type?: GuardrailType | GuardrailType[]; name?: string } = {},
  ) {
    super()
    this.name = options.name ?? `max-length-${maxChars}`
    this.type = options.type ?? ['input', 'output']
  }

  async check(payload: GuardrailPayload): Promise<GuardrailResult> {
    if (payload.content.length > this.maxChars) {
      return this.fail(
        `Content length ${payload.content.length} exceeds maximum of ${this.maxChars} characters.`,
      )
    }
    return this.pass()
  }
}

/**
 * Blocks content containing any of the specified keywords.
 */
export class KeywordBlockGuardrail extends BaseGuardrail {
  readonly name: string
  readonly type: GuardrailType | GuardrailType[]
  private readonly lowerKeywords: string[]

  constructor(
    private readonly keywords: string[],
    options: { type?: GuardrailType | GuardrailType[]; name?: string; caseSensitive?: boolean } = {},
  ) {
    super()
    this.name = options.name ?? 'keyword-block'
    this.type = options.type ?? 'input'
    this.lowerKeywords = options.caseSensitive ? keywords : keywords.map((k) => k.toLowerCase())
  }

  async check(payload: GuardrailPayload): Promise<GuardrailResult> {
    const content = this.lowerKeywords.includes(
      payload.content.toLowerCase(),
    )
      ? payload.content.toLowerCase()
      : payload.content

    for (const keyword of this.lowerKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return this.fail(`Content contains blocked keyword: '${keyword}'`)
      }
    }
    return this.pass()
  }
}

/**
 * Validates structured output against a Zod schema.
 */
export class StructuredOutputGuardrail extends BaseGuardrail {
  readonly name = 'structured-output-validation'
  readonly type: GuardrailType = 'output'

  constructor(private readonly schema: ZodSchema) {
    super()
  }

  async check(payload: GuardrailPayload): Promise<GuardrailResult> {
    try {
      const parsed = JSON.parse(payload.content) as unknown
      const result = this.schema.safeParse(parsed)
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(', ')
        return this.fail(`Output schema validation failed: ${errors}`)
      }
      return this.pass()
    } catch {
      return this.fail('Output is not valid JSON — cannot validate schema.')
    }
  }
}

/**
 * Blocks specific tools from being called.
 * Useful for preventing dangerous operations in certain contexts.
 */
export class BlockedToolsGuardrail extends BaseGuardrail {
  readonly name: string
  readonly type: GuardrailType = 'tool'

  constructor(
    private readonly blockedTools: string[],
    name?: string,
  ) {
    super()
    this.name = name ?? 'blocked-tools'
  }

  async check(payload: GuardrailPayload): Promise<GuardrailResult> {
    if (payload.toolName && this.blockedTools.includes(payload.toolName)) {
      return this.fail(`Tool '${payload.toolName}' is not allowed by policy.`)
    }
    return this.pass()
  }
}

/**
 * Custom guardrail via function — for one-off validations.
 */
export class FunctionGuardrail extends BaseGuardrail {
  readonly name: string
  readonly type: GuardrailType | GuardrailType[]

  constructor(
    name: string,
    type: GuardrailType | GuardrailType[],
    private readonly fn: (
      payload: GuardrailPayload,
      context: RunContextLite,
    ) => Promise<GuardrailResult>,
  ) {
    super()
    this.name = name
    this.type = type
  }

  async check(payload: GuardrailPayload): Promise<GuardrailResult> {
    return this.fn(payload, payload.context)
  }
}

/**
 * PII Scrubber — strips common PII patterns from output.
 */
export class PIIScrubberGuardrail extends BaseGuardrail {
  readonly name = 'pii-scrubber'
  readonly type: GuardrailType = 'output'

  private static readonly PII_PATTERNS: [RegExp, string][] = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]'],
    [/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]'],
    [/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD]'],
    [/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]'],
  ]

  async check(payload: GuardrailPayload): Promise<GuardrailResult> {
    let content = payload.content
    for (const [pattern, replacement] of PIIScrubberGuardrail.PII_PATTERNS) {
      content = content.replace(pattern, replacement)
    }
    // If content was modified, return the scrubbed version
    if (content !== payload.content) {
      return this.pass(content)
    }
    return this.pass()
  }
}

// ─────────────────────────────────────────────
// Guardrail Runner Utility
// Used internally by the AgentRunner
// ─────────────────────────────────────────────

export async function runGuardrails(
  guardrails: Guardrail[],
  payload: GuardrailPayload,
): Promise<{ passed: boolean; failedGuardrail?: string; reason?: string; modifiedContent?: string }> {
  const applicableGuardrails = guardrails.filter((g) => {
    const types = Array.isArray(g.type) ? g.type : [g.type]
    return types.includes(payload.type)
  })

  let currentContent = payload.content

  for (const guardrail of applicableGuardrails) {
    const result = await guardrail.check({
      ...payload,
      content: currentContent,
    })

    if (!result.passed) {
      return {
        passed: false,
        failedGuardrail: guardrail.name,
        reason: result.reason,
      }
    }

    // If the guardrail modified content (e.g. PII scrubbing), carry forward
    if (result.modifiedContent !== undefined) {
      currentContent = result.modifiedContent
    }
  }

  return {
    passed: true,
    modifiedContent: currentContent !== payload.content ? currentContent : undefined,
  }
}

export class GuardrailBlockedError extends Error {
  constructor(
    public readonly guardrailName: string,
    public readonly reason: string,
    public readonly guardrailType: GuardrailType,
  ) {
    super(`Guardrail '${guardrailName}' blocked execution: ${reason}`)
    this.name = 'GuardrailBlockedError'
  }
}
