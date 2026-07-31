# Examples

The Vulcan SDK codebase includes full, executable examples under the `/examples` directory.

All examples run out-of-the-box using the default **Google Gemini** configuration, meaning you only need to set `GEMINI_API_KEY` in your environment or a `.env` file to try them.

---

## 1. Basic Agent

Demonstrates creating a simple math agent with a custom calculator tool.

- **File**: `examples/basic-agent.ts`
- **Concept**: Tool creation, agent declaration, and run execution.
- **Run command**:
  ```bash
  npx tsx examples/basic-agent.ts
  ```

---

## 2. Multi-Agent Handoffs

Demonstrates a triage routing agent delegating tasks to billing or support specialized agents.

- **File**: `examples/multi-agent-handoff.ts`
- **Concept**: Fluent agent configuration, handoff tool injection, loop detection, and tracing the handoff chain.
- **Run command**:
  ```bash
  npx tsx examples/multi-agent-handoff.ts
  ```

---

## 3. Streaming and Events

Demonstrates real-time event streaming via an async generator, showcasing step-by-step reasoning details.

- **File**: `examples/streaming.ts`
- **Concept**: Event stream iteration, handling tool started/completed triggers, and harness mode step logs.
- **Run command**:
  ```bash
  npx tsx examples/streaming.ts
  ```

---

## 4. Structured Output

Demonstrates analyzing text and generating strict, Zod-schema validated JSON output.

- **File**: `examples/structured-output.ts`
- **Concept**: Zod output schema definition, typescript type inference, and validation retry logic.
- **Run command**:
  ```bash
  npx tsx examples/structured-output.ts
  ```

---

## 5. Guardrails

Demonstrates safety guardrails validating inputs, scrubbing sensitive PII from outputs, and blocking dangerous tool invocations.

- **File**: `examples/guardrails.ts`
- **Concept**: Keywords blocking, PII scrubbing, tool blocking, and custom logic checking.
- **Run command**:
  ```bash
  npx tsx examples/guardrails.ts
  ```
