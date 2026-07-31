import type { Session, StorageAdapter } from '../types/index.js'

// ─────────────────────────────────────────────
// SQLite Storage Adapter
// Persistent file-based storage for sessions
// Requires: npm install better-sqlite3
// ─────────────────────────────────────────────

export class SQLiteStorage implements StorageAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any = null
  private initialized = false

  constructor(private readonly dbPath: string = './vulcan-sessions.db') {}

  /**
   * Lazy initialization — opens/creates the DB and table on first use.
   */
  private async init(): Promise<void> {
    if (this.initialized) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Database = require('better-sqlite3') as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (path: string): any
      }
      this.db = new Database(this.dbPath)

      // Create sessions table if it doesn't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS vulcan_sessions (
          id TEXT PRIMARY KEY,
          agent_name TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)

      // Index for fast lookups by agent name
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_agent_name ON vulcan_sessions (agent_name)
      `)

      this.initialized = true
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : String(error)
      if (msg.includes('Cannot find module')) {
        console.warn(
          '[Vulcan] SQLiteStorage: better-sqlite3 not installed. ' +
            'Falling back to in-memory storage. Run: npm install better-sqlite3',
        )
        // Mark initialized to avoid repeat warnings
        this.initialized = true
        this.db = null
        return
      }
      throw new SQLiteStorageError(`Failed to initialize SQLite: ${msg}`)
    }
  }

  async get(sessionId: string): Promise<Session | null> {
    await this.init()
    if (!this.db) return null

    try {
      const row = this.db
        .prepare('SELECT data FROM vulcan_sessions WHERE id = ?')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .get(sessionId) as { data: string } | undefined

      if (!row) return null
      return JSON.parse(row.data) as Session
    } catch {
      return null
    }
  }

  async set(sessionId: string, session: Session): Promise<void> {
    await this.init()
    if (!this.db) return

    const data = JSON.stringify(session)

    this.db
      .prepare(
        `INSERT INTO vulcan_sessions (id, agent_name, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at`,
      )
      .run(sessionId, session.agentName, data, session.createdAt, session.updatedAt)
  }

  async delete(sessionId: string): Promise<void> {
    await this.init()
    if (!this.db) return

    this.db.prepare('DELETE FROM vulcan_sessions WHERE id = ?').run(sessionId)
  }

  async list(): Promise<string[]> {
    await this.init()
    if (!this.db) return []

    const rows = this.db
      .prepare('SELECT id FROM vulcan_sessions ORDER BY updated_at DESC')
      .all() as { id: string }[]

    return rows.map((r) => r.id)
  }

  async clear(): Promise<void> {
    await this.init()
    if (!this.db) return
    this.db.exec('DELETE FROM vulcan_sessions')
  }

  /**
   * Get all sessions for a specific agent.
   */
  async listByAgent(agentName: string): Promise<Session[]> {
    await this.init()
    if (!this.db) return []

    const rows = this.db
      .prepare(
        'SELECT data FROM vulcan_sessions WHERE agent_name = ? ORDER BY updated_at DESC',
      )
      .all(agentName) as { data: string }[]

    return rows.map((r) => JSON.parse(r.data) as Session)
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      ;(this.db as any).close()
      this.db = null
      this.initialized = false
    }
  }
}

export class SQLiteStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SQLiteStorageError'
  }
}
