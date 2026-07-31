/**
 * schema.ts — Zod-to-JSON Schema conversion utilities.
 * Re-exported from tool.ts for backwards compatibility.
 * Keeps schema logic separate so providers import cleanly.
 */
export { zodToJsonSchema } from './tool.js'
export type {
  OpenAIFunctionSchema,
  AnthropicToolSchema,
  GeminiFunctionSchema,
} from './tool.js'
