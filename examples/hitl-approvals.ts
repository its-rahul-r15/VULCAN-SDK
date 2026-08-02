import { Vulcan, z } from '../src'

const sendWireTransfer = Vulcan.createTool({
  name: 'send_wire_transfer',
  description: 'Transfer funds to external bank account',
  inputSchema: z.object({
    amount: z.number().describe('Amount in USD'),
    recipientAccount: z.string().describe('Recipient IBAN or account number'),
  }),
  requiresApproval: (input) => input.amount > 100, // Require human approval for amounts > $100
  async execute({ amount, recipientAccount }) {
    return { success: true, message: `Successfully transferred $${amount} to ${recipientAccount}` }
  },
})

const bankAgent = Vulcan.createAgent({
  name: 'banking-agent',
  instructions: 'You assist users with financial transactions. Always use send_wire_transfer tool for transfers.',
  tools: [sendWireTransfer],
})

async function main() {
  console.log('--- Running Banking Agent with HITL Approval ---')

  const result = await Vulcan.run(bankAgent, 'Please transfer $500 to account US123456789', {
    async onApproval(request) {
      console.log('\n🛑 [HITL Approval Requested]')
      console.log(`Tool: ${request.toolName}`)
      console.log(`Input:`, request.input)

      // Simulate operator decision
      console.log('--> Operator approving transfer...')
      return {
        approved: true,
        reason: 'Authorized by compliance manager',
      }
    },
  })

  console.log('\nFinal Status:', result.status)
  console.log('Output:', result.output)
}

main().catch(console.error)
