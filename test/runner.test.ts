import { Agent, AgentConfigError } from '../src/core/agent'
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
      content: 'Mock final answer',
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

// ── Agent class tests ─────────────────────────────────────────

describe('Agent', () => {
  it('requires a name', () => {
    expect(
      () => new Agent({ name: '', instructions: 'test' }),
    ).toThrow(AgentConfigError)
  })

  it('requires instructions', () => {
    expect(
      () => new Agent({ name: 'agent', instructions: '' }),
    ).toThrow(AgentConfigError)
  })

  it('applies default config values', () => {
    const agent = new Agent({ name: 'agent', instructions: 'test' })
    expect(agent.config.maxTurns).toBe(20)
    expect(agent.config.reasoningMode).toBe('standard')
    expect(agent.config.temperature).toBe(0.7)
  })

  it('withTool adds a tool', () => {
    const agent = new Agent({ name: 'agent', instructions: 'test' })
    const tool = { name: 'test', description: 'test', inputSchema: z.object({}), execute: async () => 'ok' }
    agent.withTool(tool)
    expect(agent.config.tools).toHaveLength(1)
  })

  it('withHarness enables harness mode', () => {
    const agent = new Agent({ name: 'agent', instructions: 'test' }).withHarness()
    expect(agent.config.reasoningMode).toBe('harness')
  })

  it('withMaxTurns sets max turns', () => {
    const agent = new Agent({ name: 'agent', instructions: 'test' }).withMaxTurns(5)
    expect(agent.config.maxTurns).toBe(5)
  })

  it('withOutputSchema sets schema', () => {
    const schema = z.object({ answer: z.string() })
    const agent = new Agent({ name: 'agent', instructions: 'test' }).withOutputSchema(schema)
    expect(agent.config.outputSchema).toBeDefined()
  })
})

// ── AgentRunner tests ─────────────────────────────────────────

describe('AgentRunner', () => {
  const getAgent = () =>
    new Agent({
      name: 'test-agent',
      instructions: 'You are a test assistant.',
      providerName: 'mock',
      model: 'mock-model',
      storageAdapter: new InMemoryStorage(),
    })

  it('runs and returns completed result', async () => {
    const runner = new AgentRunner()
    const agent = getAgent()

    const result = await runner.run(agent, 'Hello')
    expect(result.status).toBe('completed')
    expect(result.output).toBe('Mock final answer')
    expect(result.turns).toBeGreaterThan(0)
  })

  it('executes a tool and continues', async () => {
    const calcTool = {
      name: 'calculator',
      description: 'Calculate',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      execute: async ({ a, b }: { a: number; b: number }) => ({ result: a + b }),
    }

    // First response: tool call. Second: final answer
    mockResponses = [
      {
        content: '',
        toolCalls: [{ id: 'call-1', name: 'calculator', arguments: { a: 5, b: 3 } }],
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        finishReason: 'tool_calls',
        model: 'mock-model',
      },
      {
        content: 'The answer is 8',
        toolCalls: [],
        usage: { promptTokens: 15, completionTokens: 5, totalTokens: 20 },
        finishReason: 'stop',
        model: 'mock-model',
      },
    ]

    const agent = new Agent({
      name: 'calc-agent',
      instructions: 'Use calculator',
      providerName: 'mock',
      model: 'mock-model',
      tools: [calcTool],
      storageAdapter: new InMemoryStorage(),
    })

    const runner = new AgentRunner()
    const result = await runner.run(agent, 'What is 5 + 3?')

    expect(result.status).toBe('completed')
    expect(result.output).toBe('The answer is 8')
    expect(result.turns).toBe(2)
  })

  it('stops after maxTurns', async () => {
    // Every response is a tool call — never finishes
    mockResponses = Array(25).fill({
      content: '',
      toolCalls: [{ id: 'x', name: 'nonexistent_tool', arguments: {} }],
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      finishReason: 'tool_calls',
      model: 'mock',
    })

    const agent = new Agent({
      name: 'looping-agent',
      instructions: 'test',
      providerName: 'mock',
      model: 'mock',
      maxTurns: 3,
      storageAdapter: new InMemoryStorage(),
    })

    const runner = new AgentRunner()
    const result = await runner.run(agent, 'Go')

    expect(result.status).toBe('max_turns_reached')
    expect(result.turns).toBe(3)
  })

  it('persists session across runs', async () => {
    const storage = new InMemoryStorage()
    const agent = new Agent({
      name: 'memory-agent',
      instructions: 'Remember things',
      providerName: 'mock',
      model: 'mock',
      storageAdapter: storage,
    })

    const runner = new AgentRunner()
    const result1 = await runner.run(agent, 'Hello', { sessionId: 'persistent-session' })
    const result2 = await runner.run(agent, 'Remember me?', { sessionId: 'persistent-session' })

    // Session should exist and have messages from both runs
    const session = await storage.get('persistent-session')
    expect(session).not.toBeNull()
    expect(session!.messages.length).toBeGreaterThan(2)
  })

  it('accumulates token usage', async () => {
    const runner = new AgentRunner()
    const agent = getAgent()
    const result = await runner.run(agent, 'test')
    expect(result.usage.totalTokens).toBeGreaterThan(0)
  })
})
