import { Tool, ToolValidationError, ToolExecutionError, ToolTimeoutError } from '../src/tools/tool'
import { z } from 'zod'

const mockContext = {
  runId: 'test-run',
  sessionId: 'test-session',
  agentName: 'test-agent',
  turn: 1,
  metadata: {},
}

describe('Tool', () => {
  describe('creation', () => {
    it('creates a tool with required fields', () => {
      const tool = Tool.create({
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: z.object({ value: z.string() }),
        execute: async ({ value }) => value.toUpperCase(),
      })

      expect(tool.name).toBe('test_tool')
      expect(tool.description).toBe('A test tool')
    })

    it('sets default timeout of 30000ms', () => {
      const tool = Tool.create({
        name: 'tool',
        description: 'test',
        inputSchema: z.object({}),
        execute: async () => 'ok',
      })
      expect(tool.timeoutMs).toBe(30_000)
    })

    it('accepts custom timeout', () => {
      const tool = Tool.create({
        name: 'tool',
        description: 'test',
        inputSchema: z.object({}),
        execute: async () => 'ok',
        timeoutMs: 5000,
      })
      expect(tool.timeoutMs).toBe(5000)
    })
  })

  describe('execution', () => {
    it('executes successfully with valid input', async () => {
      const tool = Tool.create({
        name: 'add',
        description: 'Adds two numbers',
        inputSchema: z.object({ a: z.number(), b: z.number() }),
        execute: async ({ a, b }) => a + b,
      })

      const result = await tool.execute({ a: 5, b: 3 }, mockContext)
      expect(result).toBe(8)
    })

    it('throws ToolValidationError on invalid input', async () => {
      const tool = Tool.create({
        name: 'add',
        description: 'Adds two numbers',
        inputSchema: z.object({ a: z.number(), b: z.number() }),
        execute: async ({ a, b }) => a + b,
      })

      await expect(
        tool.execute({ a: 'not-a-number', b: 3 } as never, mockContext),
      ).rejects.toThrow(ToolValidationError)
    })

    it('calls errorHandler on execution failure', async () => {
      const tool = Tool.create({
        name: 'failing_tool',
        description: 'Always fails',
        inputSchema: z.object({ input: z.string() }),
        execute: async () => {
          throw new Error('Simulated failure')
        },
        errorHandler: (error) => `Handled: ${error.message}`,
      })

      const result = await tool.execute({ input: 'test' }, mockContext)
      expect(result).toBe('Handled: Simulated failure')
    })

    it('throws ToolExecutionError when no error handler', async () => {
      const tool = Tool.create({
        name: 'failing_tool',
        description: 'Always fails',
        inputSchema: z.object({ input: z.string() }),
        execute: async () => {
          throw new Error('Boom')
        },
      })

      await expect(tool.execute({ input: 'test' }, mockContext)).rejects.toThrow(
        ToolExecutionError,
      )
    })

    it('times out after timeoutMs', async () => {
      const tool = Tool.create({
        name: 'slow_tool',
        description: 'Very slow',
        inputSchema: z.object({}),
        execute: async () => {
          await new Promise((r) => setTimeout(r, 5000))
          return 'done'
        },
        timeoutMs: 100,
      })

      await expect(tool.execute({}, mockContext)).rejects.toThrow()
    }, 10000)
  })

  describe('schema conversion', () => {
    it('converts to OpenAI function schema', () => {
      const tool = Tool.create({
        name: 'search',
        description: 'Search the web',
        inputSchema: z.object({
          query: z.string(),
          maxResults: z.number().optional(),
        }),
        execute: async () => [],
      })

      const schema = tool.toOpenAISchema()
      expect(schema.type).toBe('function')
      expect(schema.function.name).toBe('search')
      expect(schema.function.parameters).toHaveProperty('properties')
    })

    it('converts to Anthropic schema', () => {
      const tool = Tool.create({
        name: 'search',
        description: 'Search',
        inputSchema: z.object({ query: z.string() }),
        execute: async () => [],
      })

      const schema = tool.toAnthropicSchema()
      expect(schema.name).toBe('search')
      expect(schema.input_schema).toBeDefined()
    })
  })

  describe('async operations', () => {
    it('handles async execution correctly', async () => {
      const tool = Tool.create({
        name: 'async_tool',
        description: 'Async tool',
        inputSchema: z.object({ delay: z.number() }),
        execute: async ({ delay }) => {
          await new Promise((r) => setTimeout(r, delay))
          return `done after ${delay}ms`
        },
      })

      const result = await tool.execute({ delay: 50 }, mockContext)
      expect(result).toBe('done after 50ms')
    })
  })
})
