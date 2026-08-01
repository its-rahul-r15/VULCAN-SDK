import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import type {
  AgentConfig,
  Message,
  ModelResponse,
  RunOptions,
  RunResult,
  RunStatus,
  ToolCall,
  TokenUsage,
  VulcanEvent,
  VulcanEventType,
} from '../types/index.js'
import { emptyUsage } from '../types/index.js'
import { Agent } from './agent.js'
import { RunContext } from './context.js'
import { VulcanTracer, globalTracer } from '../tracing/tracer.js'
import { SessionManager } from '../memory/session.js'
import { InMemoryStorage } from '../memory/in-memory.js'
import { providerRegistry, ProviderError } from '../providers/provider.js'
import { Tool } from '../tools/tool.js'
import { runGuardrails, GuardrailBlockedError } from '../guardrails/guardrails.js'
import { vulcanHarness, HarnessParseError } from './harness.js'
import { ApprovalRequiredSignal, createApprovalRequest, parseApprovalResult } from './hitl.js'

// ─────────────────────────────────────────────
// Handoff Signal (special error for control flow)
// ─────────────────────────────────────────────

class HandoffSignal extends Error {
  constructor(public readonly targetAgentConfig: AgentConfig) {
    super(`Handoff to agent: ${targetAgentConfig.name}`)
    this.name = 'HandoffSignal'
  }
}

// ─────────────────────────────────────────────
// AgentRunner
// The core agent execution engine.
// ─────────────────────────────────────────────

export class AgentRunner {
  private readonly tracer: VulcanTracer

  constructor(tracer?: VulcanTracer) {
    this.tracer = tracer ?? globalTracer
  }

  /**
   * Run an agent to completion and return the final result.
   */
  async run<T = string>(
    agent: Agent,
    input: string,
    options: RunOptions = {},
  ): Promise<RunResult<T>> {
    const emitter = new EventEmitter()
    emitter.setMaxListeners(50)

    const sessionId = options.sessionId ?? uuidv4()
    const storageAdapter =
      agent.config.storageAdapter ?? new InMemoryStorage()
    const sessionManager = new SessionManager(storageAdapter)
    const session = await sessionManager.loadOrCreate(sessionId, agent.config.name)
    const trace = this.tracer.startRun(uuidv4(), agent.config.name, sessionId)

    const ctx = new RunContext({
      sessionId,
      agentConfig: agent.config,
      tracer: this.tracer,
      trace,
      emitter,
      session,
      metadata: options.metadata,
    })

    ctx.emit('run_started', { agentName: agent.config.name, input })

    try {
      const result = await this._runLoop<T>(ctx, input, options, sessionManager)
      this.tracer.endRun(trace, result.status, result.output)
      ctx.emit('run_completed', result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.tracer.addError(trace, err)
      this.tracer.endRun(trace, 'failed', null)
      ctx.emit('run_failed', { error: err.message })
      return {
        output: '' as unknown as T,
        rawOutput: '',
        status: 'failed',
        sessionId,
        traceId: trace.runId,
        turns: ctx.turn,
        usage: trace.totalUsage,
        agentName: ctx.agentName,
        error: err.message,
      }
    }
  }

  /**
   * Stream an agent run — yields VulcanEvents as they happen.
   */
  async *stream(
    agent: Agent,
    input: string,
    options: RunOptions = {},
  ): AsyncGenerator<VulcanEvent> {
    const emitter = new EventEmitter()
    emitter.setMaxListeners(50)

    const buffer: VulcanEvent[] = []
    let done = false

    emitter.on('event', (event: VulcanEvent) => {
      buffer.push(event)
    })

    // Run in background and push events to buffer
    const runPromise = this.run(agent, input, { ...options })

    // Attach event forwarding to the emitter
    // We need to re-run with this specific emitter
    const sessionId = options.sessionId ?? uuidv4()
    const storageAdapter = agent.config.storageAdapter ?? new InMemoryStorage()
    const sessionManager = new SessionManager(storageAdapter)
    const session = await sessionManager.loadOrCreate(sessionId, agent.config.name)
    const trace = this.tracer.startRun(uuidv4(), agent.config.name, sessionId)

    const ctx = new RunContext({
      sessionId,
      agentConfig: agent.config,
      tracer: this.tracer,
      trace,
      emitter,
      session,
      metadata: options.metadata,
    })

    // Run the loop asynchronously
    const loopPromise = this._runLoop(ctx, input, options, sessionManager)
      .then((result) => {
        this.tracer.endRun(trace, result.status, result.output)
        ctx.emit('run_completed', result)
      })
      .catch((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error))
        this.tracer.addError(trace, err)
        ctx.emit('run_failed', { error: err.message })
      })
      .finally(() => {
        done = true
      })

    ctx.emit('run_started', { agentName: agent.config.name, input })

    // Yield events from buffer as they arrive
    while (!done || buffer.length > 0) {
      if (buffer.length > 0) {
        yield buffer.shift()!
      } else {
        // Small delay to avoid tight loop
        await new Promise<void>((resolve) => setTimeout(resolve, 5))
      }
    }

    await loopPromise
    void runPromise // suppress unused warning
  }

  // ─────────────────────────────────────────────
  // Core Agent Loop
  // ─────────────────────────────────────────────

  private async _runLoop<T>(
    ctx: RunContext,
    input: string,
    options: RunOptions,
    sessionManager: SessionManager,
  ): Promise<RunResult<T>> {
    const config = ctx.agentConfig
    const maxTurns = options.maxTurns ?? config.maxTurns ?? 20

    // ── 1. Input Guardrails ──
    const inputGuardResult = await runGuardrails(
      config.guardrails ?? [],
      {
        type: 'input',
        content: input,
        context: {
          runId: ctx.trace.runId,
          sessionId: ctx.sessionId,
          agentName: ctx.agentName,
          turn: ctx.turn,
          metadata: ctx.metadata,
        },
      },
    )

    if (!inputGuardResult.passed) {
      ctx.emit('guardrail_triggered', {
        type: 'input',
        reason: inputGuardResult.reason,
        guardrail: inputGuardResult.failedGuardrail,
      })
      throw new GuardrailBlockedError(
        inputGuardResult.failedGuardrail ?? 'unknown',
        inputGuardResult.reason ?? 'Input blocked',
        'input',
      )
    }

    const finalInput = inputGuardResult.modifiedContent ?? input

    // ── 2. Build initial messages ──
    const systemPrompt = this._buildSystemPrompt(config, finalInput)

    ctx.addMessage({ role: 'system', content: systemPrompt })
    ctx.addMessage({ role: 'user', content: finalInput })

    // ── 3. Build handoff tools if any ──
    const handoffTools = this._buildHandoffTools(config)
    const allTools = [...(config.tools ?? []), ...handoffTools]

    // ── 4. Harness mode vs standard mode ──
    if (config.reasoningMode === 'harness') {
      return this._runHarnessLoop<T>(ctx, allTools, options, sessionManager, maxTurns)
    }

    return this._runStandardLoop<T>(ctx, allTools, options, sessionManager, maxTurns)
  }

  // ─────────────────────────────────────────────
  // Standard Mode Loop (native tool calling)
  // ─────────────────────────────────────────────

  private async _runStandardLoop<T>(
    ctx: RunContext,
    tools: AgentConfig['tools'],
    options: RunOptions,
    sessionManager: SessionManager,
    maxTurns: number,
  ): Promise<RunResult<T>> {
    const config = ctx.agentConfig
    const toolList = (tools ?? []) as Tool[]

    while (ctx.turn < maxTurns) {
      ctx.turn++

      // ── Call model ──
      const callStart = Date.now()
      let response: ModelResponse

      try {
        response = await this._callWithRetry(
          ctx,
          ctx.getFullHistory(),
          toolList,
          options,
        )
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        this.tracer.addError(ctx.trace, err)
        throw err
      }

      this.tracer.addModelCall(
        ctx.trace,
        config.providerName ?? 'openai',
        ctx.getFullHistory(),
        response,
        Date.now() - callStart,
      )
      ctx.emit('model_called', {
        model: response.model,
        usage: response.usage,
        finishReason: response.finishReason,
        turn: ctx.turn,
      })

      // ── Handle tool calls ──
      if (response.toolCalls.length > 0) {
        // Add assistant message with tool calls reference
        ctx.addMessage({ role: 'assistant', content: response.content || '', toolCalls: response.toolCalls })

        for (const toolCall of response.toolCalls) {
          // Check for handoff signal first
          if (toolCall.name.startsWith('handoff_to_')) {
            const targetName = toolCall.name.replace('handoff_to_', '')
            const targetConfig = (config.handoffs ?? []).find(
              (h) => h.name === targetName,
            )

            if (targetConfig) {
              if (ctx.visitedAgents.has(targetName)) {
                throw new HandoffLoopError(Array.from(ctx.visitedAgents), targetName)
              }

              this.tracer.addHandoff(ctx.trace, ctx.agentName, targetName, ctx.turn)
              ctx.emit('handoff_started', { from: ctx.agentName, to: targetName, turn: ctx.turn })

              ctx.switchAgent(targetConfig)

              // Update tools for new agent
              const newHandoffTools = this._buildHandoffTools(targetConfig)
              const newAllTools = [...(targetConfig.tools ?? []), ...newHandoffTools]

              // Update system prompt for new agent
              ctx.messages[0] = {
                role: 'system',
                content: this._buildSystemPrompt(targetConfig, ''),
              }

              ctx.emit('handoff_completed', { agent: targetName })
              return this._runStandardLoop<T>(ctx, newAllTools, options, sessionManager, maxTurns)
            }
          }

          // Regular tool call
          try {
            await this._executeToolCall(ctx, toolCall, toolList, options)
          } catch (err) {
            if (err instanceof ApprovalRequiredSignal) {
              await this._persistSession(ctx, sessionManager, '')
              return {
                output: '' as unknown as T,
                rawOutput: '',
                status: 'requires_approval',
                sessionId: ctx.sessionId,
                traceId: ctx.trace.runId,
                turns: ctx.turn,
                usage: ctx.trace.totalUsage,
                agentName: ctx.agentName,
                pendingApproval: err.request,
              }
            }
            throw err
          }
        }
        continue
      }

      // ── Final answer ──
      const rawOutput = response.content

      // Output guardrails
      const outputGuardResult = await runGuardrails(
        config.guardrails ?? [],
        {
          type: 'output',
          content: rawOutput,
          context: {
            runId: ctx.trace.runId,
            sessionId: ctx.sessionId,
            agentName: ctx.agentName,
            turn: ctx.turn,
            metadata: ctx.metadata,
          },
        },
      )

      if (!outputGuardResult.passed) {
        ctx.emit('guardrail_triggered', {
          type: 'output',
          reason: outputGuardResult.reason,
        })
        throw new GuardrailBlockedError(
          outputGuardResult.failedGuardrail ?? 'unknown',
          outputGuardResult.reason ?? 'Output blocked',
          'output',
        )
      }

      const finalOutput = outputGuardResult.modifiedContent ?? rawOutput

      // Structured output validation
      const typedOutput = await this._validateStructuredOutput<T>(
        ctx,
        finalOutput,
        toolList,
        options,
        sessionManager,
        maxTurns,
      )

      // Persist session
      await this._persistSession(ctx, sessionManager, finalOutput)

      return {
        output: typedOutput,
        rawOutput: finalOutput,
        status: 'completed',
        sessionId: ctx.sessionId,
        traceId: ctx.trace.runId,
        turns: ctx.turn,
        usage: ctx.trace.totalUsage,
        agentName: ctx.agentName,
      }
    }

    // Max turns reached
    await this._persistSession(ctx, sessionManager, '')
    return {
      output: '' as unknown as T,
      rawOutput: '',
      status: 'max_turns_reached',
      sessionId: ctx.sessionId,
      traceId: ctx.trace.runId,
      turns: ctx.turn,
      usage: ctx.trace.totalUsage,
      agentName: ctx.agentName,
      error: `Agent reached maximum of ${maxTurns} turns without a final answer.`,
    }
  }

  // ─────────────────────────────────────────────
  // Harness Mode Loop (INITIAL → THINK → ANALYSE → TOOL_REQUEST → OUTPUT)
  // ─────────────────────────────────────────────

  private async _runHarnessLoop<T>(
    ctx: RunContext,
    tools: AgentConfig['tools'],
    options: RunOptions,
    sessionManager: SessionManager,
    maxTurns: number,
  ): Promise<RunResult<T>> {
    const toolList = (tools ?? []) as Tool[]

    while (ctx.turn < maxTurns) {
      ctx.turn++

      const callStart = Date.now()
      const response = await this._callWithRetry(ctx, ctx.getFullHistory(), toolList, options)

      this.tracer.addModelCall(
        ctx.trace,
        ctx.agentConfig.providerName ?? 'openai',
        ctx.getFullHistory(),
        response,
        Date.now() - callStart,
      )

      // Parse harness steps from response
      let steps
      try {
        steps = vulcanHarness.parseAllSteps(response.content)
      } catch (e) {
        if (e instanceof HarnessParseError) {
          // If parsing fails, treat as plain text output
          steps = [{ step: 'OUTPUT' as const, text: response.content }]
        } else {
          throw e
        }
      }

      for (const step of steps) {
        ctx.emit('harness_step', step)

        if (vulcanHarness.isToolRequest(step)) {
          // Find and execute the tool
          const tool = toolList.find((t) => t.name === step.functionName)
          if (!tool) {
            ctx.emit('tool_error', { name: step.functionName, error: 'Tool not found' })
            const toolOutputMsg = vulcanHarness.formatToolOutput(
              step.functionName,
              `Error: Tool '${step.functionName}' not found.`,
            )
            ctx.addMessage({ role: 'assistant', content: JSON.stringify(step) })
            ctx.addMessage({ role: 'user', content: toolOutputMsg })
            continue
          }

          ctx.emit('tool_started', { name: step.functionName, input: step.input })
          const toolStart = Date.now()

          try {
            const toolOutput = await (tool as Tool).execute(
              step.input as Record<string, unknown>,
              {
                runId: ctx.trace.runId,
                sessionId: ctx.sessionId,
                agentName: ctx.agentName,
                turn: ctx.turn,
                metadata: ctx.metadata,
              },
            )

            this.tracer.addToolCall(
              ctx.trace,
              step.functionName,
              step.input,
              toolOutput,
              Date.now() - toolStart,
            )
            ctx.emit('tool_completed', { name: step.functionName, output: toolOutput })

            const outputStr =
              typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput)
            const toolOutputMsg = vulcanHarness.formatToolOutput(step.functionName, outputStr)

            ctx.addMessage({ role: 'assistant', content: JSON.stringify(step) })
            ctx.addMessage({ role: 'user', content: toolOutputMsg })
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            this.tracer.addToolCall(ctx.trace, step.functionName, step.input, err.message, Date.now() - toolStart, true)
            ctx.emit('tool_error', { name: step.functionName, error: err.message })
            const errorMsg = vulcanHarness.formatToolOutput(step.functionName, `Error: ${err.message}`)
            ctx.addMessage({ role: 'assistant', content: JSON.stringify(step) })
            ctx.addMessage({ role: 'user', content: errorMsg })
          }
        } else if (vulcanHarness.isFinal(step)) {
          const rawOutput = step.text ?? ''

          // Output guardrails
          const outputGuardResult = await runGuardrails(
            ctx.agentConfig.guardrails ?? [],
            {
              type: 'output',
              content: rawOutput,
              context: {
                runId: ctx.trace.runId,
                sessionId: ctx.sessionId,
                agentName: ctx.agentName,
                turn: ctx.turn,
                metadata: ctx.metadata,
              },
            },
          )

          if (!outputGuardResult.passed) {
            ctx.emit('guardrail_triggered', { type: 'output', reason: outputGuardResult.reason })
            throw new GuardrailBlockedError(
              outputGuardResult.failedGuardrail ?? 'unknown',
              outputGuardResult.reason ?? 'Output blocked',
              'output',
            )
          }

          const finalOutput = outputGuardResult.modifiedContent ?? rawOutput
          await this._persistSession(ctx, sessionManager, finalOutput)

          return {
            output: finalOutput as unknown as T,
            rawOutput: finalOutput,
            status: 'completed',
            sessionId: ctx.sessionId,
            traceId: ctx.trace.runId,
            turns: ctx.turn,
            usage: ctx.trace.totalUsage,
            agentName: ctx.agentName,
          }
        } else {
          // THINK / ANALYSE — just add to context so model sees its own reasoning
          ctx.addMessage({ role: 'assistant', content: JSON.stringify(step) })
        }
      }
    }

    return {
      output: '' as unknown as T,
      rawOutput: '',
      status: 'max_turns_reached',
      sessionId: ctx.sessionId,
      traceId: ctx.trace.runId,
      turns: ctx.turn,
      usage: ctx.trace.totalUsage,
      agentName: ctx.agentName,
      error: `Harness agent reached max turns (${maxTurns}).`,
    }
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private async _callWithRetry(
    ctx: RunContext,
    messages: Message[],
    tools: Tool[],
    options: RunOptions,
  ): Promise<ModelResponse> {
    const config = ctx.agentConfig
    const maxRetries = config.maxRetries ?? 3
    const providerName = resolveProviderName(config, options)
    const fallbacks = config.fallbackProviders ?? []
    const providerChain = [providerName, ...fallbacks]

    let lastError: Error | undefined

    for (const pName of providerChain) {
      const provider = providerRegistry.get(pName)

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await provider.chat(messages, tools, {
            model: config.model ?? 'gemini-2.5-flash',
            temperature: options.temperature ?? config.temperature,
            maxTokens: options.maxTokens ?? config.maxTokens,
            responseFormat:
              config.outputSchema && config.reasoningMode !== 'harness'
                ? 'json_object'
                : 'text',
          })
          return response
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          lastError = err

          if (error instanceof ProviderError && error.retryable && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 500
            ctx.emit('retry', { provider: pName, attempt: attempt + 1, delay, error: err.message })
            await sleep(delay)
            continue
          }

          // Non-retryable — try next provider
          break
        }
      }
    }

    throw lastError ?? new Error('All providers failed')
  }

  private async _executeToolCall(
    ctx: RunContext,
    toolCall: ToolCall,
    tools: Tool[],
    options?: RunOptions,
  ): Promise<void> {
    const tool = tools.find((t) => t.name === toolCall.name)

    if (!tool) {
      const errorMsg = JSON.stringify({ error: `Tool '${toolCall.name}' not found.` })
      ctx.addMessage({ role: 'tool', content: errorMsg, toolCallId: toolCall.id, name: toolCall.name })
      return
    }

    // Tool guardrails
    const toolGuardResult = await runGuardrails(
      ctx.agentConfig.guardrails ?? [],
      {
        type: 'tool',
        content: JSON.stringify(toolCall.arguments),
        toolName: toolCall.name,
        toolInput: toolCall.arguments,
        context: {
          runId: ctx.trace.runId,
          sessionId: ctx.sessionId,
          agentName: ctx.agentName,
          turn: ctx.turn,
          metadata: ctx.metadata,
        },
      },
    )

    if (!toolGuardResult.passed) {
      ctx.emit('guardrail_triggered', {
        type: 'tool',
        toolName: toolCall.name,
        reason: toolGuardResult.reason,
      })
      const errorMsg = JSON.stringify({ error: `Tool blocked by guardrail: ${toolGuardResult.reason ?? ''}` })
      ctx.addMessage({ role: 'tool', content: errorMsg, toolCallId: toolCall.id, name: toolCall.name })
      return
    }

    // ── Human-in-the-Loop (HITL) Approval Check ──
    const requiresApproval = tool.requiresApproval
    const needsApproval = typeof requiresApproval === 'function'
      ? requiresApproval(toolCall.arguments)
      : Boolean(requiresApproval)

    let finalInput = toolCall.arguments

    if (needsApproval) {
      const approvalReq = createApprovalRequest({
        toolName: toolCall.name,
        input: toolCall.arguments,
        toolCallId: toolCall.id,
        runId: ctx.trace.runId,
        sessionId: ctx.sessionId,
        agentName: ctx.agentName,
      })

      ctx.emit('approval_requested', approvalReq)

      const handler = options?.onApproval ?? ctx.agentConfig.onApproval

      if (handler) {
        const rawRes = await handler(approvalReq)
        const parsedRes = parseApprovalResult(rawRes)

        if (parsedRes.approved) {
          ctx.emit('approval_granted', { request: approvalReq, result: parsedRes })
          if (parsedRes.modifiedInput) {
            finalInput = parsedRes.modifiedInput as Record<string, unknown>
          }
        } else {
          ctx.emit('approval_rejected', { request: approvalReq, result: parsedRes })
          const rejectMsg = JSON.stringify({ error: `Tool execution rejected: ${parsedRes.reason ?? 'Approval denied by operator'}` })
          ctx.addMessage({ role: 'tool', content: rejectMsg, toolCallId: toolCall.id, name: toolCall.name })
          return
        }
      } else {
        // Pause execution and throw signal
        throw new ApprovalRequiredSignal(approvalReq)
      }
    }

    ctx.emit('tool_started', { name: toolCall.name, input: finalInput, id: toolCall.id })
    const toolStart = Date.now()

    try {
      const result = await (tool as Tool).execute(finalInput, {
        runId: ctx.trace.runId,
        sessionId: ctx.sessionId,
        agentName: ctx.agentName,
        turn: ctx.turn,
        metadata: ctx.metadata,
      })

      const outputStr = typeof result === 'string' ? result : JSON.stringify(result)
      this.tracer.addToolCall(ctx.trace, toolCall.name, finalInput, result, Date.now() - toolStart)
      ctx.emit('tool_completed', { name: toolCall.name, output: result, id: toolCall.id })
      ctx.addMessage({ role: 'tool', content: outputStr, toolCallId: toolCall.id, name: toolCall.name })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.tracer.addToolCall(ctx.trace, toolCall.name, finalInput, err.message, Date.now() - toolStart, true)
      ctx.emit('tool_error', { name: toolCall.name, error: err.message, id: toolCall.id })
      const errorMsg = JSON.stringify({ error: err.message })
      ctx.addMessage({ role: 'tool', content: errorMsg, toolCallId: toolCall.id, name: toolCall.name })
    }
  }

  private async _validateStructuredOutput<T>(
    ctx: RunContext,
    output: string,
    tools: Tool[],
    options: RunOptions,
    sessionManager: SessionManager,
    maxTurns: number,
  ): Promise<T> {
    const schema = ctx.agentConfig.outputSchema
    if (!schema) return output as unknown as T

    try {
      const parsed = JSON.parse(output) as unknown
      const result = schema.safeParse(parsed)
      if (result.success) {
        return result.data as T
      }

      // Retry with validation error
      const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      const retryMsg = `Your output was invalid. Fix these issues and output valid JSON: ${errors}`

      ctx.addMessage({ role: 'user', content: retryMsg })
      ctx.turn++

      if (ctx.turn < maxTurns) {
        return this._runStandardLoop<T>(ctx, tools, options, sessionManager, maxTurns).then(
          (r) => r.output,
        )
      }
      throw new StructuredOutputValidationError(errors)
    } catch (error) {
      if (error instanceof StructuredOutputValidationError) throw error
      // Not JSON — retry
      throw new StructuredOutputValidationError(`Output is not valid JSON: ${output.slice(0, 100)}`)
    }
  }

  private _buildSystemPrompt(config: AgentConfig, _input: string): string {
    if (config.reasoningMode === 'harness') {
      return vulcanHarness.buildSystemPrompt(config.tools ?? [], config.instructions)
    }

    let prompt = config.instructions

    if (config.outputSchema) {
      prompt +=
        '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation. Just the raw JSON object.'
    }

    if ((config.handoffs ?? []).length > 0) {
      const agentList = (config.handoffs ?? []).map((h) => `- ${h.name}: ${h.instructions.slice(0, 100)}...`).join('\n')
      prompt += `\n\nYou can hand off to these agents when appropriate:\n${agentList}`
    }

    return prompt
  }

  private _buildHandoffTools(config: AgentConfig): ToolDefinition[] {
    const { z } = require('../types/index.js') as { z: typeof import('zod').z }
    return (config.handoffs ?? []).map((targetConfig) => ({
      name: `handoff_to_${targetConfig.name}`,
      description: `Hand off this conversation to the ${targetConfig.name} agent. Use when the task requires expertise this agent doesn't have.`,
      inputSchema: z.object({ reason: z.string().describe('Why you are handing off') }),
      execute: async () => `Handoff to ${targetConfig.name} initiated.`,
      timeoutMs: 5000,
    }))
  }

  private async _persistSession(
    ctx: RunContext,
    sessionManager: SessionManager,
    _finalOutput: string,
  ): Promise<void> {
    const allMessages = ctx.getFullHistory()
    const updatedSession = {
      ...ctx.session,
      messages: allMessages,
      turnCount: ctx.session.turnCount + ctx.turn,
      updatedAt: Date.now(),
    }
    await sessionManager.save(updatedSession)
  }
}

// ─────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────

export class HandoffLoopError extends Error {
  constructor(
    public readonly visitedAgents: string[],
    public readonly targetAgent: string,
  ) {
    super(
      `Handoff loop detected: Agent '${targetAgent}' was already visited in this run. ` +
        `Visited: [${visitedAgents.join(' → ')}]`,
    )
    this.name = 'HandoffLoopError'
  }
}

export class StructuredOutputValidationError extends Error {
  constructor(public readonly validationErrors: string) {
    super(`Structured output validation failed: ${validationErrors}`)
    this.name = 'StructuredOutputValidationError'
  }
}

// ─────────────────────────────────────────────
// Type import for handoff tool builder
// ─────────────────────────────────────────────
type ToolDefinition = import('../types/index.js').ToolDefinition

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveProviderName(config: AgentConfig, options: RunOptions): string {
  if (options.provider) return options.provider
  if (config.providerName) return config.providerName

  const model = (config.model || '').toLowerCase()
  if (
    model.startsWith('groq/') ||
    model.includes('llama') ||
    model.includes('mixtral') ||
    model.includes('deepseek') ||
    model.includes('gemma')
  ) {
    return 'groq'
  }
  if (model.includes('gpt') || model.startsWith('openai/')) {
    return 'openai'
  }
  if (model.includes('claude') || model.startsWith('anthropic/')) {
    return 'anthropic'
  }
  if (model.includes('gemini') || model.startsWith('google/')) {
    return 'gemini'
  }
  return 'gemini'
}
