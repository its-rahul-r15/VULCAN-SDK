import { VulcanTracer } from '../src/tracing/tracer'
import type { ModelResponse, RunStatus } from '../src/types'

function makeMockResponse(content = 'Response'): ModelResponse {
  return {
    content,
    toolCalls: [],
    usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    finishReason: 'stop',
    model: 'gpt-4o',
  }
}

describe('VulcanTracer', () => {
  let tracer: VulcanTracer

  beforeEach(() => {
    tracer = new VulcanTracer()
  })

  describe('startRun', () => {
    it('creates a trace with correct initial values', () => {
      const trace = tracer.startRun('run-1', 'test-agent', 'session-1')
      expect(trace.runId).toBe('run-1')
      expect(trace.agentName).toBe('test-agent')
      expect(trace.sessionId).toBe('session-1')
      expect(trace.modelCalls).toHaveLength(0)
      expect(trace.toolCalls).toHaveLength(0)
      expect(trace.handoffs).toHaveLength(0)
      expect(trace.errors).toHaveLength(0)
      expect(trace.totalUsage.totalTokens).toBe(0)
    })
  })

  describe('addModelCall', () => {
    it('records model call and accumulates usage', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')
      const response = makeMockResponse()

      tracer.addModelCall(trace, 'openai', [], response, 250)

      expect(trace.modelCalls).toHaveLength(1)
      expect(trace.modelCalls[0].provider).toBe('openai')
      expect(trace.modelCalls[0].durationMs).toBe(250)
      expect(trace.totalUsage.totalTokens).toBe(15)
    })

    it('accumulates usage across multiple calls', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')

      tracer.addModelCall(trace, 'openai', [], makeMockResponse(), 100)
      tracer.addModelCall(trace, 'openai', [], makeMockResponse(), 200)

      expect(trace.modelCalls).toHaveLength(2)
      expect(trace.totalUsage.totalTokens).toBe(30)
      expect(trace.totalUsage.promptTokens).toBe(20)
    })
  })

  describe('addToolCall', () => {
    it('records successful tool call', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')
      tracer.addToolCall(trace, 'calculator', { a: 1, b: 2 }, { result: 3 }, 50)

      expect(trace.toolCalls).toHaveLength(1)
      expect(trace.toolCalls[0].name).toBe('calculator')
      expect(trace.toolCalls[0].isError).toBe(false)
    })

    it('records failed tool call', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')
      tracer.addToolCall(trace, 'broken_tool', {}, 'Error: timeout', 5000, true)

      expect(trace.toolCalls[0].isError).toBe(true)
    })
  })

  describe('addHandoff', () => {
    it('records handoff details', () => {
      const trace = tracer.startRun('r1', 'triage', 's1')
      tracer.addHandoff(trace, 'triage', 'billing', 2)

      expect(trace.handoffs).toHaveLength(1)
      expect(trace.handoffs[0].from).toBe('triage')
      expect(trace.handoffs[0].to).toBe('billing')
      expect(trace.handoffs[0].turn).toBe(2)
    })
  })

  describe('addError', () => {
    it('records error with message and stack', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')
      const error = new Error('Something went wrong')
      tracer.addError(trace, error)

      expect(trace.errors).toHaveLength(1)
      expect(trace.errors[0].message).toBe('Something went wrong')
    })
  })

  describe('endRun', () => {
    it('sets end time and status', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')
      tracer.endRun(trace, 'completed', 'Final answer')

      expect(trace.endTime).toBeDefined()
      expect(trace.status).toBe('completed')
      expect(trace.output).toBe('Final answer')
    })
  })

  describe('getTrace', () => {
    it('retrieves trace by runId', () => {
      const trace = tracer.startRun('my-run', 'agent', 's1')
      const retrieved = tracer.getTrace('my-run')
      expect(retrieved).toBe(trace)
    })

    it('returns undefined for unknown runId', () => {
      expect(tracer.getTrace('nonexistent')).toBeUndefined()
    })
  })

  describe('export', () => {
    it('exports trace as JSON', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')
      tracer.endRun(trace, 'completed', 'output')

      const json = tracer.export(trace, 'json')
      const parsed = JSON.parse(json) as { runId: string }
      expect(parsed.runId).toBe('r1')
    })

    it('exports trace in pretty format', () => {
      const trace = tracer.startRun('r1', 'agent', 's1')
      tracer.addModelCall(trace, 'openai', [], makeMockResponse(), 100)
      tracer.endRun(trace, 'completed', 'output')

      const pretty = tracer.export(trace, 'pretty')
      expect(pretty).toContain('Vulcan Trace')
      expect(pretty).toContain('r1')
      expect(pretty).toContain('gpt-4o')
    })
  })
})
