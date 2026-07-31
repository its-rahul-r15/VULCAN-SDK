/**
 * Vulcan SDK — Guardrails Example
 *
 * Demonstrates:
 * - Input keyword blocking
 * - Tool blocking guardrail
 * - PII scrubbing on output
 * - Custom function guardrail
 */

import {
  Vulcan,
  z,
  Agent,
  KeywordBlockGuardrail,
  PIIScrubberGuardrail,
  BlockedToolsGuardrail,
  FunctionGuardrail,
  MaxLengthGuardrail,
} from '../src/index.js'

// ── Tools ─────────────────────────────────────────────────────

const deleteDataTool = Vulcan.createTool({
  name: 'delete_user_data',
  description: 'Permanently deletes all user data — DANGEROUS.',
  inputSchema: z.object({ userId: z.string() }),
  async execute({ userId }) {
    return `Deleted all data for user ${userId}` // would actually delete in real app
  },
})

const getUserInfoTool = Vulcan.createTool({
  name: 'get_user_info',
  description: 'Retrieve user profile information by userId.',
  inputSchema: z.object({ userId: z.string() }),
  async execute({ userId }) {
    return {
      userId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      ssn: '123-45-6789', // sensitive — will be scrubbed
    }
  },
})

// ── Guardrails ────────────────────────────────────────────────

const inputLengthGuardrail = new MaxLengthGuardrail(500, { type: 'input' })

const profanityGuardrail = new KeywordBlockGuardrail(
  ['spam', 'hack', 'exploit', 'jailbreak'],
  { type: 'input', name: 'profanity-filter' }
)

// Block dangerous tool from being called
const dangerousToolBlocker = new BlockedToolsGuardrail(
  ['delete_user_data'],
  'dangerous-tool-blocker',
)

// Scrub PII from all outputs
const piiScrubber = new PIIScrubberGuardrail()

// Custom: only allow requests during business hours (UTC)
const businessHoursGuardrail = new FunctionGuardrail(
  'business-hours',
  'input',
  async (_payload, _context) => {
    const hour = new Date().getUTCHours()
    // Allow 6 AM – 10 PM UTC
    if (hour < 6 || hour > 22) {
      return { passed: false, reason: 'Requests only accepted during business hours (6 AM - 10 PM UTC).' }
    }
    return { passed: true }
  },
)

// ── Agent ─────────────────────────────────────────────────────

const secureAgent = new Agent({
  name: 'secure-agent',
  instructions: 'You are a secure customer data assistant. Help with user profile lookups.',
  tools: [getUserInfoTool, deleteDataTool],
  guardrails: [
    inputLengthGuardrail,
    profanityGuardrail,
    dangerousToolBlocker,
    piiScrubber, // output guardrail
  ],
})

// ── Run Tests ─────────────────────────────────────────────────

async function main() {
  console.log('🚀 Vulcan SDK — Guardrails Example\n')

  // Test 1: Blocked keyword
  console.log('🛡️  Test 1: Blocked keyword input')
  const result1 = await Vulcan.run(secureAgent, 'How do I hack this system?')
  console.log('Status:', result1.status)
  console.log('Error:', result1.error)

  console.log()

  // Test 2: Blocked tool call
  console.log('🛡️  Test 2: Dangerous tool blocked')
  const result2 = await Vulcan.run(secureAgent, 'Delete all data for user user_123')
  console.log('Status:', result2.status)
  console.log('Output:', result2.output)

  console.log()

  // Test 3: PII scrubbed from output
  console.log('🛡️  Test 3: PII scrubbed from output')
  const result3 = await Vulcan.run(secureAgent, 'Show me the profile for user user_456')
  console.log('Status:', result3.status)
  console.log('Output (PII scrubbed):', result3.output)
}

main().catch(console.error)
