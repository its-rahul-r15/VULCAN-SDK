# Guardrails

Guardrails let you validate, block, or modify content at three points:
- **Input** — before the agent processes the user message
- **Output** — before the final answer is returned
- **Tool** — before a tool is executed

## Built-in Guardrails

### MaxLengthGuardrail

Blocks inputs or outputs exceeding a character limit.

```typescript
import { MaxLengthGuardrail } from '@vulcan-ai/sdk'

// Block inputs longer than 500 chars
const guard = new MaxLengthGuardrail(500, { type: 'input' })

// Block both inputs and outputs longer than 1000 chars
const guard2 = new MaxLengthGuardrail(1000, { type: ['input', 'output'] })
```

### KeywordBlockGuardrail

Blocks content containing forbidden keywords.

```typescript
import { KeywordBlockGuardrail } from '@vulcan-ai/sdk'

const guard = new KeywordBlockGuardrail(
  ['hack', 'exploit', 'jailbreak'],
  {
    type: 'input',
    name: 'security-filter',
    caseSensitive: false, // default
  }
)
```

### BlockedToolsGuardrail

Prevents specific tools from being called.

```typescript
import { BlockedToolsGuardrail } from '@vulcan-ai/sdk'

const guard = new BlockedToolsGuardrail(
  ['delete_database', 'drop_table'],
  'production-safety',
)
```

### StructuredOutputGuardrail

Validates output against a Zod schema (runs on output).

```typescript
import { StructuredOutputGuardrail } from '@vulcan-ai/sdk'
import { z } from '@vulcan-ai/sdk'

const guard = new StructuredOutputGuardrail(
  z.object({ sentiment: z.enum(['positive', 'negative', 'neutral']) })
)
```

### PIIScrubberGuardrail

Automatically scrubs Personally Identifiable Information from outputs.

Removes: emails, phone numbers, credit card numbers, SSNs.

```typescript
import { PIIScrubberGuardrail } from '@vulcan-ai/sdk'

const guard = new PIIScrubberGuardrail()
// "Contact john@example.com" → "Contact [EMAIL]"
```

### FunctionGuardrail

Custom logic in a function — for any business rule.

```typescript
import { FunctionGuardrail } from '@vulcan-ai/sdk'

const businessHours = new FunctionGuardrail(
  'business-hours-only',
  'input',
  async (payload, context) => {
    const hour = new Date().getUTCHours()
    if (hour < 9 || hour > 17) {
      return { passed: false, reason: 'Service unavailable outside business hours.' }
    }
    return { passed: true }
  },
)
```

## Using Guardrails

```typescript
import { Agent } from '@vulcan-ai/sdk'

const agent = new Agent({
  name: 'safe-agent',
  instructions: '...',
  guardrails: [
    new MaxLengthGuardrail(500, { type: 'input' }),
    new KeywordBlockGuardrail(['banned'], { type: 'input' }),
    new BlockedToolsGuardrail(['delete_all']),
    new PIIScrubberGuardrail(), // output
  ],
})

// Or fluent:
agent.withGuardrail(new MaxLengthGuardrail(500))
```

## What Happens When a Guardrail Blocks?

1. A `guardrail_triggered` event is emitted
2. The run stops with `status: 'failed'`
3. `result.error` contains the guardrail name and reason

```typescript
const result = await agent.run('hack the system')
if (result.status === 'failed') {
  console.log(result.error)
  // "Guardrail 'keyword-block' blocked execution: Contains blocked keyword: 'hack'"
}
```

## Content Modification

Guardrails can also _modify_ content (e.g., PII scrubbing):

```typescript
async check(payload): Promise<GuardrailResult> {
  const cleaned = scrubPII(payload.content)
  return {
    passed: true,
    modifiedContent: cleaned, // Runner uses this instead of original
  }
}
```

## Custom Guardrail

Implement the `Guardrail` interface:

```typescript
import type { Guardrail, GuardrailPayload, GuardrailResult } from '@vulcan-ai/sdk'

class RateLimitGuardrail implements Guardrail {
  name = 'rate-limiter'
  type = 'input' as const

  constructor(private maxPerMinute: number) {}

  async check(payload: GuardrailPayload): Promise<GuardrailResult> {
    const allowed = await this.checkRateLimit(payload.context.sessionId)
    if (!allowed) {
      return { passed: false, reason: `Rate limit exceeded: ${this.maxPerMinute}/min` }
    }
    return { passed: true }
  }
}
```
