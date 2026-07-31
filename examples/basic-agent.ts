/**
 * Vulcan SDK — Basic Agent Example
 *
 * Demonstrates:
 * - Creating an agent with a custom tool
 * - Running the agent with user input
 * - Reading the final result and trace
 */

import { Vulcan, z, OpenAIProvider, VulcanTracer } from '../src/index.js'

// ── 1. Define a tool ──────────────────────────────────────────

const calculatorTool = Vulcan.createTool({
  name: 'calculator',
  description: 'Performs basic arithmetic: add, subtract, multiply, divide.',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  async execute({ operation, a, b }) {
    switch (operation) {
      case 'add':      return { result: a + b }
      case 'subtract': return { result: a - b }
      case 'multiply': return { result: a * b }
      case 'divide':
        if (b === 0) throw new Error('Cannot divide by zero')
        return { result: a / b }
    }
  },
  errorHandler: (error) => `Calculation failed: ${error.message}`,
})

// ── 2. Create an agent ────────────────────────────────────────

const mathAgent = Vulcan.createAgent({
  name: 'math-agent',
  instructions: `
    You are a helpful math assistant.
    When asked to calculate, always use the calculator tool.
    Explain your reasoning clearly.
  `,
  model: 'gpt-4o',
  providerName: 'openai',
  tools: [calculatorTool],
  maxTurns: 5,
})

// ── 3. Run ────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Vulcan SDK — Basic Agent Example\n')

  const result = await Vulcan.run(mathAgent, 'What is 42 multiplied by 13, then divided by 7?')

  console.log('✅ Final Answer:', result.output)
  console.log('📊 Stats:')
  console.log(`   Turns: ${result.turns}`)
  console.log(`   Tokens: ${result.usage.totalTokens}`)
  console.log(`   Status: ${result.status}`)
  console.log(`   Trace ID: ${result.traceId}`)
}

main().catch(console.error)
