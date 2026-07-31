import { InMemoryStorage } from '../src/memory/in-memory'
import { SessionManager, createSession, updateSession } from '../src/memory/session'
import type { Session } from '../src/types'

function makeSession(id: string, agentName = 'test-agent'): Session {
  return {
    id,
    agentName,
    messages: [],
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    turnCount: 0,
  }
}

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage

  beforeEach(() => {
    storage = new InMemoryStorage()
  })

  it('returns null for non-existent session', async () => {
    const result = await storage.get('nonexistent')
    expect(result).toBeNull()
  })

  it('stores and retrieves a session', async () => {
    const session = makeSession('session-1')
    await storage.set('session-1', session)
    const retrieved = await storage.get('session-1')
    expect(retrieved).toEqual(session)
  })

  it('deletes a session', async () => {
    const session = makeSession('session-2')
    await storage.set('session-2', session)
    await storage.delete('session-2')
    const result = await storage.get('session-2')
    expect(result).toBeNull()
  })

  it('lists all session IDs', async () => {
    await storage.set('a', makeSession('a'))
    await storage.set('b', makeSession('b'))
    await storage.set('c', makeSession('c'))
    const ids = await storage.list()
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).toContain('c')
  })

  it('clears all sessions', async () => {
    await storage.set('x', makeSession('x'))
    await storage.clear()
    const ids = await storage.list()
    expect(ids).toHaveLength(0)
  })

  it('overwrites existing session on set', async () => {
    const original = makeSession('s1')
    await storage.set('s1', original)

    const updated = { ...original, turnCount: 5 }
    await storage.set('s1', updated)

    const retrieved = await storage.get('s1')
    expect(retrieved?.turnCount).toBe(5)
  })

  it('tracks size correctly', async () => {
    expect(storage.size).toBe(0)
    await storage.set('a', makeSession('a'))
    expect(storage.size).toBe(1)
    await storage.set('b', makeSession('b'))
    expect(storage.size).toBe(2)
    await storage.delete('a')
    expect(storage.size).toBe(1)
  })

  it('evicts sessions after TTL', async () => {
    const ttlStorage = new InMemoryStorage(100) // 100ms TTL
    await ttlStorage.set('evict-me', makeSession('evict-me'))

    let retrieved = await ttlStorage.get('evict-me')
    expect(retrieved).not.toBeNull()

    await new Promise((r) => setTimeout(r, 200))

    retrieved = await ttlStorage.get('evict-me')
    expect(retrieved).toBeNull()
  }, 10000)
})

describe('SessionManager', () => {
  let storage: InMemoryStorage
  let manager: SessionManager

  beforeEach(() => {
    storage = new InMemoryStorage()
    manager = new SessionManager(storage)
  })

  it('creates a new session if not exists', async () => {
    const session = await manager.loadOrCreate('new-session', 'agent-1')
    expect(session.id).toBe('new-session')
    expect(session.agentName).toBe('agent-1')
    expect(session.messages).toHaveLength(0)
  })

  it('loads an existing session', async () => {
    const existing = makeSession('existing', 'agent-1')
    existing.turnCount = 3
    await storage.set('existing', existing)

    const loaded = await manager.loadOrCreate('existing', 'agent-1')
    expect(loaded.turnCount).toBe(3)
  })

  it('saves a session', async () => {
    const session = makeSession('to-save')
    await manager.save(session)
    const retrieved = await storage.get('to-save')
    expect(retrieved).toEqual(session)
  })

  it('appends messages to a session', async () => {
    await storage.set('msg-session', makeSession('msg-session'))

    const updated = await manager.appendMessages('msg-session', [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ])

    expect(updated?.messages).toHaveLength(2)
    expect(updated?.messages[0].content).toBe('Hello')
  })

  it('returns null when appending to non-existent session', async () => {
    const result = await manager.appendMessages('ghost', [{ role: 'user', content: 'Hi' }])
    expect(result).toBeNull()
  })
})

describe('Session utilities', () => {
  it('createSession generates unique IDs', () => {
    const s1 = createSession('agent')
    const s2 = createSession('agent')
    expect(s1.id).not.toBe(s2.id)
  })

  it('createSession uses provided ID', () => {
    const s = createSession('agent', 'custom-id')
    expect(s.id).toBe('custom-id')
  })

  it('updateSession increments turnCount', () => {
    const session = makeSession('s1')
    const updated = updateSession(session, [{ role: 'user', content: 'Hi' }])
    expect(updated.turnCount).toBe(1)
  })

  it('updateSession updates messages', () => {
    const session = makeSession('s1')
    const msgs = [{ role: 'user' as const, content: 'Test' }]
    const updated = updateSession(session, msgs)
    expect(updated.messages).toEqual(msgs)
  })
})
