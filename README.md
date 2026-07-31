<div align="center">

# ⚡ Vulcan SDK

**Production-grade AI Agent SDK for TypeScript**

Multi-provider · Typed · Observable · Framework-free

[![npm version](https://img.shields.io/npm/v/vulcan-agentic-sdk.svg?style=flat-square)](https://www.npmjs.com/package/vulcan-agentic-sdk)
[![CI](https://github.com/its-rahul-r15/VULCAN-SDK/actions/workflows/ci.yml/badge.svg)](https://github.com/its-rahul-r15/VULCAN-SDK/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=flat-square)](https://www.typescriptlang.org)

</div>

---

## What is Vulcan?

Vulcan is an open-source AI Agent SDK that gives developers complete control over autonomous agents — without locking you into a single provider or framework.

Build agents that:
- 🧠 **Think step-by-step** with the built-in INITIAL → THINK → ANALYSE → OUTPUT reasoning pipeline
- 🔧 **Call tools** with Zod-validated inputs and typed outputs
- 🔄 **Hand off** between specialized agents with loop detection
- 🛡️ **Stay safe** with input, output, and tool-level guardrails
- 💾 **Remember** conversations across sessions with pluggable storage
- 📊 **Observe everything** with full traces, token usage, and event streams
- 🌐 **Work with any LLM** — OpenAI, Claude, Gemini, or your own provider

---

## Why Vulcan?

| Feature | Vulcan | LangChain | OpenAI Agents SDK |
|---------|--------|-----------|-------------------|
| Zero framework dependency | ✅ | ❌ | ❌ |
| Multi-provider support | ✅ | ✅ | ❌ |
| Built-in CoT reasoning | ✅ | ❌ | ❌ |
| Zod typed tool inputs | ✅ | Partial | ❌ |
| Tool-level guardrails | ✅ | ❌ | ❌ |
| Handoff loop detection | ✅ | ❌ | Partial |
| Full TypeScript inference | ✅ | Partial | Partial |

---

## Installation

```bash
npm install vulcan-agentic-sdk

# Add your preferred provider(s):
npm install openai                    # OpenAI (GPT-4o, GPT-4 Turbo, etc.)
npm install @anthropic-ai/sdk         # Claude 3.5 Sonnet/Haiku
npm install @google/generative-ai     # Gemini 1.5 Pro/Flash

# Optional: persistent session storage
npm install better-sqlite3
```

Set your API key:
```bash
export OPENAI_API_KEY=sk-...
```

---

## Quick Start — 5 Minutes to Your First Agent

```typescript
import { Vulcan, z } from 'vulcan-agentic-sdk'

// 1. Create a tool
const calculator = Vulcan.createTool({
  name: 'calculator',
  description: 'Perform arithmetic operations',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  async execute({ operation, a, b }) {
    const ops = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b }
    return { result: ops[operation] }
  },
})

// 2. Create an agent
const agent = Vulcan.createAgent({
  name: 'math-agent',
  instructions: 'You are a math assistant. Always use the calculator tool.',
  model: 'gpt-4o',
  tools: [calculator],
})

// 3. Run it
const result = await Vulcan.run(agent, 'What is 42 × 13?')
console.log(result.output) // "The answer is 546"
```

---

## Reasoning Harness Mode

Enable chain-of-thought reasoning with the built-in INITIAL → THINK → ANALYSE → TOOL_REQUEST → OUTPUT pipeline:

```typescript
import { Agent } from 'vulcan-agentic-sdk'

const agent = new Agent({
  name: 'reasoner',
  instructions: 'Solve problems step by step.',
  model: 'gpt-4o',
  reasoningMode: 'harness',  // 👈 Enable CoT pipeline
  tools: [myTool],
})

// Events show the reasoning steps in real-time:
for await (const event of agent.stream('What is 2 + 2 - 5 * 10 / 3?')) {
  if (event.type === 'harness_step') {
    const step = event.data as { step: string; text: string }
    console.log(`[${step.step}]`, step.text)
  }
}
// [INITIAL] The user wants to solve a math equation using BODMAS rules
// [THINK]   First multiply 5 * 10 = 50. Equation: 2 + 2 - 50 / 3
// [ANALYSE] Correct. Now divide: 50 / 3 = 16.6667
// [OUTPUT]  The final answer is -12.6667
```

---

## Multi-Agent Handoffs

```typescript
const billingAgent = new Agent({ name: 'billing', instructions: 'Handle billing...' })
const supportAgent = new Agent({ name: 'support', instructions: 'Handle technical issues...' })

const triage = new Agent({
  name: 'triage',
  instructions: 'Route customers to the right agent.',
})
  .withHandoff(billingAgent)   // Auto-injects handoff_to_billing tool
  .withHandoff(supportAgent)   // Auto-injects handoff_to_support tool

const result = await triage.run('My invoice #123 is wrong')
// Agent automatically hands off to billingAgent
```

---

## Guardrails

```typescript
import { KeywordBlockGuardrail, PIIScrubberGuardrail, BlockedToolsGuardrail } from '@vulcan-ai/sdk'

const agent = new Agent({ name: 'safe-agent', instructions: '...' })
  .withGuardrail(new KeywordBlockGuardrail(['hack', 'exploit'], { type: 'input' }))
  .withGuardrail(new PIIScrubberGuardrail())         // Scrubs emails, phones, SSNs from output
  .withGuardrail(new BlockedToolsGuardrail(['delete_all']))
```

---

## Structured Output

```typescript
import { z } from '@vulcan-ai/sdk'

const SentimentSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number().min(0).max(10),
  summary: z.string(),
})

type Sentiment = z.infer<typeof SentimentSchema>

const agent = new Agent({
  name: 'analyzer',
  instructions: 'Analyze the sentiment of text.',
  outputSchema: SentimentSchema,
})

const result = await agent.run<Sentiment>('This product is amazing!')
console.log(result.output.sentiment) // "positive" — fully typed!
```

---

## Memory & Sessions

```typescript
import { InMemoryStorage, SQLiteStorage } from '@vulcan-ai/sdk'

// In-memory (default)
const agent = new Agent({ name: 'agent', instructions: '...' })
  .withMemory(new InMemoryStorage())

// Persistent SQLite
const agent = new Agent({ name: 'agent', instructions: '...' })
  .withMemory(new SQLiteStorage('./sessions.db'))

// Multi-turn conversation
const result1 = await agent.run('My name is Alice', { sessionId: 'user-123' })
const result2 = await agent.run('What is my name?', { sessionId: 'user-123' })
// result2.output → "Your name is Alice" ✓
```

---

## Streaming & Events

```typescript
for await (const event of agent.stream('Tell me a story')) {
  switch (event.type) {
    case 'tool_started':   console.log('🔧 Tool running:', event.data)
    case 'tool_completed': console.log('✅ Tool done:', event.data)
    case 'harness_step':   console.log('💭 Thinking:', event.data)
    case 'run_completed':  console.log('🎉 Done!')
  }
}
```

---

## Provider Abstraction

```typescript
import { OpenAIProvider, AnthropicProvider, GeminiProvider, Vulcan } from '@vulcan-ai/sdk'

// Register providers
Vulcan.registerProvider('openai', new OpenAIProvider(process.env.OPENAI_API_KEY))
Vulcan.registerProvider('anthropic', new AnthropicProvider(process.env.ANTHROPIC_API_KEY))
Vulcan.registerProvider('gemini', new GeminiProvider(process.env.GEMINI_API_KEY))

// Use with automatic fallback
const agent = new Agent({
  name: 'resilient-agent',
  instructions: '...',
  providerName: 'openai',
  fallbackProviders: ['anthropic', 'gemini'],  // Try these if OpenAI fails
})
```

---

## Tracing

```typescript
import { VulcanTracer } from '@vulcan-ai/sdk'

const tracer = new VulcanTracer()
const runner = new AgentRunner(tracer)
const result = await runner.run(agent, 'Hello')

const trace = tracer.getTrace(result.traceId)
console.log(tracer.export(trace, 'pretty'))
// ╔══════════════════════════════════════════
// ║ Vulcan Trace — Run ID: abc-123
// ║ Agent: math-agent | Tokens: 245
// ║ Model Calls (2): [gpt-4o] 320ms
// ║ Tool Calls (1): ✓ calculator — 12ms
// ╚══════════════════════════════════════════
```

---

## Documentation

📖 **Full documentation**: [docs/](./docs/)

- [Installation](./docs/installation.md)
- [Quick Start](./docs/quickstart.md)
- [API Reference](./docs/api-reference.md)
- [Tools](./docs/tools.md)
- [Handoffs](./docs/handoffs.md)
- [Guardrails](./docs/guardrails.md)
- [Memory & Sessions](./docs/memory-sessions.md)
- [Structured Output](./docs/structured-output.md)
- [Streaming](./docs/streaming.md)
- [Tracing](./docs/tracing.md)
- [Model Providers](./docs/providers.md)
- [Error Handling](./docs/error-handling.md)
- [Examples](./docs/examples.md)

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT © Vulcan AI
