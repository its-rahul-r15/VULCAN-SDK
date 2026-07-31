# Installation

Install the Vulcan SDK using npm, yarn, or pnpm.

## Base Installation

```bash
npm install @vulcan-ai/sdk
# or
yarn add @vulcan-ai/sdk
# or
pnpm add @vulcan-ai/sdk
```

---

## Adding Model Providers

Vulcan has a modular design with zero mandatory peer dependencies. Install only the SDKs for the providers you intend to use:

### 1. Google Gemini (Default)

```bash
npm install @google/generative-ai
```

Set the API key in your environment variables:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### 2. OpenAI

```bash
npm install openai
```

Set the API key in your environment variables:
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

### 3. Anthropic (Claude)

```bash
npm install @anthropic-ai/sdk
```

Set the API key in your environment variables:
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

---

## Persistent Memory (Optional)

By default, Vulcan stores session context in-memory. For persistent SQLite-backed session storage:

```bash
npm install better-sqlite3
```

*(If `better-sqlite3` is not installed, Vulcan automatically falls back to safe in-memory storage with a console warning).*
