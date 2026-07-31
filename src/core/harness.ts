import type { HarnessMessage, HarnessStep } from '../types/index.js'
import type { ToolDefinition } from '../types/index.js'

// ─────────────────────────────────────────────
// Vulcan Harness Prompt
// Based on the structured INITIAL → THINK → ANALYSE → TOOL_REQUEST → OUTPUT pipeline
// ─────────────────────────────────────────────

export const VULCAN_HARNESS_PROMPT = `
You are an expert AI assistant powered by Vulcan SDK.

You MUST analyse the user's input carefully and then break down the problem into
multiple sub-problems before arriving at the final result.

We follow a strict pipeline: "INITIAL" → "THINK" → "ANALYSE" → "TOOL_REQUEST" → "OUTPUT"

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
{ "step": "INITIAL" | "THINK" | "ANALYSE" | "TOOL_REQUEST" | "OUTPUT", "text": "<content>", "functionName": "<tool name — only for TOOL_REQUEST>", "input": <tool input object — only for TOOL_REQUEST> }

Example — Math:
User: What is 2 + 2 - 5 * 10 / 3?
{ "step": "INITIAL", "text": "The user wants me to solve a math equation using BODMAS rules." }
{ "step": "THINK", "text": "BODMAS: first multiply 5 * 10 = 50. Equation: 2 + 2 - 50 / 3" }
{ "step": "ANALYSE", "text": "Correct. Now divide: 50 / 3 = 16.6667. Equation: 2 + 2 - 16.6667" }
{ "step": "THINK", "text": "Addition: 2 + 2 = 4. Equation: 4 - 16.6667" }
{ "step": "ANALYSE", "text": "Simple subtraction remains: 4 - 16.6667 = -12.6667" }
{ "step": "OUTPUT", "text": "The final answer is -12.6667" }

Example — Tool Use:
User: What is the weather in Goa?
{ "step": "INITIAL", "text": "The user wants weather information for Goa." }
{ "step": "THINK", "text": "I have a tool named getWeatherData that can fetch weather by city." }
{ "step": "ANALYSE", "text": "Calling getWeatherData with 'goa' is the right approach." }
{ "step": "TOOL_REQUEST", "text": "Fetching weather data", "functionName": "getWeatherData", "input": "goa" }
[After receiving TOOL_OUTPUT]
{ "step": "THINK", "text": "I now have the weather data from the tool." }
{ "step": "OUTPUT", "text": "The weather in Goa is sunny at 30°C. It's going to be hot!" }
`

// ─────────────────────────────────────────────
// VulcanHarness Class
// ─────────────────────────────────────────────

export class VulcanHarness {
  /**
   * Builds the full system prompt with tools injected.
   */
  buildSystemPrompt(
    tools: ToolDefinition[],
    baseInstructions: string,
  ): string {
    const toolList =
      tools.length > 0
        ? `\nAvailable Tools:\n${tools
            .map((t) => `- ${t.name}: ${t.description}`)
            .join('\n')}`
        : '\nNo tools available for this agent.'

    return `${VULCAN_HARNESS_PROMPT}\n${toolList}\n\nAdditional Instructions:\n${baseInstructions}`
  }

  /**
   * Parses a raw JSON string from the model into a HarnessMessage.
   * Handles JSON embedded in markdown code blocks.
   */
  parseStep(raw: string): HarnessMessage {
    const cleaned = this._extractJson(raw.trim())

    try {
      const parsed = JSON.parse(cleaned) as Record<string, unknown>

      const step = parsed.step as HarnessStep
      if (!this._isValidStep(step)) {
        throw new HarnessParseError(`Invalid step: '${String(parsed.step)}'`, raw)
      }

      return {
        step,
        text: typeof parsed.text === 'string' ? parsed.text : undefined,
        functionName:
          typeof parsed.functionName === 'string' ? parsed.functionName : undefined,
        input: parsed.input,
      }
    } catch (error) {
      if (error instanceof HarnessParseError) throw error
      throw new HarnessParseError(`Failed to parse harness step: ${raw}`, raw)
    }
  }

  /**
   * Parses all steps from a multi-step response (for non-streaming mode).
   */
  parseAllSteps(raw: string): HarnessMessage[] {
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('{'))

    if (lines.length === 0) {
      // Try parsing the whole thing as one step
      return [this.parseStep(raw)]
    }

    return lines.map((line) => this.parseStep(line))
  }

  /**
   * Returns true if the step is a TOOL_REQUEST.
   */
  isToolRequest(msg: HarnessMessage): msg is HarnessMessage & {
    step: 'TOOL_REQUEST'
    functionName: string
  } {
    return msg.step === 'TOOL_REQUEST' && typeof msg.functionName === 'string'
  }

  /**
   * Returns true if the pipeline has ended.
   */
  isFinal(msg: HarnessMessage): boolean {
    return msg.step === 'OUTPUT'
  }

  /**
   * Formats a TOOL_OUTPUT to inject back into the conversation.
   */
  formatToolOutput(toolName: string, output: string): string {
    return JSON.stringify({
      step: 'TOOL_OUTPUT',
      functionName: toolName,
      result: output,
    })
  }

  /**
   * Extracts JSON from a string that may be wrapped in markdown code blocks.
   */
  private _extractJson(raw: string): string {
    // Remove ```json ... ``` wrappers
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch?.[1]) return codeBlockMatch[1].trim()
    return raw
  }

  private _isValidStep(step: unknown): step is HarnessStep {
    const validSteps: HarnessStep[] = [
      'INITIAL',
      'THINK',
      'ANALYSE',
      'TOOL_REQUEST',
      'OUTPUT',
    ]
    return validSteps.includes(step as HarnessStep)
  }
}

// ─────────────────────────────────────────────
// Error
// ─────────────────────────────────────────────

export class HarnessParseError extends Error {
  constructor(message: string, public readonly raw: string) {
    super(message)
    this.name = 'HarnessParseError'
  }
}

// Singleton instance
export const vulcanHarness = new VulcanHarness()
