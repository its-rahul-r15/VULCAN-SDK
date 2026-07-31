# Quick Start

Get your first Vulcan agent running in under 5 minutes.

## Prerequisites

- Node.js >= 18
- An OpenAI API key (or Claude / Gemini key)

## Step 1: Install

```bash
npm install @vulcan-ai/sdk openai
```

## Step 2: Set API Key

```bash
export OPENAI_API_KEY=sk-...
```

Or create a `.env` file:
```
OPENAI_API_KEY=sk-...
```

## Step 3: Create Your First Agent

Create `my-agent.ts`:

```typescript
import { Vulcan, z } from '@vulcan-ai/sdk'

// A tool the agent can call
const weatherTool = Vulcan.createTool({
  name: 'get_weather',
  description: 'Get the current weather for a city',
  inputSchema: z.object({
    city: z.string(),
  }),
  async execute({ city }) {
    // In a real app, call a weather API here
    return { city, temperature: 28, condition: 'Sunny' }
  },
})

// Create the agent
const agent = Vulcan.createAgent({
  name: 'weather-agent',
  instructions: `
    You are a helpful weather assistant.
    Always use the get_weather tool when asked about weather.
  `,
  model: 'gpt-4o',
  tools: [weatherTool],
})

// Run it
const result = await Vulcan.run(agent, 'What is the weather in Tokyo?')
console.log(result.output)
// → "The weather in Tokyo is currently sunny at 28°C."
```

## Step 4: Run

```bash
ts-node my-agent.ts
# or
npx tsx my-agent.ts
```

## Next Steps

- [Define custom tools →](./tools.md)
- [Add memory →](./memory-sessions.md)
- [Set up guardrails →](./guardrails.md)
- [Enable reasoning mode →](./api-reference.md#reasoningmode)
- [Stream events →](./streaming.md)
