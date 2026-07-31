# API Reference

## `Vulcan` (namespace)

The top-level convenience factory.

### `Vulcan.createAgent(config: AgentConfig): Agent`
Create a new agent.

```typescript
const agent = Vulcan.createAgent({
  name: 'my-agent',
  instructions: 'You are a helpful assistant.',
  model: 'gpt-4o',
  providerName: 'openai',
  tools: [],
  guardrails: [],
  maxTurns: 20,
  temperature: 0.7,
  reasoningMode: 'standard',  // or 'harness'
})
```

### `Vulcan.createTool<I, O>(config: ToolConfig<I, O>): Tool<I, O>`
Create a typed tool.

### `Vulcan.run<T>(agent, input, options?): Promise<RunResult<T>>`
Run an agent and await the final result.

### `Vulcan.stream(agent, input, options?): AsyncGenerator<VulcanEvent>`
Stream an agent run, yielding events in real time.

### `Vulcan.registerProvider(name, provider): void`
Register a custom or built-in model provider.

---

## `Agent`

### Constructor

```typescript
new Agent(config: AgentConfig)
```

### Fluent Builder Methods

| Method | Description |
|--------|-------------|
| `.withTool(tool)` | Add a tool |
| `.withTools(...tools)` | Add multiple tools |
| `.withHandoff(agent)` | Register a handoff target |
| `.withGuardrail(g)` | Add a guardrail |
| `.withMemory(adapter)` | Set storage adapter |
| `.withOutputSchema(schema)` | Set Zod output schema |
| `.withProvider(name)` | Set primary provider |
| `.withFallback(...names)` | Set fallback providers |
| `.withHarness()` | Enable CoT reasoning pipeline |
| `.withModel(model)` | Set model identifier |
| `.withMaxTurns(n)` | Set turn limit |
| `.withTemperature(t)` | Set temperature |

### `agent.run<T>(input, options?)`
Convenience shorthand for running the agent.

### `agent.stream(input, options?)`
Convenience shorthand for streaming.

---

## `AgentConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | **required** | Unique agent identifier |
| `instructions` | `string` | **required** | System prompt |
| `model` | `string` | `'gpt-4o'` | Model identifier |
| `providerName` | `string` | `'openai'` | Provider registry key |
| `fallbackProviders` | `string[]` | `[]` | Fallback provider keys |
| `tools` | `ToolDefinition[]` | `[]` | Available tools |
| `handoffs` | `AgentConfig[]` | `[]` | Handoff targets |
| `guardrails` | `Guardrail[]` | `[]` | Input/output/tool guards |
| `outputSchema` | `ZodSchema` | — | Structured output schema |
| `maxTurns` | `number` | `20` | Max agent loop turns |
| `maxRetries` | `number` | `3` | Provider retry limit |
| `storageAdapter` | `StorageAdapter` | InMemory | Session storage |
| `reasoningMode` | `'standard' \| 'harness'` | `'standard'` | CoT reasoning toggle |
| `temperature` | `number` | `0.7` | Model temperature |
| `maxTokens` | `number` | — | Max response tokens |

---

## `RunResult<T>`

```typescript
interface RunResult<T = string> {
  output: T              // The final typed output
  rawOutput: string      // Raw string from model
  status: RunStatus      // 'completed' | 'failed' | 'max_turns_reached' | ...
  sessionId: string      // Session ID used
  traceId: string        // Trace ID for VulcanTracer lookup
  turns: number          // Number of turns taken
  usage: TokenUsage      // Total token consumption
  agentName: string      // Final agent name (may differ after handoff)
  error?: string         // Error message if status !== 'completed'
}
```

---

## `RunOptions`

```typescript
interface RunOptions {
  sessionId?: string              // Reuse an existing session
  maxTurns?: number               // Override agent's maxTurns
  temperature?: number            // Override temperature
  maxTokens?: number              // Override max tokens
  metadata?: Record<string, unknown> // Attached to RunContext
  provider?: string               // Override provider for this run
}
```

---

## `Tool<I, O>`

```typescript
const tool = Tool.create({
  name: 'my_tool',              // snake_case
  description: 'What it does',  // Shown to the model
  inputSchema: z.object({ ... }), // Zod schema — auto-validated
  execute: async (input, context) => { ... },
  errorHandler: (error, input) => 'Fallback string or value',
  timeoutMs: 10_000,            // Default: 30000
})
```

---

## `VulcanEvent`

All events have this shape:

```typescript
interface VulcanEvent {
  type: VulcanEventType
  timestamp: number
  runId: string
  agentName: string
  data: unknown
}
```

### Event Types

| Type | When fired | `data` shape |
|------|-----------|--------------|
| `run_started` | Run begins | `{ agentName, input }` |
| `model_called` | LLM call made | `{ model, usage, finishReason, turn }` |
| `tool_started` | Before tool executes | `{ name, input, id }` |
| `tool_completed` | Tool succeeds | `{ name, output, id }` |
| `tool_error` | Tool throws | `{ name, error, id }` |
| `harness_step` | In harness mode | `HarnessMessage` |
| `handoff_started` | Handoff triggered | `{ from, to, turn }` |
| `handoff_completed` | New agent active | `{ agent }` |
| `guardrail_triggered` | Guard blocks | `{ type, reason, guardrail }` |
| `retry` | Provider retry | `{ provider, attempt, delay, error }` |
| `run_completed` | Run ends OK | `RunResult` |
| `run_failed` | Run fails | `{ error }` |

---

## `VulcanHarness` — Reasoning Pipeline

```typescript
// Enable on an agent
agent.config.reasoningMode = 'harness'
// or
agent.withHarness()

// The pipeline steps:
// 'INITIAL' → 'THINK' → 'ANALYSE' → 'TOOL_REQUEST' → 'OUTPUT'
```

Each step emits a `harness_step` event with `HarnessMessage`:

```typescript
interface HarnessMessage {
  step: 'INITIAL' | 'THINK' | 'ANALYSE' | 'TOOL_REQUEST' | 'OUTPUT'
  text?: string
  functionName?: string  // TOOL_REQUEST only
  input?: unknown        // TOOL_REQUEST only
}
```
