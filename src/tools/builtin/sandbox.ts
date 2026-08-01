import { z } from 'zod'
import { Tool } from '../tool.js'

export interface CodeSandboxOptions {
  /** Allowed global variable keys */
  allowedGlobals?: Record<string, unknown>
  /** Timeout in ms (default: 5000) */
  timeoutMs?: number
}

const inputSchema = z.object({
  code: z.string().min(1, 'Code snippet cannot be empty'),
  language: z.enum(['javascript', 'typescript']).optional().default('javascript'),
})

export function createCodeSandboxTool(options: CodeSandboxOptions = {}) {
  return Tool.create({
    name: 'code_sandbox',
    description: 'Execute a JavaScript code snippet safely in an isolated execution context and return the result.',
    inputSchema,
    timeoutMs: options.timeoutMs ?? 5000,
    async execute({ code }) {
      const logs: string[] = []
      const fakeConsole = {
        log: (...args: unknown[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      }

      try {
        // Create an isolated Function scope
        const runnerFn = new Function('console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', `
          "use strict";
          ${code}
        `)

        const result = runnerFn(
          fakeConsole,
          Math,
          JSON,
          Object,
          Array,
          String,
          Number,
        )

        return {
          success: true,
          result: result !== undefined ? (typeof result === 'object' ? JSON.stringify(result) : String(result)) : null,
          logs,
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        return {
          success: false,
          error: errorMsg,
          logs,
        }
      }
    },
  })
}
