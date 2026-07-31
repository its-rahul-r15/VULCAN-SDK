import { v4 as uuidv4 } from 'uuid'
import type {
  Trace,
  ModelCallRecord,
  ToolCallRecord,
  HandoffRecord,
  ErrorRecord,
  ModelResponse,
  Message,
  RunStatus,
  TokenUsage,
} from '../types/index.js'

export type { Trace }

// ─────────────────────────────────────────────
// VulcanTracer
// Collects a structured trace for each agent run
// ─────────────────────────────────────────────

export class VulcanTracer {
  private readonly traces = new Map<string, Trace>()

  /**
   * Start a new trace for a run.
   */
  startRun(runId: string, agentName: string, sessionId: string): Trace {
    const trace: Trace = {
      runId,
      agentName,
      sessionId,
      startTime: Date.now(),
      modelCalls: [],
      toolCalls: [],
      handoffs: [],
      errors: [],
      totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    }
    this.traces.set(runId, trace)
    return trace
  }

  /**
   * Record a model API call.
   */
  addModelCall(
    trace: Trace,
    providerName: string,
    requestMessages: Message[],
    response: ModelResponse,
    durationMs: number,
  ): void {
    const record: ModelCallRecord = {
      id: uuidv4(),
      model: response.model,
      provider: providerName,
      requestMessages,
      response,
      durationMs,
      timestamp: Date.now(),
    }
    trace.modelCalls.push(record)
    this._accumulateUsage(trace, response.usage)
  }

  /**
   * Record a tool execution.
   */
  addToolCall(
    trace: Trace,
    toolName: string,
    input: unknown,
    output: unknown,
    durationMs: number,
    isError = false,
  ): void {
    const record: ToolCallRecord = {
      id: uuidv4(),
      name: toolName,
      input,
      output,
      isError,
      durationMs,
      timestamp: Date.now(),
    }
    trace.toolCalls.push(record)
  }

  /**
   * Record an agent handoff.
   */
  addHandoff(trace: Trace, from: string, to: string, turn: number): void {
    const record: HandoffRecord = {
      from,
      to,
      turn,
      timestamp: Date.now(),
    }
    trace.handoffs.push(record)
  }

  /**
   * Record an error.
   */
  addError(trace: Trace, error: Error): void {
    const record: ErrorRecord = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    }
    trace.errors.push(record)
  }

  /**
   * Finalize the trace with status and output.
   */
  endRun(trace: Trace, status: RunStatus, output: unknown): void {
    trace.endTime = Date.now()
    trace.status = status
    trace.output = output
    this.traces.set(trace.runId, trace)
  }

  /**
   * Get a trace by run ID.
   */
  getTrace(runId: string): Trace | undefined {
    return this.traces.get(runId)
  }

  /**
   * Export a trace to JSON or human-readable format.
   */
  export(trace: Trace, format: 'json' | 'pretty' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(trace, null, 2)
    }
    return this._prettyPrint(trace)
  }

  /**
   * Clear all traces (e.g. for testing).
   */
  clear(): void {
    this.traces.clear()
  }

  private _accumulateUsage(trace: Trace, usage: TokenUsage): void {
    trace.totalUsage.promptTokens += usage.promptTokens
    trace.totalUsage.completionTokens += usage.completionTokens
    trace.totalUsage.totalTokens += usage.totalTokens
  }

  private _prettyPrint(trace: Trace): string {
    const duration = trace.endTime
      ? `${trace.endTime - trace.startTime}ms`
      : 'in progress'
    const lines: string[] = [
      `╔══════════════════════════════════════════`,
      `║ Vulcan Trace — Run ID: ${trace.runId}`,
      `║ Agent: ${trace.agentName} | Session: ${trace.sessionId}`,
      `║ Status: ${trace.status ?? 'running'} | Duration: ${duration}`,
      `║ Tokens: ${trace.totalUsage.totalTokens} (↑${trace.totalUsage.promptTokens} ↓${trace.totalUsage.completionTokens})`,
      `╠══════════════════════════════════════════`,
      `║ Model Calls (${trace.modelCalls.length}):`,
    ]

    for (const call of trace.modelCalls) {
      lines.push(
        `║   [${call.model}] ${call.durationMs}ms — ${call.response.finishReason} — ${call.response.usage.totalTokens} tokens`,
      )
    }

    if (trace.toolCalls.length > 0) {
      lines.push(`║ Tool Calls (${trace.toolCalls.length}):`)
      for (const tc of trace.toolCalls) {
        const status = tc.isError ? '✗ ERROR' : '✓ OK'
        lines.push(`║   [${status}] ${tc.name} — ${tc.durationMs}ms`)
      }
    }

    if (trace.handoffs.length > 0) {
      lines.push(`║ Handoffs (${trace.handoffs.length}):`)
      for (const h of trace.handoffs) {
        lines.push(`║   Turn ${h.turn}: ${h.from} → ${h.to}`)
      }
    }

    if (trace.errors.length > 0) {
      lines.push(`║ Errors (${trace.errors.length}):`)
      for (const e of trace.errors) {
        lines.push(`║   ✗ ${e.message}`)
      }
    }

    lines.push(`╚══════════════════════════════════════════`)
    return lines.join('\n')
  }
}

/** Global singleton tracer */
export const globalTracer = new VulcanTracer()
