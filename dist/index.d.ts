import { ZodSchema } from 'zod';
export { ZodSchema, z } from 'zod';
import { EventEmitter } from 'events';

type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
interface Message {
    role: MessageRole;
    content: string;
    /** Only present when role === 'tool' */
    toolCallId?: string;
    /** Tool name — only present when role === 'tool' */
    name?: string;
    /** Tool calls made by the assistant — only present when role === 'assistant' */
    toolCalls?: ToolCall[];
}
interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
interface ToolResult {
    toolCallId: string;
    name: string;
    output: string;
    isError: boolean;
}
interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
type FinishReason = 'stop' | 'tool_calls' | 'length' | 'content_filter' | 'error';
interface ModelResponse {
    content: string;
    toolCalls: ToolCall[];
    usage: TokenUsage;
    finishReason: FinishReason;
    model: string;
}
interface StreamChunk {
    type: 'text_delta' | 'tool_call_delta' | 'done';
    content?: string;
    toolCall?: Partial<ToolCall>;
}
interface ProviderCallConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    systemPrompt?: string;
    responseFormat?: 'text' | 'json_object';
    timeoutMs?: number;
}
type HarnessStep = 'INITIAL' | 'THINK' | 'ANALYSE' | 'TOOL_REQUEST' | 'OUTPUT';
interface HarnessMessage {
    step: HarnessStep;
    text?: string;
    functionName?: string;
    input?: unknown;
}
type ReasoningMode = 'standard' | 'harness';
interface ApprovalRequest {
    id: string;
    toolName: string;
    input: unknown;
    toolCallId: string;
    runId: string;
    sessionId: string;
    agentName: string;
    timestamp: number;
}
interface ApprovalResult {
    approved: boolean;
    reason?: string;
    modifiedInput?: unknown;
}
type ApprovalHandler = (request: ApprovalRequest) => Promise<ApprovalResult | boolean> | ApprovalResult | boolean;
type RunStatus = 'running' | 'completed' | 'failed' | 'max_turns_reached' | 'handoff' | 'guardrail_blocked' | 'requires_approval';
interface RunResult<T = string> {
    output: T;
    rawOutput: string;
    status: RunStatus;
    sessionId: string;
    traceId: string;
    turns: number;
    usage: TokenUsage;
    agentName: string;
    error?: string;
    pendingApproval?: ApprovalRequest;
}
interface RunOptions {
    sessionId?: string;
    maxTurns?: number;
    temperature?: number;
    maxTokens?: number;
    metadata?: Record<string, unknown>;
    /** Override the agent's provider for this run */
    provider?: string;
    /** Human-in-the-Loop approval callback for sensitive tool calls */
    onApproval?: ApprovalHandler;
}
type VulcanEventType = 'text_streamed' | 'tool_started' | 'tool_completed' | 'tool_error' | 'approval_requested' | 'approval_granted' | 'approval_rejected' | 'handoff_started' | 'handoff_completed' | 'guardrail_triggered' | 'guardrail_passed' | 'harness_step' | 'model_called' | 'retry' | 'run_started' | 'run_completed' | 'run_failed';
interface VulcanEvent {
    type: VulcanEventType;
    timestamp: number;
    runId: string;
    agentName: string;
    data: unknown;
}
interface Session {
    id: string;
    agentName: string;
    messages: Message[];
    metadata: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
    turnCount: number;
}
interface StorageAdapter {
    get(sessionId: string): Promise<Session | null>;
    set(sessionId: string, session: Session): Promise<void>;
    delete(sessionId: string): Promise<void>;
    list(): Promise<string[]>;
    clear(): Promise<void>;
}
type GuardrailType = 'input' | 'output' | 'tool';
interface GuardrailPayload {
    type: GuardrailType;
    content: string;
    toolName?: string;
    toolInput?: unknown;
    context: RunContextLite;
}
interface GuardrailResult {
    passed: boolean;
    reason?: string;
    /** If present, replaces the original content */
    modifiedContent?: string;
}
interface Guardrail {
    name: string;
    type: GuardrailType | GuardrailType[];
    check(payload: GuardrailPayload): Promise<GuardrailResult>;
}
interface ModelCallRecord {
    id: string;
    model: string;
    provider: string;
    requestMessages: Message[];
    response: ModelResponse;
    durationMs: number;
    timestamp: number;
}
interface ToolCallRecord {
    id: string;
    name: string;
    input: unknown;
    output: unknown;
    isError: boolean;
    durationMs: number;
    timestamp: number;
}
interface HandoffRecord {
    from: string;
    to: string;
    turn: number;
    timestamp: number;
}
interface ErrorRecord {
    message: string;
    stack?: string;
    timestamp: number;
}
interface Trace {
    runId: string;
    agentName: string;
    sessionId: string;
    startTime: number;
    endTime?: number;
    modelCalls: ModelCallRecord[];
    toolCalls: ToolCallRecord[];
    handoffs: HandoffRecord[];
    errors: ErrorRecord[];
    totalUsage: TokenUsage;
    status?: RunStatus;
    output?: unknown;
    metadata?: Record<string, unknown>;
}
interface RunContextLite {
    runId: string;
    sessionId: string;
    agentName: string;
    turn: number;
    metadata: Record<string, unknown>;
}
interface ToolDefinition<TInput = unknown, TOutput = unknown> {
    name: string;
    description: string;
    inputSchema: ZodSchema<TInput>;
    execute(input: TInput, context: RunContextLite): Promise<TOutput>;
    errorHandler?(error: Error, input: TInput): TOutput | string;
    timeoutMs?: number;
    /** Require Human-in-the-Loop approval before executing this tool */
    requiresApproval?: boolean | ((input: any) => boolean);
}
/**
 * ToolConfig — the configuration object passed to Tool.create().
 * Identical to ToolDefinition but with the execute fn allowed inline.
 */
interface ToolConfig$1<TInput = unknown, TOutput = unknown> {
    name: string;
    description: string;
    inputSchema: ZodSchema<TInput>;
    execute: (input: TInput, context: RunContextLite) => Promise<TOutput>;
    errorHandler?: (error: Error, input: TInput) => TOutput | string;
    timeoutMs?: number;
    /** Require Human-in-the-Loop approval before executing this tool */
    requiresApproval?: boolean | ((input: any) => boolean);
}
interface AgentConfig {
    /** Unique agent name — used for handoffs and tracing */
    name: string;
    /** System instructions for the agent */
    instructions: string;
    /** Model identifier (e.g. 'gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'claude-3-5-sonnet') */
    model?: string;
    /** Provider name — must be registered in ProviderRegistry */
    providerName?: string;
    /** Fallback provider names (tried in order on error) */
    fallbackProviders?: string[];
    /** Tools available to this agent */
    tools?: ToolDefinition[];
    /** Agents this agent can hand off to */
    handoffs?: AgentConfig[];
    /** Guardrails applied to this agent */
    guardrails?: Guardrail[];
    /** Zod schema for structured output validation */
    outputSchema?: ZodSchema;
    /** Max turns before stopping (default: 20) */
    maxTurns?: number;
    /** Max retries on provider failure (default: 3) */
    maxRetries?: number;
    /** Storage adapter for session memory */
    storageAdapter?: StorageAdapter;
    /** Reasoning mode: 'standard' (default) or 'harness' (CoT pipeline) */
    reasoningMode?: ReasoningMode;
    /** Temperature (default: 0.7) */
    temperature?: number;
    /** Max tokens per response */
    maxTokens?: number;
    /** Default Human-in-the-Loop approval handler for this agent */
    onApproval?: ApprovalHandler;
}

declare class Agent {
    readonly config: AgentConfig;
    constructor(config: AgentConfig);
    /**
     * Add a tool to this agent.
     */
    withTool(tool: ToolDefinition): this;
    /**
     * Add multiple tools at once.
     */
    withTools(...tools: ToolDefinition[]): this;
    /**
     * Register an agent that this agent can hand off to.
     */
    withHandoff(agent: Agent): this;
    /**
     * Register multiple agents for handoff.
     */
    withHandoffs(...agents: Agent[]): this;
    /**
     * Add a guardrail.
     */
    withGuardrail(guardrail: Guardrail): this;
    /**
     * Set the storage adapter for session memory.
     */
    withMemory(adapter: StorageAdapter): this;
    /**
     * Set an output schema for structured output validation.
     */
    withOutputSchema<T>(schema: ZodSchema<T>): this;
    /**
     * Set the primary provider name (must be registered).
     */
    withProvider(providerName: string): this;
    /**
     * Set fallback providers (tried in order on primary failure).
     */
    withFallback(...providerNames: string[]): this;
    /**
     * Enable the VulcanHarness reasoning pipeline (INITIAL → THINK → ANALYSE → OUTPUT).
     */
    withHarness(): this;
    /**
     * Set the model identifier.
     */
    withModel(model: string): this;
    /**
     * Set max turns before giving up.
     */
    withMaxTurns(maxTurns: number): this;
    /**
     * Set temperature.
     */
    withTemperature(temperature: number): this;
    /**
     * Run the agent with a user input string.
     * Shorthand for: new AgentRunner().run(agent, input, options)
     */
    run<T = string>(input: string, options?: RunOptions): Promise<RunResult<T>>;
    /**
     * Stream the agent run.
     * Shorthand for: new AgentRunner().stream(agent, input, options)
     */
    stream(input: string, options?: RunOptions): AsyncGenerator<VulcanEvent>;
    /**
     * Get the agent's display name.
     */
    get name(): string;
}
declare class AgentConfigError extends Error {
    constructor(message: string);
}

declare class VulcanTracer {
    private readonly traces;
    /**
     * Start a new trace for a run.
     */
    startRun(runId: string, agentName: string, sessionId: string): Trace;
    /**
     * Record a model API call.
     */
    addModelCall(trace: Trace, providerName: string, requestMessages: Message[], response: ModelResponse, durationMs: number): void;
    /**
     * Record a tool execution.
     */
    addToolCall(trace: Trace, toolName: string, input: unknown, output: unknown, durationMs: number, isError?: boolean): void;
    /**
     * Record an agent handoff.
     */
    addHandoff(trace: Trace, from: string, to: string, turn: number): void;
    /**
     * Record an error.
     */
    addError(trace: Trace, error: Error): void;
    /**
     * Finalize the trace with status and output.
     */
    endRun(trace: Trace, status: RunStatus, output: unknown): void;
    /**
     * Get a trace by run ID.
     */
    getTrace(runId: string): Trace | undefined;
    /**
     * Export a trace to JSON or human-readable format.
     */
    export(trace: Trace, format?: 'json' | 'pretty'): string;
    /**
     * Clear all traces (e.g. for testing).
     */
    clear(): void;
    private _accumulateUsage;
    private _prettyPrint;
}
/** Global singleton tracer */
declare const globalTracer: VulcanTracer;

declare class AgentRunner {
    private readonly tracer;
    constructor(tracer?: VulcanTracer);
    /**
     * Run an agent to completion and return the final result.
     */
    run<T = string>(agent: Agent, input: string, options?: RunOptions): Promise<RunResult<T>>;
    /**
     * Stream an agent run — yields VulcanEvents as they happen.
     */
    stream(agent: Agent, input: string, options?: RunOptions): AsyncGenerator<VulcanEvent>;
    private _runLoop;
    private _runStandardLoop;
    private _runHarnessLoop;
    private _callWithRetry;
    private _executeToolCall;
    private _validateStructuredOutput;
    private _buildSystemPrompt;
    private _buildHandoffTools;
    private _persistSession;
}
declare class HandoffLoopError extends Error {
    readonly visitedAgents: string[];
    readonly targetAgent: string;
    constructor(visitedAgents: string[], targetAgent: string);
}
declare class StructuredOutputValidationError extends Error {
    readonly validationErrors: string;
    constructor(validationErrors: string);
}

declare class RunContext implements RunContextLite {
    readonly runId: string;
    readonly sessionId: string;
    readonly agentName: string;
    readonly tracer: VulcanTracer;
    readonly trace: Trace;
    readonly emitter: EventEmitter;
    /** Messages accumulated in THIS run (not the full session history) */
    messages: Message[];
    /** Full session state (includes history from previous runs) */
    session: Session;
    /** Current turn number */
    turn: number;
    /** Arbitrary metadata from RunOptions */
    metadata: Record<string, unknown>;
    /** Current agent config (may change on handoff) */
    agentConfig: AgentConfig;
    /** Track visited agents to detect handoff loops */
    visitedAgents: Set<string>;
    constructor(options: RunContextOptions);
    /**
     * Add a message to the current run's context.
     */
    addMessage(msg: Message): void;
    /**
     * Get the full message history: session history + current run messages.
     * The session history provides multi-turn memory.
     */
    getFullHistory(): Message[];
    /**
     * Emit a VulcanEvent to all listeners.
     */
    emit(type: VulcanEventType, data: unknown): void;
    /**
     * Listen to a specific event type.
     */
    on(type: VulcanEventType | 'event', listener: (event: VulcanEvent) => void): void;
    /**
     * Switch to a new agent (during handoff).
     * Updates agentConfig and agentName tracking.
     */
    switchAgent(newConfig: AgentConfig): void;
}
interface RunContextOptions {
    sessionId: string;
    agentConfig: AgentConfig;
    tracer: VulcanTracer;
    trace: Trace;
    emitter: EventEmitter;
    session: Session;
    metadata?: Record<string, unknown>;
}

declare const VULCAN_HARNESS_PROMPT = "\nYou are an expert AI assistant powered by Vulcan SDK.\n\nYou MUST analyse the user's input carefully and then break down the problem into\nmultiple sub-problems before arriving at the final result.\n\nWe follow a strict pipeline: \"INITIAL\" \u2192 \"THINK\" \u2192 \"ANALYSE\" \u2192 \"TOOL_REQUEST\" \u2192 \"OUTPUT\"\n\nThe Pipeline:\n- \"INITIAL\": When the user gives input, produce an initial thought on what they are trying to do.\n- \"THINK\": Think about how to solve this and break down the problem step-by-step.\n- \"ANALYSE\": Analyse your approach and verify if the direction is correct.\n- \"THINK\": You may re-enter THINK if sub-problems remain.\n- \"ANALYSE\": Re-analyse until confident.\n- \"TOOL_REQUEST\": Use this to call a tool. Output ONLY the JSON for this step.\n- \"OUTPUT\": Final answer to the user. This ENDS the pipeline.\n\nRules:\n- Always output ONE step at a time as a valid JSON object.\n- Always maintain the pipeline sequence shown above.\n- NEVER skip INITIAL or OUTPUT steps.\n- NEVER nest steps or output multiple steps at once.\n- If a tool is needed, use TOOL_REQUEST before OUTPUT.\n- After receiving TOOL_OUTPUT, continue the pipeline from THINK or ANALYSE.\n\nOutput Format (strict JSON, one step per response):\n{ \"step\": \"INITIAL\" | \"THINK\" | \"ANALYSE\" | \"TOOL_REQUEST\" | \"OUTPUT\", \"text\": \"<content>\", \"functionName\": \"<tool name \u2014 only for TOOL_REQUEST>\", \"input\": <tool input object \u2014 only for TOOL_REQUEST> }\n\nExample \u2014 Math:\nUser: What is 2 + 2 - 5 * 10 / 3?\n{ \"step\": \"INITIAL\", \"text\": \"The user wants me to solve a math equation using BODMAS rules.\" }\n{ \"step\": \"THINK\", \"text\": \"BODMAS: first multiply 5 * 10 = 50. Equation: 2 + 2 - 50 / 3\" }\n{ \"step\": \"ANALYSE\", \"text\": \"Correct. Now divide: 50 / 3 = 16.6667. Equation: 2 + 2 - 16.6667\" }\n{ \"step\": \"THINK\", \"text\": \"Addition: 2 + 2 = 4. Equation: 4 - 16.6667\" }\n{ \"step\": \"ANALYSE\", \"text\": \"Simple subtraction remains: 4 - 16.6667 = -12.6667\" }\n{ \"step\": \"OUTPUT\", \"text\": \"The final answer is -12.6667\" }\n\nExample \u2014 Tool Use:\nUser: What is the weather in Goa?\n{ \"step\": \"INITIAL\", \"text\": \"The user wants weather information for Goa.\" }\n{ \"step\": \"THINK\", \"text\": \"I have a tool named getWeatherData that can fetch weather by city.\" }\n{ \"step\": \"ANALYSE\", \"text\": \"Calling getWeatherData with 'goa' is the right approach.\" }\n{ \"step\": \"TOOL_REQUEST\", \"text\": \"Fetching weather data\", \"functionName\": \"getWeatherData\", \"input\": \"goa\" }\n[After receiving TOOL_OUTPUT]\n{ \"step\": \"THINK\", \"text\": \"I now have the weather data from the tool.\" }\n{ \"step\": \"OUTPUT\", \"text\": \"The weather in Goa is sunny at 30\u00B0C. It's going to be hot!\" }\n";
declare class VulcanHarness {
    /**
     * Builds the full system prompt with tools injected.
     */
    buildSystemPrompt(tools: ToolDefinition[], baseInstructions: string): string;
    /**
     * Parses a raw JSON string from the model into a HarnessMessage.
     * Handles JSON embedded in markdown code blocks.
     */
    parseStep(raw: string): HarnessMessage;
    /**
     * Parses all steps from a multi-step response (for non-streaming mode).
     */
    parseAllSteps(raw: string): HarnessMessage[];
    /**
     * Returns true if the step is a TOOL_REQUEST.
     */
    isToolRequest(msg: HarnessMessage): msg is HarnessMessage & {
        step: 'TOOL_REQUEST';
        functionName: string;
    };
    /**
     * Returns true if the pipeline has ended.
     */
    isFinal(msg: HarnessMessage): boolean;
    /**
     * Formats a TOOL_OUTPUT to inject back into the conversation.
     */
    formatToolOutput(toolName: string, output: string): string;
    /**
     * Extracts JSON from a string that may be wrapped in markdown code blocks.
     */
    private _extractJson;
    private _isValidStep;
}
declare class HarnessParseError extends Error {
    readonly raw: string;
    constructor(message: string, raw: string);
}
declare const vulcanHarness: VulcanHarness;

declare class ApprovalRequiredSignal extends Error {
    readonly request: ApprovalRequest;
    constructor(request: ApprovalRequest);
}
declare function createApprovalRequest(params: {
    toolName: string;
    input: unknown;
    toolCallId: string;
    runId: string;
    sessionId: string;
    agentName: string;
}): ApprovalRequest;
declare function parseApprovalResult(result: ApprovalResult | boolean): ApprovalResult;

declare class Tool<TInput = unknown, TOutput = unknown> implements ToolDefinition<TInput, TOutput> {
    readonly name: string;
    readonly description: string;
    readonly inputSchema: ZodSchema<TInput>;
    readonly timeoutMs: number;
    readonly errorHandler?: (error: Error, input: TInput) => TOutput | string;
    readonly requiresApproval?: boolean | ((input: TInput) => boolean);
    private readonly _execute;
    constructor(config: ToolConfig<TInput, TOutput>);
    /**
     * Execute the tool with Zod input validation and timeout enforcement.
     * Returns structured ToolExecutionResult with success/error state.
     */
    execute(rawInput: TInput, context: RunContextLite): Promise<TOutput>;
    /**
     * Converts this tool to the OpenAI function calling JSON schema format.
     * Used by the OpenAI provider.
     */
    toOpenAISchema(): OpenAIFunctionSchema;
    /**
     * Converts to Anthropic tool format.
     */
    toAnthropicSchema(): AnthropicToolSchema;
    /**
     * Converts to Gemini function declaration format.
     */
    toGeminiSchema(): GeminiFunctionSchema;
    /** Static factory for cleaner ergonomics */
    static create<I, O>(config: ToolConfig<I, O>): Tool<I, O>;
}
interface ToolConfig<TInput, TOutput> {
    /** Unique tool name — must be snake_case */
    name: string;
    /** Human-readable description sent to the model */
    description: string;
    /** Zod schema for input validation */
    inputSchema: ZodSchema<TInput>;
    /** Async execution function */
    execute: (input: TInput, context: RunContextLite) => Promise<TOutput>;
    /** Optional custom error handler — return a value instead of throwing */
    errorHandler?: (error: Error, input: TInput) => TOutput | string;
    /** Execution timeout in milliseconds (default: 30000) */
    timeoutMs?: number;
    /** Require Human-in-the-Loop approval before executing this tool */
    requiresApproval?: boolean | ((input: any) => boolean);
}
declare class ToolValidationError extends Error {
    readonly toolName: string;
    readonly validationMessage: string;
    readonly input: unknown;
    constructor(toolName: string, validationMessage: string, input: unknown);
}
declare class ToolExecutionError extends Error {
    readonly toolName: string;
    readonly cause: Error;
    constructor(toolName: string, cause: Error);
}
declare class ToolTimeoutError extends Error {
    readonly toolName: string;
    readonly timeoutMs: number;
    constructor(toolName: string, timeoutMs: number);
}
interface OpenAIFunctionSchema {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
interface AnthropicToolSchema {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
}
interface GeminiFunctionSchema {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}
/**
 * Converts a Zod schema to a JSON Schema compatible object.
 * This is a lightweight converter covering the most common Zod types.
 */
declare function zodToJsonSchema(schema: ZodSchema): Record<string, unknown>;

interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}
interface WebSearchOptions {
    /** Search API key (Tavily, Brave, etc.) if applicable */
    apiKey?: string;
    /** Provider: 'tavily' | 'brave' | 'mock' (default: 'mock') */
    provider?: 'tavily' | 'brave' | 'mock';
    /** Default max results (default: 5) */
    maxResults?: number;
}
declare function createWebSearchTool(options?: WebSearchOptions): Tool<{
    query: string;
    maxResults?: number | undefined;
}, {
    title: string;
    url: string;
    snippet: string;
}[]>;

interface WebScraperOptions {
    /** Maximum response character length (default: 8000) */
    maxLength?: number;
    /** Request timeout in ms (default: 10000) */
    timeoutMs?: number;
}
declare function createWebScraperTool(options?: WebScraperOptions): Tool<{
    url: string;
    maxLength?: number | undefined;
}, {
    url: string;
    status: number;
    content: string;
    contentLength?: undefined;
} | {
    url: string;
    status: number;
    contentLength: number;
    content: string;
}>;

interface CodeSandboxOptions {
    /** Allowed global variable keys */
    allowedGlobals?: Record<string, unknown>;
    /** Timeout in ms (default: 5000) */
    timeoutMs?: number;
}
declare function createCodeSandboxTool(options?: CodeSandboxOptions): Tool<{
    code: string;
    language?: "javascript" | "typescript" | undefined;
}, {
    success: boolean;
    result: string | null;
    logs: string[];
    error?: undefined;
} | {
    success: boolean;
    error: string;
    logs: string[];
    result?: undefined;
}>;

interface SQLQueryOptions {
    /** Database query executor callback */
    executeQuery: (sql: string) => Promise<unknown[]> | unknown[];
    /** Enforce strict read-only queries (SELECT only). Default: true */
    readOnly?: boolean;
    /** Human-readable database schema description for the model */
    schemaDescription?: string;
}
declare function createSQLQueryTool(options: SQLQueryOptions): Tool<{
    query: string;
}, {
    query: string;
    rowCount: number;
    rows: unknown[];
    error?: undefined;
} | {
    query: string;
    error: string;
    rowCount?: undefined;
    rows?: undefined;
}>;

interface VectorSearchResult {
    id: string;
    score: number;
    content: string;
    metadata?: Record<string, unknown>;
}
interface VectorStoreOptions {
    /** Custom vector search implementation */
    searchFn: (query: string, topK: number) => Promise<VectorSearchResult[]> | VectorSearchResult[];
    /** Default topK matches to retrieve (default: 3) */
    defaultTopK?: number;
}
declare function createVectorStoreTool(options: VectorStoreOptions): Tool<{
    query: string;
    topK?: number | undefined;
}, {
    query: string;
    count: number;
    results: VectorSearchResult[];
}>;

/**
 * Every model provider must implement this interface.
 * The Runner interacts only with this abstraction — never directly with any SDK.
 */
interface ModelProvider {
    /** Unique identifier for this provider (e.g. 'openai', 'anthropic', 'gemini') */
    readonly name: string;
    /**
     * Perform a single chat completion.
     * Returns a unified ModelResponse regardless of the underlying API format.
     */
    chat(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): Promise<ModelResponse>;
    /**
     * Stream a chat completion.
     * Yields StreamChunk objects as they arrive.
     */
    stream(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): AsyncGenerator<StreamChunk>;
    /**
     * Optional: estimate token count for the given messages.
     */
    countTokens?(messages: Message[], model: string): Promise<number>;
}
declare class ProviderRegistry {
    private readonly providers;
    /**
     * Register a provider under a name.
     * Built-in providers are auto-registered when their module is imported.
     */
    register(name: string, provider: ModelProvider): void;
    /**
     * Retrieve a registered provider by name.
     * Throws if not found.
     */
    get(name: string): ModelProvider;
    has(name: string): boolean;
    list(): string[];
}
/** Global singleton registry */
declare const providerRegistry: ProviderRegistry;
declare abstract class BaseProvider implements ModelProvider {
    abstract readonly name: string;
    abstract chat(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): Promise<ModelResponse>;
    abstract stream(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): AsyncGenerator<StreamChunk>;
    /** Merges usage from multiple model calls */
    protected mergeUsage(a: TokenUsage, b: TokenUsage): TokenUsage;
    /** Separates system messages from conversation messages */
    protected extractSystemPrompt(messages: Message[]): {
        system: string;
        rest: Message[];
    };
}
declare class ProviderNotFoundError extends Error {
    constructor(name: string, available: string);
}
declare class ProviderError extends Error {
    readonly providerName: string;
    readonly statusCode?: number | undefined;
    readonly retryable: boolean;
    constructor(providerName: string, message: string, statusCode?: number | undefined, retryable?: boolean);
}

declare class GeminiProvider extends BaseProvider {
    private readonly apiKey?;
    readonly name = "gemini";
    constructor(apiKey?: string | undefined);
    chat(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): Promise<ModelResponse>;
    stream(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): AsyncGenerator<StreamChunk>;
    private _toGeminiContents;
    private modelCache;
    private genAI;
    private _getModel;
    private _wrapError;
}

declare class OpenAIProvider extends BaseProvider {
    readonly name = "openai";
    private client;
    constructor(apiKey?: string, options?: OpenAIProviderOptions);
    chat(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): Promise<ModelResponse>;
    stream(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): AsyncGenerator<StreamChunk>;
    private _toOpenAIMessages;
    private _mapFinishReason;
    private _wrapError;
}
interface OpenAIProviderOptions {
    baseURL?: string;
    organization?: string;
    maxRetries?: number;
}

declare class AnthropicProvider extends BaseProvider {
    private readonly apiKey?;
    readonly name = "anthropic";
    private clientCache;
    constructor(apiKey?: string | undefined);
    chat(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): Promise<ModelResponse>;
    stream(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): AsyncGenerator<StreamChunk>;
    private _toAnthropicMessages;
    private _getClient;
    private _wrapError;
}

interface GroqProviderOptions {
    apiKey?: string;
    baseURL?: string;
    timeoutMs?: number;
}
declare class GroqProvider extends BaseProvider {
    readonly name = "groq";
    private apiKey;
    private baseURL;
    constructor(apiKey?: string, options?: GroqProviderOptions);
    private getApiKey;
    chat(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): Promise<ModelResponse>;
    stream(messages: Message[], tools: ToolDefinition[], config: ProviderCallConfig): AsyncGenerator<StreamChunk>;
    private _toOpenAIMessages;
    private _mapFinishReason;
}
declare const groqProvider: GroqProvider;

declare function createSession(agentName: string, sessionId?: string): Session;
declare function updateSession(session: Session, messages: Message[]): Session;
declare class SessionManager {
    private readonly adapter;
    constructor(adapter: StorageAdapter);
    /**
     * Load an existing session or create a new one.
     * This is called at the start of every run.
     */
    loadOrCreate(sessionId: string, agentName: string): Promise<Session>;
    /**
     * Persist a session after a turn completes.
     */
    save(session: Session): Promise<void>;
    /**
     * Append messages to a session and save.
     */
    appendMessages(sessionId: string, messages: Message[]): Promise<Session | null>;
    /**
     * Delete a session.
     */
    delete(sessionId: string): Promise<void>;
    /**
     * List all active sessions.
     */
    list(): Promise<string[]>;
    /**
     * Get a session by ID.
     */
    get(sessionId: string): Promise<Session | null>;
}

declare class InMemoryStorage implements StorageAdapter {
    private readonly ttlMs?;
    private readonly store;
    private readonly expiryMap;
    constructor(ttlMs?: number | undefined);
    get(sessionId: string): Promise<Session | null>;
    set(sessionId: string, session: Session): Promise<void>;
    delete(sessionId: string): Promise<void>;
    list(): Promise<string[]>;
    clear(): Promise<void>;
    /** Returns the number of active sessions */
    get size(): number;
}

declare class SQLiteStorage implements StorageAdapter {
    private readonly dbPath;
    private db;
    private initialized;
    constructor(dbPath?: string);
    /**
     * Lazy initialization — opens/creates the DB and table on first use.
     */
    private init;
    get(sessionId: string): Promise<Session | null>;
    set(sessionId: string, session: Session): Promise<void>;
    delete(sessionId: string): Promise<void>;
    list(): Promise<string[]>;
    clear(): Promise<void>;
    /**
     * Get all sessions for a specific agent.
     */
    listByAgent(agentName: string): Promise<Session[]>;
    /**
     * Close the database connection.
     */
    close(): void;
}
declare class SQLiteStorageError extends Error {
    constructor(message: string);
}

declare abstract class BaseGuardrail implements Guardrail {
    abstract readonly name: string;
    abstract readonly type: GuardrailType | GuardrailType[];
    abstract check(payload: GuardrailPayload): Promise<GuardrailResult>;
    protected pass(modifiedContent?: string): GuardrailResult;
    protected fail(reason: string): GuardrailResult;
}
/**
 * Blocks inputs/outputs exceeding a character limit.
 */
declare class MaxLengthGuardrail extends BaseGuardrail {
    private readonly maxChars;
    readonly name: string;
    readonly type: GuardrailType | GuardrailType[];
    constructor(maxChars: number, options?: {
        type?: GuardrailType | GuardrailType[];
        name?: string;
    });
    check(payload: GuardrailPayload): Promise<GuardrailResult>;
}
/**
 * Blocks content containing any of the specified keywords.
 */
declare class KeywordBlockGuardrail extends BaseGuardrail {
    private readonly keywords;
    readonly name: string;
    readonly type: GuardrailType | GuardrailType[];
    private readonly lowerKeywords;
    constructor(keywords: string[], options?: {
        type?: GuardrailType | GuardrailType[];
        name?: string;
        caseSensitive?: boolean;
    });
    check(payload: GuardrailPayload): Promise<GuardrailResult>;
}
/**
 * Validates structured output against a Zod schema.
 */
declare class StructuredOutputGuardrail extends BaseGuardrail {
    private readonly schema;
    readonly name = "structured-output-validation";
    readonly type: GuardrailType;
    constructor(schema: ZodSchema);
    check(payload: GuardrailPayload): Promise<GuardrailResult>;
}
/**
 * Blocks specific tools from being called.
 * Useful for preventing dangerous operations in certain contexts.
 */
declare class BlockedToolsGuardrail extends BaseGuardrail {
    private readonly blockedTools;
    readonly name: string;
    readonly type: GuardrailType;
    constructor(blockedTools: string[], name?: string);
    check(payload: GuardrailPayload): Promise<GuardrailResult>;
}
/**
 * Custom guardrail via function — for one-off validations.
 */
declare class FunctionGuardrail extends BaseGuardrail {
    private readonly fn;
    readonly name: string;
    readonly type: GuardrailType | GuardrailType[];
    constructor(name: string, type: GuardrailType | GuardrailType[], fn: (payload: GuardrailPayload, context: RunContextLite) => Promise<GuardrailResult>);
    check(payload: GuardrailPayload): Promise<GuardrailResult>;
}
/**
 * PII Scrubber — strips common PII patterns from output.
 */
declare class PIIScrubberGuardrail extends BaseGuardrail {
    readonly name = "pii-scrubber";
    readonly type: GuardrailType;
    private static readonly PII_PATTERNS;
    check(payload: GuardrailPayload): Promise<GuardrailResult>;
}
declare function runGuardrails(guardrails: Guardrail[], payload: GuardrailPayload): Promise<{
    passed: boolean;
    failedGuardrail?: string;
    reason?: string;
    modifiedContent?: string;
}>;
declare class GuardrailBlockedError extends Error {
    readonly guardrailName: string;
    readonly reason: string;
    readonly guardrailType: GuardrailType;
    constructor(guardrailName: string, reason: string, guardrailType: GuardrailType);
}

declare const Vulcan: {
    /**
     * Create a new agent.
     *
     * @example
     * const agent = Vulcan.createAgent({ name: 'my-agent', instructions: '...' })
     */
    createAgent(config: AgentConfig): Agent;
    /**
     * Create a typed tool.
     *
     * @example
     * const myTool = Vulcan.createTool({ name: 'search', description: '...', inputSchema: z.object(...), execute: async (input) => '...' })
     */
    createTool<I, O>(config: ToolConfig$1<I, O>): Tool<I, O>;
    /**
     * Register a custom model provider.
     *
     * @example
     * Vulcan.registerProvider('my-provider', new MyProvider())
     */
    registerProvider(name: string, provider: ModelProvider): void;
    /**
     * Run an agent and return the final result.
     *
     * @example
     * const result = await Vulcan.run(agent, 'What is the weather in Goa?')
     */
    run<T = string>(agent: Agent, input: string, options?: RunOptions): Promise<RunResult<T>>;
    /**
     * Stream an agent run — yields VulcanEvents.
     *
     * @example
     * for await (const event of Vulcan.stream(agent, 'Tell me a story')) {
     *   if (event.type === 'text_streamed') console.log(event.data)
     * }
     */
    stream(agent: Agent, input: string, options?: RunOptions): AsyncGenerator<VulcanEvent, void, any>;
};

export { Agent, type AgentConfig, AgentConfigError, AgentRunner, AnthropicProvider, type AnthropicToolSchema, type ApprovalHandler, type ApprovalRequest, ApprovalRequiredSignal, type ApprovalResult, BaseProvider, BlockedToolsGuardrail, type CodeSandboxOptions, type FinishReason, FunctionGuardrail, type GeminiFunctionSchema, GeminiProvider, GroqProvider, type Guardrail, GuardrailBlockedError, type GuardrailPayload, type GuardrailResult, type GuardrailType, HandoffLoopError, type HandoffRecord, type HarnessMessage, HarnessParseError, type HarnessStep, InMemoryStorage, KeywordBlockGuardrail, MaxLengthGuardrail, type Message, type MessageRole, type ModelCallRecord, type ModelProvider, type ModelResponse, type OpenAIFunctionSchema, OpenAIProvider, PIIScrubberGuardrail, type ProviderCallConfig, ProviderError, ProviderNotFoundError, type ReasoningMode, RunContext, type RunContextLite, type RunOptions, type RunResult, type RunStatus, type SQLQueryOptions, SQLiteStorage, SQLiteStorageError, type Session, SessionManager, type StorageAdapter, type StreamChunk, StructuredOutputGuardrail, StructuredOutputValidationError, type TokenUsage, Tool, type ToolCall, type ToolCallRecord, type ToolDefinition, ToolExecutionError, type ToolResult, ToolTimeoutError, ToolValidationError, type Trace, VULCAN_HARNESS_PROMPT, type VectorSearchResult, type VectorStoreOptions, Vulcan, type VulcanEvent, type VulcanEventType, VulcanHarness, VulcanTracer, type WebScraperOptions, type WebSearchOptions, type WebSearchResult, createApprovalRequest, createCodeSandboxTool, createSQLQueryTool, createSession, createVectorStoreTool, createWebScraperTool, createWebSearchTool, globalTracer, groqProvider, parseApprovalResult, providerRegistry, runGuardrails, updateSession, vulcanHarness, zodToJsonSchema };
