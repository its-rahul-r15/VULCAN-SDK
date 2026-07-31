import type { Session, StorageAdapter, Message } from '../types/index.js'
import { v4 as uuidv4 } from 'uuid'

// ─────────────────────────────────────────────
// Session Factory
// ─────────────────────────────────────────────

export function createSession(agentName: string, sessionId?: string): Session {
  const now = Date.now()
  return {
    id: sessionId ?? uuidv4(),
    agentName,
    messages: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
    turnCount: 0,
  }
}

export function updateSession(session: Session, messages: Message[]): Session {
  return {
    ...session,
    messages,
    updatedAt: Date.now(),
    turnCount: session.turnCount + 1,
  }
}

// ─────────────────────────────────────────────
// SessionManager — Coordinates storage adapters
// ─────────────────────────────────────────────

export class SessionManager {
  constructor(private readonly adapter: StorageAdapter) {}

  /**
   * Load an existing session or create a new one.
   * This is called at the start of every run.
   */
  async loadOrCreate(sessionId: string, agentName: string): Promise<Session> {
    const existing = await this.adapter.get(sessionId)
    if (existing) {
      return existing
    }
    const newSession = createSession(agentName, sessionId)
    await this.adapter.set(sessionId, newSession)
    return newSession
  }

  /**
   * Persist a session after a turn completes.
   */
  async save(session: Session): Promise<void> {
    await this.adapter.set(session.id, session)
  }

  /**
   * Append messages to a session and save.
   */
  async appendMessages(sessionId: string, messages: Message[]): Promise<Session | null> {
    const session = await this.adapter.get(sessionId)
    if (!session) return null
    const updated = updateSession(session, [...session.messages, ...messages])
    await this.adapter.set(sessionId, updated)
    return updated
  }

  /**
   * Delete a session.
   */
  async delete(sessionId: string): Promise<void> {
    await this.adapter.delete(sessionId)
  }

  /**
   * List all active sessions.
   */
  async list(): Promise<string[]> {
    return this.adapter.list()
  }

  /**
   * Get a session by ID.
   */
  async get(sessionId: string): Promise<Session | null> {
    return this.adapter.get(sessionId)
  }
}
