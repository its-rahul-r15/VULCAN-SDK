import { z, ZodSchema } from 'zod'

// ─────────────────────────────────────────────
// Message Types
// ─────────────────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface Message {
  role: MessageRole
  content: string
  /** Only present when role === 'tool' */
  toolCallId?: string
  /** Tool name — only present when role === 'tool' */
  name?: string
  /** Tool calls made by the assistant — only present when role === 'assistant' */
  toolCalls?: ToolCall[]
}

// ─────────────────────────────────────────────
// Tool Call / Response
// ─────────────────────────────────────────────

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  name: string
  output: string
  isError: boolean
}

// ─────────────────────────────────────────────
// Token Usage
// ─────────────────────────────────────────────

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

const emptyUsage = (): TokenUsage => ({
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
})

export { emptyUsage }

// ─────────────────────────────────────────────
// Model Response
// ─────────────────────────────────────────────

export type FinishReason = 'stop' | 'tool_calls' | 'length' | 'content_filter' | 'error'

export interface ModelResponse {
  content: string
  toolCalls: ToolCall[]
  usage: TokenUsage
  finishReason: FinishReason
  model: string
}

export interface StreamChunk {
  type: 'text_delta' | 'tool_call_delta' | 'done'
  content?: string
  toolCall?: Partial<ToolCall>
}

// ─────────────────────────────────────────────
// Provider Config
// ─────────────────────────────────────────────

export interface ProviderCallConfig {
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  systemPrompt?: string
  responseFormat?: 'text' | 'json_object'
  timeoutMs?: number
}

// ─────────────────────────────────────────────
// Reasoning Harness
// ─────────────────────────────────────────────

export type HarnessStep = 'INITIAL' | 'THINK' | 'ANALYSE' | 'TOOL_REQUEST' | 'OUTPUT'

export interface HarnessMessage {
  step: HarnessStep
  text?: string
  functionName?: string
  input?: unknown
}

export type ReasoningMode = 'standard' | 'harness'

// ─────────────────────────────────────────────
// Human-in-the-Loop (HITL) Approval Types
// ─────────────────────────────────────────────

export interface ApprovalRequest {
  id: string
  toolName: string
  input: unknown
  toolCallId: string
  runId: string
  sessionId: string
  agentName: string
  timestamp: number
}

export interface ApprovalResult {
  approved: boolean
  reason?: string
  modifiedInput?: unknown
}

export type ApprovalHandler = (
  request: ApprovalRequest,
) => Promise<ApprovalResult | boolean> | ApprovalResult | boolean

// ─────────────────────────────────────────────
// Run Status & Result
// ─────────────────────────────────────────────

export type RunStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'max_turns_reached'
  | 'handoff'
  | 'guardrail_blocked'
  | 'requires_approval'

export interface RunResult<T = string> {
  output: T
  rawOutput: string
  status: RunStatus
  sessionId: string
  traceId: string
  turns: number
  usage: TokenUsage
  agentName: string
  error?: string
  pendingApproval?: ApprovalRequest
}

export interface RunOptions {
  sessionId?: string
  maxTurns?: number
  temperature?: number
  maxTokens?: number
  metadata?: Record<string, unknown>
  /** Override the agent's provider for this run */
  provider?: string
  /** Human-in-the-Loop approval callback for sensitive tool calls */
  onApproval?: ApprovalHandler
}

// ─────────────────────────────────────────────
// Vulcan Events
// ─────────────────────────────────────────────

export type VulcanEventType =
  | 'text_streamed'
  | 'tool_started'
  | 'tool_completed'
  | 'tool_error'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_rejected'
  | 'handoff_started'
  | 'handoff_completed'
  | 'guardrail_triggered'
  | 'guardrail_passed'
  | 'harness_step'
  | 'model_called'
  | 'retry'
  | 'run_started'
  | 'run_completed'
  | 'run_failed'

export interface VulcanEvent {
  type: VulcanEventType
  timestamp: number
  runId: string
  agentName: string
  data: unknown
}

// ─────────────────────────────────────────────
// Session / Memory
// ─────────────────────────────────────────────

export interface Session {
  id: string
  agentName: string
  messages: Message[]
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
  turnCount: number
}

export interface StorageAdapter {
  get(sessionId: string): Promise<Session | null>
  set(sessionId: string, session: Session): Promise<void>
  delete(sessionId: string): Promise<void>
  list(): Promise<string[]>
  clear(): Promise<void>
}

// ─────────────────────────────────────────────
// Guardrail
// ─────────────────────────────────────────────

export type GuardrailType = 'input' | 'output' | 'tool'

export interface GuardrailPayload {
  type: GuardrailType
  content: string
  toolName?: string
  toolInput?: unknown
  context: RunContextLite
}

export interface GuardrailResult {
  passed: boolean
  reason?: string
  /** If present, replaces the original content */
  modifiedContent?: string
}

export interface Guardrail {
  name: string
  type: GuardrailType | GuardrailType[]
  check(payload: GuardrailPayload): Promise<GuardrailResult>
}

// ─────────────────────────────────────────────
// Tracing
// ─────────────────────────────────────────────

export interface ModelCallRecord {
  id: string
  model: string
  provider: string
  requestMessages: Message[]
  response: ModelResponse
  durationMs: number
  timestamp: number
}

export interface ToolCallRecord {
  id: string
  name: string
  input: unknown
  output: unknown
  isError: boolean
  durationMs: number
  timestamp: number
}

export interface HandoffRecord {
  from: string
  to: string
  turn: number
  timestamp: number
}

export interface ErrorRecord {
  message: string
  stack?: string
  timestamp: number
}

export interface Trace {
  runId: string
  agentName: string
  sessionId: string
  startTime: number
  endTime?: number
  modelCalls: ModelCallRecord[]
  toolCalls: ToolCallRecord[]
  handoffs: HandoffRecord[]
  errors: ErrorRecord[]
  totalUsage: TokenUsage
  status?: RunStatus
  output?: unknown
  metadata?: Record<string, unknown>
}

// ─────────────────────────────────────────────
// Lite Context (for guardrails, avoids circular dep)
// ─────────────────────────────────────────────

export interface RunContextLite {
  runId: string
  sessionId: string
  agentName: string
  turn: number
  metadata: Record<string, unknown>
}

// ─────────────────────────────────────────────
// Tool Definition (forward ref — full impl in tools/tool.ts)
// ─────────────────────────────────────────────

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string
  description: string
  inputSchema: ZodSchema<TInput>
  execute(input: TInput, context: RunContextLite): Promise<TOutput>
  errorHandler?(error: Error, input: TInput): TOutput | string
  timeoutMs?: number
  /** Require Human-in-the-Loop approval before executing this tool */
  requiresApproval?: boolean | ((input: any) => boolean)
}

/**
 * ToolConfig — the configuration object passed to Tool.create().
 * Identical to ToolDefinition but with the execute fn allowed inline.
 */
export interface ToolConfig<TInput = unknown, TOutput = unknown> {
  name: string
  description: string
  inputSchema: ZodSchema<TInput>
  execute: (input: TInput, context: RunContextLite) => Promise<TOutput>
  errorHandler?: (error: Error, input: TInput) => TOutput | string
  timeoutMs?: number
  /** Require Human-in-the-Loop approval before executing this tool */
  requiresApproval?: boolean | ((input: any) => boolean)
}

// ─────────────────────────────────────────────
// Agent Config
// ─────────────────────────────────────────────

export interface AgentConfig {
  /** Unique agent name — used for handoffs and tracing */
  name: string
  /** System instructions for the agent */
  instructions: string
  /** Model identifier (e.g. 'gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'claude-3-5-sonnet') */
  model?: string
  /** Provider name — must be registered in ProviderRegistry */
  providerName?: string
  /** Fallback provider names (tried in order on error) */
  fallbackProviders?: string[]
  /** Tools available to this agent */
  tools?: ToolDefinition[]
  /** Agents this agent can hand off to */
  handoffs?: AgentConfig[]
  /** Guardrails applied to this agent */
  guardrails?: Guardrail[]
  /** Zod schema for structured output validation */
  outputSchema?: ZodSchema
  /** Max turns before stopping (default: 20) */
  maxTurns?: number
  /** Max retries on provider failure (default: 3) */
  maxRetries?: number
  /** Storage adapter for session memory */
  storageAdapter?: StorageAdapter
  /** Reasoning mode: 'standard' (default) or 'harness' (CoT pipeline) */
  reasoningMode?: ReasoningMode
  /** Temperature (default: 0.7) */
  temperature?: number
  /** Max tokens per response */
  maxTokens?: number
  /** Default Human-in-the-Loop approval handler for this agent */
  onApproval?: ApprovalHandler
}

// Re-export zod for convenience
export { z, ZodSchema }
