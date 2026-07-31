import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import type {
  Message,
  Session,
  RunContextLite,
  VulcanEvent,
  VulcanEventType,
} from '../types/index.js'
import type { AgentConfig } from '../types/index.js'
import { VulcanTracer, type Trace } from '../tracing/tracer.js'

// ─────────────────────────────────────────────
// RunContext
// Live state for a single agent run.
// Separate from: agent config (static) and session (persisted).
// ─────────────────────────────────────────────

export class RunContext implements RunContextLite {
  readonly runId: string
  readonly sessionId: string
  readonly agentName: string
  readonly tracer: VulcanTracer
  readonly trace: Trace
  readonly emitter: EventEmitter

  /** Messages accumulated in THIS run (not the full session history) */
  messages: Message[]
  /** Full session state (includes history from previous runs) */
  session: Session
  /** Current turn number */
  turn: number
  /** Arbitrary metadata from RunOptions */
  metadata: Record<string, unknown>
  /** Current agent config (may change on handoff) */
  agentConfig: AgentConfig
  /** Track visited agents to detect handoff loops */
  visitedAgents: Set<string>

  constructor(options: RunContextOptions) {
    this.runId = uuidv4()
    this.sessionId = options.sessionId
    this.agentName = options.agentConfig.name
    this.tracer = options.tracer
    this.trace = options.trace
    this.emitter = options.emitter
    this.messages = []
    this.session = options.session
    this.turn = 0
    this.metadata = options.metadata ?? {}
    this.agentConfig = options.agentConfig
    this.visitedAgents = new Set([options.agentConfig.name])
  }

  /**
   * Add a message to the current run's context.
   */
  addMessage(msg: Message): void {
    this.messages.push(msg)
  }

  /**
   * Get the full message history: session history + current run messages.
   * The session history provides multi-turn memory.
   */
  getFullHistory(): Message[] {
    return [...this.session.messages, ...this.messages]
  }

  /**
   * Emit a VulcanEvent to all listeners.
   */
  emit(type: VulcanEventType, data: unknown): void {
    const event: VulcanEvent = {
      type,
      timestamp: Date.now(),
      runId: this.runId,
      agentName: this.agentName,
      data,
    }
    this.emitter.emit('event', event)
    this.emitter.emit(type, event)
  }

  /**
   * Listen to a specific event type.
   */
  on(type: VulcanEventType | 'event', listener: (event: VulcanEvent) => void): void {
    this.emitter.on(type, listener)
  }

  /**
   * Switch to a new agent (during handoff).
   * Updates agentConfig and agentName tracking.
   */
  switchAgent(newConfig: AgentConfig): void {
    // Update internal state but keep the same runId/sessionId
    this.agentConfig = newConfig
    ;(this as { agentName: string }).agentName = newConfig.name
    this.visitedAgents.add(newConfig.name)
  }
}

export interface RunContextOptions {
  sessionId: string
  agentConfig: AgentConfig
  tracer: VulcanTracer
  trace: Trace
  emitter: EventEmitter
  session: Session
  metadata?: Record<string, unknown>
}
