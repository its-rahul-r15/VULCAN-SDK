# Tracing

Every Vulcan agent run produces a detailed trace containing model calls, tool executions, handoffs, errors, token usage, and timing.

## Using the Tracer

```typescript
import { VulcanTracer, AgentRunner } from '@vulcan-ai/sdk'

const tracer = new VulcanTracer()
const runner = new AgentRunner(tracer)

const result = await runner.run(agent, 'Hello')

// Get the trace
const trace = tracer.getTrace(result.traceId)
```

## Trace Structure

```typescript
interface Trace {
  runId: string                  // Unique run identifier
  agentName: string              // Agent that ran
  sessionId: string              // Session used
  startTime: number              // Unix ms timestamp
  endTime?: number               // Set after run completes
  status?: RunStatus             // Final status
  output?: unknown               // Final output

  modelCalls: ModelCallRecord[]  // Every LLM API call
  toolCalls: ToolCallRecord[]    // Every tool execution
  handoffs: HandoffRecord[]      // Agent-to-agent transfers
  errors: ErrorRecord[]          // Any errors encountered

  totalUsage: TokenUsage         // Aggregated token counts
}
```

## Pretty Print

```typescript
console.log(tracer.export(trace, 'pretty'))
```

```
╔══════════════════════════════════════════
║ Vulcan Trace — Run ID: abc-123-def
║ Agent: math-agent | Session: sess-456
║ Status: completed | Duration: 1250ms
║ Tokens: 312 (↑245 ↓67)
╠══════════════════════════════════════════
║ Model Calls (2):
║   [gpt-4o] 850ms — tool_calls — 120 tokens
║   [gpt-4o] 400ms — stop — 192 tokens
║ Tool Calls (1):
║   [✓ OK] calculator — 12ms
╚══════════════════════════════════════════
```

## JSON Export

```typescript
const json = tracer.export(trace, 'json')
// Full structured JSON for logging/analytics
```

## Global Tracer

The `globalTracer` singleton is shared across all `AgentRunner` instances that don't provide their own:

```typescript
import { globalTracer } from '@vulcan-ai/sdk'

const trace = globalTracer.getTrace(result.traceId)
```

## Custom Trace Sink

Export traces to your observability platform:

```typescript
import { VulcanTracer } from '@vulcan-ai/sdk'

const tracer = new VulcanTracer()

// After a run:
const trace = tracer.getTrace(result.traceId)
const json = tracer.export(trace, 'json')

// Send to your platform
await analytics.track('agent_run', JSON.parse(json))
await datadog.logTrace(JSON.parse(json))
```

## Events vs Traces

| | Events | Traces |
|--|--------|--------|
| **When** | Real-time during run | Collected, available after run |
| **How** | AsyncGenerator / EventEmitter | `tracer.getTrace(runId)` |
| **Use for** | UI updates, live dashboards | Debugging, analytics, audit logs |
