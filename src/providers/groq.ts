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

export interface GroqProviderOptions {
  apiKey?: string
  baseURL?: string
  timeoutMs?: number
}

// ─────────────────────────────────────────────
// Groq Provider (OpenAI Compatible + Native Fetch Fallback)
// Supports Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1, Mixtral, Gemma 2
// ─────────────────────────────────────────────

export class GroqProvider extends BaseProvider {
  readonly name = 'groq'
  private apiKey: string
  private baseURL: string

  constructor(apiKey?: string, options?: GroqProviderOptions) {
    super()
    this.apiKey = apiKey || process.env.GROQ_API_KEY || ''
    this.baseURL = options?.baseURL || 'https://api.groq.com/openai/v1'
  }

  private getApiKey(): string {
    const key = this.apiKey || process.env.GROQ_API_KEY
    if (!key) {
      throw new ProviderError(
        'groq',
        'GROQ_API_KEY environment variable is missing. Get your API key at https://console.groq.com',
        401,
      )
    }
    return key
  }

  async chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): Promise<ModelResponse> {
    const apiKey = this.getApiKey()
    const model = normalizeGroqModel(config.model)

    const formattedMessages = this._toOpenAIMessages(messages)
    const formattedTools =
      tools.length > 0
        ? tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: zodToJsonSchema(t.inputSchema),
            },
          }))
        : undefined

    const payload: Record<string, unknown> = {
      model,
      messages: formattedMessages,
      temperature: config.temperature ?? 0.7,
    }

    if (formattedTools && formattedTools.length > 0) {
      payload.tools = formattedTools
      payload.tool_choice = 'auto'
    }

    if (config.maxTokens) {
      payload.max_tokens = config.maxTokens
    }

    if (config.responseFormat === 'json_object') {
      payload.response_format = { type: 'json_object' }
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorJson: { error?: { message?: string } } = {}
        try {
          errorJson = JSON.parse(errorText)
        } catch {
          // fallback text
        }
        const message = errorJson.error?.message || `Groq API Error HTTP ${response.status}: ${errorText}`
        throw new ProviderError('groq', message, response.status, response.status >= 500 || response.status === 429)
      }

      const data = (await response.json()) as {
        id: string
        model: string
        choices: Array<{
          message: {
            content: string | null
            tool_calls?: Array<{
              id: string
              function: {
                name: string
                arguments: string
              }
            }>
          }
          finish_reason: string
        }>
        usage?: {
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
        }
      }

      const choice = data.choices?.[0]
      if (!choice) {
        throw new ProviderError('groq', 'No choices returned from Groq API', 500)
      }

      const toolCalls: ToolCall[] = (choice.message.tool_calls ?? []).map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: safeJsonParse(tc.function.arguments),
      }))

      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      }

      return {
        content: choice.message.content ?? '',
        toolCalls,
        usage,
        finishReason: this._mapFinishReason(choice.finish_reason),
        model: data.model || model,
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error
      const err = error instanceof Error ? error : new Error(String(error))
      throw new ProviderError('groq', `Groq request failed: ${err.message}`, 500)
    }
  }

  async *stream(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): AsyncGenerator<StreamChunk> {
    const apiKey = this.getApiKey()
    const model = normalizeGroqModel(config.model)

    const formattedMessages = this._toOpenAIMessages(messages)
    const formattedTools =
      tools.length > 0
        ? tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: zodToJsonSchema(t.inputSchema),
            },
          }))
        : undefined

    const payload: Record<string, unknown> = {
      model,
      messages: formattedMessages,
      stream: true,
      temperature: config.temperature ?? 0.7,
    }

    if (formattedTools && formattedTools.length > 0) {
      payload.tools = formattedTools
      payload.tool_choice = 'auto'
    }

    if (config.maxTokens) {
      payload.max_tokens = config.maxTokens
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        throw new ProviderError('groq', `Groq stream error (${response.status}): ${errorText}`, response.status)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue
          if (trimmed === 'data: [DONE]') {
            yield { type: 'done' }
            return
          }
          if (trimmed.startsWith('data: ')) {
            const rawData = trimmed.slice(6)
            try {
              const parsed = JSON.parse(rawData) as {
                choices?: Array<{
                  delta?: {
                    content?: string
                    tool_calls?: Array<{
                      id?: string
                      function?: {
                        name?: string
                        arguments?: string
                      }
                    }>
                  }
                }>
              }
              const delta = parsed.choices?.[0]?.delta
              if (delta?.content) {
                yield { type: 'text_delta', content: delta.content }
              }
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  yield {
                    type: 'tool_call_delta',
                    toolCall: {
                      id: tc.id,
                      name: tc.function?.name,
                      arguments: tc.function?.arguments ? safeJsonParse(tc.function.arguments) : undefined,
                    },
                  }
                }
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error
      const err = error instanceof Error ? error : new Error(String(error))
      throw new ProviderError('groq', `Groq stream failed: ${err.message}`, 500)
    }

    yield { type: 'done' }
  }

  private _toOpenAIMessages(messages: Message[]) {
    return messages.map((m) => {
      if (m.role === 'system') return { role: 'system', content: m.content }
      if (m.role === 'user') return { role: 'user', content: m.content }
      if (m.role === 'assistant') {
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls:
            m.toolCalls && m.toolCalls.length > 0
              ? m.toolCalls.map((tc) => ({
                  id: tc.id,
                  type: 'function' as const,
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.arguments),
                  },
                }))
              : undefined,
        }
      }
      if (m.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: m.toolCallId ?? '',
          content: m.content,
        }
      }
      return { role: 'user', content: m.content }
    })
  }

  private _mapFinishReason(reason?: string) {
    if (reason === 'stop') return 'stop'
    if (reason === 'tool_calls') return 'tool_calls'
    if (reason === 'length') return 'length'
    return 'stop'
  }
}

function normalizeGroqModel(model?: string): string {
  if (!model) return 'llama-3.3-70b-versatile'
  const cleaned = model.replace(/^groq\//i, '')
  if (cleaned === 'llama-3.3-70b' || cleaned === 'llama3.3') return 'llama-3.3-70b-versatile'
  if (cleaned === 'llama-3.1-8b' || cleaned === 'llama3.1') return 'llama-3.1-8b-instant'
  if (cleaned === 'deepseek-r1') return 'deepseek-r1-distill-llama-70b'
  return cleaned
}

function safeJsonParse(jsonStr?: string): Record<string, unknown> {
  if (!jsonStr) return {}
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>
  } catch {
    return { raw: jsonStr }
  }
}

// Auto-register Groq provider
export const groqProvider = new GroqProvider()
providerRegistry.register('groq', groqProvider)
