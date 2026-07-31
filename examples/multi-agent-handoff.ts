/**
 * Vulcan SDK — Multi-Agent Handoff Example
 *
 * Demonstrates:
 * - A triage agent that routes to specialized agents
 * - Automatic handoff tool injection
 * - Handoff loop detection
 * - Trace showing the handoff chain
 */

import { Vulcan, z, VulcanTracer, globalTracer } from '../src/index.js'

// ── Specialized Agent: Billing ────────────────────────────────

const lookupInvoiceTool = Vulcan.createTool({
  name: 'lookup_invoice',
  description: 'Look up an invoice by invoice number.',
  inputSchema: z.object({ invoiceNumber: z.string() }),
  async execute({ invoiceNumber }) {
    // Simulated DB lookup
    return {
      invoiceNumber,
      amount: '$249.99',
      status: 'paid',
      date: '2026-07-15',
    }
  },
})

const billingAgent = new (await import('../src/core/agent.js').then(m => m.Agent))({
  name: 'billing',
  instructions: `
    You are a billing specialist. Help customers with invoices, payments, and billing inquiries.
    Use the lookup_invoice tool to retrieve invoice details.
  `,
  tools: [lookupInvoiceTool],
  model: 'gpt-4o',
})

// ── Specialized Agent: Technical Support ──────────────────────

const troubleshootTool = Vulcan.createTool({
  name: 'troubleshoot',
  description: 'Get troubleshooting steps for a technical issue.',
  inputSchema: z.object({
    issue: z.string().describe('Description of the technical issue'),
    product: z.string().optional(),
  }),
  async execute({ issue, product }) {
    return {
      steps: [
        'Restart the application',
        'Clear browser cache',
        'Check network connectivity',
        `Contact support for: ${issue}${product ? ` (${product})` : ''}`,
      ],
    }
  },
})

const supportAgent = new (await import('../src/core/agent.js').then(m => m.Agent))({
  name: 'tech-support',
  instructions: `
    You are a technical support specialist. Help customers troubleshoot product issues.
    Use the troubleshoot tool to provide step-by-step guidance.
  `,
  tools: [troubleshootTool],
  model: 'gpt-4o',
})

// ── Triage Agent ──────────────────────────────────────────────

import { Agent } from '../src/core/agent.js'

const triageAgent = new Agent({
  name: 'triage',
  instructions: `
    You are a customer support triage agent. Your job is to understand the customer's issue
    and route them to the correct specialist:
    - For billing, payment, or invoice issues → hand off to the 'billing' agent
    - For technical problems, bugs, or product issues → hand off to the 'tech-support' agent
    - Only hand off ONCE — do not keep re-routing.
  `,
  model: 'gpt-4o',
})
  .withHandoff(billingAgent)
  .withHandoff(supportAgent)

// ── Run ───────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Vulcan SDK — Multi-Agent Handoff Example\n')

  const runner = new (await import('../src/core/runner.js').then(m => m.AgentRunner))(globalTracer)

  // Billing inquiry
  console.log('📋 Test 1: Billing inquiry')
  const billingResult = await runner.run(
    triageAgent,
    'I need help with invoice #INV-2026-00142. Can you look it up?',
  )
  console.log('Answer:', billingResult.output)
  console.log('Status:', billingResult.status)

  // Check the trace for handoff
  const trace = globalTracer.getTrace(billingResult.traceId)
  if (trace && trace.handoffs.length > 0) {
    console.log('\n📡 Handoff detected:')
    for (const h of trace.handoffs) {
      console.log(`   ${h.from} → ${h.to} (turn ${h.turn})`)
    }
  }

  console.log('\n' + globalTracer.export(trace!, 'pretty'))
}

main().catch(console.error)
