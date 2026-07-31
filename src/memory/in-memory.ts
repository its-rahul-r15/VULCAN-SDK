import type { Session, StorageAdapter } from '../types/index.js'

// ─────────────────────────────────────────────
// In-Memory Storage Adapter
// Default storage — fast, zero dependencies
// ─────────────────────────────────────────────

export class InMemoryStorage implements StorageAdapter {
  private readonly store = new Map<string, Session>()
  private readonly expiryMap = new Map<string, NodeJS.Timeout>()

  constructor(private readonly ttlMs?: number) {}

  async get(sessionId: string): Promise<Session | null> {
    return this.store.get(sessionId) ?? null
  }

  async set(sessionId: string, session: Session): Promise<void> {
    this.store.set(sessionId, session)

    // Reset TTL if configured
    if (this.ttlMs) {
      const existing = this.expiryMap.get(sessionId)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(() => {
        this.store.delete(sessionId)
        this.expiryMap.delete(sessionId)
      }, this.ttlMs)

      this.expiryMap.set(sessionId, timer)
    }
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId)
    const timer = this.expiryMap.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.expiryMap.delete(sessionId)
    }
  }

  async list(): Promise<string[]> {
    return Array.from(this.store.keys())
  }

  async clear(): Promise<void> {
    this.store.clear()
    for (const timer of this.expiryMap.values()) {
      clearTimeout(timer)
    }
    this.expiryMap.clear()
  }

  /** Returns the number of active sessions */
  get size(): number {
    return this.store.size
  }
}
