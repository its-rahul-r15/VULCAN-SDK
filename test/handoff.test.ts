import { Agent } from '../src/core/agent'
import { AgentRunner, HandoffLoopError } from '../src/core/runner'
import { InMemoryStorage } from '../src/memory/in-memory'
import { providerRegistry } from '../src/providers/provider'
import type { ModelProvider } from '../src/providers/provider'
import type { ModelResponse, StreamChunk, Message, ToolDefinition, ProviderCallConfig } from '../src/types'
import { z } from 'zod'

// ── Mock Provider ─────────────────────────────────────────────

let mockResponses: ModelResponse[] = []
let callCount = 0

const mockProvider: ModelProvider = {
  name: 'mock',
  async chat(_messages: Message[], _tools: ToolDefinition[], _config: ProviderCallConfig): Promise<ModelResponse> {
    const response = mockResponses[callCount] ?? {
      content: 'Final support answer',
      toolCalls: [],
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      finishReason: 'stop' as const,
      model: 'mock-model',
    }
    callCount++
    return response
  },
  async *stream(): AsyncGenerator<StreamChunk> {
    yield { type: 'text_delta', content: 'Mock' }
    yield { type: 'done' }
  },
}

beforeAll(() => {
  providerRegistry.register('mock', mockProvider)
})

beforeEach(() => {
  mockResponses = []
  callCount = 0
})

describe('Multi-agent Handoffs', () => {
  const getAgents = () => {
    const supportAgent = new Agent({
      name: 'support',
      instructions: 'You are support.',
      providerName: 'mock',
      model: 'mock-model',
      storageAdapter: new InMemoryStorage(),
    })

    const triageAgent = new Agent({
      name: 'triage',
      instructions: 'Route requests.',
      providerName: 'mock',
      model: 'mock-model',
      storageAdapter: new InMemoryStorage(),
    })
      .withHandoff(supportAgent)

    return { triageAgent, supportAgent }
  };

  it('triggers a handoff and routes to the target agent', async () => {
    const { triageAgent } = getAgents()

    mockResponses = [
      {
        content: '',
        toolCalls: [{ id: 'call-handoff', name: 'handoff_to_support', arguments: { reason: 'Technical support issue' } }],
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        finishReason: 'tool_calls',
        model: 'mock-model',
      },
      {
        content: 'Troubleshooting steps: clear browser cache.',
        toolCalls: [],
        usage: { promptTokens: 15, completionTokens: 5, totalTokens: 20 },
        finishReason: 'stop',
        model: 'mock-model',
      },
    ]

    const runner = new AgentRunner()
    const result = await runner.run(triageAgent, 'My app is crashing!')

    expect(result.status).toBe('completed')
    expect(result.output).toBe('Troubleshooting steps: clear browser cache.')
    expect(result.agentName).toBe('support') // switched to support agent
    expect(result.turns).toBe(2)
  })

  it('detects and throws on handoff loops', async () => {
    const agentA = new Agent({
      name: 'agentA',
      instructions: 'Agent A.',
      providerName: 'mock',
      model: 'mock-model',
      storageAdapter: new InMemoryStorage(),
    })

    const agentB = new Agent({
      name: 'agentB',
      instructions: 'Agent B.',
      providerName: 'mock',
      model: 'mock-model',
      storageAdapter: new InMemoryStorage(),
    })

    // Setup bidirectional handoff
    agentA.withHandoff(agentB)
    agentB.withHandoff(agentA)

    mockResponses = [
      {
        content: '',
        toolCalls: [{ id: 'call-b', name: 'handoff_to_agentB', arguments: { reason: 'Go to B' } }],
        usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        finishReason: 'tool_calls',
        model: 'mock',
      },
      {
        content: '',
        toolCalls: [{ id: 'call-a', name: 'handoff_to_agentA', arguments: { reason: 'Back to A' } }],
        usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        finishReason: 'tool_calls',
        model: 'mock',
      },
    ]

    const runner = new AgentRunner()
    const result = await runner.run(agentA, 'Ping pong')

    expect(result.status).toBe('failed')
    expect(result.error).toContain('Handoff loop detected')
  })
})
