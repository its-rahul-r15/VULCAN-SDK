# Streaming

Vulcan exposes all agent events in real-time via `AsyncGenerator<VulcanEvent>`.

## Basic Streaming

```typescript
for await (const event of agent.stream('Tell me about Paris')) {
  if (event.type === 'run_completed') {
    const result = event.data as { output: string }
    console.log(result.output)
  }
}
```

## All Event Types

```typescript
for await (const event of agent.stream('What is the weather in Goa?')) {
  const ts = new Date(event.timestamp).toISOString()

  switch (event.type) {
    case 'run_started':
      console.log(`[${ts}] 🚀 Started — Agent: ${event.agentName}`)
      break

    case 'model_called':
      const { model, turn } = event.data as { model: string; turn: number }
      console.log(`[${ts}] 🤖 LLM called (turn ${turn}) — ${model}`)
      break

    case 'tool_started':
      const { name, input } = event.data as { name: string; input: unknown }
      console.log(`[${ts}] 🔧 Tool: ${name}`, input)
      break

    case 'tool_completed':
      const { name: n, output } = event.data as { name: string; output: unknown }
      console.log(`[${ts}] ✅ Tool done: ${n}`, output)
      break

    case 'tool_error':
      const { name: tn, error } = event.data as { name: string; error: string }
      console.log(`[${ts}] ❌ Tool failed: ${tn} — ${error}`)
      break

    case 'harness_step':
      const step = event.data as { step: string; text?: string }
      console.log(`[${ts}] 💭 [${step.step}] ${step.text}`)
      break

    case 'handoff_started':
      const { from, to } = event.data as { from: string; to: string }
      console.log(`[${ts}] 🔄 Handoff: ${from} → ${to}`)
      break

    case 'guardrail_triggered':
      const { type, reason } = event.data as { type: string; reason: string }
      console.log(`[${ts}] 🛡️ Guardrail (${type}): ${reason}`)
      break

    case 'retry':
      const { provider, attempt } = event.data as { provider: string; attempt: number }
      console.log(`[${ts}] 🔁 Retry ${attempt} on ${provider}`)
      break

    case 'run_completed':
      console.log(`[${ts}] 🎉 Complete!`)
      break

    case 'run_failed':
      const { error: err } = event.data as { error: string }
      console.log(`[${ts}] 💥 Failed: ${err}`)
      break
  }
}
```

## Harness Mode Streaming

In `reasoningMode: 'harness'`, every thinking step emits a `harness_step` event:

```typescript
const agent = new Agent({
  name: 'thinker',
  instructions: '...',
  reasoningMode: 'harness',
  tools: [myTool],
})

for await (const event of agent.stream('What is 2 + 2 - 5 * 10 / 3?')) {
  if (event.type === 'harness_step') {
    const { step, text } = event.data as { step: string; text: string }
    console.log(`[${step}] ${text}`)
  }
}
// [INITIAL] The user wants to solve a math equation
// [THINK]   First multiply 5 * 10 = 50
// [ANALYSE] Correct, now divide: 50 / 3 = 16.667
// [THINK]   Add 2 + 2 = 4, equation: 4 - 16.667
// [OUTPUT]  The answer is -12.667
```

## Building a UI with Streaming

```typescript
// React example — stream events to state
const [steps, setSteps] = useState<string[]>([])
const [output, setOutput] = useState('')

async function runAgent(input: string) {
  for await (const event of agent.stream(input)) {
    if (event.type === 'harness_step') {
      const { step, text } = event.data as { step: string; text?: string }
      setSteps(prev => [...prev, `[${step}] ${text ?? ''}`])
    }
    if (event.type === 'run_completed') {
      const result = event.data as { output: string }
      setOutput(result.output)
    }
  }
}
```
