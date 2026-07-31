/**
 * Vulcan SDK — Streaming & Events Example
 *
 * Demonstrates:
 * - AsyncGenerator-based streaming
 * - All VulcanEvent types
 * - Real-time tool execution visibility
 * - Harness mode streaming with step events
 */

import { Vulcan, z, Agent, VulcanEvent } from '../src/index.js'

// ── Tools ─────────────────────────────────────────────────────

const weatherTool = Vulcan.createTool({
  name: 'get_weather',
  description: 'Get current weather for a city.',
  inputSchema: z.object({
    city: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  }),
  async execute({ city, units }) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500))
    return {
      city,
      temperature: units === 'celsius' ? 28 : 82,
      condition: 'Partly cloudy',
      humidity: '65%',
      units,
    }
  },
})

// ── Harness Mode Agent (structured reasoning) ─────────────────

const harnessWeatherAgent = new Agent({
  name: 'harness-weather',
  instructions: 'You are a weather assistant that provides detailed weather reports.',
  tools: [weatherTool],
  reasoningMode: 'harness', // Enable chain-of-thought pipeline
})

// ── Standard Streaming Agent ──────────────────────────────────

const streamingAgent = new Agent({
  name: 'story-teller',
  instructions: 'You are a creative storyteller. Tell engaging short stories.',
})

// ── Event handler ─────────────────────────────────────────────

function handleEvent(event: VulcanEvent): void {
  const ts = new Date(event.timestamp).toISOString().slice(11, 23)

  switch (event.type) {
    case 'run_started':
      console.log(`[${ts}] 🚀 Run started — Agent: ${event.agentName}`)
      break
    case 'model_called':
      console.log(`[${ts}] 🤖 Model called`)
      break
    case 'tool_started':
      console.log(`[${ts}] 🔧 Tool started: ${(event.data as { name: string }).name}`)
      break
    case 'tool_completed':
      console.log(`[${ts}] ✅ Tool completed: ${(event.data as { name: string }).name}`)
      break
    case 'tool_error':
      console.log(`[${ts}] ❌ Tool error: ${(event.data as { error: string }).error}`)
      break
    case 'harness_step': {
      const step = event.data as { step: string; text?: string }
      console.log(`[${ts}] 💭 [${step.step}] ${step.text?.slice(0, 80) ?? ''}...`)
      break
    }
    case 'guardrail_triggered':
      console.log(`[${ts}] 🛡️  Guardrail triggered: ${(event.data as { reason: string }).reason}`)
      break
    case 'handoff_started':
      console.log(`[${ts}] 🔄 Handoff: ${(event.data as { from: string; to: string }).from} → ${(event.data as { from: string; to: string }).to}`)
      break
    case 'retry':
      console.log(`[${ts}] 🔁 Retry attempt ${(event.data as { attempt: number }).attempt}`)
      break
    case 'run_completed':
      console.log(`[${ts}] 🎉 Run completed`)
      break
    case 'run_failed':
      console.log(`[${ts}] 💥 Run failed: ${(event.data as { error: string }).error}`)
      break
    default:
      break
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Vulcan SDK — Streaming & Events Example\n')

  // Test 1: Harness mode with tool use
  console.log('═══════════════════════════════════════')
  console.log('Test 1: Harness Mode (Chain-of-Thought)')
  console.log('═══════════════════════════════════════\n')

  const runner = new (await import('../src/core/runner.js').then(m => m.AgentRunner))()

  for await (const event of runner.stream(harnessWeatherAgent, 'What is the weather in Tokyo and Goa?')) {
    handleEvent(event)
  }

  // Test 2: Standard streaming
  console.log('\n═══════════════════════════════════════')
  console.log('Test 2: Standard Streaming')
  console.log('═══════════════════════════════════════\n')

  for await (const event of runner.stream(streamingAgent, 'Tell me a 3-sentence story about an AI discovering emotions.')) {
    handleEvent(event)
    if (event.type === 'run_completed') {
      const result = event.data as { output?: string }
      if (result.output) {
        console.log('\n📖 Story:\n', result.output)
      }
    }
  }
}

main().catch(console.error)
