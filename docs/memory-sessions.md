# Memory & Sessions

Vulcan supports multi-turn conversations via sessions, with three clearly separate concepts:

| Concept | What it is | Where stored |
|---------|-----------|-------------|
| **Agent Config** | Instructions, tools, settings | In memory (static) |
| **Run State** | Messages for current turn | `RunContext` (temporary) |
| **Session** | Full message history across runs | `StorageAdapter` |

## Storage Adapters

### InMemoryStorage (default)

Fast, zero-dependency. Data is lost on process restart.

```typescript
import { InMemoryStorage } from '@vulcan-ai/sdk'

const storage = new InMemoryStorage()

// Optional: TTL eviction (ms)
const storageWithTTL = new InMemoryStorage(3600_000) // 1 hour
```

### SQLiteStorage

File-based persistence. Survives restarts.

```typescript
import { SQLiteStorage } from '@vulcan-ai/sdk'

const storage = new SQLiteStorage('./my-sessions.db')

// Query by agent name
const sessions = await storage.listByAgent('my-agent')

// Clean up
storage.close()
```

> **Note**: Requires `npm install better-sqlite3`. If not installed, falls back to in-memory with a warning.

### Custom Storage Adapter

Implement the `StorageAdapter` interface for any backend (Redis, DynamoDB, PostgreSQL, etc.):

```typescript
import type { StorageAdapter, Session } from '@vulcan-ai/sdk'
import Redis from 'ioredis'

class RedisStorage implements StorageAdapter {
  constructor(private redis: Redis) {}

  async get(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(`session:${sessionId}`)
    return data ? JSON.parse(data) : null
  }

  async set(sessionId: string, session: Session): Promise<void> {
    await this.redis.set(`session:${sessionId}`, JSON.stringify(session), 'EX', 86400)
  }

  async delete(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`)
  }

  async list(): Promise<string[]> {
    const keys = await this.redis.keys('session:*')
    return keys.map(k => k.replace('session:', ''))
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys('session:*')
    if (keys.length > 0) await this.redis.del(...keys)
  }
}
```

## Multi-Turn Conversations

```typescript
import { Agent, SQLiteStorage } from '@vulcan-ai/sdk'

const agent = new Agent({
  name: 'assistant',
  instructions: 'You are a helpful assistant with memory.',
})
  .withMemory(new SQLiteStorage('./sessions.db'))

// Turn 1
const r1 = await agent.run('My name is Alice.', { sessionId: 'user-alice' })
// "Nice to meet you, Alice!"

// Turn 2 — agent remembers the context
const r2 = await agent.run('What is my name?', { sessionId: 'user-alice' })
// "Your name is Alice." ✓

// Turn 3
const r3 = await agent.run('What have we talked about?', { sessionId: 'user-alice' })
// "You told me your name is Alice."
```

## Session Object

```typescript
interface Session {
  id: string                        // Unique session identifier
  agentName: string                 // Which agent owns this session
  messages: Message[]               // Full message history
  metadata: Record<string, unknown> // Custom metadata
  createdAt: number                 // Unix timestamp
  updatedAt: number                 // Unix timestamp
  turnCount: number                 // Total turns completed
}
```

## SessionManager

For direct session manipulation:

```typescript
import { SessionManager, InMemoryStorage } from '@vulcan-ai/sdk'

const manager = new SessionManager(new InMemoryStorage())

// Load or create
const session = await manager.loadOrCreate('session-id', 'agent-name')

// Save manually
await manager.save(session)

// Append messages
await manager.appendMessages('session-id', [
  { role: 'user', content: 'Hello' },
])

// List all sessions
const ids = await manager.list()

// Get specific
const s = await manager.get('session-id')
```
