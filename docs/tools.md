# Tools

Tools are the primary way agents interact with external systems.

## Creating a Tool

```typescript
import { Vulcan, z } from '@vulcan-ai/sdk'

const myTool = Vulcan.createTool({
  name: 'get_weather',          // snake_case, sent to the model
  description: 'Get current weather for a city. Always use this for weather questions.',
  inputSchema: z.object({
    city: z.string().describe('The city name'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  }),
  async execute({ city, units }, context) {
    // context gives you: runId, sessionId, agentName, turn, metadata
    const data = await fetchWeatherApi(city)
    return { city, temperature: data.temp, units }
  },
  // Optional: handle errors gracefully instead of throwing
  errorHandler: (error, input) => {
    return `Could not fetch weather for ${input.city}: ${error.message}`
  },
  timeoutMs: 10_000, // 10 second timeout (default: 30s)
})
```

## Input Validation

Vulcan uses **Zod** for automatic input validation. Invalid inputs are caught before execution:

```typescript
const tool = Vulcan.createTool({
  name: 'divide',
  description: 'Divide two numbers',
  inputSchema: z.object({
    numerator: z.number(),
    denominator: z.number().refine(n => n !== 0, 'Cannot divide by zero'),
  }),
  execute: async ({ numerator, denominator }) => numerator / denominator,
})
```

If the model sends `{ numerator: "five", denominator: 0 }`, a `ToolValidationError` is thrown and the error is returned to the model as a tool result — the model can then correct itself.

## Error Handling

```typescript
// Option 1: errorHandler (graceful fallback)
const tool = Vulcan.createTool({
  name: 'risky_tool',
  description: '...',
  inputSchema: z.object({ id: z.string() }),
  execute: async ({ id }) => await callExternalApi(id),
  errorHandler: (error) => `API unavailable: ${error.message}`,
})

// Option 2: throw — runner catches it and returns error as tool result
const tool = Vulcan.createTool({
  execute: async ({ id }) => {
    if (!id.startsWith('user_')) throw new Error('Invalid ID format')
    return fetchUser(id)
  },
})
```

## Async Tools

All tools are async by default. You can use any async operation:

```typescript
const databaseTool = Vulcan.createTool({
  name: 'query_db',
  description: 'Query the database',
  inputSchema: z.object({ sql: z.string() }),
  async execute({ sql }) {
    const rows = await db.query(sql)
    return { count: rows.length, rows }
  },
  timeoutMs: 60_000, // 1 minute for slow queries
})
```

## Tool Context

The second argument to `execute` is `RunContextLite`:

```typescript
execute: async (input, context) => {
  console.log('Run ID:', context.runId)
  console.log('Session:', context.sessionId)
  console.log('Agent:', context.agentName)
  console.log('Turn:', context.turn)
  console.log('Metadata:', context.metadata)
  return result
}
```

## Schema Conversion

Tools automatically convert to the correct format for each provider:

```typescript
tool.toOpenAISchema()    // OpenAI function calling format
tool.toAnthropicSchema() // Anthropic tool_use format
tool.toGeminiSchema()    // Gemini functionDeclarations format
```
