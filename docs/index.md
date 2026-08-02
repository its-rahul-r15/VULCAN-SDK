# Vulcan SDK

Welcome to the documentation for **Vulcan**, a production-grade, open-source AI Agent SDK for TypeScript.

Vulcan allows you to build multi-provider, observable, and guardrailed autonomous agents without being locked into complex, heavy frameworks.

---

## Key Features

- 🧠 **Observable CoT Reasoning**: First-class chain-of-thought logic with step-by-step trace generation.
- 🔧 **Type-safe Tool Invocations**: Auto-validates inputs using Zod.
- 🔄 **Bidirectional Handoffs**: Transfer conversations between agents automatically with built-in loop detection.
- 🛡️ **Flexible Guardrails**: Clean input/output/tool interception with support for PII scrubbing and custom functions.
- ⚡ **Budgets & Self-Healing**: Max tool calls, duration timeouts, token budgets, and LLM tool auto-correction retries.
- 💾 **Pluggable Session Memory**: SQLite persistence and TTL memory out-of-the-box.
- 📡 **Real-time Event Streaming**: Generates stream chunks for tools, handoffs, guardrails, and reasoning.
- 📊 **Detailed Tracing**: Export beautiful execution charts or JSON logs for observability platforms.

---

## Directory Index

Get started by following the guides below:

1. [Quick Start](./quickstart.md) — Create and run your first agent in 5 minutes.
2. [Installation](./installation.md) — Package managers and provider dependencies.
3. [API Reference](./api-reference.md) — Complete API documentation for Agent, Tool, and Runner.
4. [Tools](./tools.md) — Designing custom executable schemas.
5. [Budgets & Reliability](./budgets-reliability.md) — Run budgets, tool self-healing, and multi-model fallbacks.
6. [Guardrails](./guardrails.md) — Securing applications at input, output, and tool levels.
7. [Memory & Sessions](./memory-sessions.md) — Context management and session databases.
8. [Agent Handoffs](./handoffs.md) — Routing conversations through multi-agent networks.
9. [Providers](./providers.md) — Integrating OpenAI, Gemini, Claude, or custom LLMs.
10. [Streaming & Events](./streaming.md) — Listening to real-time agent loop outputs.
11. [Observability & Tracing](./tracing.md) — Visualizing token counts, run times, and calls.
12. [Error Handling](./error-handling.md) — Gracefully recovering from LLM failures.
13. [Examples](./examples.md) — List of functional demonstrations.
