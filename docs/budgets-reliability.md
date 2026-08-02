# Run Budgets & Reliability

Vulcan SDK provides enterprise-grade reliability controls to ensure that autonomous agents execute safely without running into infinite tool loops, excessive duration timeouts, or runaway token bills.

---

## 1. Run Budgets & Protection

Set hard budgets per run or per agent to automatically terminate runs before they exceed resources.

### Configuration Options

```typescript
import { Vulcan } from '@vulcan-ai/sdk'

const agent = Vulcan.createAgent({
  name: 'protected-agent',
  instructions: '...',
  maxToolCalls: 10,       // Max tool calls per run (default: unlimited)
  maxDurationMs: 30000,    // Max 30 seconds wall-clock time
  maxTotalTokens: 50000,   // Max cumulative tokens (prompt + completion)
})
```

Or pass budget limits dynamically via `RunOptions`:

```typescript
const result = await agent.run('Process batch tasks', {
  maxToolCalls: 5,
  maxDurationMs: 15000,
  maxTotalTokens: 20000,
})

if (result.status === 'budget_exceeded') {
  console.warn('Run stopped due to budget limit:', result.error)
}
```

### Budget Errors

When a budget limit is exceeded, the agent run terminates with `status: 'budget_exceeded'` and raises one of the following errors:

- `ToolCallBudgetExceededError`: Triggered when total tool calls exceed `maxToolCalls`.
- `TimeoutBudgetExceededError`: Triggered when wall-clock execution time exceeds `maxDurationMs`.
- `TokenBudgetExceededError`: Triggered when cumulative tokens exceed `maxTotalTokens`.

---

## 2. Tool Self-Healing (Auto-Correction)

When a tool throws an error (e.g. invalid parameter format, missing database record, API timeout), Vulcan SDK automatically catches the error and provides self-healing feedback to the model.

### How It Works

1. **Error Capture**: The SDK catches tool execution exceptions.
2. **Self-Healing Feedback**: Generates a structured error context:
   ```json
   {
     "error": "Invalid date format",
     "selfHealingHint": "Tool 'search_logs' execution failed (attempt 1/3). Please analyze the error, adjust input arguments, and try again."
   }
   ```
3. **Model Auto-Correction**: The LLM reviews the error hint, corrects its arguments, and retries the tool call.
4. **Retry Events**: Emits `'self_healing_retry'` events for observability.

### Configuration

Set maximum tool error retries per agent:

```typescript
const agent = Vulcan.createAgent({
  name: 'self-healing-agent',
  instructions: '...',
  maxToolErrorRetries: 3, // Default retries allowed per tool error
})
```

---

## 3. Multi-Provider & Model Fallbacks

Ensure continuous agent uptime even if a primary LLM API experiences outages or rate-limits.

### Provider Fallbacks

```typescript
const agent = Vulcan.createAgent({
  name: 'resilient-agent',
  instructions: '...',
  providerName: 'openai',
  model: 'gpt-4o',
  fallbackProviders: ['anthropic', 'gemini'],
})
```

### Model Fallbacks

```typescript
const agent = Vulcan.createAgent({
  name: 'multi-model-agent',
  instructions: '...',
  model: 'gpt-4o',
})
.withFallbackModels('claude-3-5-sonnet', 'gemini-1.5-pro')
```

If the primary model call fails with non-retryable errors (or after max retries), Vulcan SDK seamlessly fails over to the next configured model or provider without breaking execution state.
