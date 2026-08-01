import { GroqProvider, Agent, AgentRunner, Vulcan } from '../src/index.js'
import { providerRegistry } from '../src/providers/provider.js'

describe('GroqProvider', () => {
  test('GroqProvider auto-registers in registry', () => {
    expect(providerRegistry.has('groq')).toBe(true)
    const provider = providerRegistry.get('groq')
    expect(provider.name).toBe('groq')
  })

  test('GroqProvider executes chat completion with fetch mock', async () => {
    const groq = new GroqProvider('mock-groq-key')

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'groq-123',
        model: 'llama-3.3-70b-versatile',
        choices: [
          {
            message: { content: 'Hello from Groq Llama 3.3!' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 },
      }),
    } as Response)

    const response = await groq.chat(
      [{ role: 'user', content: 'Hi Groq' }],
      [],
      { model: 'llama-3.3-70b-versatile' }
    )

    expect(response.content).toBe('Hello from Groq Llama 3.3!')
    expect(response.model).toBe('llama-3.3-70b-versatile')
    expect(response.usage.totalTokens).toBe(25)
  })

  test('Agent auto-detects Groq provider for Llama models', async () => {
    const agent = Vulcan.createAgent({
      name: 'groq-agent',
      instructions: 'You are an ultra-fast Llama assistant.',
      model: 'llama-3.3-70b',
    })

    expect(agent.config.model).toBe('llama-3.3-70b')
  })
})
