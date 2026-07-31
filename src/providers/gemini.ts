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
// Gemini Provider
// ─────────────────────────────────────────────

export class GeminiProvider extends BaseProvider {
  readonly name = 'gemini'

  constructor(private readonly apiKey?: string) {
    super()
  }

  async chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): Promise<ModelResponse> {
    const model = await this._getModel(config.model)
    const { system, rest } = this.extractSystemPrompt(messages)

    const geminiContents = this._toGeminiContents(rest)
    const geminiFunctionDeclarations =
      tools.length > 0
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: zodToJsonSchema(t.inputSchema),
          }))
        : undefined

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestBody: any = {
        contents: geminiContents,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens,
          responseMimeType:
            config.responseFormat === 'json_object' ? 'application/json' : 'text/plain',
        },
      }

      if (system) {
        requestBody.systemInstruction = { parts: [{ text: system }] }
      }

      if (geminiFunctionDeclarations) {
        requestBody.tools = [{ functionDeclarations: geminiFunctionDeclarations }]
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (model as any).generateContent(requestBody)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = result.response as any

      let textContent = ''
      const toolCalls: ToolCall[] = []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = response.candidates?.[0]?.content?.parts ?? []
      let callIndex = 0
      for (const part of parts) {
        if (typeof part.text === 'string') {
          textContent += part.text
        } else if (part.functionCall) {
          toolCalls.push({
            id: `gemini-call-${callIndex++}`,
            name: String(part.functionCall.name),
            arguments: part.functionCall.args as Record<string, unknown>,
          })
        }
      }

      const usageMetadata = response.usageMetadata as Record<string, number> | undefined
      const usage: TokenUsage = {
        promptTokens: usageMetadata?.promptTokenCount ?? 0,
        completionTokens: usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: usageMetadata?.totalTokenCount ?? 0,
      }

      const finishReason =
        toolCalls.length > 0
          ? 'tool_calls'
          : response.candidates?.[0]?.finishReason === 'STOP'
            ? 'stop'
            : 'stop'

      return {
        content: textContent,
        toolCalls,
        usage,
        finishReason,
        model: config.model,
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
    const model = await this._getModel(config.model)
    const { system, rest } = this.extractSystemPrompt(messages)
    const geminiContents = this._toGeminiContents(rest)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestBody: any = {
        contents: geminiContents,
        generationConfig: { temperature: config.temperature ?? 0.7 },
      }
      if (system) {
        requestBody.systemInstruction = { parts: [{ text: system }] }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { stream } = await (model as any).generateContentStream(requestBody)

      for await (const chunk of stream) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = (chunk as any).text?.() as string | undefined
        if (text) {
          yield { type: 'text_delta', content: text }
        }
      }

      yield { type: 'done' }
    } catch (error) {
      throw this._wrapError(error)
    }
  }

  private _toGeminiContents(messages: Message[]): GeminiContent[] {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
  }

  private modelCache = new Map<string, GeminiInstance>()
  private genAI: GeminiInstance | null = null

  private async _getModel(modelName: string): Promise<GeminiInstance> {
    // Return cached model instance if already created
    if (this.modelCache.has(modelName)) {
      return this.modelCache.get(modelName)!
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GoogleGenerativeAI } = require('@google/generative-ai') as {
        GoogleGenerativeAI: new (key: string) => { getGenerativeModel(opts: Record<string, unknown>): GeminiInstance }
      }

      const apiKey = this.apiKey ?? process.env.GEMINI_API_KEY ?? ''
      if (!apiKey) {
        throw new ProviderError(
          'gemini',
          'Gemini API key not found. Set GEMINI_API_KEY environment variable or pass apiKey to GeminiProvider constructor.',
        )
      }

      if (!this.genAI) {
        this.genAI = new GoogleGenerativeAI(apiKey)
      }

      const model = this.genAI.getGenerativeModel({ model: modelName })
      this.modelCache.set(modelName, model)
      return model
    } catch (error) {
      if (error instanceof ProviderError) throw error
      throw new ProviderError(
        'gemini',
        'Google Generative AI package not found. Install it: npm install @google/generative-ai',
      )
    }
  }

  private _wrapError(error: unknown): ProviderError {
    if (error instanceof ProviderError) return error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any
    const status = e.status as number | undefined
    return new ProviderError('gemini', String(e.message ?? error), status, status === 429)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeminiInstance = any

interface GeminiContent {
  role: 'user' | 'model'
  parts: { text: string }[]
}

// Auto-register when imported
providerRegistry.register('gemini', new GeminiProvider())
