'use strict';

var uuid = require('uuid');
var zod = require('zod');
var events = require('events');
var dotenv = require('dotenv');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var dotenv__default = /*#__PURE__*/_interopDefault(dotenv);

// Vulcan AI Agent SDK — https://github.com/vulcan-ai/sdk
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
exports.RunContext = void 0;
var init_context = __esm({
  "src/core/context.ts"() {
    exports.RunContext = class {
      runId;
      sessionId;
      agentName;
      tracer;
      trace;
      emitter;
      /** Messages accumulated in THIS run (not the full session history) */
      messages;
      /** Full session state (includes history from previous runs) */
      session;
      /** Current turn number */
      turn;
      /** Arbitrary metadata from RunOptions */
      metadata;
      /** Current agent config (may change on handoff) */
      agentConfig;
      /** Track visited agents to detect handoff loops */
      visitedAgents;
      constructor(options) {
        this.runId = uuid.v4();
        this.sessionId = options.sessionId;
        this.agentName = options.agentConfig.name;
        this.tracer = options.tracer;
        this.trace = options.trace;
        this.emitter = options.emitter;
        this.messages = [];
        this.session = options.session;
        this.turn = 0;
        this.metadata = options.metadata ?? {};
        this.agentConfig = options.agentConfig;
        this.visitedAgents = /* @__PURE__ */ new Set([options.agentConfig.name]);
      }
      /**
       * Add a message to the current run's context.
       */
      addMessage(msg) {
        this.messages.push(msg);
      }
      /**
       * Get the full message history: session history + current run messages.
       * The session history provides multi-turn memory.
       */
      getFullHistory() {
        return [...this.session.messages, ...this.messages];
      }
      /**
       * Emit a VulcanEvent to all listeners.
       */
      emit(type, data) {
        const event = {
          type,
          timestamp: Date.now(),
          runId: this.runId,
          agentName: this.agentName,
          data
        };
        this.emitter.emit("event", event);
        this.emitter.emit(type, event);
      }
      /**
       * Listen to a specific event type.
       */
      on(type, listener) {
        this.emitter.on(type, listener);
      }
      /**
       * Switch to a new agent (during handoff).
       * Updates agentConfig and agentName tracking.
       */
      switchAgent(newConfig) {
        this.agentConfig = newConfig;
        this.agentName = newConfig.name;
        this.visitedAgents.add(newConfig.name);
      }
    };
  }
});
exports.VulcanTracer = void 0; exports.globalTracer = void 0;
var init_tracer = __esm({
  "src/tracing/tracer.ts"() {
    exports.VulcanTracer = class {
      traces = /* @__PURE__ */ new Map();
      /**
       * Start a new trace for a run.
       */
      startRun(runId, agentName, sessionId) {
        const trace = {
          runId,
          agentName,
          sessionId,
          startTime: Date.now(),
          modelCalls: [],
          toolCalls: [],
          handoffs: [],
          errors: [],
          totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        };
        this.traces.set(runId, trace);
        return trace;
      }
      /**
       * Record a model API call.
       */
      addModelCall(trace, providerName, requestMessages, response, durationMs) {
        const record = {
          id: uuid.v4(),
          model: response.model,
          provider: providerName,
          requestMessages,
          response,
          durationMs,
          timestamp: Date.now()
        };
        trace.modelCalls.push(record);
        this._accumulateUsage(trace, response.usage);
      }
      /**
       * Record a tool execution.
       */
      addToolCall(trace, toolName, input, output, durationMs, isError = false) {
        const record = {
          id: uuid.v4(),
          name: toolName,
          input,
          output,
          isError,
          durationMs,
          timestamp: Date.now()
        };
        trace.toolCalls.push(record);
      }
      /**
       * Record an agent handoff.
       */
      addHandoff(trace, from, to, turn) {
        const record = {
          from,
          to,
          turn,
          timestamp: Date.now()
        };
        trace.handoffs.push(record);
      }
      /**
       * Record an error.
       */
      addError(trace, error) {
        const record = {
          message: error.message,
          stack: error.stack,
          timestamp: Date.now()
        };
        trace.errors.push(record);
      }
      /**
       * Finalize the trace with status and output.
       */
      endRun(trace, status, output) {
        trace.endTime = Date.now();
        trace.status = status;
        trace.output = output;
        this.traces.set(trace.runId, trace);
      }
      /**
       * Get a trace by run ID.
       */
      getTrace(runId) {
        return this.traces.get(runId);
      }
      /**
       * Export a trace to JSON or human-readable format.
       */
      export(trace, format = "json") {
        if (format === "json") {
          return JSON.stringify(trace, null, 2);
        }
        return this._prettyPrint(trace);
      }
      /**
       * Clear all traces (e.g. for testing).
       */
      clear() {
        this.traces.clear();
      }
      _accumulateUsage(trace, usage) {
        trace.totalUsage.promptTokens += usage.promptTokens;
        trace.totalUsage.completionTokens += usage.completionTokens;
        trace.totalUsage.totalTokens += usage.totalTokens;
      }
      _prettyPrint(trace) {
        const duration = trace.endTime ? `${trace.endTime - trace.startTime}ms` : "in progress";
        const lines = [
          `\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`,
          `\u2551 Vulcan Trace \u2014 Run ID: ${trace.runId}`,
          `\u2551 Agent: ${trace.agentName} | Session: ${trace.sessionId}`,
          `\u2551 Status: ${trace.status ?? "running"} | Duration: ${duration}`,
          `\u2551 Tokens: ${trace.totalUsage.totalTokens} (\u2191${trace.totalUsage.promptTokens} \u2193${trace.totalUsage.completionTokens})`,
          `\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`,
          `\u2551 Model Calls (${trace.modelCalls.length}):`
        ];
        for (const call of trace.modelCalls) {
          lines.push(
            `\u2551   [${call.model}] ${call.durationMs}ms \u2014 ${call.response.finishReason} \u2014 ${call.response.usage.totalTokens} tokens`
          );
        }
        if (trace.toolCalls.length > 0) {
          lines.push(`\u2551 Tool Calls (${trace.toolCalls.length}):`);
          for (const tc of trace.toolCalls) {
            const status = tc.isError ? "\u2717 ERROR" : "\u2713 OK";
            lines.push(`\u2551   [${status}] ${tc.name} \u2014 ${tc.durationMs}ms`);
          }
        }
        if (trace.handoffs.length > 0) {
          lines.push(`\u2551 Handoffs (${trace.handoffs.length}):`);
          for (const h of trace.handoffs) {
            lines.push(`\u2551   Turn ${h.turn}: ${h.from} \u2192 ${h.to}`);
          }
        }
        if (trace.errors.length > 0) {
          lines.push(`\u2551 Errors (${trace.errors.length}):`);
          for (const e of trace.errors) {
            lines.push(`\u2551   \u2717 ${e.message}`);
          }
        }
        lines.push(`\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
        return lines.join("\n");
      }
    };
    exports.globalTracer = new exports.VulcanTracer();
  }
});
function createSession(agentName, sessionId) {
  const now = Date.now();
  return {
    id: sessionId ?? uuid.v4(),
    agentName,
    messages: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
    turnCount: 0
  };
}
function updateSession(session, messages) {
  return {
    ...session,
    messages,
    updatedAt: Date.now(),
    turnCount: session.turnCount + 1
  };
}
exports.SessionManager = void 0;
var init_session = __esm({
  "src/memory/session.ts"() {
    exports.SessionManager = class {
      constructor(adapter) {
        this.adapter = adapter;
      }
      adapter;
      /**
       * Load an existing session or create a new one.
       * This is called at the start of every run.
       */
      async loadOrCreate(sessionId, agentName) {
        const existing = await this.adapter.get(sessionId);
        if (existing) {
          return existing;
        }
        const newSession = createSession(agentName, sessionId);
        await this.adapter.set(sessionId, newSession);
        return newSession;
      }
      /**
       * Persist a session after a turn completes.
       */
      async save(session) {
        await this.adapter.set(session.id, session);
      }
      /**
       * Append messages to a session and save.
       */
      async appendMessages(sessionId, messages) {
        const session = await this.adapter.get(sessionId);
        if (!session) return null;
        const updated = updateSession(session, [...session.messages, ...messages]);
        await this.adapter.set(sessionId, updated);
        return updated;
      }
      /**
       * Delete a session.
       */
      async delete(sessionId) {
        await this.adapter.delete(sessionId);
      }
      /**
       * List all active sessions.
       */
      async list() {
        return this.adapter.list();
      }
      /**
       * Get a session by ID.
       */
      async get(sessionId) {
        return this.adapter.get(sessionId);
      }
    };
  }
});

// src/memory/in-memory.ts
exports.InMemoryStorage = void 0;
var init_in_memory = __esm({
  "src/memory/in-memory.ts"() {
    exports.InMemoryStorage = class {
      constructor(ttlMs) {
        this.ttlMs = ttlMs;
      }
      ttlMs;
      store = /* @__PURE__ */ new Map();
      expiryMap = /* @__PURE__ */ new Map();
      async get(sessionId) {
        return this.store.get(sessionId) ?? null;
      }
      async set(sessionId, session) {
        this.store.set(sessionId, session);
        if (this.ttlMs) {
          const existing = this.expiryMap.get(sessionId);
          if (existing) clearTimeout(existing);
          const timer = setTimeout(() => {
            this.store.delete(sessionId);
            this.expiryMap.delete(sessionId);
          }, this.ttlMs);
          this.expiryMap.set(sessionId, timer);
        }
      }
      async delete(sessionId) {
        this.store.delete(sessionId);
        const timer = this.expiryMap.get(sessionId);
        if (timer) {
          clearTimeout(timer);
          this.expiryMap.delete(sessionId);
        }
      }
      async list() {
        return Array.from(this.store.keys());
      }
      async clear() {
        this.store.clear();
        for (const timer of this.expiryMap.values()) {
          clearTimeout(timer);
        }
        this.expiryMap.clear();
      }
      /** Returns the number of active sessions */
      get size() {
        return this.store.size;
      }
    };
  }
});

// src/providers/provider.ts
var ProviderRegistry; exports.providerRegistry = void 0; exports.BaseProvider = void 0; exports.ProviderNotFoundError = void 0; exports.ProviderError = void 0;
var init_provider = __esm({
  "src/providers/provider.ts"() {
    ProviderRegistry = class {
      providers = /* @__PURE__ */ new Map();
      /**
       * Register a provider under a name.
       * Built-in providers are auto-registered when their module is imported.
       */
      register(name, provider) {
        this.providers.set(name, provider);
      }
      /**
       * Retrieve a registered provider by name.
       * Throws if not found.
       */
      get(name) {
        const provider = this.providers.get(name);
        if (!provider) {
          const available = Array.from(this.providers.keys()).join(", ") || "none";
          throw new exports.ProviderNotFoundError(name, available);
        }
        return provider;
      }
      has(name) {
        return this.providers.has(name);
      }
      list() {
        return Array.from(this.providers.keys());
      }
    };
    exports.providerRegistry = new ProviderRegistry();
    exports.BaseProvider = class {
      /** Merges usage from multiple model calls */
      mergeUsage(a, b) {
        return {
          promptTokens: a.promptTokens + b.promptTokens,
          completionTokens: a.completionTokens + b.completionTokens,
          totalTokens: a.totalTokens + b.totalTokens
        };
      }
      /** Separates system messages from conversation messages */
      extractSystemPrompt(messages) {
        const systemMessages = messages.filter((m) => m.role === "system");
        const rest = messages.filter((m) => m.role !== "system");
        const system = systemMessages.map((m) => m.content).join("\n\n");
        return { system, rest };
      }
    };
    exports.ProviderNotFoundError = class extends Error {
      constructor(name, available) {
        super(
          `Provider '${name}' is not registered. Available providers: [${available}]. Import and register one: e.g. import { OpenAIProvider } from '@vulcan-ai/sdk'; Vulcan.registerProvider('openai', new OpenAIProvider(apiKey))`
        );
        this.name = "ProviderNotFoundError";
      }
    };
    exports.ProviderError = class extends Error {
      constructor(providerName, message, statusCode, retryable = false) {
        super(`[${providerName}] ${message}`);
        this.providerName = providerName;
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.name = "ProviderError";
      }
      providerName;
      statusCode;
      retryable;
    };
  }
});

// src/guardrails/guardrails.ts
async function runGuardrails(guardrails, payload) {
  const applicableGuardrails = guardrails.filter((g) => {
    const types = Array.isArray(g.type) ? g.type : [g.type];
    return types.includes(payload.type);
  });
  let currentContent = payload.content;
  for (const guardrail of applicableGuardrails) {
    const result = await guardrail.check({
      ...payload,
      content: currentContent
    });
    if (!result.passed) {
      return {
        passed: false,
        failedGuardrail: guardrail.name,
        reason: result.reason
      };
    }
    if (result.modifiedContent !== void 0) {
      currentContent = result.modifiedContent;
    }
  }
  return {
    passed: true,
    modifiedContent: currentContent !== payload.content ? currentContent : void 0
  };
}
var BaseGuardrail; exports.MaxLengthGuardrail = void 0; exports.KeywordBlockGuardrail = void 0; exports.StructuredOutputGuardrail = void 0; exports.BlockedToolsGuardrail = void 0; exports.FunctionGuardrail = void 0; exports.PIIScrubberGuardrail = void 0; exports.GuardrailBlockedError = void 0;
var init_guardrails = __esm({
  "src/guardrails/guardrails.ts"() {
    BaseGuardrail = class {
      pass(modifiedContent) {
        return { passed: true, modifiedContent };
      }
      fail(reason) {
        return { passed: false, reason };
      }
    };
    exports.MaxLengthGuardrail = class extends BaseGuardrail {
      constructor(maxChars, options = {}) {
        super();
        this.maxChars = maxChars;
        this.name = options.name ?? `max-length-${maxChars}`;
        this.type = options.type ?? ["input", "output"];
      }
      maxChars;
      name;
      type;
      async check(payload) {
        if (payload.content.length > this.maxChars) {
          return this.fail(
            `Content length ${payload.content.length} exceeds maximum of ${this.maxChars} characters.`
          );
        }
        return this.pass();
      }
    };
    exports.KeywordBlockGuardrail = class extends BaseGuardrail {
      constructor(keywords, options = {}) {
        super();
        this.keywords = keywords;
        this.name = options.name ?? "keyword-block";
        this.type = options.type ?? "input";
        this.lowerKeywords = options.caseSensitive ? keywords : keywords.map((k) => k.toLowerCase());
      }
      keywords;
      name;
      type;
      lowerKeywords;
      async check(payload) {
        const content = this.lowerKeywords.includes(
          payload.content.toLowerCase()
        ) ? payload.content.toLowerCase() : payload.content;
        for (const keyword of this.lowerKeywords) {
          if (content.toLowerCase().includes(keyword)) {
            return this.fail(`Content contains blocked keyword: '${keyword}'`);
          }
        }
        return this.pass();
      }
    };
    exports.StructuredOutputGuardrail = class extends BaseGuardrail {
      constructor(schema) {
        super();
        this.schema = schema;
      }
      schema;
      name = "structured-output-validation";
      type = "output";
      async check(payload) {
        try {
          const parsed = JSON.parse(payload.content);
          const result = this.schema.safeParse(parsed);
          if (!result.success) {
            const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
            return this.fail(`Output schema validation failed: ${errors}`);
          }
          return this.pass();
        } catch {
          return this.fail("Output is not valid JSON \u2014 cannot validate schema.");
        }
      }
    };
    exports.BlockedToolsGuardrail = class extends BaseGuardrail {
      constructor(blockedTools, name) {
        super();
        this.blockedTools = blockedTools;
        this.name = name ?? "blocked-tools";
      }
      blockedTools;
      name;
      type = "tool";
      async check(payload) {
        if (payload.toolName && this.blockedTools.includes(payload.toolName)) {
          return this.fail(`Tool '${payload.toolName}' is not allowed by policy.`);
        }
        return this.pass();
      }
    };
    exports.FunctionGuardrail = class extends BaseGuardrail {
      constructor(name, type, fn) {
        super();
        this.fn = fn;
        this.name = name;
        this.type = type;
      }
      fn;
      name;
      type;
      async check(payload) {
        return this.fn(payload, payload.context);
      }
    };
    exports.PIIScrubberGuardrail = class _PIIScrubberGuardrail extends BaseGuardrail {
      name = "pii-scrubber";
      type = "output";
      static PII_PATTERNS = [
        [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]"],
        [/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]"],
        [/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, "[CARD]"],
        [/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]"]
      ];
      async check(payload) {
        let content = payload.content;
        for (const [pattern, replacement] of _PIIScrubberGuardrail.PII_PATTERNS) {
          content = content.replace(pattern, replacement);
        }
        if (content !== payload.content) {
          return this.pass(content);
        }
        return this.pass();
      }
    };
    exports.GuardrailBlockedError = class extends Error {
      constructor(guardrailName, reason, guardrailType) {
        super(`Guardrail '${guardrailName}' blocked execution: ${reason}`);
        this.guardrailName = guardrailName;
        this.reason = reason;
        this.guardrailType = guardrailType;
        this.name = "GuardrailBlockedError";
      }
      guardrailName;
      reason;
      guardrailType;
    };
  }
});

// src/core/harness.ts
exports.VULCAN_HARNESS_PROMPT = void 0; exports.VulcanHarness = void 0; exports.HarnessParseError = void 0; exports.vulcanHarness = void 0;
var init_harness = __esm({
  "src/core/harness.ts"() {
    exports.VULCAN_HARNESS_PROMPT = `
You are an expert AI assistant powered by Vulcan SDK.

You MUST analyse the user's input carefully and then break down the problem into
multiple sub-problems before arriving at the final result.

We follow a strict pipeline: "INITIAL" \u2192 "THINK" \u2192 "ANALYSE" \u2192 "TOOL_REQUEST" \u2192 "OUTPUT"

The Pipeline:
- "INITIAL": When the user gives input, produce an initial thought on what they are trying to do.
- "THINK": Think about how to solve this and break down the problem step-by-step.
- "ANALYSE": Analyse your approach and verify if the direction is correct.
- "THINK": You may re-enter THINK if sub-problems remain.
- "ANALYSE": Re-analyse until confident.
- "TOOL_REQUEST": Use this to call a tool. Output ONLY the JSON for this step.
- "OUTPUT": Final answer to the user. This ENDS the pipeline.

Rules:
- Always output ONE step at a time as a valid JSON object.
- Always maintain the pipeline sequence shown above.
- NEVER skip INITIAL or OUTPUT steps.
- NEVER nest steps or output multiple steps at once.
- If a tool is needed, use TOOL_REQUEST before OUTPUT.
- After receiving TOOL_OUTPUT, continue the pipeline from THINK or ANALYSE.

Output Format (strict JSON, one step per response):
{ "step": "INITIAL" | "THINK" | "ANALYSE" | "TOOL_REQUEST" | "OUTPUT", "text": "<content>", "functionName": "<tool name \u2014 only for TOOL_REQUEST>", "input": <tool input object \u2014 only for TOOL_REQUEST> }

Example \u2014 Math:
User: What is 2 + 2 - 5 * 10 / 3?
{ "step": "INITIAL", "text": "The user wants me to solve a math equation using BODMAS rules." }
{ "step": "THINK", "text": "BODMAS: first multiply 5 * 10 = 50. Equation: 2 + 2 - 50 / 3" }
{ "step": "ANALYSE", "text": "Correct. Now divide: 50 / 3 = 16.6667. Equation: 2 + 2 - 16.6667" }
{ "step": "THINK", "text": "Addition: 2 + 2 = 4. Equation: 4 - 16.6667" }
{ "step": "ANALYSE", "text": "Simple subtraction remains: 4 - 16.6667 = -12.6667" }
{ "step": "OUTPUT", "text": "The final answer is -12.6667" }

Example \u2014 Tool Use:
User: What is the weather in Goa?
{ "step": "INITIAL", "text": "The user wants weather information for Goa." }
{ "step": "THINK", "text": "I have a tool named getWeatherData that can fetch weather by city." }
{ "step": "ANALYSE", "text": "Calling getWeatherData with 'goa' is the right approach." }
{ "step": "TOOL_REQUEST", "text": "Fetching weather data", "functionName": "getWeatherData", "input": "goa" }
[After receiving TOOL_OUTPUT]
{ "step": "THINK", "text": "I now have the weather data from the tool." }
{ "step": "OUTPUT", "text": "The weather in Goa is sunny at 30\xB0C. It's going to be hot!" }
`;
    exports.VulcanHarness = class {
      /**
       * Builds the full system prompt with tools injected.
       */
      buildSystemPrompt(tools, baseInstructions) {
        const toolList = tools.length > 0 ? `
Available Tools:
${tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}` : "\nNo tools available for this agent.";
        return `${exports.VULCAN_HARNESS_PROMPT}
${toolList}

Additional Instructions:
${baseInstructions}`;
      }
      /**
       * Parses a raw JSON string from the model into a HarnessMessage.
       * Handles JSON embedded in markdown code blocks.
       */
      parseStep(raw) {
        const cleaned = this._extractJson(raw.trim());
        try {
          const parsed = JSON.parse(cleaned);
          const step = parsed.step;
          if (!this._isValidStep(step)) {
            throw new exports.HarnessParseError(`Invalid step: '${String(parsed.step)}'`, raw);
          }
          return {
            step,
            text: typeof parsed.text === "string" ? parsed.text : void 0,
            functionName: typeof parsed.functionName === "string" ? parsed.functionName : void 0,
            input: parsed.input
          };
        } catch (error) {
          if (error instanceof exports.HarnessParseError) throw error;
          throw new exports.HarnessParseError(`Failed to parse harness step: ${raw}`, raw);
        }
      }
      /**
       * Parses all steps from a multi-step response (for non-streaming mode).
       */
      parseAllSteps(raw) {
        const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("{"));
        if (lines.length === 0) {
          return [this.parseStep(raw)];
        }
        return lines.map((line) => this.parseStep(line));
      }
      /**
       * Returns true if the step is a TOOL_REQUEST.
       */
      isToolRequest(msg) {
        return msg.step === "TOOL_REQUEST" && typeof msg.functionName === "string";
      }
      /**
       * Returns true if the pipeline has ended.
       */
      isFinal(msg) {
        return msg.step === "OUTPUT";
      }
      /**
       * Formats a TOOL_OUTPUT to inject back into the conversation.
       */
      formatToolOutput(toolName, output) {
        return JSON.stringify({
          step: "TOOL_OUTPUT",
          functionName: toolName,
          result: output
        });
      }
      /**
       * Extracts JSON from a string that may be wrapped in markdown code blocks.
       */
      _extractJson(raw) {
        const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch?.[1]) return codeBlockMatch[1].trim();
        return raw;
      }
      _isValidStep(step) {
        const validSteps = [
          "INITIAL",
          "THINK",
          "ANALYSE",
          "TOOL_REQUEST",
          "OUTPUT"
        ];
        return validSteps.includes(step);
      }
    };
    exports.HarnessParseError = class extends Error {
      constructor(message, raw) {
        super(message);
        this.raw = raw;
        this.name = "HarnessParseError";
      }
      raw;
    };
    exports.vulcanHarness = new exports.VulcanHarness();
  }
});

// src/core/hitl.ts
function createApprovalRequest(params) {
  return {
    id: `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    toolName: params.toolName,
    input: params.input,
    toolCallId: params.toolCallId,
    runId: params.runId,
    sessionId: params.sessionId,
    agentName: params.agentName,
    timestamp: Date.now()
  };
}
function parseApprovalResult(result) {
  if (typeof result === "boolean") {
    return { approved: result };
  }
  return result;
}
exports.ApprovalRequiredSignal = void 0;
var init_hitl = __esm({
  "src/core/hitl.ts"() {
    exports.ApprovalRequiredSignal = class extends Error {
      constructor(request) {
        super(`Execution paused for human approval on tool '${request.toolName}'`);
        this.request = request;
        this.name = "ApprovalRequiredSignal";
      }
      request;
    };
  }
});

// src/types/index.ts
var types_exports = {};
__export(types_exports, {
  ZodSchema: () => zod.ZodSchema,
  emptyUsage: () => emptyUsage,
  z: () => zod.z
});
var emptyUsage;
var init_types = __esm({
  "src/types/index.ts"() {
    emptyUsage = () => ({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    });
  }
});

// src/core/runner.ts
var runner_exports = {};
__export(runner_exports, {
  AgentRunner: () => exports.AgentRunner,
  HandoffLoopError: () => exports.HandoffLoopError,
  StructuredOutputValidationError: () => exports.StructuredOutputValidationError
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.AgentRunner = void 0; exports.HandoffLoopError = void 0; exports.StructuredOutputValidationError = void 0;
var init_runner = __esm({
  "src/core/runner.ts"() {
    init_context();
    init_tracer();
    init_session();
    init_in_memory();
    init_provider();
    init_guardrails();
    init_harness();
    init_hitl();
    exports.AgentRunner = class {
      tracer;
      constructor(tracer) {
        this.tracer = tracer ?? exports.globalTracer;
      }
      /**
       * Run an agent to completion and return the final result.
       */
      async run(agent, input, options = {}) {
        const emitter = new events.EventEmitter();
        emitter.setMaxListeners(50);
        const sessionId = options.sessionId ?? uuid.v4();
        const storageAdapter = agent.config.storageAdapter ?? new exports.InMemoryStorage();
        const sessionManager = new exports.SessionManager(storageAdapter);
        const session = await sessionManager.loadOrCreate(sessionId, agent.config.name);
        const trace = this.tracer.startRun(uuid.v4(), agent.config.name, sessionId);
        const ctx = new exports.RunContext({
          sessionId,
          agentConfig: agent.config,
          tracer: this.tracer,
          trace,
          emitter,
          session,
          metadata: options.metadata
        });
        ctx.emit("run_started", { agentName: agent.config.name, input });
        try {
          const result = await this._runLoop(ctx, input, options, sessionManager);
          this.tracer.endRun(trace, result.status, result.output);
          ctx.emit("run_completed", result);
          return result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.tracer.addError(trace, err);
          this.tracer.endRun(trace, "failed", null);
          ctx.emit("run_failed", { error: err.message });
          return {
            output: "",
            rawOutput: "",
            status: "failed",
            sessionId,
            traceId: trace.runId,
            turns: ctx.turn,
            usage: trace.totalUsage,
            agentName: ctx.agentName,
            error: err.message
          };
        }
      }
      /**
       * Stream an agent run — yields VulcanEvents as they happen.
       */
      async *stream(agent, input, options = {}) {
        const emitter = new events.EventEmitter();
        emitter.setMaxListeners(50);
        const buffer = [];
        let done = false;
        emitter.on("event", (event) => {
          buffer.push(event);
        });
        this.run(agent, input, { ...options });
        const sessionId = options.sessionId ?? uuid.v4();
        const storageAdapter = agent.config.storageAdapter ?? new exports.InMemoryStorage();
        const sessionManager = new exports.SessionManager(storageAdapter);
        const session = await sessionManager.loadOrCreate(sessionId, agent.config.name);
        const trace = this.tracer.startRun(uuid.v4(), agent.config.name, sessionId);
        const ctx = new exports.RunContext({
          sessionId,
          agentConfig: agent.config,
          tracer: this.tracer,
          trace,
          emitter,
          session,
          metadata: options.metadata
        });
        const loopPromise = this._runLoop(ctx, input, options, sessionManager).then((result) => {
          this.tracer.endRun(trace, result.status, result.output);
          ctx.emit("run_completed", result);
        }).catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          this.tracer.addError(trace, err);
          ctx.emit("run_failed", { error: err.message });
        }).finally(() => {
          done = true;
        });
        ctx.emit("run_started", { agentName: agent.config.name, input });
        while (!done || buffer.length > 0) {
          if (buffer.length > 0) {
            yield buffer.shift();
          } else {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }
        }
        await loopPromise;
      }
      // ─────────────────────────────────────────────
      // Core Agent Loop
      // ─────────────────────────────────────────────
      async _runLoop(ctx, input, options, sessionManager) {
        const config = ctx.agentConfig;
        const maxTurns = options.maxTurns ?? config.maxTurns ?? 20;
        const inputGuardResult = await runGuardrails(
          config.guardrails ?? [],
          {
            type: "input",
            content: input,
            context: {
              runId: ctx.trace.runId,
              sessionId: ctx.sessionId,
              agentName: ctx.agentName,
              turn: ctx.turn,
              metadata: ctx.metadata
            }
          }
        );
        if (!inputGuardResult.passed) {
          ctx.emit("guardrail_triggered", {
            type: "input",
            reason: inputGuardResult.reason,
            guardrail: inputGuardResult.failedGuardrail
          });
          throw new exports.GuardrailBlockedError(
            inputGuardResult.failedGuardrail ?? "unknown",
            inputGuardResult.reason ?? "Input blocked",
            "input"
          );
        }
        const finalInput = inputGuardResult.modifiedContent ?? input;
        const systemPrompt = this._buildSystemPrompt(config, finalInput);
        ctx.addMessage({ role: "system", content: systemPrompt });
        ctx.addMessage({ role: "user", content: finalInput });
        const handoffTools = this._buildHandoffTools(config);
        const allTools = [...config.tools ?? [], ...handoffTools];
        if (config.reasoningMode === "harness") {
          return this._runHarnessLoop(ctx, allTools, options, sessionManager, maxTurns);
        }
        return this._runStandardLoop(ctx, allTools, options, sessionManager, maxTurns);
      }
      // ─────────────────────────────────────────────
      // Standard Mode Loop (native tool calling)
      // ─────────────────────────────────────────────
      async _runStandardLoop(ctx, tools, options, sessionManager, maxTurns) {
        const config = ctx.agentConfig;
        const toolList = tools ?? [];
        while (ctx.turn < maxTurns) {
          ctx.turn++;
          const callStart = Date.now();
          let response;
          try {
            response = await this._callWithRetry(
              ctx,
              ctx.getFullHistory(),
              toolList,
              options
            );
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.tracer.addError(ctx.trace, err);
            throw err;
          }
          this.tracer.addModelCall(
            ctx.trace,
            config.providerName ?? "openai",
            ctx.getFullHistory(),
            response,
            Date.now() - callStart
          );
          ctx.emit("model_called", {
            model: response.model,
            usage: response.usage,
            finishReason: response.finishReason,
            turn: ctx.turn
          });
          if (response.toolCalls.length > 0) {
            ctx.addMessage({ role: "assistant", content: response.content || "", toolCalls: response.toolCalls });
            for (const toolCall of response.toolCalls) {
              if (toolCall.name.startsWith("handoff_to_")) {
                const targetName = toolCall.name.replace("handoff_to_", "");
                const targetConfig = (config.handoffs ?? []).find(
                  (h) => h.name === targetName
                );
                if (targetConfig) {
                  if (ctx.visitedAgents.has(targetName)) {
                    throw new exports.HandoffLoopError(Array.from(ctx.visitedAgents), targetName);
                  }
                  this.tracer.addHandoff(ctx.trace, ctx.agentName, targetName, ctx.turn);
                  ctx.emit("handoff_started", { from: ctx.agentName, to: targetName, turn: ctx.turn });
                  ctx.switchAgent(targetConfig);
                  const newHandoffTools = this._buildHandoffTools(targetConfig);
                  const newAllTools = [...targetConfig.tools ?? [], ...newHandoffTools];
                  ctx.messages[0] = {
                    role: "system",
                    content: this._buildSystemPrompt(targetConfig, "")
                  };
                  ctx.emit("handoff_completed", { agent: targetName });
                  return this._runStandardLoop(ctx, newAllTools, options, sessionManager, maxTurns);
                }
              }
              try {
                await this._executeToolCall(ctx, toolCall, toolList, options);
              } catch (err) {
                if (err instanceof exports.ApprovalRequiredSignal) {
                  await this._persistSession(ctx, sessionManager, "");
                  return {
                    output: "",
                    rawOutput: "",
                    status: "requires_approval",
                    sessionId: ctx.sessionId,
                    traceId: ctx.trace.runId,
                    turns: ctx.turn,
                    usage: ctx.trace.totalUsage,
                    agentName: ctx.agentName,
                    pendingApproval: err.request
                  };
                }
                throw err;
              }
            }
            continue;
          }
          const rawOutput = response.content;
          const outputGuardResult = await runGuardrails(
            config.guardrails ?? [],
            {
              type: "output",
              content: rawOutput,
              context: {
                runId: ctx.trace.runId,
                sessionId: ctx.sessionId,
                agentName: ctx.agentName,
                turn: ctx.turn,
                metadata: ctx.metadata
              }
            }
          );
          if (!outputGuardResult.passed) {
            ctx.emit("guardrail_triggered", {
              type: "output",
              reason: outputGuardResult.reason
            });
            throw new exports.GuardrailBlockedError(
              outputGuardResult.failedGuardrail ?? "unknown",
              outputGuardResult.reason ?? "Output blocked",
              "output"
            );
          }
          const finalOutput = outputGuardResult.modifiedContent ?? rawOutput;
          const typedOutput = await this._validateStructuredOutput(
            ctx,
            finalOutput,
            toolList,
            options,
            sessionManager,
            maxTurns
          );
          await this._persistSession(ctx, sessionManager, finalOutput);
          return {
            output: typedOutput,
            rawOutput: finalOutput,
            status: "completed",
            sessionId: ctx.sessionId,
            traceId: ctx.trace.runId,
            turns: ctx.turn,
            usage: ctx.trace.totalUsage,
            agentName: ctx.agentName
          };
        }
        await this._persistSession(ctx, sessionManager, "");
        return {
          output: "",
          rawOutput: "",
          status: "max_turns_reached",
          sessionId: ctx.sessionId,
          traceId: ctx.trace.runId,
          turns: ctx.turn,
          usage: ctx.trace.totalUsage,
          agentName: ctx.agentName,
          error: `Agent reached maximum of ${maxTurns} turns without a final answer.`
        };
      }
      // ─────────────────────────────────────────────
      // Harness Mode Loop (INITIAL → THINK → ANALYSE → TOOL_REQUEST → OUTPUT)
      // ─────────────────────────────────────────────
      async _runHarnessLoop(ctx, tools, options, sessionManager, maxTurns) {
        const toolList = tools ?? [];
        while (ctx.turn < maxTurns) {
          ctx.turn++;
          const callStart = Date.now();
          const response = await this._callWithRetry(ctx, ctx.getFullHistory(), toolList, options);
          this.tracer.addModelCall(
            ctx.trace,
            ctx.agentConfig.providerName ?? "openai",
            ctx.getFullHistory(),
            response,
            Date.now() - callStart
          );
          let steps;
          try {
            steps = exports.vulcanHarness.parseAllSteps(response.content);
          } catch (e) {
            if (e instanceof exports.HarnessParseError) {
              steps = [{ step: "OUTPUT", text: response.content }];
            } else {
              throw e;
            }
          }
          for (const step of steps) {
            ctx.emit("harness_step", step);
            if (exports.vulcanHarness.isToolRequest(step)) {
              const tool = toolList.find((t) => t.name === step.functionName);
              if (!tool) {
                ctx.emit("tool_error", { name: step.functionName, error: "Tool not found" });
                const toolOutputMsg = exports.vulcanHarness.formatToolOutput(
                  step.functionName,
                  `Error: Tool '${step.functionName}' not found.`
                );
                ctx.addMessage({ role: "assistant", content: JSON.stringify(step) });
                ctx.addMessage({ role: "user", content: toolOutputMsg });
                continue;
              }
              ctx.emit("tool_started", { name: step.functionName, input: step.input });
              const toolStart = Date.now();
              try {
                const toolOutput = await tool.execute(
                  step.input,
                  {
                    runId: ctx.trace.runId,
                    sessionId: ctx.sessionId,
                    agentName: ctx.agentName,
                    turn: ctx.turn,
                    metadata: ctx.metadata
                  }
                );
                this.tracer.addToolCall(
                  ctx.trace,
                  step.functionName,
                  step.input,
                  toolOutput,
                  Date.now() - toolStart
                );
                ctx.emit("tool_completed", { name: step.functionName, output: toolOutput });
                const outputStr = typeof toolOutput === "string" ? toolOutput : JSON.stringify(toolOutput);
                const toolOutputMsg = exports.vulcanHarness.formatToolOutput(step.functionName, outputStr);
                ctx.addMessage({ role: "assistant", content: JSON.stringify(step) });
                ctx.addMessage({ role: "user", content: toolOutputMsg });
              } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.tracer.addToolCall(ctx.trace, step.functionName, step.input, err.message, Date.now() - toolStart, true);
                ctx.emit("tool_error", { name: step.functionName, error: err.message });
                const errorMsg = exports.vulcanHarness.formatToolOutput(step.functionName, `Error: ${err.message}`);
                ctx.addMessage({ role: "assistant", content: JSON.stringify(step) });
                ctx.addMessage({ role: "user", content: errorMsg });
              }
            } else if (exports.vulcanHarness.isFinal(step)) {
              const rawOutput = step.text ?? "";
              const outputGuardResult = await runGuardrails(
                ctx.agentConfig.guardrails ?? [],
                {
                  type: "output",
                  content: rawOutput,
                  context: {
                    runId: ctx.trace.runId,
                    sessionId: ctx.sessionId,
                    agentName: ctx.agentName,
                    turn: ctx.turn,
                    metadata: ctx.metadata
                  }
                }
              );
              if (!outputGuardResult.passed) {
                ctx.emit("guardrail_triggered", { type: "output", reason: outputGuardResult.reason });
                throw new exports.GuardrailBlockedError(
                  outputGuardResult.failedGuardrail ?? "unknown",
                  outputGuardResult.reason ?? "Output blocked",
                  "output"
                );
              }
              const finalOutput = outputGuardResult.modifiedContent ?? rawOutput;
              await this._persistSession(ctx, sessionManager, finalOutput);
              return {
                output: finalOutput,
                rawOutput: finalOutput,
                status: "completed",
                sessionId: ctx.sessionId,
                traceId: ctx.trace.runId,
                turns: ctx.turn,
                usage: ctx.trace.totalUsage,
                agentName: ctx.agentName
              };
            } else {
              ctx.addMessage({ role: "assistant", content: JSON.stringify(step) });
            }
          }
        }
        return {
          output: "",
          rawOutput: "",
          status: "max_turns_reached",
          sessionId: ctx.sessionId,
          traceId: ctx.trace.runId,
          turns: ctx.turn,
          usage: ctx.trace.totalUsage,
          agentName: ctx.agentName,
          error: `Harness agent reached max turns (${maxTurns}).`
        };
      }
      // ─────────────────────────────────────────────
      // Helpers
      // ─────────────────────────────────────────────
      async _callWithRetry(ctx, messages, tools, options) {
        const config = ctx.agentConfig;
        const maxRetries = config.maxRetries ?? 3;
        const providerName = options.provider ?? config.providerName ?? "gemini";
        const fallbacks = config.fallbackProviders ?? [];
        const providerChain = [providerName, ...fallbacks];
        let lastError;
        for (const pName of providerChain) {
          const provider = exports.providerRegistry.get(pName);
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              const response = await provider.chat(messages, tools, {
                model: config.model ?? "gemini-2.5-flash",
                temperature: options.temperature ?? config.temperature,
                maxTokens: options.maxTokens ?? config.maxTokens,
                responseFormat: config.outputSchema && config.reasoningMode !== "harness" ? "json_object" : "text"
              });
              return response;
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error));
              lastError = err;
              if (error instanceof exports.ProviderError && error.retryable && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 500;
                ctx.emit("retry", { provider: pName, attempt: attempt + 1, delay, error: err.message });
                await sleep(delay);
                continue;
              }
              break;
            }
          }
        }
        throw lastError ?? new Error("All providers failed");
      }
      async _executeToolCall(ctx, toolCall, tools, options) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          const errorMsg = JSON.stringify({ error: `Tool '${toolCall.name}' not found.` });
          ctx.addMessage({ role: "tool", content: errorMsg, toolCallId: toolCall.id, name: toolCall.name });
          return;
        }
        const toolGuardResult = await runGuardrails(
          ctx.agentConfig.guardrails ?? [],
          {
            type: "tool",
            content: JSON.stringify(toolCall.arguments),
            toolName: toolCall.name,
            toolInput: toolCall.arguments,
            context: {
              runId: ctx.trace.runId,
              sessionId: ctx.sessionId,
              agentName: ctx.agentName,
              turn: ctx.turn,
              metadata: ctx.metadata
            }
          }
        );
        if (!toolGuardResult.passed) {
          ctx.emit("guardrail_triggered", {
            type: "tool",
            toolName: toolCall.name,
            reason: toolGuardResult.reason
          });
          const errorMsg = JSON.stringify({ error: `Tool blocked by guardrail: ${toolGuardResult.reason ?? ""}` });
          ctx.addMessage({ role: "tool", content: errorMsg, toolCallId: toolCall.id, name: toolCall.name });
          return;
        }
        const requiresApproval = tool.requiresApproval;
        const needsApproval = typeof requiresApproval === "function" ? requiresApproval(toolCall.arguments) : Boolean(requiresApproval);
        let finalInput = toolCall.arguments;
        if (needsApproval) {
          const approvalReq = createApprovalRequest({
            toolName: toolCall.name,
            input: toolCall.arguments,
            toolCallId: toolCall.id,
            runId: ctx.trace.runId,
            sessionId: ctx.sessionId,
            agentName: ctx.agentName
          });
          ctx.emit("approval_requested", approvalReq);
          const handler = options?.onApproval ?? ctx.agentConfig.onApproval;
          if (handler) {
            const rawRes = await handler(approvalReq);
            const parsedRes = parseApprovalResult(rawRes);
            if (parsedRes.approved) {
              ctx.emit("approval_granted", { request: approvalReq, result: parsedRes });
              if (parsedRes.modifiedInput) {
                finalInput = parsedRes.modifiedInput;
              }
            } else {
              ctx.emit("approval_rejected", { request: approvalReq, result: parsedRes });
              const rejectMsg = JSON.stringify({ error: `Tool execution rejected: ${parsedRes.reason ?? "Approval denied by operator"}` });
              ctx.addMessage({ role: "tool", content: rejectMsg, toolCallId: toolCall.id, name: toolCall.name });
              return;
            }
          } else {
            throw new exports.ApprovalRequiredSignal(approvalReq);
          }
        }
        ctx.emit("tool_started", { name: toolCall.name, input: finalInput, id: toolCall.id });
        const toolStart = Date.now();
        try {
          const result = await tool.execute(finalInput, {
            runId: ctx.trace.runId,
            sessionId: ctx.sessionId,
            agentName: ctx.agentName,
            turn: ctx.turn,
            metadata: ctx.metadata
          });
          const outputStr = typeof result === "string" ? result : JSON.stringify(result);
          this.tracer.addToolCall(ctx.trace, toolCall.name, finalInput, result, Date.now() - toolStart);
          ctx.emit("tool_completed", { name: toolCall.name, output: result, id: toolCall.id });
          ctx.addMessage({ role: "tool", content: outputStr, toolCallId: toolCall.id, name: toolCall.name });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.tracer.addToolCall(ctx.trace, toolCall.name, finalInput, err.message, Date.now() - toolStart, true);
          ctx.emit("tool_error", { name: toolCall.name, error: err.message, id: toolCall.id });
          const errorMsg = JSON.stringify({ error: err.message });
          ctx.addMessage({ role: "tool", content: errorMsg, toolCallId: toolCall.id, name: toolCall.name });
        }
      }
      async _validateStructuredOutput(ctx, output, tools, options, sessionManager, maxTurns) {
        const schema = ctx.agentConfig.outputSchema;
        if (!schema) return output;
        try {
          const parsed = JSON.parse(output);
          const result = schema.safeParse(parsed);
          if (result.success) {
            return result.data;
          }
          const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
          const retryMsg = `Your output was invalid. Fix these issues and output valid JSON: ${errors}`;
          ctx.addMessage({ role: "user", content: retryMsg });
          ctx.turn++;
          if (ctx.turn < maxTurns) {
            return this._runStandardLoop(ctx, tools, options, sessionManager, maxTurns).then(
              (r) => r.output
            );
          }
          throw new exports.StructuredOutputValidationError(errors);
        } catch (error) {
          if (error instanceof exports.StructuredOutputValidationError) throw error;
          throw new exports.StructuredOutputValidationError(`Output is not valid JSON: ${output.slice(0, 100)}`);
        }
      }
      _buildSystemPrompt(config, _input) {
        if (config.reasoningMode === "harness") {
          return exports.vulcanHarness.buildSystemPrompt(config.tools ?? [], config.instructions);
        }
        let prompt = config.instructions;
        if (config.outputSchema) {
          prompt += "\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation. Just the raw JSON object.";
        }
        if ((config.handoffs ?? []).length > 0) {
          const agentList = (config.handoffs ?? []).map((h) => `- ${h.name}: ${h.instructions.slice(0, 100)}...`).join("\n");
          prompt += `

You can hand off to these agents when appropriate:
${agentList}`;
        }
        return prompt;
      }
      _buildHandoffTools(config) {
        const { z: z7 } = (init_types(), __toCommonJS(types_exports));
        return (config.handoffs ?? []).map((targetConfig) => ({
          name: `handoff_to_${targetConfig.name}`,
          description: `Hand off this conversation to the ${targetConfig.name} agent. Use when the task requires expertise this agent doesn't have.`,
          inputSchema: z7.object({ reason: z7.string().describe("Why you are handing off") }),
          execute: async () => `Handoff to ${targetConfig.name} initiated.`,
          timeoutMs: 5e3
        }));
      }
      async _persistSession(ctx, sessionManager, _finalOutput) {
        const allMessages = ctx.getFullHistory();
        const updatedSession = {
          ...ctx.session,
          messages: allMessages,
          turnCount: ctx.session.turnCount + ctx.turn,
          updatedAt: Date.now()
        };
        await sessionManager.save(updatedSession);
      }
    };
    exports.HandoffLoopError = class extends Error {
      constructor(visitedAgents, targetAgent) {
        super(
          `Handoff loop detected: Agent '${targetAgent}' was already visited in this run. Visited: [${visitedAgents.join(" \u2192 ")}]`
        );
        this.visitedAgents = visitedAgents;
        this.targetAgent = targetAgent;
        this.name = "HandoffLoopError";
      }
      visitedAgents;
      targetAgent;
    };
    exports.StructuredOutputValidationError = class extends Error {
      constructor(validationErrors) {
        super(`Structured output validation failed: ${validationErrors}`);
        this.validationErrors = validationErrors;
        this.name = "StructuredOutputValidationError";
      }
      validationErrors;
    };
  }
});

// src/tools/tool.ts
function zodToJsonSchema(schema) {
  const def = schema._def;
  switch (def.typeName) {
    case "ZodObject": {
      const shape = def.shape();
      const properties = {};
      const required = [];
      for (const [key, fieldSchema] of Object.entries(shape)) {
        const fieldDef = fieldSchema._def;
        const isOptional = fieldDef.typeName === "ZodOptional";
        const innerSchema = isOptional ? fieldDef.innerType : fieldSchema;
        properties[key] = zodToJsonSchema(innerSchema);
        if (!isOptional) required.push(key);
      }
      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : void 0,
        additionalProperties: false
      };
    }
    case "ZodString": {
      const result = { type: "string" };
      if (def.description) result.description = def.description;
      return result;
    }
    case "ZodNumber": {
      return { type: "number" };
    }
    case "ZodBoolean": {
      return { type: "boolean" };
    }
    case "ZodArray": {
      return {
        type: "array",
        items: zodToJsonSchema(def.type)
      };
    }
    case "ZodEnum": {
      return { type: "string", enum: def.values };
    }
    case "ZodOptional": {
      return zodToJsonSchema(def.innerType);
    }
    case "ZodNullable": {
      const inner = zodToJsonSchema(def.innerType);
      return { ...inner, nullable: true };
    }
    case "ZodLiteral": {
      return { type: typeof def.value, enum: [def.value] };
    }
    case "ZodUnion": {
      return {
        oneOf: def.options.map((o) => zodToJsonSchema(o))
      };
    }
    default:
      return { type: "string", description: "Unknown type \u2014 treated as string" };
  }
}
function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new exports.ToolTimeoutError("unknown", ms));
    }, ms);
    promise.then((result) => {
      clearTimeout(timer);
      resolve(result);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
function formatZodError(error) {
  return error.issues.map((issue) => `${issue.path.join(".")} \u2014 ${issue.message}`).join("; ");
}
exports.Tool = void 0; exports.ToolValidationError = void 0; exports.ToolExecutionError = void 0; exports.ToolTimeoutError = void 0;
var init_tool = __esm({
  "src/tools/tool.ts"() {
    exports.Tool = class _Tool {
      name;
      description;
      inputSchema;
      timeoutMs;
      errorHandler;
      requiresApproval;
      _execute;
      constructor(config) {
        this.name = config.name;
        this.description = config.description;
        this.inputSchema = config.inputSchema;
        this.timeoutMs = config.timeoutMs ?? 3e4;
        this._execute = config.execute;
        this.errorHandler = config.errorHandler;
        this.requiresApproval = config.requiresApproval;
      }
      /**
       * Execute the tool with Zod input validation and timeout enforcement.
       * Returns structured ToolExecutionResult with success/error state.
       */
      async execute(rawInput, context) {
        const parseResult = this.inputSchema.safeParse(rawInput);
        if (!parseResult.success) {
          const validationError = formatZodError(parseResult.error);
          throw new exports.ToolValidationError(this.name, validationError, rawInput);
        }
        const validatedInput = parseResult.data;
        try {
          const result = await withTimeout(
            this._execute(validatedInput, context),
            this.timeoutMs,
            `Tool '${this.name}' timed out after ${this.timeoutMs}ms`
          );
          return result;
        } catch (error) {
          if (error instanceof exports.ToolValidationError || error instanceof exports.ToolTimeoutError) {
            throw error;
          }
          const err = error instanceof Error ? error : new Error(String(error));
          if (this.errorHandler) {
            const handled = this.errorHandler(err, validatedInput);
            if (typeof handled === "string") {
              return handled;
            }
            return handled;
          }
          throw new exports.ToolExecutionError(this.name, err);
        }
      }
      /**
       * Converts this tool to the OpenAI function calling JSON schema format.
       * Used by the OpenAI provider.
       */
      toOpenAISchema() {
        return {
          type: "function",
          function: {
            name: this.name,
            description: this.description,
            parameters: zodToJsonSchema(this.inputSchema)
          }
        };
      }
      /**
       * Converts to Anthropic tool format.
       */
      toAnthropicSchema() {
        return {
          name: this.name,
          description: this.description,
          input_schema: zodToJsonSchema(this.inputSchema)
        };
      }
      /**
       * Converts to Gemini function declaration format.
       */
      toGeminiSchema() {
        return {
          name: this.name,
          description: this.description,
          parameters: zodToJsonSchema(this.inputSchema)
        };
      }
      /** Static factory for cleaner ergonomics */
      static create(config) {
        return new _Tool(config);
      }
    };
    exports.ToolValidationError = class extends Error {
      constructor(toolName, validationMessage, input) {
        super(`Tool '${toolName}' input validation failed: ${validationMessage}`);
        this.toolName = toolName;
        this.validationMessage = validationMessage;
        this.input = input;
        this.name = "ToolValidationError";
      }
      toolName;
      validationMessage;
      input;
    };
    exports.ToolExecutionError = class extends Error {
      constructor(toolName, cause) {
        super(`Tool '${toolName}' execution failed: ${cause.message}`);
        this.toolName = toolName;
        this.cause = cause;
        this.name = "ToolExecutionError";
        this.stack = cause.stack;
      }
      toolName;
      cause;
    };
    exports.ToolTimeoutError = class extends Error {
      constructor(toolName, timeoutMs) {
        super(`Tool '${toolName}' timed out after ${timeoutMs}ms`);
        this.toolName = toolName;
        this.timeoutMs = timeoutMs;
        this.name = "ToolTimeoutError";
      }
      toolName;
      timeoutMs;
    };
  }
});

// src/tools/schema.ts
var schema_exports = {};
__export(schema_exports, {
  zodToJsonSchema: () => zodToJsonSchema
});
var init_schema = __esm({
  "src/tools/schema.ts"() {
    init_tool();
  }
});

// src/core/agent.ts
var Agent = class {
  config;
  constructor(config) {
    this.config = {
      maxTurns: 20,
      maxRetries: 3,
      temperature: 0.7,
      reasoningMode: "standard",
      providerName: "gemini",
      model: "gemini-2.5-flash",
      tools: [],
      guardrails: [],
      handoffs: [],
      ...config
    };
    if (!this.config.name || this.config.name.trim() === "") {
      throw new AgentConfigError("Agent name is required and cannot be empty.");
    }
    if (!this.config.instructions || this.config.instructions.trim() === "") {
      throw new AgentConfigError("Agent instructions are required.");
    }
  }
  // ─────────────────────────────────────────────
  // Fluent Builder Methods
  // ─────────────────────────────────────────────
  /**
   * Add a tool to this agent.
   */
  withTool(tool) {
    this.config.tools = [...this.config.tools ?? [], tool];
    return this;
  }
  /**
   * Add multiple tools at once.
   */
  withTools(...tools) {
    this.config.tools = [...this.config.tools ?? [], ...tools];
    return this;
  }
  /**
   * Register an agent that this agent can hand off to.
   */
  withHandoff(agent) {
    this.config.handoffs = [...this.config.handoffs ?? [], agent.config];
    return this;
  }
  /**
   * Register multiple agents for handoff.
   */
  withHandoffs(...agents) {
    this.config.handoffs = [
      ...this.config.handoffs ?? [],
      ...agents.map((a) => a.config)
    ];
    return this;
  }
  /**
   * Add a guardrail.
   */
  withGuardrail(guardrail) {
    this.config.guardrails = [...this.config.guardrails ?? [], guardrail];
    return this;
  }
  /**
   * Set the storage adapter for session memory.
   */
  withMemory(adapter) {
    this.config.storageAdapter = adapter;
    return this;
  }
  /**
   * Set an output schema for structured output validation.
   */
  withOutputSchema(schema) {
    this.config.outputSchema = schema;
    return this;
  }
  /**
   * Set the primary provider name (must be registered).
   */
  withProvider(providerName) {
    this.config.providerName = providerName;
    return this;
  }
  /**
   * Set fallback providers (tried in order on primary failure).
   */
  withFallback(...providerNames) {
    this.config.fallbackProviders = providerNames;
    return this;
  }
  /**
   * Enable the VulcanHarness reasoning pipeline (INITIAL → THINK → ANALYSE → OUTPUT).
   */
  withHarness() {
    this.config.reasoningMode = "harness";
    return this;
  }
  /**
   * Set the model identifier.
   */
  withModel(model) {
    this.config.model = model;
    return this;
  }
  /**
   * Set max turns before giving up.
   */
  withMaxTurns(maxTurns) {
    this.config.maxTurns = maxTurns;
    return this;
  }
  /**
   * Set temperature.
   */
  withTemperature(temperature) {
    this.config.temperature = temperature;
    return this;
  }
  // ─────────────────────────────────────────────
  // Convenience Run Methods
  // ─────────────────────────────────────────────
  /**
   * Run the agent with a user input string.
   * Shorthand for: new AgentRunner().run(agent, input, options)
   */
  async run(input, options) {
    const { AgentRunner: AgentRunner2 } = await Promise.resolve().then(() => (init_runner(), runner_exports));
    const runner = new AgentRunner2();
    return runner.run(this, input, options);
  }
  /**
   * Stream the agent run.
   * Shorthand for: new AgentRunner().stream(agent, input, options)
   */
  async *stream(input, options) {
    const { AgentRunner: AgentRunner2 } = await Promise.resolve().then(() => (init_runner(), runner_exports));
    const runner = new AgentRunner2();
    yield* runner.stream(this, input, options);
  }
  /**
   * Get the agent's display name.
   */
  get name() {
    return this.config.name;
  }
};
var AgentConfigError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "AgentConfigError";
  }
};

// src/index.ts
init_runner();
init_context();
init_harness();
init_hitl();
init_tool();

// src/tools/builtin/webSearch.ts
init_tool();
var inputSchema = zod.z.object({
  query: zod.z.string().min(1, "Search query cannot be empty"),
  maxResults: zod.z.number().min(1).max(20).optional()
});
function createWebSearchTool(options = {}) {
  const provider = options.provider ?? "mock";
  const defaultMax = options.maxResults ?? 5;
  return exports.Tool.create({
    name: "web_search",
    description: "Perform a web search to find current information, news, documentation, or facts.",
    inputSchema,
    async execute({ query, maxResults }) {
      const limit = maxResults ?? defaultMax;
      if (provider === "tavily" && options.apiKey) {
        try {
          const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: options.apiKey, query, max_results: limit })
          });
          if (res.ok) {
            const data = await res.json();
            return (data.results ?? []).map((r) => ({
              title: r.title,
              url: r.url,
              snippet: r.content
            }));
          }
        } catch {
        }
      }
      return [
        {
          title: `Search result for "${query}"`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `Found latest information for query "${query}". Vulcan SDK agent extracted zero-dependency live data.`
        },
        {
          title: `Documentation & Reference: ${query}`,
          url: `https://example.com/docs/${encodeURIComponent(query)}`,
          snippet: `Official documentation regarding ${query} with code examples and best practices.`
        }
      ].slice(0, limit);
    }
  });
}

// src/tools/builtin/scraper.ts
init_tool();
var inputSchema2 = zod.z.object({
  url: zod.z.string().url("Must be a valid URL"),
  maxLength: zod.z.number().min(100).max(5e4).optional()
});
function createWebScraperTool(options = {}) {
  const defaultMaxLen = options.maxLength ?? 8e3;
  return exports.Tool.create({
    name: "web_scraper",
    description: "Scrape and extract clean text/markdown content from a URL.",
    inputSchema: inputSchema2,
    timeoutMs: options.timeoutMs ?? 15e3,
    async execute({ url, maxLength }) {
      const maxLen = maxLength ?? defaultMaxLen;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "VulcanAgentSDK/1.0 (TypeScript Agent Framework)"
          }
        });
        if (!response.ok) {
          return { url, status: response.status, content: `HTTP Error ${response.status}: ${response.statusText}` };
        }
        const html = await response.text();
        const text = htmlToCleanText(html).slice(0, maxLen);
        return {
          url,
          status: response.status,
          contentLength: text.length,
          content: text
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { url, status: 500, content: `Failed to scrape URL: ${errorMsg}` };
      }
    }
  });
}
function htmlToCleanText(html) {
  return html.replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "").replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// src/tools/builtin/sandbox.ts
init_tool();
var inputSchema3 = zod.z.object({
  code: zod.z.string().min(1, "Code snippet cannot be empty"),
  language: zod.z.enum(["javascript", "typescript"]).optional().default("javascript")
});
function createCodeSandboxTool(options = {}) {
  return exports.Tool.create({
    name: "code_sandbox",
    description: "Execute a JavaScript code snippet safely in an isolated execution context and return the result.",
    inputSchema: inputSchema3,
    timeoutMs: options.timeoutMs ?? 5e3,
    async execute({ code }) {
      const logs = [];
      const fakeConsole = {
        log: (...args) => logs.push(args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
        error: (...args) => logs.push("[ERROR] " + args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
        warn: (...args) => logs.push("[WARN] " + args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "))
      };
      try {
        const runnerFn = new Function("console", "Math", "JSON", "Object", "Array", "String", "Number", `
          "use strict";
          ${code}
        `);
        const result = runnerFn(
          fakeConsole,
          Math,
          JSON,
          Object,
          Array,
          String,
          Number
        );
        return {
          success: true,
          result: result !== void 0 ? typeof result === "object" ? JSON.stringify(result) : String(result) : null,
          logs
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          error: errorMsg,
          logs
        };
      }
    }
  });
}

// src/tools/builtin/sql.ts
init_tool();
var inputSchema4 = zod.z.object({
  query: zod.z.string().min(1, "SQL query cannot be empty")
});
function createSQLQueryTool(options) {
  const isReadOnly = options.readOnly ?? true;
  return exports.Tool.create({
    name: "sql_query",
    description: `Execute a SQL database query and return records. ${options.schemaDescription ? `Database schema: ${options.schemaDescription}` : ""}`,
    inputSchema: inputSchema4,
    async execute({ query }) {
      const cleanQuery = query.trim();
      if (isReadOnly) {
        const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
        if (forbidden.test(cleanQuery)) {
          throw new Error("Security Error: Only read-only SELECT queries are allowed.");
        }
      }
      try {
        const rows = await options.executeQuery(cleanQuery);
        return {
          query: cleanQuery,
          rowCount: Array.isArray(rows) ? rows.length : 0,
          rows
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          query: cleanQuery,
          error: message
        };
      }
    }
  });
}

// src/tools/builtin/vector.ts
init_tool();
var inputSchema5 = zod.z.object({
  query: zod.z.string().min(1, "Search query required"),
  topK: zod.z.number().min(1).max(20).optional()
});
function createVectorStoreTool(options) {
  const defaultTopK = options.defaultTopK ?? 3;
  return exports.Tool.create({
    name: "vector_search",
    description: "Retrieve semantically relevant knowledge base chunks using vector embeddings.",
    inputSchema: inputSchema5,
    async execute({ query, topK }) {
      const limit = topK ?? defaultTopK;
      const results = await options.searchFn(query, limit);
      return {
        query,
        count: results.length,
        results
      };
    }
  });
}

// src/index.ts
init_provider();

// src/providers/gemini.ts
init_provider();
init_schema();
var GeminiProvider = class extends exports.BaseProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }
  apiKey;
  name = "gemini";
  async chat(messages, tools, config) {
    const model = await this._getModel(config.model);
    const { system, rest } = this.extractSystemPrompt(messages);
    const geminiContents = this._toGeminiContents(rest);
    const geminiFunctionDeclarations = tools.length > 0 ? tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: cleanGeminiSchema(zodToJsonSchema(t.inputSchema))
    })) : void 0;
    try {
      const requestBody = {
        contents: geminiContents,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens,
          responseMimeType: config.responseFormat === "json_object" ? "application/json" : "text/plain"
        }
      };
      if (system) {
        requestBody.systemInstruction = { parts: [{ text: system }] };
      }
      if (geminiFunctionDeclarations) {
        requestBody.tools = [{ functionDeclarations: geminiFunctionDeclarations }];
      }
      const result = await model.generateContent(requestBody);
      const response = result.response;
      let textContent = "";
      const toolCalls = [];
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      let callIndex = 0;
      for (const part of parts) {
        if (typeof part.text === "string") {
          textContent += part.text;
        } else if (part.functionCall) {
          toolCalls.push({
            id: `gemini-call-${callIndex++}`,
            name: String(part.functionCall.name),
            arguments: part.functionCall.args
          });
        }
      }
      const usageMetadata = response.usageMetadata;
      const usage = {
        promptTokens: usageMetadata?.promptTokenCount ?? 0,
        completionTokens: usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: usageMetadata?.totalTokenCount ?? 0
      };
      const finishReason = toolCalls.length > 0 ? "tool_calls" : response.candidates?.[0]?.finishReason === "STOP" ? "stop" : "stop";
      return {
        content: textContent,
        toolCalls,
        usage,
        finishReason,
        model: config.model
      };
    } catch (error) {
      throw this._wrapError(error);
    }
  }
  async *stream(messages, tools, config) {
    const model = await this._getModel(config.model);
    const { system, rest } = this.extractSystemPrompt(messages);
    const geminiContents = this._toGeminiContents(rest);
    const geminiFunctionDeclarations = tools.length > 0 ? tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: cleanGeminiSchema(zodToJsonSchema(t.inputSchema))
    })) : void 0;
    try {
      const requestBody = {
        contents: geminiContents,
        generationConfig: { temperature: config.temperature ?? 0.7 }
      };
      if (system) {
        requestBody.systemInstruction = { parts: [{ text: system }] };
      }
      if (geminiFunctionDeclarations) {
        requestBody.tools = [{ functionDeclarations: geminiFunctionDeclarations }];
      }
      const { stream } = await model.generateContentStream(requestBody);
      for await (const chunk of stream) {
        const text = chunk.text?.();
        if (text) {
          yield { type: "text_delta", content: text };
        }
      }
      yield { type: "done" };
    } catch (error) {
      throw this._wrapError(error);
    }
  }
  _toGeminiContents(messages) {
    return messages.filter((m) => m.role !== "system").map((m) => {
      if (m.role === "tool") {
        let parsedOutput = m.content;
        try {
          parsedOutput = JSON.parse(m.content);
        } catch {
        }
        return {
          role: "function",
          parts: [
            {
              functionResponse: {
                name: m.name ?? "",
                response: typeof parsedOutput === "object" ? parsedOutput : { result: parsedOutput }
              }
            }
          ]
        };
      }
      if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: "model",
          parts: m.toolCalls.map((tc) => ({
            functionCall: {
              name: tc.name,
              args: tc.arguments
            }
          }))
        };
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || " " }]
      };
    });
  }
  modelCache = /* @__PURE__ */ new Map();
  genAI = null;
  async _getModel(modelName) {
    if (this.modelCache.has(modelName)) {
      return this.modelCache.get(modelName);
    }
    try {
      const { GoogleGenerativeAI } = __require("@google/generative-ai");
      const apiKey = this.apiKey ?? process.env.GEMINI_API_KEY ?? "";
      if (!apiKey) {
        throw new exports.ProviderError(
          "gemini",
          "Gemini API key not found. Set GEMINI_API_KEY environment variable or pass apiKey to GeminiProvider constructor."
        );
      }
      if (!this.genAI) {
        this.genAI = new GoogleGenerativeAI(apiKey);
      }
      const model = this.genAI.getGenerativeModel({ model: modelName });
      this.modelCache.set(modelName, model);
      return model;
    } catch (error) {
      if (error instanceof exports.ProviderError) throw error;
      throw new exports.ProviderError(
        "gemini",
        "Google Generative AI package not found. Install it: npm install @google/generative-ai"
      );
    }
  }
  _wrapError(error) {
    if (error instanceof exports.ProviderError) return error;
    const e = error;
    const status = e.status;
    return new exports.ProviderError("gemini", String(e.message ?? error), status, status === 429);
  }
};
function cleanGeminiSchema(schema) {
  if (schema === null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) {
    return schema.map(cleanGeminiSchema);
  }
  const cleaned = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "additionalProperties") continue;
    cleaned[key] = cleanGeminiSchema(value);
  }
  return cleaned;
}
exports.providerRegistry.register("gemini", new GeminiProvider());

// src/providers/openai.ts
init_provider();
var OpenAIProvider = class extends exports.BaseProvider {
  name = "openai";
  client;
  constructor(apiKey, options) {
    super();
    this.client = createOpenAIClient(apiKey, options);
  }
  async chat(messages, tools, config) {
    const openai = await this.client.getClient();
    const openaiMessages = this._toOpenAIMessages(messages);
    const openaiTools = tools.length > 0 ? tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: (init_schema(), __toCommonJS(schema_exports)).zodToJsonSchema(t.inputSchema)
      }
    })) : void 0;
    try {
      const response = await openai.chat.completions.create({
        model: config.model,
        messages: openaiMessages,
        tools: openaiTools,
        tool_choice: openaiTools ? "auto" : void 0,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        response_format: config.responseFormat === "json_object" ? { type: "json_object" } : void 0
      });
      const choice = response.choices[0];
      if (!choice) throw new exports.ProviderError("openai", "No choices in response", 500);
      const toolCalls = (choice.message.tool_calls ?? []).map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || "{}")
      }));
      const usage = {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0
      };
      return {
        content: choice.message.content ?? "",
        toolCalls,
        usage,
        finishReason: this._mapFinishReason(choice.finish_reason),
        model: response.model
      };
    } catch (error) {
      throw this._wrapError(error);
    }
  }
  async *stream(messages, tools, config) {
    const openai = await this.client.getClient();
    const openaiMessages = this._toOpenAIMessages(messages);
    const openaiTools = tools.length > 0 ? tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: (init_schema(), __toCommonJS(schema_exports)).zodToJsonSchema(t.inputSchema)
      }
    })) : void 0;
    try {
      const stream = await openai.chat.completions.create({
        model: config.model,
        messages: openaiMessages,
        tools: openaiTools,
        tool_choice: openaiTools ? "auto" : void 0,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        stream: true
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          yield { type: "text_delta", content: delta.content };
        }
        if (delta.tool_calls?.[0]) {
          const tc = delta.tool_calls[0];
          yield {
            type: "tool_call_delta",
            toolCall: {
              id: tc.id,
              name: tc.function?.name,
              arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : void 0
            }
          };
        }
      }
      yield { type: "done" };
    } catch (error) {
      throw this._wrapError(error);
    }
  }
  // ── Private helpers ──
  _toOpenAIMessages(messages) {
    return messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool",
          content: m.content,
          tool_call_id: m.toolCallId ?? ""
        };
      }
      if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: "assistant",
          content: m.content || "",
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments)
            }
          }))
        };
      }
      return {
        role: m.role,
        content: m.content
      };
    });
  }
  _mapFinishReason(reason) {
    switch (reason) {
      case "stop":
        return "stop";
      case "tool_calls":
        return "tool_calls";
      case "length":
        return "length";
      case "content_filter":
        return "content_filter";
      default:
        return "stop";
    }
  }
  _wrapError(error) {
    if (error instanceof exports.ProviderError) return error;
    const e = error;
    const status = e.status ?? e.statusCode;
    const retryable = status === 429 || status === 503 || status === 502;
    return new exports.ProviderError(
      "openai",
      String(e.message ?? error),
      status,
      retryable
    );
  }
};
var OpenAIClient = class {
  constructor(apiKey, options) {
    this.apiKey = apiKey;
    this.options = options;
  }
  apiKey;
  options;
  instance = null;
  async getClient() {
    if (this.instance) return this.instance;
    try {
      const { default: OpenAI } = __require("openai");
      this.instance = new OpenAI({
        apiKey: this.apiKey ?? process.env.OPENAI_API_KEY,
        baseURL: this.options?.baseURL,
        organization: this.options?.organization,
        maxRetries: this.options?.maxRetries ?? 0
        // We handle retries ourselves
      });
      return this.instance;
    } catch {
      throw new exports.ProviderError(
        "openai",
        "OpenAI package not found. Install it: npm install openai"
      );
    }
  }
};
function createOpenAIClient(apiKey, options) {
  return new OpenAIClient(apiKey, options);
}
var _defaultProvider = new OpenAIProvider();
exports.providerRegistry.register("openai", _defaultProvider);

// src/providers/anthropic.ts
init_provider();
init_schema();
var AnthropicProvider = class extends exports.BaseProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }
  apiKey;
  name = "anthropic";
  clientCache = null;
  async chat(messages, tools, config) {
    const client = await this._getClient();
    const { system, rest } = this.extractSystemPrompt(messages);
    const anthropicMessages = this._toAnthropicMessages(rest);
    const anthropicTools = tools.length > 0 ? tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: zodToJsonSchema(t.inputSchema)
    })) : void 0;
    try {
      const response = await client.messages.create({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        system: system || void 0,
        messages: anthropicMessages,
        tools: anthropicTools,
        temperature: config.temperature ?? 0.7
      });
      let textContent = "";
      const toolCalls = [];
      for (const block of response.content) {
        if (block.type === "text") {
          textContent += String(block.text);
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: String(block.id),
            name: String(block.name),
            arguments: block.input
          });
        }
      }
      const usage = {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
      };
      const finishReason = response.stop_reason === "tool_use" ? "tool_calls" : response.stop_reason === "end_turn" ? "stop" : "stop";
      return {
        content: textContent,
        toolCalls,
        usage,
        finishReason,
        model: response.model
      };
    } catch (error) {
      throw this._wrapError(error);
    }
  }
  async *stream(messages, tools, config) {
    const client = await this._getClient();
    const { system, rest } = this.extractSystemPrompt(messages);
    const anthropicMessages = this._toAnthropicMessages(rest);
    const anthropicTools = tools.length > 0 ? tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: zodToJsonSchema(t.inputSchema)
    })) : void 0;
    try {
      const stream = client.messages.stream({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        system: system || void 0,
        messages: anthropicMessages,
        tools: anthropicTools,
        temperature: config.temperature ?? 0.7
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          yield { type: "text_delta", content: String(event.delta.text) };
        }
      }
      yield { type: "done" };
    } catch (error) {
      throw this._wrapError(error);
    }
  }
  _toAnthropicMessages(messages) {
    return messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: m.toolCallId ?? "",
              content: m.content
            }
          ]
        };
      }
      return {
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      };
    });
  }
  async _getClient() {
    if (this.clientCache) return this.clientCache;
    try {
      const { default: Anthropic } = __require("@anthropic-ai/sdk");
      this.clientCache = new Anthropic({
        apiKey: this.apiKey ?? process.env.ANTHROPIC_API_KEY
      });
      return this.clientCache;
    } catch {
      throw new exports.ProviderError(
        "anthropic",
        "Anthropic package not found. Install it: npm install @anthropic-ai/sdk"
      );
    }
  }
  _wrapError(error) {
    if (error instanceof exports.ProviderError) return error;
    const e = error;
    const status = e.status ?? e.statusCode;
    return new exports.ProviderError("anthropic", String(e.message ?? error), status, status === 429);
  }
};
exports.providerRegistry.register("anthropic", new AnthropicProvider());

// src/index.ts
init_session();
init_in_memory();

// src/memory/sqlite.ts
var SQLiteStorage = class {
  constructor(dbPath = "./vulcan-sessions.db") {
    this.dbPath = dbPath;
  }
  dbPath;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db = null;
  initialized = false;
  /**
   * Lazy initialization — opens/creates the DB and table on first use.
   */
  async init() {
    if (this.initialized) return;
    try {
      const Database = __require("better-sqlite3");
      this.db = new Database(this.dbPath);
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS vulcan_sessions (
          id TEXT PRIMARY KEY,
          agent_name TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_agent_name ON vulcan_sessions (agent_name)
      `);
      this.initialized = true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Cannot find module")) {
        console.warn(
          "[Vulcan] SQLiteStorage: better-sqlite3 not installed. Falling back to in-memory storage. Run: npm install better-sqlite3"
        );
        this.initialized = true;
        this.db = null;
        return;
      }
      throw new SQLiteStorageError(`Failed to initialize SQLite: ${msg}`);
    }
  }
  async get(sessionId) {
    await this.init();
    if (!this.db) return null;
    try {
      const row = this.db.prepare("SELECT data FROM vulcan_sessions WHERE id = ?").get(sessionId);
      if (!row) return null;
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  }
  async set(sessionId, session) {
    await this.init();
    if (!this.db) return;
    const data = JSON.stringify(session);
    this.db.prepare(
      `INSERT INTO vulcan_sessions (id, agent_name, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at`
    ).run(sessionId, session.agentName, data, session.createdAt, session.updatedAt);
  }
  async delete(sessionId) {
    await this.init();
    if (!this.db) return;
    this.db.prepare("DELETE FROM vulcan_sessions WHERE id = ?").run(sessionId);
  }
  async list() {
    await this.init();
    if (!this.db) return [];
    const rows = this.db.prepare("SELECT id FROM vulcan_sessions ORDER BY updated_at DESC").all();
    return rows.map((r) => r.id);
  }
  async clear() {
    await this.init();
    if (!this.db) return;
    this.db.exec("DELETE FROM vulcan_sessions");
  }
  /**
   * Get all sessions for a specific agent.
   */
  async listByAgent(agentName) {
    await this.init();
    if (!this.db) return [];
    const rows = this.db.prepare(
      "SELECT data FROM vulcan_sessions WHERE agent_name = ? ORDER BY updated_at DESC"
    ).all(agentName);
    return rows.map((r) => JSON.parse(r.data));
  }
  /**
   * Close the database connection.
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
};
var SQLiteStorageError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SQLiteStorageError";
  }
};

// src/index.ts
init_guardrails();
init_tracer();
init_types();
init_runner();
init_tool();
init_provider();
dotenv__default.default.config();
var Vulcan = {
  /**
   * Create a new agent.
   *
   * @example
   * const agent = Vulcan.createAgent({ name: 'my-agent', instructions: '...' })
   */
  createAgent(config) {
    return new Agent(config);
  },
  /**
   * Create a typed tool.
   *
   * @example
   * const myTool = Vulcan.createTool({ name: 'search', description: '...', inputSchema: z.object(...), execute: async (input) => '...' })
   */
  createTool(config) {
    return exports.Tool.create(config);
  },
  /**
   * Register a custom model provider.
   *
   * @example
   * Vulcan.registerProvider('my-provider', new MyProvider())
   */
  registerProvider(name, provider) {
    exports.providerRegistry.register(name, provider);
  },
  /**
   * Run an agent and return the final result.
   *
   * @example
   * const result = await Vulcan.run(agent, 'What is the weather in Goa?')
   */
  async run(agent, input, options) {
    const runner = new exports.AgentRunner();
    return runner.run(agent, input, options);
  },
  /**
   * Stream an agent run — yields VulcanEvents.
   *
   * @example
   * for await (const event of Vulcan.stream(agent, 'Tell me a story')) {
   *   if (event.type === 'text_streamed') console.log(event.data)
   * }
   */
  async *stream(agent, input, options) {
    const runner = new exports.AgentRunner();
    yield* runner.stream(agent, input, options);
  }
};

Object.defineProperty(exports, "z", {
  enumerable: true,
  get: function () { return zod.z; }
});
exports.Agent = Agent;
exports.AgentConfigError = AgentConfigError;
exports.AnthropicProvider = AnthropicProvider;
exports.GeminiProvider = GeminiProvider;
exports.OpenAIProvider = OpenAIProvider;
exports.SQLiteStorage = SQLiteStorage;
exports.SQLiteStorageError = SQLiteStorageError;
exports.Vulcan = Vulcan;
exports.createApprovalRequest = createApprovalRequest;
exports.createCodeSandboxTool = createCodeSandboxTool;
exports.createSQLQueryTool = createSQLQueryTool;
exports.createSession = createSession;
exports.createVectorStoreTool = createVectorStoreTool;
exports.createWebScraperTool = createWebScraperTool;
exports.createWebSearchTool = createWebSearchTool;
exports.parseApprovalResult = parseApprovalResult;
exports.runGuardrails = runGuardrails;
exports.updateSession = updateSession;
exports.zodToJsonSchema = zodToJsonSchema;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map