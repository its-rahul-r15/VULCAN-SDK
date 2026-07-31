import type {
  AgentConfig,
  Guardrail,
  RunOptions,
  RunResult,
  StorageAdapter,
  VulcanEvent,
  VulcanEventType,
  ZodSchema,
} from '../types/index.js'
import type { ToolDefinition } from '../types/index.js'

// ─────────────────────────────────────────────
// Agent Class
// Pure configuration container — no execution logic.
// Use AgentRunner or Agent.run() to execute.
// ─────────────────────────────────────────────

export class Agent {
  readonly config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = {
      maxTurns: 20,
      maxRetries: 3,
      temperature: 0.7,
      reasoningMode: 'standard',
      providerName: 'gemini',
      model: 'gemini-2.5-flash',
      tools: [],
      guardrails: [],
      handoffs: [],
      ...config,
    }

    if (!this.config.name || this.config.name.trim() === '') {
      throw new AgentConfigError('Agent name is required and cannot be empty.')
    }

    if (!this.config.instructions || this.config.instructions.trim() === '') {
      throw new AgentConfigError('Agent instructions are required.')
    }
  }

  // ─────────────────────────────────────────────
  // Fluent Builder Methods
  // ─────────────────────────────────────────────

  /**
   * Add a tool to this agent.
   */
  withTool(tool: ToolDefinition): this {
    this.config.tools = [...(this.config.tools ?? []), tool]
    return this
  }

  /**
   * Add multiple tools at once.
   */
  withTools(...tools: ToolDefinition[]): this {
    this.config.tools = [...(this.config.tools ?? []), ...tools]
    return this
  }

  /**
   * Register an agent that this agent can hand off to.
   */
  withHandoff(agent: Agent): this {
    this.config.handoffs = [...(this.config.handoffs ?? []), agent.config]
    return this
  }

  /**
   * Register multiple agents for handoff.
   */
  withHandoffs(...agents: Agent[]): this {
    this.config.handoffs = [
      ...(this.config.handoffs ?? []),
      ...agents.map((a) => a.config),
    ]
    return this
  }

  /**
   * Add a guardrail.
   */
  withGuardrail(guardrail: Guardrail): this {
    this.config.guardrails = [...(this.config.guardrails ?? []), guardrail]
    return this
  }

  /**
   * Set the storage adapter for session memory.
   */
  withMemory(adapter: StorageAdapter): this {
    this.config.storageAdapter = adapter
    return this
  }

  /**
   * Set an output schema for structured output validation.
   */
  withOutputSchema<T>(schema: ZodSchema<T>): this {
    this.config.outputSchema = schema as ZodSchema
    return this
  }

  /**
   * Set the primary provider name (must be registered).
   */
  withProvider(providerName: string): this {
    this.config.providerName = providerName
    return this
  }

  /**
   * Set fallback providers (tried in order on primary failure).
   */
  withFallback(...providerNames: string[]): this {
    this.config.fallbackProviders = providerNames
    return this
  }

  /**
   * Enable the VulcanHarness reasoning pipeline (INITIAL → THINK → ANALYSE → OUTPUT).
   */
  withHarness(): this {
    this.config.reasoningMode = 'harness'
    return this
  }

  /**
   * Set the model identifier.
   */
  withModel(model: string): this {
    this.config.model = model
    return this
  }

  /**
   * Set max turns before giving up.
   */
  withMaxTurns(maxTurns: number): this {
    this.config.maxTurns = maxTurns
    return this
  }

  /**
   * Set temperature.
   */
  withTemperature(temperature: number): this {
    this.config.temperature = temperature
    return this
  }

  // ─────────────────────────────────────────────
  // Convenience Run Methods
  // ─────────────────────────────────────────────

  /**
   * Run the agent with a user input string.
   * Shorthand for: new AgentRunner().run(agent, input, options)
   */
  async run<T = string>(
    input: string,
    options?: RunOptions,
  ): Promise<RunResult<T>> {
    // Lazy import to avoid circular dependency
    const { AgentRunner } = await import('./runner.js')
    const runner = new AgentRunner()
    return runner.run<T>(this, input, options)
  }

  /**
   * Stream the agent run.
   * Shorthand for: new AgentRunner().stream(agent, input, options)
   */
  async *stream(
    input: string,
    options?: RunOptions,
  ): AsyncGenerator<VulcanEvent> {
    const { AgentRunner } = await import('./runner.js')
    const runner = new AgentRunner()
    yield* runner.stream(this, input, options)
  }

  /**
   * Get the agent's display name.
   */
  get name(): string {
    return this.config.name
  }
}

export class AgentConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentConfigError'
  }
}
