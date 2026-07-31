import {
  MaxLengthGuardrail,
  KeywordBlockGuardrail,
  StructuredOutputGuardrail,
  BlockedToolsGuardrail,
  FunctionGuardrail,
  PIIScrubberGuardrail,
  runGuardrails,
} from '../src/guardrails/guardrails'
import { z } from 'zod'

const mockContext = {
  runId: 'test-run',
  sessionId: 'test-session',
  agentName: 'test-agent',
  turn: 1,
  metadata: {},
}

const makePayload = (content: string, type: 'input' | 'output' | 'tool' = 'input') => ({
  type: type as 'input' | 'output' | 'tool',
  content,
  context: mockContext,
})

describe('MaxLengthGuardrail', () => {
  it('passes content within limit', async () => {
    const guardrail = new MaxLengthGuardrail(100)
    const result = await guardrail.check(makePayload('Short message'))
    expect(result.passed).toBe(true)
  })

  it('blocks content exceeding limit', async () => {
    const guardrail = new MaxLengthGuardrail(10)
    const result = await guardrail.check(makePayload('This is way too long for the limit'))
    expect(result.passed).toBe(false)
    expect(result.reason).toContain('exceeds maximum')
  })
})

describe('KeywordBlockGuardrail', () => {
  it('blocks content with forbidden keyword', async () => {
    const guardrail = new KeywordBlockGuardrail(['hack', 'exploit'])
    const result = await guardrail.check(makePayload('How do I hack this system?'))
    expect(result.passed).toBe(false)
    expect(result.reason).toContain('hack')
  })

  it('passes clean content', async () => {
    const guardrail = new KeywordBlockGuardrail(['hack', 'exploit'])
    const result = await guardrail.check(makePayload('How do I improve performance?'))
    expect(result.passed).toBe(true)
  })

  it('is case-insensitive by default', async () => {
    const guardrail = new KeywordBlockGuardrail(['hack'])
    const result = await guardrail.check(makePayload('HACK this'))
    expect(result.passed).toBe(false)
  })
})

describe('StructuredOutputGuardrail', () => {
  const schema = z.object({ name: z.string(), age: z.number() })
  const guardrail = new StructuredOutputGuardrail(schema)

  it('passes valid structured output', async () => {
    const payload = makePayload(JSON.stringify({ name: 'Alice', age: 30 }), 'output')
    const result = await guardrail.check(payload)
    expect(result.passed).toBe(true)
  })

  it('blocks invalid structured output', async () => {
    const payload = makePayload(JSON.stringify({ name: 123, age: 'not-a-number' }), 'output')
    const result = await guardrail.check(payload)
    expect(result.passed).toBe(false)
  })

  it('blocks non-JSON output', async () => {
    const payload = makePayload('This is plain text, not JSON', 'output')
    const result = await guardrail.check(payload)
    expect(result.passed).toBe(false)
  })
})

describe('BlockedToolsGuardrail', () => {
  it('blocks specified tool', async () => {
    const guardrail = new BlockedToolsGuardrail(['delete_data', 'drop_table'])
    const payload = { ...makePayload('{}', 'tool'), toolName: 'delete_data' }
    const result = await guardrail.check(payload)
    expect(result.passed).toBe(false)
  })

  it('allows non-blocked tools', async () => {
    const guardrail = new BlockedToolsGuardrail(['delete_data'])
    const payload = { ...makePayload('{}', 'tool'), toolName: 'get_weather' }
    const result = await guardrail.check(payload)
    expect(result.passed).toBe(true)
  })
})

describe('PIIScrubberGuardrail', () => {
  const guardrail = new PIIScrubberGuardrail()

  it('scrubs email addresses', async () => {
    const payload = makePayload('Contact me at john@example.com for details', 'output')
    const result = await guardrail.check(payload)
    expect(result.passed).toBe(true)
    expect(result.modifiedContent).toContain('[EMAIL]')
    expect(result.modifiedContent).not.toContain('john@example.com')
  })

  it('scrubs phone numbers', async () => {
    const payload = makePayload('Call me at 555-123-4567', 'output')
    const result = await guardrail.check(payload)
    expect(result.modifiedContent).toContain('[PHONE]')
  })

  it('passes clean content unchanged', async () => {
    const payload = makePayload('The weather is nice today', 'output')
    const result = await guardrail.check(payload)
    expect(result.passed).toBe(true)
    expect(result.modifiedContent).toBeUndefined()
  })
})

describe('FunctionGuardrail', () => {
  it('passes when function returns passed: true', async () => {
    const guardrail = new FunctionGuardrail('custom', 'input', async () => ({ passed: true }))
    const result = await guardrail.check(makePayload('anything'))
    expect(result.passed).toBe(true)
  })

  it('blocks when function returns passed: false', async () => {
    const guardrail = new FunctionGuardrail('custom', 'input', async () => ({
      passed: false,
      reason: 'Custom rejection',
    }))
    const result = await guardrail.check(makePayload('anything'))
    expect(result.passed).toBe(false)
    expect(result.reason).toBe('Custom rejection')
  })
})

describe('runGuardrails', () => {
  it('runs all applicable guardrails', async () => {
    const guardrails = [
      new MaxLengthGuardrail(1000),
      new KeywordBlockGuardrail(['bad']),
    ]
    const result = await runGuardrails(guardrails, makePayload('Good content'))
    expect(result.passed).toBe(true)
  })

  it('stops at first failed guardrail', async () => {
    const guardrails = [
      new KeywordBlockGuardrail(['bad']),
      new MaxLengthGuardrail(5), // Would also fail but shouldn't be reached
    ]
    const result = await runGuardrails(guardrails, makePayload('Contains bad word'))
    expect(result.passed).toBe(false)
    expect(result.failedGuardrail).toBeDefined()
  })

  it('only runs guardrails matching the payload type', async () => {
    const inputGuardrail = new KeywordBlockGuardrail(['bad'], { type: 'input' })
    const result = await runGuardrails(
      [inputGuardrail],
      makePayload('bad content', 'output'), // type mismatch — should not apply
    )
    expect(result.passed).toBe(true)
  })
})
