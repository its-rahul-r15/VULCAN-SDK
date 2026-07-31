/**
 * @vulcan-ai/sdk
 *
 * Production-grade AI Agent SDK — multi-provider, typed, observable, and framework-free.
 * https://github.com/vulcan-ai/sdk
 */

// ─────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────
export { Agent, AgentConfigError } from './core/agent.js'
export { AgentRunner, HandoffLoopError, StructuredOutputValidationError } from './core/runner.js'
export { RunContext } from './core/context.js'
export { VulcanHarness, vulcanHarness, VULCAN_HARNESS_PROMPT, HarnessParseError } from './core/harness.js'

// ─────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────
export {
  Tool,
  ToolValidationError,
  ToolExecutionError,
  ToolTimeoutError,
  zodToJsonSchema,
} from './tools/tool.js'
export type { OpenAIFunctionSchema, AnthropicToolSchema, GeminiFunctionSchema } from './tools/tool.js'

// ─────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────
export {
  BaseProvider,
  providerRegistry,
  ProviderNotFoundError,
  ProviderError,
} from './providers/provider.js'
export type { ModelProvider } from './providers/provider.js'

// Gemini is the default provider — imported first so it auto-registers
export { GeminiProvider } from './providers/gemini.js'
export { OpenAIProvider } from './providers/openai.js'
export { AnthropicProvider } from './providers/anthropic.js'

// ─────────────────────────────────────────────
// Memory & Sessions
// ─────────────────────────────────────────────
export { SessionManager, createSession, updateSession } from './memory/session.js'
export { InMemoryStorage } from './memory/in-memory.js'
export { SQLiteStorage, SQLiteStorageError } from './memory/sqlite.js'

// ─────────────────────────────────────────────
// Guardrails
// ─────────────────────────────────────────────
export {
  MaxLengthGuardrail,
  KeywordBlockGuardrail,
  StructuredOutputGuardrail,
  BlockedToolsGuardrail,
  FunctionGuardrail,
  PIIScrubberGuardrail,
  runGuardrails,
  GuardrailBlockedError,
} from './guardrails/guardrails.js'

// ─────────────────────────────────────────────
// Tracing
// ─────────────────────────────────────────────
export { VulcanTracer, globalTracer } from './tracing/tracer.js'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type {
  // Messages
  Message,
  MessageRole,
  // Tools
  ToolCall,
  ToolResult,
  ToolDefinition,
  // Provider
  ModelResponse,
  StreamChunk,
  ProviderCallConfig,
  FinishReason,
  // Token Usage
  TokenUsage,
  // Harness
  HarnessMessage,
  HarnessStep,
  ReasoningMode,
  // Run
  RunOptions,
  RunResult,
  RunStatus,
  // Events
  VulcanEvent,
  VulcanEventType,
  // Memory
  Session,
  StorageAdapter,
  // Guardrails
  Guardrail,
  GuardrailType,
  GuardrailPayload,
  GuardrailResult,
  // Tracing
  Trace,
  ModelCallRecord,
  ToolCallRecord,
  HandoffRecord,
  // Agent
  AgentConfig,
  RunContextLite,
  // Zod
  ZodSchema,
} from './types/index.js'

export { z } from './types/index.js'

// ─────────────────────────────────────────────
// Convenience Factory API
// ─────────────────────────────────────────────

import { Agent } from './core/agent.js'
import { AgentRunner } from './core/runner.js'
import { Tool } from './tools/tool.js'
import { providerRegistry } from './providers/provider.js'
import type { ModelProvider } from './providers/provider.js'
import type { AgentConfig, RunOptions, ToolConfig } from './types/index.js'

export const Vulcan = {
  /**
   * Create a new agent.
   *
   * @example
   * const agent = Vulcan.createAgent({ name: 'my-agent', instructions: '...' })
   */
  createAgent(config: AgentConfig): Agent {
    return new Agent(config)
  },

  /**
   * Create a typed tool.
   *
   * @example
   * const myTool = Vulcan.createTool({ name: 'search', description: '...', inputSchema: z.object(...), execute: async (input) => '...' })
   */
  createTool<I, O>(config: ToolConfig<I, O>): Tool<I, O> {
    return Tool.create(config)
  },

  /**
   * Register a custom model provider.
   *
   * @example
   * Vulcan.registerProvider('my-provider', new MyProvider())
   */
  registerProvider(name: string, provider: ModelProvider): void {
    providerRegistry.register(name, provider)
  },

  /**
   * Run an agent and return the final result.
   *
   * @example
   * const result = await Vulcan.run(agent, 'What is the weather in Goa?')
   */
  async run<T = string>(
    agent: Agent,
    input: string,
    options?: RunOptions,
  ) {
    const runner = new AgentRunner()
    return runner.run<T>(agent, input, options)
  },

  /**
   * Stream an agent run — yields VulcanEvents.
   *
   * @example
   * for await (const event of Vulcan.stream(agent, 'Tell me a story')) {
   *   if (event.type === 'text_streamed') console.log(event.data)
   * }
   */
  async *stream(agent: Agent, input: string, options?: RunOptions) {
    const runner = new AgentRunner()
    yield* runner.stream(agent, input, options)
  },
}
