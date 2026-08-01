export interface DocSection {
  title: string
  content: string
  code?: string
  codeLanguage?: string
  callout?: { type: 'tip' | 'warning' | 'note' | 'danger'; text: string }
  steps?: string[]
  table?: { headers: string[]; rows: string[][] }
}

export interface DocPage {
  id: string
  title: string
  category: string
  description: string
  sections: DocSection[]
}

export const docsData: Record<string, DocPage> = {
  introduction: {
    id: 'introduction',
    title: 'Introduction',
    category: 'Getting Started',
    description: 'Vulcan is an open-source, production-grade AI Agent SDK built from scratch in TypeScript. It gives developers fine-grained control over agent execution loops, tool validation, multi-agent coordination, and safety policy evaluation — all without opinionated abstractions or vendor lock-in.',
    sections: [
      {
        title: 'What is Vulcan?',
        content: 'Vulcan is a lightweight but fully-featured SDK that separates three critical concerns of an agent runtime: the Agent Configuration (static behavior, instructions, tools), the RunContext (dynamic, single-run state), and the Session Storage (persistent, long-term chat history). This separation lets you scale stateless agent logic horizontally while storing session state independently in databases.',
      },
      {
        title: 'Core Design Principles',
        content: 'Vulcan is built around three principles that distinguish it from other agent frameworks.',
        steps: [
          'Type-first: All tool inputs are validated with Zod schemas before the handler is ever invoked. The model can never pass malformed arguments to your business logic.',
          'Zero opinionated runtime: Vulcan does not dictate your web framework, database, or deployment environment. It is just a TypeScript library.',
          'Transparent execution: Every LLM call, tool invocation, guardrail check, and handoff is recorded in a structured trace you can inspect, export, or send to an observability platform.',
        ],
      },
      {
        title: 'Architecture Overview',
        content: 'The AgentRunner sits at the center. It orchestrates the reasoning loop, validates tool calls, runs guardrails, and delegates handoffs. Storage adapters plug in via a unified interface. Tracing is global and passive — it never requires changes to your agent code.',
      },
      {
        title: 'Supported LLM Providers',
        content: 'Vulcan uses a provider-agnostic adapter layer. You can switch models without changing any agent logic.',
        table: {
          headers: ['Provider', 'SDK Dependency', 'Default Model', 'Status'],
          rows: [
            ['Google Gemini', '@google/generative-ai', 'gemini-2.5-flash', '✓ Stable'],
            ['Groq (Llama / DeepSeek)', 'Zero-dep / fetch API', 'llama-3.3-70b-versatile', '✓ Stable'],
            ['OpenAI', 'openai', 'gpt-4o', '✓ Stable'],
            ['Anthropic Claude', '@anthropic-ai/sdk', 'claude-3-5-sonnet-20241022', '✓ Stable'],
          ]
        }
      },
    ],
  },

  installation: {
    id: 'installation',
    title: 'Installation',
    category: 'Getting Started',
    description: 'Install the Vulcan SDK and configure your LLM provider API keys. The base package is zero-dependency and under 50 kB gzipped.',
    sections: [
      {
        title: 'Install the SDK',
        content: 'Install the base Vulcan SDK using your preferred package manager.',
        code: `# npm
npm install vulcan-agentic-sdk

# pnpm
pnpm add vulcan-agentic-sdk

# yarn
yarn add vulcan-agentic-sdk`,
        codeLanguage: 'bash',
      },
      {
        title: 'Install a Provider SDK',
        content: 'Vulcan uses lazy-loading — only the provider SDK you actually call is imported at runtime. Install the one you need:',
        code: `# Google Gemini (recommended default)
npm install @google/generative-ai

# OpenAI GPT
npm install openai

# Anthropic Claude
npm install @anthropic-ai/sdk`,
        codeLanguage: 'bash',
      },
      {
        title: 'Configure API Keys',
        content: 'Create a .env file in your project root. Vulcan reads it automatically using dotenv at startup.',
        code: `# .env
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-api03-..."`,
        codeLanguage: 'bash',
        callout: { type: 'warning', text: 'Never commit your .env file to version control. Add it to your .gitignore immediately.' },
      },
      {
        title: 'TypeScript Configuration',
        content: 'Vulcan requires TypeScript 5.0 or higher with ESM module resolution enabled. Recommended tsconfig settings:',
        code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true
  }
}`,
        codeLanguage: 'json',
      },
    ],
  },

  quickstart: {
    id: 'quickstart',
    title: 'Quickstart',
    category: 'Getting Started',
    description: 'Build a working AI agent with a custom tool in under 5 minutes. This guide walks you through defining a tool, creating an agent, and running your first autonomous LLM loop.',
    sections: [
      {
        title: 'Step 1 — Define a Tool',
        content: 'Tools are the actions your agent can take. You define them with a Zod schema for input validation and an async execute handler. Vulcan validates all model-generated arguments against this schema before calling your handler — preventing invalid data from ever reaching your business logic.',
        code: `import { Vulcan, z } from 'vulcan-agentic-sdk'

const calculatorTool = Vulcan.createTool({
  name: 'calculator',
  description: 'Perform basic math calculations: add, subtract, multiply, divide.',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  async execute({ operation, a, b }) {
    const math = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b }
    return { result: math[operation] }
  },
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Step 2 — Create an Agent',
        content: 'Agents are defined with a name, system instructions, and an array of tools. The instructions guide the LLM\'s behavior. Keep them precise and task-focused.',
        code: `const mathAgent = Vulcan.createAgent({
  name: 'math-helper',
  instructions: \`You are a math assistant. Always use the calculator tool for arithmetic calculations.\`,
  model: 'gemini-2.5-flash', // optional — this is the default
  tools: [calculatorTool],
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Step 3 — Run the Agent',
        content: 'Call Vulcan.run() with your agent and a user message. The runner handles the full tool-calling loop: it calls the model, detects tool use requests, executes your handlers, feeds the results back, and repeats until the model produces a final text response.',
        code: `async function main() {
  const result = await Vulcan.run(mathAgent, 'What is 128 multiplied by 37?')

  console.log('Output:', result.output)
  // → "128 multiplied by 37 is 4,736."
}

main()`,
        codeLanguage: 'typescript',
        callout: { type: 'tip', text: 'Run with npx tsx agent.ts for instant TypeScript execution without a build step.' },
      },
      {
        title: 'Complete 1-File Working Script',
        content: 'Here is the full, self-contained single-file code you can copy-paste and run immediately:',
        code: `import { Vulcan, z } from 'vulcan-agentic-sdk'

// 1. Define a tool with Zod schema validation
const calculatorTool = Vulcan.createTool({
  name: 'calculator',
  description: 'Perform basic math calculations: add, subtract, multiply, divide.',
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
  instructions: 'You are a math assistant. Always use the calculator tool for math.',
  tools: [calculatorTool],
})

// 3. Run the agent
async function main() {
  const result = await Vulcan.run(mathAgent, 'What is 128 multiplied by 37?')
  console.log('Output:', result.output)
  // → "128 multiplied by 37 is 4,736."
}

main()`,
        codeLanguage: 'typescript',
        callout: { type: 'tip', text: 'Save as agent.ts and execute with: npx tsx agent.ts' },
      },
      {
        title: 'Multi-Turn Conversations',
        content: 'Pass a session ID to maintain conversation history across multiple calls. Vulcan\'s storage adapter automatically retrieves and appends messages.',
        code: `const result1 = await Vulcan.run(mathAgent, 'What is 12 * 12?', {
  session: 'user-session-abc123',
})
// → "144"

const result2 = await Vulcan.run(mathAgent, 'Now divide that by 6.', {
  session: 'user-session-abc123', // same session = history is preserved
})
// → "144 divided by 6 is 24."`,
        codeLanguage: 'typescript',
      },
    ],
  },

  tools: {
    id: 'tools',
    title: 'Tools System',
    category: 'Core Primitives',
    description: 'Tools give your agent the ability to interact with APIs, databases, file systems, or any external service. Every tool input is Zod-validated before execution, creating a safe boundary between the LLM\'s output and your business logic.',
    sections: [
      {
        title: 'Tool Anatomy',
        content: 'Every Vulcan tool has four properties: a unique name (used by the model to identify it), a description (used to help the model decide when to call it), an inputSchema (Zod object defining validated parameters), and an execute handler.',
        code: `import { Vulcan, z } from 'vulcan-agentic-sdk'

const getWeather = Vulcan.createTool({
  name: 'get_weather',
  description: 'Get the current weather for a city. Returns temperature in Celsius.',
  inputSchema: z.object({
    city: z.string().min(1).describe('The city name, e.g. "Tokyo"'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  }),
  async execute({ city, units }) {
    const response = await fetch(\`https://api.weather.example.com?city=\${city}&units=\${units}\`)
    const data = await response.json()
    return { temperature: data.temp, description: data.desc }
  }
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Validation & Auto-Correction',
        content: 'When the LLM generates tool call arguments, Vulcan runs them through your Zod schema before calling execute(). If validation fails, the error message is sent back to the model so it can self-correct. This loop repeats up to 3 times before raising a ToolValidationError.',
        callout: { type: 'note', text: 'Write descriptive .describe() annotations on your schema fields. They are included in the tool definition sent to the LLM and significantly improve argument accuracy.' },
      },
      {
        title: 'Timeouts & Error Handlers',
        content: 'Configure execution timeouts and custom error fallbacks to keep the agent loop running even when external services fail.',
        code: `const fetchPageTool = Vulcan.createTool({
  name: 'fetch_webpage',
  description: 'Download and return the text content of a URL.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  timeoutMs: 8000, // Abort after 8 seconds

  // If execute throws or times out, this runs instead
  errorHandler(error, input) {
    return \`Could not fetch \${input.url}: \${error.message}. Please try a different approach.\`
  },

  async execute({ url }) {
    const res = await fetch(url)
    return { content: await res.text() }
  }
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Returning Structured Data',
        content: 'Tool execute() handlers can return any JSON-serializable object. The entire return value is serialized and sent back to the model as the tool result. Return rich objects to give the model more context for its final response.',
        code: `// Tool returning a rich object
async execute({ ticker }) {
  return {
    ticker: ticker.toUpperCase(),
    price: 182.50,
    change: +2.3,
    changePercent: '+1.28%',
    marketCap: '2.8T',
    lastUpdated: new Date().toISOString(),
  }
}`,
        codeLanguage: 'typescript',
      },
    ],
  },

  guardrails: {
    id: 'guardrails',
    title: 'Guardrails & Safety',
    category: 'Core Primitives',
    description: 'Guardrails intercept and evaluate payloads at three borders: before the user prompt reaches the LLM (input), after the LLM generates a response (output), and before a tool is executed (tool). If a guardrail fails, the agent loop is safely terminated with a GuardrailViolationError.',
    sections: [
      {
        title: 'Guardrail Borders',
        content: 'Each guardrail specifies where it intercepts payloads.',
        table: {
          headers: ['Border', 'type value', 'Evaluates', 'Use Case'],
          rows: [
            ['Input', '"input"', 'User message before LLM call', 'Block harmful prompts, enforce length limits'],
            ['Output', '"output"', 'LLM response before returning to user', 'Scrub PII, filter banned content'],
            ['Tool', '"tool"', 'Tool arguments before execute()', 'Block specific tool invocations'],
          ]
        }
      },
      {
        title: 'Built-in Guardrails',
        content: 'Vulcan ships five ready-to-use guardrail adapters. Import and instantiate them directly.',
        code: `import {
  MaxLengthGuardrail,
  KeywordBlockGuardrail,
  PIIScrubberGuardrail,
  BlockedToolsGuardrail,
  FunctionGuardrail,
} from 'vulcan-agentic-sdk'

const secureAgent = Vulcan.createAgent({
  name: 'secure-helper',
  instructions: 'Help users with account questions.',
  guardrails: [
    // Input: reject messages over 500 chars
    new MaxLengthGuardrail(500, { type: 'input' }),

    // Input: block prompt injection attempts
    new KeywordBlockGuardrail(['ignore previous', 'system prompt', 'jailbreak'], { type: 'input' }),

    // Output: replace emails and phone numbers with [REDACTED]
    new PIIScrubberGuardrail({ type: 'output' }),
  ],
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Custom Function Guardrail',
        content: 'FunctionGuardrail lets you run arbitrary async logic. Return { passed: true } to continue, or { passed: false, reason: "..." } to halt.',
        code: `import { FunctionGuardrail } from 'vulcan-agentic-sdk'

// Only allow requests during business hours (6am–10pm UTC)
const businessHoursGuard = new FunctionGuardrail(
  'business-hours-check',
  'input',
  async (payload) => {
    const hour = new Date().getUTCHours()
    if (hour < 6 || hour > 22) {
      return {
        passed: false,
        reason: 'Our AI assistant is only available between 6am and 10pm UTC.'
      }
    }
    return { passed: true }
  }
)

const agent = Vulcan.createAgent({
  name: 'support-bot',
  instructions: 'Help users with support queries.',
  guardrails: [businessHoursGuard],
})`,
        codeLanguage: 'typescript',
        callout: { type: 'tip', text: 'Guardrails are evaluated in order. Put fast, cheap checks (like MaxLength) before slow, expensive ones (like LLM-based moderation) to short-circuit early.' },
      },
      {
        title: 'BlockedToolsGuardrail',
        content: 'Prevent specific tools from being called at runtime, regardless of whether the model requests them. Useful for disabling dangerous operations in certain user contexts.',
        code: `// Prevent the agent from calling delete_record or drop_table
const toolBlocker = new BlockedToolsGuardrail(
  ['delete_record', 'drop_table'],
  { type: 'tool' }
)`,
        codeLanguage: 'typescript',
      },
    ],
  },

  'memory-sessions': {
    id: 'memory-sessions',
    title: 'Memory & Sessions',
    category: 'Core Primitives',
    description: 'Vulcan decouples agent configuration from conversation state. Session storage adapters persist and retrieve chat history independently from the agent, enabling stateless agent instances that can be shared across requests.',
    sections: [
      {
        title: 'How Sessions Work',
        content: 'When you pass a session ID to Vulcan.run(), the runner loads the existing message history from the storage adapter, appends the new user message, runs the agent loop, and writes the updated history back to storage. If no session ID is provided, a fresh ephemeral context is created for that run.',
        code: `// Each call with the same session ID builds on the previous
const r1 = await Vulcan.run(agent, 'My name is Rahul.', { session: 'chat-1' })
const r2 = await Vulcan.run(agent, 'What is my name?', { session: 'chat-1' })
// r2.output → "Your name is Rahul."`,
        codeLanguage: 'typescript',
      },
      {
        title: 'InMemoryStorage (Default)',
        content: 'Zero-configuration in-process storage. Data is lost when the process exits. Best for development, testing, and stateless serverless functions.',
        code: `import { InMemoryStorage } from 'vulcan-agentic-sdk'

const storage = new InMemoryStorage({
  ttlMs: 3_600_000,  // Evict sessions older than 1 hour
  maxSessions: 500,  // Evict oldest when limit is reached
})

const agent = Vulcan.createAgent({
  name: 'my-agent',
  instructions: '...',
  storage, // attach storage adapter
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'SQLiteStorage (Persistent)',
        content: 'File-backed persistent storage using SQLite. Sessions survive process restarts. Requires the better-sqlite3 package installed separately.',
        code: `import { SQLiteStorage } from 'vulcan-agentic-sdk'

// Creates the file and table schema automatically on first use
const storage = new SQLiteStorage('./data/sessions.db')

const agent = Vulcan.createAgent({
  name: 'persistent-agent',
  instructions: '...',
  storage,
})`,
        codeLanguage: 'typescript',
        callout: { type: 'note', text: 'In production, prefer an external database adapter (Redis, PostgreSQL) for multi-instance deployments. Custom adapters can be built by implementing the SessionStorage interface.' },
      },
      {
        title: 'Custom Storage Adapter',
        content: 'Implement the SessionStorage interface to connect any database. You only need to implement three methods.',
        code: `import type { SessionStorage, Message } from 'vulcan-agentic-sdk'

export class RedisStorage implements SessionStorage {
  async getMessages(sessionId: string): Promise<Message[]> {
    const raw = await redis.get(\`session:\${sessionId}\`)
    return raw ? JSON.parse(raw) : []
  }

  async appendMessages(sessionId: string, messages: Message[]): Promise<void> {
    const existing = await this.getMessages(sessionId)
    const updated = [...existing, ...messages]
    await redis.set(\`session:\${sessionId}\`, JSON.stringify(updated), 'EX', 86400)
  }

  async clearSession(sessionId: string): Promise<void> {
    await redis.del(\`session:\${sessionId}\`)
  }
}`,
        codeLanguage: 'typescript',
      },
    ],
  },

  handoffs: {
    id: 'handoffs',
    title: 'Agent Handoffs',
    category: 'Advanced Patterns',
    description: 'Handoffs let one agent delegate a conversation to another specialized agent at runtime. Vulcan injects a handoff tool automatically and manages the full context transfer, including cycle detection to prevent infinite delegation loops.',
    sections: [
      {
        title: 'Basic Handoff Setup',
        content: 'Chain agents together using .withHandoff(). When the triage agent decides to delegate, Vulcan transfers the full conversation history to the target agent and continues the loop from there.',
        code: `import { Vulcan } from 'vulcan-agentic-sdk'

const billingAgent = Vulcan.createAgent({
  name: 'billing-specialist',
  instructions: \`You are a billing specialist.
Help users with invoices, payment issues, and subscription changes.
Be precise and always confirm account numbers before taking actions.\`,
})

const techAgent = Vulcan.createAgent({
  name: 'tech-support',
  instructions: \`You are a technical support engineer.
Help users debug integration issues and API errors.\`,
})

const triageAgent = Vulcan.createAgent({
  name: 'triage',
  instructions: \`You are the first point of contact. Route requests:
- Billing/payment questions → billing-specialist
- Technical/API questions → tech-support
- All other questions → answer directly.\`,
})
  .withHandoff(billingAgent)
  .withHandoff(techAgent)

// User query is automatically routed to the right specialist
const result = await Vulcan.run(triageAgent, 'My invoice INV-2026-04 shows the wrong amount.')`,
        codeLanguage: 'typescript',
      },
      {
        title: 'How Handoffs Are Injected',
        content: 'When you call .withHandoff(targetAgent), Vulcan adds a hidden tool named handoff_to_<agent_name> to the triage agent\'s tool list. The tool description is derived from the target agent\'s instructions. The model sees this as a callable action and decides when to use it based on context.',
        callout: { type: 'note', text: 'Handoff tool names are auto-generated from the target agent\'s name. Keep agent names short, lowercase, and hyphen-separated for clean tool names.' },
      },
      {
        title: 'Loop Detection',
        content: 'Vulcan tracks every agent visited during a single run() call. If an agent tries to hand off to an agent already in the visited chain, a HandoffLoopError is raised immediately instead of entering an infinite loop.',
        code: `// This chain would cause a loop: triage → billing → triage
// Vulcan catches it and throws:
// HandoffLoopError: Cycle detected: triage → billing → triage

try {
  const result = await Vulcan.run(triageAgent, 'Hello')
} catch (err) {
  if (err.name === 'HandoffLoopError') {
    console.error('Agents entered a delegation loop:', err.message)
  }
}`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Handoff with Context Injection',
        content: 'You can pass additional context when initiating a run. The context object is available inside the execute() handler of any tool the handoff agent calls, without polluting the message history.',
        code: `const result = await Vulcan.run(triageAgent, 'Show me my invoices', {
  session: 'user-session-789',
  context: {
    userId: 'usr_9f3a',
    accountTier: 'pro',
    region: 'us-east-1',
  }
})`,
        codeLanguage: 'typescript',
      },
    ],
  },

  tracing: {
    id: 'tracing',
    title: 'Tracing & Observability',
    category: 'Advanced Patterns',
    description: 'Vulcan\'s global tracer silently records every operation in a run — LLM calls, tool executions, guardrail evaluations, and handoffs. Traces are structured, exportable, and require zero instrumentation in your agent code.',
    sections: [
      {
        title: 'Accessing a Trace',
        content: 'Every Vulcan.run() call returns a traceId. Pass it to the global tracer to retrieve the full execution record.',
        code: `import { Vulcan, globalTracer } from 'vulcan-agentic-sdk'

const result = await Vulcan.run(agent, 'What is the square root of 144?')

// Retrieve the structured trace object
const trace = globalTracer.getTrace(result.traceId)

console.log(\`Status:   \${trace.status}\`)       // "completed"
console.log(\`Duration: \${trace.durationMs}ms\`) // 3412
console.log(\`Turns:    \${trace.turns}\`)         // 3
console.log(\`Tokens:   \${trace.totalTokens}\`)   // 486`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Pretty-Print Export',
        content: 'Export a human-readable trace table ideal for debugging in the terminal. Every step is timestamped and shows token usage.',
        code: `console.log(globalTracer.export(trace, 'pretty'))`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Pretty Export Output',
        content: 'The formatted output gives you a clear picture of what happened inside a run:',
        code: `╔══════════════════════════════════════════════════════════════
║ Vulcan Trace  ·  Run ID: 7da6ede0-a062-444f-819c-6f77716f7568
║ Agent: math-agent  ·  Session: 657192f0-ecb1-49ac-acd5-9894
║ Status: completed  ·  Duration: 3412ms  ·  Turns: 3
║ Tokens: 486  (↑ 312 prompt  ↓ 174 completion)
╠══════════════════════════════════════════════════════════════
║ LLM Calls
║  [1] gemini-2.5-flash  1840ms  stop_reason=tool_calls  tokens=212
║  [2] gemini-2.5-flash  1080ms  stop_reason=tool_calls  tokens=158
║  [3] gemini-2.5-flash   492ms  stop_reason=stop        tokens=116
║
║ Tool Calls
║  [✓]  calculator  { operation: "sqrt", a: 144 }  → { result: 12 }  1ms
╚══════════════════════════════════════════════════════════════`,
        codeLanguage: 'text',
      },
      {
        title: 'JSON Export',
        content: 'Export the trace as a structured JSON object for ingestion into your observability stack (Datadog, Grafana, custom logging pipelines).',
        code: `const json = globalTracer.export(trace, 'json')
// Send to your observability pipeline
await fetch('https://logs.myapp.com/traces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(json),
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Streaming Events',
        content: 'For real-time observability, use the stream() API to receive events as they happen during a run.',
        code: `for await (const event of agent.stream('Solve a complex problem step by step')) {
  switch (event.type) {
    case 'llm_call_start':
      console.log('→ LLM thinking...')
      break
    case 'tool_call':
      console.log(\`→ Tool: \${event.data.toolName}(\${JSON.stringify(event.data.args)})\`)
      break
    case 'tool_result':
      console.log(\`← Result: \${JSON.stringify(event.data.result)}\`)
      break
    case 'final_output':
      console.log(\`✓ Done: \${event.data.output}\`)
      break
  }
}`,
        codeLanguage: 'typescript',
        callout: { type: 'tip', text: 'Use streaming events to build real-time progress UIs or pipe agent execution logs to a monitoring dashboard without any additional instrumentation.' },
      },
    ],
  },

  builtinTools: {
    id: 'builtinTools',
    title: 'Built-in Production Tools',
    category: 'Core Primitives',
    description: 'Vulcan ships five zero-dependency, production-grade built-in tools for web search, web scraping, sandboxed code execution, safe SQL queries, and RAG vector store retrieval.',
    sections: [
      {
        title: 'Overview',
        content: 'Built-in tools give agents instant capabilities without writing custom boilerplates. All built-in tools come prepackaged with Zod schemas and security controls.',
      },
      {
        title: '1. Web Search Tool',
        content: 'Perform live web searches with Tavily, Brave Search, or automatic DuckDuckGo offline fallback.',
        code: `import { createWebSearchTool, Vulcan } from 'vulcan-agentic-sdk'

const searchTool = createWebSearchTool({
  provider: 'tavily',
  apiKey: process.env.TAVILY_API_KEY,
  maxResults: 5,
})

const researchAgent = Vulcan.createAgent({
  name: 'researcher',
  instructions: 'Find recent tech news and summarize.',
  tools: [searchTool],
})`,
        codeLanguage: 'typescript',
      },
      {
        title: '2. Web Scraper Tool',
        content: 'Download and clean web pages into markdown/text while stripping unsafe HTML tags and capping payload length.',
        code: `import { createWebScraperTool } from 'vulcan-agentic-sdk'

const scraperTool = createWebScraperTool({
  maxLength: 10000,
  timeoutMs: 15000,
})`,
        codeLanguage: 'typescript',
      },
      {
        title: '3. Code Sandbox Tool',
        content: 'Safely execute JavaScript code in an isolated execution sandbox and return console logs and return values.',
        code: `import { createCodeSandboxTool } from 'vulcan-agentic-sdk'

const sandboxTool = createCodeSandboxTool({ timeoutMs: 5000 })`,
        codeLanguage: 'typescript',
      },
      {
        title: '4. Safe SQL Query Tool',
        content: 'Execute SQL queries with built-in read-only safeguards (blocks DROP, DELETE, INSERT, UPDATE statements automatically).',
        code: `import { createSQLQueryTool } from 'vulcan-agentic-sdk'

const sqlTool = createSQLQueryTool({
  schemaDescription: 'users (id INT, email TEXT, created_at TIMESTAMP)',
  readOnly: true,
  async executeQuery(sql) {
    return await db.query(sql)
  },
})`,
        codeLanguage: 'typescript',
      },
      {
        title: '5. Vector Store RAG Tool',
        content: 'Retrieve semantically relevant knowledge chunks from vector DBs or local embeddings.',
        code: `import { createVectorStoreTool } from 'vulcan-agentic-sdk'

const ragTool = createVectorStoreTool({
  async searchFn(query, topK) {
    return await vectorDb.search(query, topK)
  },
})`,
        codeLanguage: 'typescript',
      },
    ],
  },

  hitlApprovals: {
    id: 'hitlApprovals',
    title: 'Human-in-the-Loop (HITL)',
    category: 'Core Primitives',
    description: 'Enforce human review and manual approval before executing high-risk or destructive tool calls (such as payment processing, database writes, or emailing customers).',
    sections: [
      {
        title: 'Requiring Approval on Tools',
        content: 'Set requiresApproval: true or pass a dynamic predicate function on any tool definition.',
        code: `import { Vulcan, Tool, z } from 'vulcan-agentic-sdk'

const paymentTool = Tool.create({
  name: 'send_payment',
  description: 'Transfer funds to user account.',
  inputSchema: z.object({ amount: z.number(), recipient: z.string() }),
  requiresApproval: (input) => input.amount > 50, // Require approval for transfers > $50
  async execute({ amount, recipient }) {
    return \`Transferred $\${amount} to \${recipient}\`
  },
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Handling Approval Callbacks',
        content: 'Pass an onApproval callback to runner options or agent config. Approve, deny, or modify tool arguments before execution.',
        code: `const result = await Vulcan.run(agent, 'Send $500 to Bob', {
  async onApproval(request) {
    console.log(\`[HITL Approval Needed] Tool: \${request.toolName}, Input:\`, request.input)
    
    // Prompt operator / user UI for confirmation
    const userApproved = await askUserConfirmation(request)
    
    return {
      approved: userApproved,
      reason: userApproved ? 'Approved by operator' : 'Transfer rejected by user',
    }
  },
})`,
        codeLanguage: 'typescript',
      },
      {
        title: 'Execution Pause & Resume',
        content: 'If no onApproval handler is provided, Vulcan automatically pauses execution, saves session state, and returns status: "requires_approval" with pendingApproval details.',
        code: `const result = await Vulcan.run(agent, 'Delete account records')

if (result.status === 'requires_approval') {
  console.log('Execution paused for request:', result.pendingApproval)
  // Store pendingApproval.id in DB or Web UI
}`,
        codeLanguage: 'typescript',
        callout: { type: 'important', text: 'HITL approvals ensure production safety for automated agents interacting with financial, healthcare, or enterprise data.' },
      },
    ],
  },
}
