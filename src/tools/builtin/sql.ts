import { z } from 'zod'
import { Tool } from '../tool.js'

export interface SQLQueryOptions {
  /** Database query executor callback */
  executeQuery: (sql: string) => Promise<unknown[]> | unknown[]
  /** Enforce strict read-only queries (SELECT only). Default: true */
  readOnly?: boolean
  /** Human-readable database schema description for the model */
  schemaDescription?: string
}

const inputSchema = z.object({
  query: z.string().min(1, 'SQL query cannot be empty'),
})

export function createSQLQueryTool(options: SQLQueryOptions) {
  const isReadOnly = options.readOnly ?? true

  return Tool.create({
    name: 'sql_query',
    description: `Execute a SQL database query and return records. ${options.schemaDescription ? `Database schema: ${options.schemaDescription}` : ''}`,
    inputSchema,
    async execute({ query }) {
      const cleanQuery = query.trim()

      if (isReadOnly) {
        const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i
        if (forbidden.test(cleanQuery)) {
          throw new Error('Security Error: Only read-only SELECT queries are allowed.')
        }
      }

      try {
        const rows = await options.executeQuery(cleanQuery)
        return {
          query: cleanQuery,
          rowCount: Array.isArray(rows) ? rows.length : 0,
          rows,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          query: cleanQuery,
          error: message,
        }
      }
    },
  })
}
