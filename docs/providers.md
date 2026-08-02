# Providers

Vulcan supports multiple AI providers through a unified abstraction. Switch providers by changing one string.

## Built-in Providers

### OpenAI

```typescript
import { OpenAIProvider, Vulcan } from '@vulcan-ai/sdk'

Vulcan.registerProvider('openai', new OpenAIProvider(process.env.OPENAI_API_KEY))

const agent = Vulcan.createAgent({
  name: 'agent',
  instructions: '...',
  providerName: 'openai',
  model: 'gpt-4o',  // or 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', etc.
})
```

OpenAI is auto-registered when you `import '@vulcan-ai/sdk'`.

### Anthropic (Claude)

```typescript
import { AnthropicProvider, Vulcan } from '@vulcan-ai/sdk'
import '@vulcan-ai/sdk/providers/anthropic'

Vulcan.registerProvider('anthropic', new AnthropicProvider(process.env.ANTHROPIC_API_KEY))

const agent = Vulcan.createAgent({
  name: 'agent',
  instructions: '...',
  providerName: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',  // or 'claude-3-haiku-20240307'
})
```

### Gemini

```typescript
import { GeminiProvider, Vulcan } from '@vulcan-ai/sdk'

Vulcan.registerProvider('gemini', new GeminiProvider(process.env.GEMINI_API_KEY))

const agent = Vulcan.createAgent({
  name: 'agent',
  instructions: '...',
  providerName: 'gemini',
  model: 'gemini-1.5-pro',  // or 'gemini-1.5-flash'
})
```

## Model & Provider Fallbacks

Automatically fall back to alternative providers or model identifiers on failure:

```typescript
// Provider Fallbacks
const agent = Vulcan.createAgent({
  name: 'resilient-agent',
  instructions: '...',
  model: 'gpt-4o',
  providerName: 'openai',
  fallbackProviders: ['anthropic', 'gemini'],
})

// Model Fallbacks (using fluent builder)
const resilientAgent = Vulcan.createAgent({
  name: 'smart-agent',
  instructions: '...',
  model: 'gpt-4o',
})
.withFallbackModels('claude-3-5-sonnet', 'gemini-1.5-pro')
```

The runner tries providers and fallback models in order, with exponential backoff retry on rate limits (429) and server errors (503). If the primary provider or model fails, execution automatically transitions to the next fallback candidate.

## Custom Provider

Implement the `ModelProvider` interface:

```typescript
import type { ModelProvider, Message, ModelResponse, ProviderCallConfig, StreamChunk } from '@vulcan-ai/sdk'
import type { ToolDefinition } from '@vulcan-ai/sdk'

class MyCustomProvider implements ModelProvider {
  readonly name = 'my-provider'

  async chat(
    messages: Message[],
    tools: ToolDefinition[],
    config: ProviderCallConfig,
  ): Promise<ModelResponse> {
    // Call your custom LLM API here
    const response = await myLLM.complete({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      model: config.model,
      temperature: config.temperature,
    })

    return {
      content: response.text,
      toolCalls: [],
      usage: {
        promptTokens: response.usage.input,
        completionTokens: response.usage.output,
        totalTokens: response.usage.total,
      },
      finishReason: 'stop',
      model: config.model,
    }
  }

  async *stream(messages, tools, config): AsyncGenerator<StreamChunk> {
    for await (const chunk of myLLM.stream({ messages, model: config.model })) {
      yield { type: 'text_delta', content: chunk.text }
    }
    yield { type: 'done' }
  }
}

// Register
Vulcan.registerProvider('my-provider', new MyCustomProvider())

// Use
const agent = Vulcan.createAgent({
  name: 'agent',
  instructions: '...',
  providerName: 'my-provider',
  model: 'my-model-v1',
})
```

## Provider Registry

```typescript
import { providerRegistry } from '@vulcan-ai/sdk'

// Register
providerRegistry.register('my-provider', provider)

// Check if registered
providerRegistry.has('openai') // true

// List all registered providers
providerRegistry.list() // ['openai', 'anthropic', 'gemini', ...]

// Get a provider (throws if not found)
const provider = providerRegistry.get('openai')
```
