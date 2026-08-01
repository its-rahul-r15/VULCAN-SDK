import type { ApprovalRequest, ApprovalResult } from '../types/index.js'

export class ApprovalRequiredSignal extends Error {
  constructor(public readonly request: ApprovalRequest) {
    super(`Execution paused for human approval on tool '${request.toolName}'`)
    this.name = 'ApprovalRequiredSignal'
  }
}

export function createApprovalRequest(params: {
  toolName: string
  input: unknown
  toolCallId: string
  runId: string
  sessionId: string
  agentName: string
}): ApprovalRequest {
  return {
    id: `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    toolName: params.toolName,
    input: params.input,
    toolCallId: params.toolCallId,
    runId: params.runId,
    sessionId: params.sessionId,
    agentName: params.agentName,
    timestamp: Date.now(),
  }
}

export function parseApprovalResult(result: ApprovalResult | boolean): ApprovalResult {
  if (typeof result === 'boolean') {
    return { approved: result }
  }
  return result
}
