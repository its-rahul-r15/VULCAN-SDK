import type {
  Message,
  ModelResponse,
  ProviderCallConfig,
  StreamChunk,
  TokenUsage,
} from '../types/index.js'
import type { ToolDefinition } from '../types/index.js'

// ─────────────────────────────────────────────
// ModelProvider Interface
// ─────────────────────────────────────────────

/**
 * Every model provider must implement this interface.
 * The Runner interacts only with this abstraction — never directly with any SDK.
 */
export interface ModelProvider {
  /** Unique identifier for this provider (e.g. 'openai', 'anthropic', 'gemini') */
  readonly name: string

  /**
   * Perform a single chat completion.
   * Returns a unified ModelResponse regardless of the underlying API format.
   */
  chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): Promise<ModelResponse>

  /**
   * Stream a chat completion.
   * Yields StreamChunk objects as they arrive.
   */
  stream(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): AsyncGenerator<StreamChunk>

  /**
   * Optional: estimate token count for the given messages.
   */
  countTokens?(messages: Message[], model: string): Promise<number>
}

// ─────────────────────────────────────────────
// Provider Registry
// ─────────────────────────────────────────────

class ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>()

  /**
   * Register a provider under a name.
   * Built-in providers are auto-registered when their module is imported.
   */
  register(name: string, provider: ModelProvider): void {
    this.providers.set(name, provider)
  }

  /**
   * Retrieve a registered provider by name.
   * Throws if not found.
   */
  get(name: string): ModelProvider {
    const provider = this.providers.get(name)
    if (!provider) {
      const available = Array.from(this.providers.keys()).join(', ') || 'none'
      throw new ProviderNotFoundError(name, available)
    }
    return provider
  }

  has(name: string): boolean {
    return this.providers.has(name)
  }

  list(): string[] {
    return Array.from(this.providers.keys())
  }
}

/** Global singleton registry */
export const providerRegistry = new ProviderRegistry()

// ─────────────────────────────────────────────
// Abstract Base Provider
// Provides utilities — concrete providers extend this
// ─────────────────────────────────────────────

export abstract class BaseProvider implements ModelProvider {
  abstract readonly name: string

  abstract chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): Promise<ModelResponse>

  abstract stream(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): AsyncGenerator<StreamChunk>

  /** Merges usage from multiple model calls */
  protected mergeUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
    return {
      promptTokens: a.promptTokens + b.promptTokens,
      completionTokens: a.completionTokens + b.completionTokens,
      totalTokens: a.totalTokens + b.totalTokens,
    }
  }

  /** Separates system messages from conversation messages */
  protected extractSystemPrompt(messages: Message[]): {
    system: string
    rest: Message[]
  } {
    const systemMessages = messages.filter((m) => m.role === 'system')
    const rest = messages.filter((m) => m.role !== 'system')
    const system = systemMessages.map((m) => m.content).join('\n\n')
    return { system, rest }
  }
}

// ─────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────

export class ProviderNotFoundError extends Error {
  constructor(name: string, available: string) {
    super(
      `Provider '${name}' is not registered. Available providers: [${available}]. ` +
        `Import and register one: e.g. import { OpenAIProvider } from '@vulcan-ai/sdk'; ` +
        `Vulcan.registerProvider('openai', new OpenAIProvider(apiKey))`,
    )
    this.name = 'ProviderNotFoundError'
  }
}

export class ProviderError extends Error {
  constructor(
    public readonly providerName: string,
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(`[${providerName}] ${message}`)
    this.name = 'ProviderError'
  }
}
