import { Agent, AgentRunner, Tool, z } from '../src/index.js'

describe('Human-in-the-Loop (HITL) Approvals', () => {
  test('Tool with requiresApproval emits approval request and runs when approved', async () => {
    const paymentTool = Tool.create({
      name: 'send_payment',
      description: 'Transfer funds to user account.',
      inputSchema: z.object({ amount: z.number(), recipient: z.string() }),
      requiresApproval: true,
      async execute({ amount, recipient }) {
        return `Transferred $${amount} to ${recipient}`
      },
    })

    const agent = new Agent({
      name: 'finance-agent',
      instructions: 'Help user make payments.',
      tools: [paymentTool],
    })

    const mockProvider = {
      name: 'mock',
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          content: '',
          toolCalls: [{ id: 'tc1', name: 'send_payment', arguments: { amount: 100, recipient: 'Alice' } }],
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          finishReason: 'tool_calls',
          model: 'mock',
        })
        .mockResolvedValueOnce({
          content: 'Payment of $100 to Alice completed successfully.',
          toolCalls: [],
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          finishReason: 'stop',
          model: 'mock',
        }),
    }

    const runner = new AgentRunner()
    const onApproval = jest.fn().mockResolvedValue({ approved: true })

    // Register mock provider
    const { providerRegistry } = await import('../src/providers/provider.js')
    providerRegistry.register('mock', mockProvider as any)

    const result = await runner.run(agent, 'Send $100 to Alice', {
      provider: 'mock',
      onApproval,
    })

    expect(onApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: 'send_payment',
        input: { amount: 100, recipient: 'Alice' },
      })
    )
    expect(result.status).toBe('completed')
    expect(result.output).toContain('Payment of $100 to Alice completed successfully.')
  })

  test('Tool with requiresApproval pauses execution when no approval handler is provided', async () => {
    const dangerousTool = Tool.create({
      name: 'delete_database',
      description: 'Delete production database.',
      inputSchema: z.object({ confirm: z.boolean() }),
      requiresApproval: true,
      async execute() {
        return 'Deleted'
      },
    })

    const agent = new Agent({
      name: 'admin-agent',
      instructions: 'Admin commands',
      tools: [dangerousTool],
    })

    const mockProvider = {
      name: 'mock2',
      chat: jest.fn().mockResolvedValue({
        content: '',
        toolCalls: [{ id: 'tc2', name: 'delete_database', arguments: { confirm: true } }],
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        finishReason: 'tool_calls',
        model: 'mock2',
      }),
    }

    const { providerRegistry } = await import('../src/providers/provider.js')
    providerRegistry.register('mock2', mockProvider as any)

    const runner = new AgentRunner()
    const result = await runner.run(agent, 'Delete DB', { provider: 'mock2' })

    expect(result.status).toBe('requires_approval')
    expect(result.pendingApproval).toBeDefined()
    expect(result.pendingApproval?.toolName).toBe('delete_database')
  })
})
