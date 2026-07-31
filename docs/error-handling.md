# Error Handling

Vulcan uses typed error classes so you can handle failures precisely.

## Error Classes

| Class | When thrown |
|-------|-------------|
| `AgentConfigError` | Invalid agent config (missing name, instructions) |
| `ProviderNotFoundError` | Using a provider that isn't registered |
| `ProviderError` | LLM API call failed (with status code + retryable flag) |
| `ToolValidationError` | Tool input failed Zod schema validation |
| `ToolExecutionError` | Tool function threw an unhandled error |
| `ToolTimeoutError` | Tool exceeded its `timeoutMs` |
| `GuardrailBlockedError` | Guardrail blocked input, output, or tool |
| `HandoffLoopError` | Handoff chain visited the same agent twice |
| `StructuredOutputValidationError` | Output didn't match Zod schema after retries |
| `HarnessParseError` | Harness mode response couldn't be parsed as JSON step |

## Handling Run Results

The runner catches all errors and reflects them in `RunResult.status`:

```typescript
const result = await agent.run('Hello')

switch (result.status) {
  case 'completed':
    console.log('Success:', result.output)
    break
  case 'failed':
    console.error('Failed:', result.error)
    break
  case 'max_turns_reached':
    console.warn('Timed out after', result.turns, 'turns')
    break
  case 'guardrail_blocked':
    console.warn('Blocked by guardrail:', result.error)
    break
}
```

## Provider Errors & Retries

Vulcan automatically retries on retryable provider errors (429 rate limit, 503 service unavailable) with exponential backoff:

- Attempt 1: immediate
- Attempt 2: 500ms delay
- Attempt 3: 1000ms delay
- Attempt 4: 2000ms delay

After all retries fail, tries the next provider in `fallbackProviders`.

Listen for retry events:

```typescript
for await (const event of agent.stream('Hello')) {
  if (event.type === 'retry') {
    const { provider, attempt, delay } = event.data as { provider: string; attempt: number; delay: number }
    console.log(`Retrying ${provider} (attempt ${attempt}, waiting ${delay}ms)`)
  }
}
```

## Tool Error Handling

```typescript
// Strategy 1: errorHandler — graceful fallback, run continues
const tool = Vulcan.createTool({
  name: 'fetch_data',
  execute: async () => { throw new Error('API down') },
  errorHandler: (error) => `Service unavailable: ${error.message}`,
  // ↑ The model receives this as the tool result and can adapt
})

// Strategy 2: throw — ToolExecutionError, run fails unless caught
const tool = Vulcan.createTool({
  name: 'fetch_data',
  execute: async () => { throw new Error('Critical failure') },
  // No errorHandler — error becomes a tool result message to the model
})
```

## Importing Error Classes

```typescript
import {
  AgentConfigError,
  ProviderError,
  ProviderNotFoundError,
  ToolValidationError,
  ToolExecutionError,
  ToolTimeoutError,
  GuardrailBlockedError,
  HandoffLoopError,
  StructuredOutputValidationError,
} from '@vulcan-ai/sdk'

try {
  const result = await agent.run('Hello')
} catch (error) {
  if (error instanceof ProviderNotFoundError) {
    console.error('Provider not registered:', error.message)
  } else if (error instanceof GuardrailBlockedError) {
    console.error(`Blocked by ${error.guardrailName}:`, error.reason)
  }
}
```
