import type {
  Message,
  ModelResponse,
  ProviderCallConfig,
  StreamChunk,
  ToolCall,
  TokenUsage,
} from '../types/index.js'
import type { ToolDefinition } from '../types/index.js'
import { BaseProvider, ProviderError, providerRegistry } from './provider.js'

// ─────────────────────────────────────────────
// OpenAI Provider
// ─────────────────────────────────────────────

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai'
  private client: OpenAIClient

  constructor(apiKey?: string, options?: OpenAIProviderOptions) {
    super()
    this.client = createOpenAIClient(apiKey, options)
  }

  async chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): Promise<ModelResponse> {
    const openai = await this.client.getClient()

    const openaiMessages = this._toOpenAIMessages(messages)
    const openaiTools =
      tools.length > 0
        ? tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: require('../tools/schema.js').zodToJsonSchema(t.inputSchema),
            },
          }))
        : undefined

    try {
      const response = await openai.chat.completions.create({
        model: config.model,
        messages: openaiMessages,
        tools: openaiTools,
        tool_choice: openaiTools ? 'auto' : undefined,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        response_format:
          config.responseFormat === 'json_object'
            ? { type: 'json_object' }
            : undefined,
      })

      const choice = response.choices[0]
      if (!choice) throw new ProviderError('openai', 'No choices in response', 500)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolCalls: ToolCall[] = (choice.message.tool_calls ?? []).map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>,
      }))

      const usage: TokenUsage = {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      }

      return {
        content: choice.message.content ?? '',
        toolCalls,
        usage,
        finishReason: this._mapFinishReason(choice.finish_reason),
        model: response.model,
      }
    } catch (error) {
      throw this._wrapError(error)
    }
  }

  async *stream(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): AsyncGenerator<StreamChunk> {
    const openai = await this.client.getClient()

    const openaiMessages = this._toOpenAIMessages(messages)
    const openaiTools =
      tools.length > 0
        ? tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: require('../tools/schema.js').zodToJsonSchema(t.inputSchema),
            },
          }))
        : undefined

    try {
      const stream = await openai.chat.completions.create({
        model: config.model,
        messages: openaiMessages,
        tools: openaiTools,
        tool_choice: openaiTools ? 'auto' : undefined,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        stream: true,
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (!delta) continue

        if (delta.content) {
          yield { type: 'text_delta', content: delta.content }
        }

        if (delta.tool_calls?.[0]) {
          const tc = delta.tool_calls[0]
          yield {
            type: 'tool_call_delta',
            toolCall: {
              id: tc.id,
              name: tc.function?.name,
              arguments: tc.function?.arguments
                ? (JSON.parse(tc.function.arguments) as Record<string, unknown>)
                : undefined,
            },
          }
        }
      }

      yield { type: 'done' }
    } catch (error) {
      throw this._wrapError(error)
    }
  }

  // ── Private helpers ──

  private _toOpenAIMessages(messages: Message[]): OpenAIMessage[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          content: m.content,
          tool_call_id: m.toolCallId ?? '',
        }
      }
      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: 'assistant' as const,
          content: m.content || '',
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        }
      }
      return {
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }
    })
  }

  private _mapFinishReason(
    reason: string | null,
  ): ModelResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'tool_calls':
        return 'tool_calls'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'content_filter'
      default:
        return 'stop'
    }
  }

  private _wrapError(error: unknown): ProviderError {
    if (error instanceof ProviderError) return error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any
    const status = (e.status ?? e.statusCode) as number | undefined
    const retryable = status === 429 || status === 503 || status === 502
    return new ProviderError(
      'openai',
      String(e.message ?? error),
      status,
      retryable,
    )
  }
}

// ─────────────────────────────────────────────
// Lazy OpenAI client loader
// ─────────────────────────────────────────────

interface OpenAIProviderOptions {
  baseURL?: string
  organization?: string
  maxRetries?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenAIInstance = any

type OpenAIMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'tool'; content: string; tool_call_id: string }

class OpenAIClient {
  private instance: OpenAIInstance | null = null
  constructor(
    private readonly apiKey?: string,
    private readonly options?: OpenAIProviderOptions,
  ) {}

  async getClient(): Promise<OpenAIInstance> {
    if (this.instance) return this.instance

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: OpenAI } = require('openai') as {
        default: new (opts: Record<string, unknown>) => OpenAIInstance
      }
      this.instance = new OpenAI({
        apiKey: this.apiKey ?? process.env.OPENAI_API_KEY,
        baseURL: this.options?.baseURL,
        organization: this.options?.organization,
        maxRetries: this.options?.maxRetries ?? 0, // We handle retries ourselves
      })
      return this.instance
    } catch {
      throw new ProviderError(
        'openai',
        'OpenAI package not found. Install it: npm install openai',
      )
    }
  }
}

function createOpenAIClient(
  apiKey?: string,
  options?: OpenAIProviderOptions,
): OpenAIClient {
  return new OpenAIClient(apiKey, options)
}

// Auto-register when imported
const _defaultProvider = new OpenAIProvider()
providerRegistry.register('openai', _defaultProvider)
