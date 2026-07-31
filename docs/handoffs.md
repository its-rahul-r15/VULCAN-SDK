# Handoffs

Multi-agent handoffs allow one agent to delegate a task to a specialized agent.

## Setting Up Handoffs

```typescript
import { Agent } from '@vulcan-ai/sdk'

// Specialized agents
const billingAgent = new Agent({
  name: 'billing',
  instructions: 'You handle billing, payments, and invoice inquiries.',
})

const techSupportAgent = new Agent({
  name: 'tech-support',
  instructions: 'You handle technical issues and product bugs.',
})

// Triage agent — routes to specialists
const triage = new Agent({
  name: 'triage',
  instructions: `
    Route the customer to the right specialist:
    - Billing/payment issues → billing agent
    - Technical problems → tech-support agent
  `,
})
  .withHandoff(billingAgent)
  .withHandoff(techSupportAgent)
```

When you call `.withHandoff()`, Vulcan automatically injects a `handoff_to_billing` and `handoff_to_tech-support` tool into the triage agent. The LLM calls these tools to trigger a handoff.

## How Handoffs Work

1. User sends: "My invoice is wrong"
2. Triage agent calls `handoff_to_billing(reason: "Customer has billing issue")`
3. Runner detects the handoff tool call
4. Emits `handoff_started` event with `{ from: 'triage', to: 'billing' }`
5. Switches to billing agent, carries forward the full conversation context
6. Billing agent continues the conversation with the customer
7. Emits `handoff_completed` event

## Context Preservation

The full conversation history is preserved across handoffs. The new agent sees everything the previous agent saw.

## Loop Detection

Vulcan tracks visited agents per run and throws a `HandoffLoopError` if an agent is visited twice:

```typescript
// This would be detected:
// triage → billing → triage → billing (loop!)
// HandoffLoopError: Agent 'triage' was already visited in this run.
// Visited: [triage → billing → triage]
```

The runner hard-caps at **10 handoff hops** per run by default.

## Observing Handoffs in Traces

```typescript
const result = await runner.run(triage, "My invoice is wrong")
const trace = tracer.getTrace(result.traceId)

for (const handoff of trace.handoffs) {
  console.log(`Turn ${handoff.turn}: ${handoff.from} → ${handoff.to}`)
}
// Turn 2: triage → billing
```

## Handoff Events

```typescript
for await (const event of agent.stream('My invoice is wrong')) {
  if (event.type === 'handoff_started') {
    const { from, to } = event.data as { from: string; to: string }
    console.log(`Handing off from ${from} to ${to}`)
  }
  if (event.type === 'handoff_completed') {
    console.log('New agent active:', event.agentName)
  }
}
```
