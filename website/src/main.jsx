import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register WebMCP tools if supported by the browser to support Agentic Browsing / Lighthouse checks
if (typeof document !== 'undefined' && 'modelContext' in document) {
  try {
    document.modelContext.registerTool({
      name: 'get_sdk_installation_info',
      description: 'Get command line instructions for installing the Vulcan SDK and its package manager commands.',
      inputSchema: {
        type: 'object',
        properties: {
          packageManager: {
            type: 'string',
            enum: ['npm', 'pnpm', 'yarn'],
            default: 'npm'
          }
        }
      },
      readOnlyHint: true,
      execute: async ({ packageManager = 'npm' }) => {
        const cmd = {
          npm: 'npm install vulcan-agentic-sdk',
          pnpm: 'pnpm add vulcan-agentic-sdk',
          yarn: 'yarn add vulcan-agentic-sdk'
        };
        return `Run this command to install the SDK: ${cmd[packageManager]}`;
      }
    });

    document.modelContext.registerTool({
      name: 'get_sdk_quickstart_example',
      description: 'Get a self-contained, working single-file TypeScript code example showing how to build a math agent using Vulcan SDK.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      readOnlyHint: true,
      execute: async () => {
        return `import { Vulcan, z } from 'vulcan-agentic-sdk'

// 1. Define a tool with Zod schema validation
const calculatorTool = Vulcan.createTool({
  name: 'calculator',
  description: 'Perform basic math calculations.',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  async execute({ operation, a, b }) {
    const math = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b }
    return { result: math[operation] }
  },
})

// 2. Create the agent
const mathAgent = Vulcan.createAgent({
  name: 'math-helper',
  instructions: 'You are a math assistant.',
  tools: [calculatorTool],
})

// 3. Run the agent
async function main() {
  const result = await Vulcan.run(mathAgent, 'What is 128 multiplied by 37?')
  console.log('Output:', result.output)
}

main()`;
      }
    });
  } catch (err) {
    console.warn('Failed to register WebMCP tools:', err);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
