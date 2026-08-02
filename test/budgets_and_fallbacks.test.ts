import { Agent } from '../src/core/agent'
import { AgentRunner, ProviderError } from '../src'
import { InMemoryStorage } from '../src/memory/in-memory'
import { providerRegistry } from '../src/providers/provider'
import type { ModelProvider } from '../src/providers/provider'
import type { ModelResponse, StreamChunk, Message, ToolDefinition, ProviderCallConfig } from '../src/types'
import { z } from 'zod'

describe('Run Budgets, Tool Self-Healing, and Multi-Provider Fallbacks', () => {
  let mockPrimaryCallCount = 0
  let mockFallbackCallCount = 0

  const mockPrimaryProvider: ModelProvider = {
    name: 'primary-mock',
    async chat(_messages: Message[], _tools: ToolDefinition[], _config: ProviderCallConfig): Promise<ModelResponse> {
      mockPrimaryCallCount++
      // Simulate non-retryable provider error
      throw new ProviderError('Primary provider service unavailable', 'primary-mock', 503, false)
    },
    async *stream(): AsyncGenerator<StreamChunk> {
      yield { type: 'done' }
    },
  }

  const mockFallbackProvider: ModelProvider = {
    name: 'fallback-mock',
    async chat(_messages: Message[], _tools: ToolDefinition[], _config: ProviderCallConfig): Promise<ModelResponse> {
      mockFallbackCallCount++
      return {
        content: 'Response from fallback provider',
        toolCalls: [],
        usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
        finishReason: 'stop',
        model: 'fallback-model',
      }
    },
    async *stream(): AsyncGenerator<StreamChunk> {
      yield { type: 'done' }
    },
  }

  beforeAll(() => {
    providerRegistry.register('primary-mock', mockPrimaryProvider)
    providerRegistry.register('fallback-mock', mockFallbackProvider)
  })

  beforeEach(() => {
    mockPrimaryCallCount = 0
    mockFallbackCallCount = 0
  })

  describe('Run Budgets', () => {
    it('stops run with status budget_exceeded when maxToolCalls is exceeded', async () => {
      let callStep = 0
      const loopProvider: ModelProvider = {
        name: 'loop-mock',
        async chat(): Promise<ModelResponse> {
          callStep++
          return {
            content: '',
            toolCalls: [
              {
                id: `call_${callStep}`,
                name: 'ping_tool',
                arguments: {},
              },
            ],
            usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
            finishReason: 'tool_calls',
            model: 'loop-model',
          }
        },
        async *stream(): AsyncGenerator<StreamChunk> {
          yield { type: 'done' }
        },
      }
      providerRegistry.register('loop-mock', loopProvider)

      const pingTool = {
        name: 'ping_tool',
        description: 'Pings a service',
        inputSchema: z.object({}),
        execute: async () => 'pong',
      }

      const agent = new Agent({
        name: 'budget-agent',
        instructions: 'Call ping tool repeatedly',
        providerName: 'loop-mock',
        tools: [pingTool],
        storageAdapter: new InMemoryStorage(),
        maxToolCalls: 2,
      })

      const runner = new AgentRunner()
      const result = await runner.run(agent, 'Start pinging')

      expect(result.status).toBe('budget_exceeded')
      expect(result.error).toContain('maxToolCalls')
      expect(result.error).toContain('exceeding maximum budget of 2')
    })

    it('stops run with status budget_exceeded when maxDurationMs is exceeded', async () => {
      const slowProvider: ModelProvider = {
        name: 'slow-mock',
        async chat(): Promise<ModelResponse> {
          await new Promise((res) => setTimeout(res, 50))
          return {
            content: 'Done',
            toolCalls: [],
            usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
            finishReason: 'stop',
            model: 'slow-model',
          }
        },
        async *stream(): AsyncGenerator<StreamChunk> {
          yield { type: 'done' }
        },
      }
      providerRegistry.register('slow-mock', slowProvider)

      const agent = new Agent({
        name: 'slow-agent',
        instructions: 'Test timeout',
        providerName: 'slow-mock',
        storageAdapter: new InMemoryStorage(),
        maxDurationMs: 10, // Exceeded during slowProvider execution delay
      })

      const runner = new AgentRunner()
      const result = await runner.run(agent, 'Test slow run')

      expect(result.status).toBe('budget_exceeded')
      expect(result.error).toContain('maxDurationMs')
    })
  })

  describe('Tool Self-Healing (Auto-Correction)', () => {
    it('emits self_healing_retry event and sends error feedback when a tool fails', async () => {
      let turnCount = 0
      let receivedToolMessages: Message[] = []

      const selfHealingProvider: ModelProvider = {
        name: 'healing-mock',
        async chat(messages: Message[]): Promise<ModelResponse> {
          turnCount++
          receivedToolMessages = messages
          if (turnCount === 1) {
            return {
              content: '',
              toolCalls: [
                {
                  id: 'failing_call_1',
                  name: 'buggy_tool',
                  arguments: { query: 'invalid' },
                },
              ],
              usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
              finishReason: 'tool_calls',
              model: 'healing-model',
            }
          }
          return {
            content: 'Recovered after fixing tool error',
            toolCalls: [],
            usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
            finishReason: 'stop',
            model: 'healing-model',
          }
        },
        async *stream(): AsyncGenerator<StreamChunk> {
          yield { type: 'done' }
        },
      }
      providerRegistry.register('healing-mock', selfHealingProvider)

      const buggyTool = {
        name: 'buggy_tool',
        description: 'Throws error on invalid query',
        inputSchema: z.object({ query: z.string() }),
        execute: async (input: { query: string }) => {
          if (input.query === 'invalid') {
            throw new Error('Invalid query argument')
          }
          return 'success'
        },
      }

      const agent = new Agent({
        name: 'healing-agent',
        instructions: 'Test self healing',
        providerName: 'healing-mock',
        tools: [buggyTool],
        storageAdapter: new InMemoryStorage(),
      })

      let selfHealingEventFired = false
      const runner = new AgentRunner()

      // We stream to listen to events or run
      const events: any[] = []
      for await (const event of runner.stream(agent, 'Run buggy tool')) {
        events.push(event)
        if (event.type === 'self_healing_retry') {
          selfHealingEventFired = true
          expect((event.data as any).toolName).toBe('buggy_tool')
          expect((event.data as any).error).toBe('Invalid query argument')
        }
      }

      expect(selfHealingEventFired).toBe(true)
      const toolMessage = receivedToolMessages.find((m) => m.role === 'tool')
      expect(toolMessage).toBeDefined()
      expect(toolMessage?.content).toContain('selfHealingHint')
      expect(toolMessage?.content).toContain('Tool \'buggy_tool\' execution failed')
    })
  })

  describe('Multi-Provider / Model Fallbacks', () => {
    it('automatically falls back to fallbackProviders when primary provider fails', async () => {
      const agent = new Agent({
        name: 'fallback-agent',
        instructions: 'Test fallback',
        providerName: 'primary-mock',
        fallbackProviders: ['fallback-mock'],
        storageAdapter: new InMemoryStorage(),
      })

      const runner = new AgentRunner()
      const result = await runner.run(agent, 'Hello')

      expect(mockPrimaryCallCount).toBe(1)
      expect(mockFallbackCallCount).toBe(1)
      expect(result.status).toBe('completed')
      expect(result.output).toBe('Response from fallback provider')
    })
  })
})
