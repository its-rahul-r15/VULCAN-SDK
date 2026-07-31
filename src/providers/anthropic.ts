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
import { zodToJsonSchema } from '../tools/schema.js'

// ─────────────────────────────────────────────
// Anthropic (Claude) Provider
// ─────────────────────────────────────────────

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic'
  private clientCache: AnthropicInstance | null = null

  constructor(private readonly apiKey?: string) {
    super()
  }

  async chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): Promise<ModelResponse> {
    const client = await this._getClient()
    const { system, rest } = this.extractSystemPrompt(messages)

    const anthropicMessages = this._toAnthropicMessages(rest)
    const anthropicTools =
      tools.length > 0
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: zodToJsonSchema(t.inputSchema),
          }))
        : undefined

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (client as any).messages.create({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        system: system || undefined,
        messages: anthropicMessages,
        tools: anthropicTools,
        temperature: config.temperature ?? 0.7,
      })

      // Parse Anthropic's content blocks
      let textContent = ''
      const toolCalls: ToolCall[] = []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const block of (response.content as any[])) {
        if (block.type === 'text') {
          textContent += String(block.text)
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: String(block.id),
            name: String(block.name),
            arguments: block.input as Record<string, unknown>,
          })
        }
      }

      const usage: TokenUsage = {
        promptTokens: (response.usage?.input_tokens as number) ?? 0,
        completionTokens: (response.usage?.output_tokens as number) ?? 0,
        totalTokens:
          ((response.usage?.input_tokens as number) ?? 0) +
          ((response.usage?.output_tokens as number) ?? 0),
      }

      const finishReason =
        response.stop_reason === 'tool_use'
          ? 'tool_calls'
          : response.stop_reason === 'end_turn'
            ? 'stop'
            : 'stop'

      return {
        content: textContent,
        toolCalls,
        usage,
        finishReason,
        model: response.model as string,
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
    const client = await this._getClient()
    const { system, rest } = this.extractSystemPrompt(messages)

    const anthropicMessages = this._toAnthropicMessages(rest)
    const anthropicTools =
      tools.length > 0
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: zodToJsonSchema(t.inputSchema),
          }))
        : undefined

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (client as any).messages.stream({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        system: system || undefined,
        messages: anthropicMessages,
        tools: anthropicTools,
        temperature: config.temperature ?? 0.7,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const event of stream as AsyncIterable<any>) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          yield { type: 'text_delta', content: String(event.delta.text) }
        }
      }

      yield { type: 'done' }
    } catch (error) {
      throw this._wrapError(error)
    }
  }

  private _toAnthropicMessages(messages: Message[]): AnthropicMessage[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.toolCallId ?? '',
              content: m.content,
            },
          ],
        }
      }
      return {
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }
    })
  }

  private async _getClient(): Promise<AnthropicInstance> {
    if (this.clientCache) return this.clientCache

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: Anthropic } = require('@anthropic-ai/sdk') as {
        default: new (opts: Record<string, unknown>) => AnthropicInstance
      }
      this.clientCache = new Anthropic({
        apiKey: this.apiKey ?? process.env.ANTHROPIC_API_KEY,
      })
      return this.clientCache
    } catch {
      throw new ProviderError(
        'anthropic',
        'Anthropic package not found. Install it: npm install @anthropic-ai/sdk',
      )
    }
  }

  private _wrapError(error: unknown): ProviderError {
    if (error instanceof ProviderError) return error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any
    const status = (e.status ?? e.statusCode) as number | undefined
    return new ProviderError('anthropic', String(e.message ?? error), status, status === 429)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnthropicInstance = any

type AnthropicMessage =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'user'; content: { type: 'tool_result'; tool_use_id: string; content: string }[] }

// Auto-register when imported
providerRegistry.register('anthropic', new AnthropicProvider())
