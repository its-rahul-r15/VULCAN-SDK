import { Vulcan, z } from '../src'

// 1. Create a tool that might fail
const flakyApi = Vulcan.createTool({
  name: 'flaky_api',
  description: 'Fetches data from an unstable remote server',
  inputSchema: z.object({ endpoint: z.string() }),
  async execute({ endpoint }) {
    if (endpoint.includes('fail')) {
      throw new Error('Remote server returned 502 Bad Gateway')
    }
    return { status: 200, data: 'Server response OK' }
  },
})

// 2. Create resilient agent with Budgets, Self-Healing, and Model Fallbacks
const agent = Vulcan.createAgent({
  name: 'resilient-agent',
  instructions: 'You fetch data from remote APIs. If a call fails, adjust parameters and retry.',
  model: 'gpt-4o',
  providerName: 'openai',
  fallbackProviders: ['anthropic', 'gemini'],
  fallbackModels: ['claude-3-5-sonnet', 'gemini-1.5-pro'],
  tools: [flakyApi],
  maxToolCalls: 5,         // Hard limit of 5 tool calls
  maxDurationMs: 15000,     // Max 15 seconds run duration
  maxToolErrorRetries: 3,  // Allow LLM 3 self-healing retries on tool error
})

// Listen to self-healing retry events
agent.on('self_healing_retry', (event: any) => {
  console.log(`\n⚠️ [Self-Healing Triggered] Tool '${event.data.toolName}' failed: ${event.data.error}`)
  console.log(`--> Retrying attempt ${event.data.retryCount} of ${event.data.maxRetries}...`)
})

agent.on('budget_exceeded', (event: any) => {
  console.log(`\n🛑 [Budget Exceeded] ${event.data.type}: ${JSON.stringify(event.data)}`)
})

async function main() {
  console.log('--- Running Resilient Agent with Self-Healing & Budgets ---')
  const result = await Vulcan.run(agent, 'Call flaky_api with endpoint "/api/v1/data"')
  console.log('\nResult Status:', result.status)
  console.log('Result Output:', result.output)
}

main().catch(console.error)
