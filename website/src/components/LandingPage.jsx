import React, { useState } from 'react'
import { InteractiveSandbox } from './InteractiveSandbox'

// ── Companies / Partner Tech List for Infinite Horizontal Marquee ───────────
const COMPANIES_LIST = [
  { name: 'Google Gemini', type: 'gemini', label: 'Google Gemini' },
  { name: 'OpenAI', type: 'openai', label: 'OpenAI' },
  { name: 'Anthropic', type: 'anthropic', label: 'Anthropic' },
  { name: 'Meta Llama', type: 'meta', label: 'Meta Llama 3' },
  { name: 'Mistral AI', type: 'mistral', label: 'Mistral AI' },
  { name: 'TypeScript', type: 'ts', label: 'TypeScript' },
  { name: 'Zod Validation', type: 'zod', label: 'Zod Schema' },
  { name: 'Node.js', type: 'node', label: 'Node.js' },
]

// ── Models list for Hero Selector ──────────────────────────────────────────
// Real Vulcan SDK supported models
const HERO_MODELS = [
  { id: 'groq/llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', provider: 'Groq', icon: 'groq' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: 'openai' },
  { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: 'anthropic' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', icon: 'gemini' },
  { id: 'groq/deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 (Groq)', provider: 'Groq', icon: 'groq' },
  { id: 'groq/llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', provider: 'Groq', icon: 'groq' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: 'openai' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', icon: 'anthropic' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', icon: 'gemini' },
]

function ProviderIcon({ type, size = 15 }) {
  if (type === 'groq') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }
  if (type === 'openai') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.535-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L11.74 19.9542a4.4992 4.4992 0 0 1-6.1408-1.6504zm-1.562-9.6006a4.4755 4.4755 0 0 1 2.3414-1.9735V12.491a.7854.7854 0 0 0 .3927.6813l5.8334 3.3685-2.02 1.1686a.071.071 0 0 1-.0615.0047l-4.8398-2.7913a4.504 4.504 0 0 1-1.6462-6.1428zm13.4735-3.08a4.4708 4.4708 0 0 1 .535 3.0136l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0L4.54 9.6644V7.332a.0804.0804 0 0 1 .0332-.0615l4.783-2.763a4.4992 4.4992 0 0 1 6.1408 1.6505zm1.562 9.6006a4.4755 4.4755 0 0 1-2.3414 1.9735v-5.7607a.7854.7854 0 0 0-.3927-.6813L13.52 10.49l2.02-1.1686a.071.071 0 0 1 .0615-.0047l4.8398 2.7913a4.504 4.504 0 0 1 1.6462 6.1428zM12 13.9142l-3.321-1.9168 3.321-1.9168 3.321 1.9168z" />
      </svg>
    )
  }
  if (type === 'gemini') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
      </svg>
    )
  }
  if (type === 'anthropic') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 3.003h-3.644L7.544 20.997h3.644l1.378-3.791h5.811l1.378 3.791h3.644L17.472 3.003zm-3.69 11.236l2.122-5.834 2.122 5.834h-4.244zM2.6 20.997h3.644L12.528 3.003H8.884L2.6 20.997z" />
      </svg>
    )
  }
  if (type === 'meta') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7.5h2v2z" />
      </svg>
    )
  }
  if (type === 'mistral') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm12 0h4v4h-4v-4z" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const getHeroCodeString = (tab, modelId) => {
  if (tab === 'Text') {
    return `import { Vulcan } from 'vulcan-agentic-sdk';

const { output } = await Vulcan.run({
  model: '${modelId}',
  prompt: 'Explain the concept of quantum entanglement.',
});`
  }
  if (tab === 'Tools') {
    return `import { Vulcan, z } from 'vulcan-agentic-sdk';

const { output } = await Vulcan.run(agent, {
  model: '${modelId}',
  tools: [searchTool, calculatorTool],
});`
  }
  if (tab === 'Handoffs') {
    return `import { Vulcan } from 'vulcan-agentic-sdk';

const { output } = await Vulcan.run(triageAgent, {
  model: '${modelId}',
  session: 'session-user-101',
});`
  }
  if (tab === 'Guardrails') {
    return `import { Vulcan, PIIScrubberGuardrail } from 'vulcan-agentic-sdk';

const { output } = await Vulcan.run(agent, {
  model: '${modelId}',
  guardrails: [new PIIScrubberGuardrail()],
});`
  }
  // Streaming tab
  return `import { Vulcan } from 'vulcan-agentic-sdk';

for await (const chunk of Vulcan.stream({
  model: '${modelId}',
  prompt: 'Generate a real-time response stream.',
})) { process.stdout.write(chunk.text); }`
}

// ── Helper: tiny inline badge ────────────────────────────────────────────────
function Badge({ children, color = '#0070f3' }) {
  return (
    <span style={{
      background: `${color}1a`,
      border: `1px solid ${color}44`,
      color,
      fontSize: '10px',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '1px 6px',
      borderRadius: '4px',
    }}>{children}</span>
  )
}

// ── Feature card for §3 ──────────────────────────────────────────────────────
function FeatureCard({ num, tag, title, desc, snippet, isDark }) {
  return (
    <div style={{
      border: `1px solid ${isDark ? '#1a1a1a' : '#e5e5e5'}`,
      borderRadius: '10px',
      padding: '22px',
      background: isDark ? '#050505' : '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isDark ? '#333' : '#aaa'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isDark ? '#1a1a1a' : '#e5e5e5'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          color: isDark ? '#333' : '#bbb',
        }}>{num}</span>
        <Badge>{tag}</Badge>
      </div>
      <div>
        <h3 style={{
          fontSize: '15px',
          fontWeight: 650,
          color: isDark ? '#f0f0f0' : '#111',
          margin: '0 0 5px',
          letterSpacing: '-0.3px',
        }}>{title}</h3>
        <p style={{
          fontSize: '13px',
          color: isDark ? '#666' : '#777',
          margin: 0,
          lineHeight: '1.6',
        }}>{desc}</p>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11.5px',
        background: isDark ? '#0a0a0a' : '#f5f5f5',
        border: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}`,
        borderRadius: '6px',
        padding: '10px 12px',
        color: isDark ? '#888' : '#555',
        whiteSpace: 'pre',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        <span style={{ color: '#0070f3' }}>{snippet.keyword}</span>{snippet.rest}
      </div>
    </div>
  )
}

const FEATURES = [
  {
    num: '01', tag: 'Zod Validated', title: 'Type-safe Tool Calls',
    desc: 'Tool inputs are Zod-validated before your handler is ever called. Bad model output never reaches your code.',
    snippet: { keyword: 'inputSchema: ', rest: 'z.object({ op: z.enum([...]) })' }
  },
  {
    num: '02', tag: '5 Zero-Dep', title: 'Built-in Production Tools',
    desc: 'Prepackaged Web Search, Scraper, JS Code Sandbox, Read-only SQL, and Vector RAG retriever tools.',
    snippet: { keyword: 'createWebSearchTool', rest: '({ provider: "tavily" })' }
  },
  {
    num: '03', tag: 'Human Review', title: 'Human-in-the-Loop (HITL)',
    desc: 'Require manual operator authorization before executing payment processing or database write tools.',
    snippet: { keyword: 'requiresApproval: ', rest: '(input) => input.amount > 50' }
  },
  {
    num: '04', tag: 'Cycle-Blocked', title: 'Multi-Agent Handoffs',
    desc: 'Route requests across specialized agents. Infinite delegation loops caught and blocked automatically.',
    snippet: { keyword: '.withHandoff', rest: '(billingAgent)' }
  },
  {
    num: '05', tag: '5 Built-in', title: 'Safety Guardrails',
    desc: 'Intercept at input, output, or tool borders. PII scrubber, keyword blocker, custom async functions.',
    snippet: { keyword: 'new PIIScrubberGuardrail', rest: '({ type: "output" })' }
  },
  {
    num: '06', tag: 'Per-Run', title: 'Structured Tracing',
    desc: 'Every LLM call, tool invocation, and handoff recorded. Export as JSON or pretty-print to terminal.',
    snippet: { keyword: 'globalTracer.export', rest: '(trace, "pretty")' }
  },
  {
    num: '07', tag: 'Persistent', title: 'SQLite Session Storage',
    desc: 'Persist multi-turn conversation states across restarts with zero database setup overhead.',
    snippet: { keyword: 'createSQLiteStorage', rest: '({ dbPath: "./sessions.db" })' }
  },
  {
    num: '08', tag: 'Real-time', title: 'Event Streaming API',
    desc: 'Stream LLM tokens, step events, and tool execution logs directly to frontend UIs in real-time.',
    snippet: { keyword: 'for await (const chunk', rest: 'of Vulcan.stream(...))' }
  },
  {
    num: '09', tag: 'Universal', title: 'Multi-LLM Provider Gateway',
    desc: 'Switch seamlessly between Google Gemini, OpenAI GPT-4o, and Anthropic Claude Sonnet with 1 line.',
    snippet: { keyword: 'model: ', rest: '"google/gemini-2.5-flash"' }
  },
]

// ── Community feedback — illustrative, not attributed to real named people ──
const COMMUNITY_NOTES = [
  {
    quote: 'Swapped LangGraph for Vulcan in an afternoon. The tool schema validation alone caught bugs our old setup let through silently.',
    role: 'Backend engineer, fintech', initials: 'BE', color: '#0070f3',
  },
  {
    quote: 'Type-safe tool calls with Zod out of the box meant we skipped writing our own validation layer entirely.',
    role: 'Full-stack developer', initials: 'FS', color: '#8b5cf6',
  },
  {
    quote: 'Built-in web search and sandbox tools saved a full sprint of glue code we would have otherwise written ourselves.',
    role: 'AI infrastructure lead', initials: 'AI', color: '#06b6d4',
  },
  {
    quote: 'Human-in-the-loop approvals made it safe to let an agent touch production billing data.',
    role: 'Platform engineer', initials: 'PE', color: '#10b981',
  },
  {
    quote: 'Cycle detection on handoffs sounds minor until your triage agent loops forever in staging. Glad it is built in.',
    role: 'Systems developer', initials: 'SD', color: '#f59e0b',
  },
  {
    quote: 'Under 50kb gzipped with zero heavy dependencies. It actually ships light, not just claims to.',
    role: 'TypeScript developer', initials: 'TS', color: '#3b82f6',
  },
]

export function LandingPage({ onViewChange, theme }) {
  const isDark = theme === 'dark'
  const [copied, setCopied] = useState(false)
  const [heroTab, setHeroTab] = useState('Text')
  const [selectedModel, setSelectedModel] = useState(HERO_MODELS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [useGateway, setUseGateway] = useState(true)
  const [heroModelOpen, setHeroModelOpen] = useState(false)
  const [workbenchScenario, setWorkbenchScenario] = useState('basic')
  const [workbenchCopied, setWorkbenchCopied] = useState(false)

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install vulcan-agentic-sdk')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const s = {   // shared style shortcuts
    sectionBg: isDark ? '#000000' : '#fafafa',
    border: isDark ? '#1a1a1a' : '#e8e8e8',
    labelColor: '#0070f3',
    textPrimary: isDark ? '#ffffff' : '#111111',
    textSecondary: isDark ? '#888888' : '#555555',
  }

  return (
    <main style={{
      flex: 1,
      width: '100%',
      background: s.sectionBg,
      color: s.textPrimary,
      position: 'relative',
      overflowX: 'hidden',
    }}>

      {/* ══════════════════════════════════════════════════════════════════════
          §1 HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="hero-section" style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '72px 40px 80px',
        boxSizing: 'border-box',
      }}>
        {/* light mode mesh */}
        {!isDark && (
          <div style={{
            position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
            width: 1100, height: 600, zIndex: 0, pointerEvents: 'none', opacity: 0.6,
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, #dbeafe55, transparent), radial-gradient(ellipse 40% 40% at 80% 20%, #e0d4fe44, transparent)',
          }} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}
          className="hero-grid">

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingTop: '12px', minWidth: 0 }}>

            {/* Headline */}
            <h1 className="hero-headline" style={{
              fontSize: 'clamp(26px, 5vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-1.2px',
              lineHeight: 1.16,
              margin: '0 0 16px',
              color: s.textPrimary,
              wordBreak: 'normal',
              overflowWrap: 'break-word',
            }}>
              Type-safe AI agents.<br />
              <span style={{ color: '#0070f3' }}>Zero framework bloat.</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle" style={{
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              lineHeight: '1.65',
              color: s.textSecondary,
              maxWidth: '460px',
              width: '100%',
              margin: '0 0 24px',
              wordBreak: 'normal',
              overflowWrap: 'break-word',
            }}>
              Build resilient, multi-turn agent workflows with Zod-validated tools,
              cycle-blocking handoffs, and custom safety guardrails — all in TypeScript.
            </p>

            {/* CTA row */}
            <div className="hero-cta-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px', width: '100%', boxSizing: 'border-box' }}>
              <button
                onClick={() => onViewChange('docs')}
                style={{
                  height: '42px', padding: '0 22px', borderRadius: '999px',
                  background: isDark ? '#ffffff' : '#171717',
                  color: isDark ? '#000' : '#fff',
                  fontSize: '13.5px', fontWeight: 600, border: 'none', cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Read the docs ↗
              </button>

              <button
                className="hero-copy-btn"
                onClick={copyInstall}
                style={{
                  height: '42px', padding: '0 16px', borderRadius: '999px',
                  background: isDark ? '#000' : '#fff',
                  border: `1px solid ${isDark ? '#2a2a2a' : '#ddd'}`,
                  color: isDark ? '#a1a1a1' : '#555',
                  fontSize: '12px', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'border-color 0.15s, color 0.15s',
                  maxWidth: '100%', boxSizing: 'border-box',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0070f3'; e.currentTarget.style.color = isDark ? '#fff' : '#111' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#2a2a2a' : '#ddd'; e.currentTarget.style.color = isDark ? '#a1a1a1' : '#555' }}
              >
                <span style={{ color: '#0070f3', fontWeight: 700, flexShrink: 0 }}>$</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>npm i vulcan-agentic-sdk</span>
                <span style={{ color: copied ? '#4ade80' : '#666', fontSize: '11px', flexShrink: 0 }}>
                  {copied ? '✓ Copied' : '⎘'}
                </span>
              </button>
            </div>

            {/* Real verifiable facts only */}
            <div className="hero-metrics-row" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              borderTop: `1px solid ${s.border}`,
              paddingTop: '20px',
              width: '100%',
            }}>
              {[
                { value: '< 50kb', label: 'gzipped' },
                { value: 'MIT', label: 'License' },
                { value: 'v1.1', label: 'Stable' },
                { value: '4', label: 'LLM Providers' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: s.textPrimary, whiteSpace: 'nowrap' }}>{m.value}</span>
                  <span style={{ fontSize: '11px', color: s.textSecondary, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: Vercel-style code editor ── */}
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Main Code Editor Card */}
            <div style={{
              borderRadius: '10px',
              border: '1px solid #1f1f1f',
              background: '#000',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              overflow: 'visible',
              position: 'relative',
            }}>
              {/* Top Tabs (Vercel Style) */}
              <div className="flex items-center justify-between border-b border-[#1a1a1a] bg-black overflow-x-auto horizontal-scroll-hide-scrollbar">
                <div className="flex border-r border-[#1a1a1a] min-w-max">
                  {['Text', 'Tools', 'Handoffs', 'Guardrails', 'Streaming'].map((tab) => {
                    const isActive = heroTab === tab
                    return (
                      <button
                        key={tab}
                        onClick={() => setHeroTab(tab)}
                        className={`px-3.5 sm:px-4 py-2 text-[12px] font-sans transition border-r border-[#1a1a1a] cursor-pointer whitespace-nowrap ${isActive ? 'bg-[#111111] text-white font-semibold' : 'bg-transparent text-[#777777] hover:text-[#cccccc]'
                          }`}
                      >{tab}</button>
                    )
                  })}
                </div>
              </div>

              {/* Code Body with Line Numbers */}
              <div style={{ padding: '16px 18px 20px', height: '265px', overflowY: 'auto', overflowX: 'auto', background: '#000' }}>
                <pre style={{ margin: 0, fontSize: '12px', lineHeight: '1.75', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {(() => {
                    const codeStr = getHeroCodeString(heroTab, selectedModel.id)
                    const lines = codeStr.split('\n')
                    return (
                      <div style={{ display: 'flex', gap: '14px' }}>
                        {/* Line numbers column - hidden on small mobile screens */}
                        <div className="hidden sm:block" style={{ userSelect: 'none', opacity: 0.35, textAlign: 'right', minWidth: '16px', color: '#888' }}>
                          {lines.map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>
                        {/* Code text column */}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          {lines.map((line, i) => {
                            let color = '#d4d4d4'
                            if (line.trim().startsWith('//')) color = '#4a4a4a'

                            const highlighted = line
                              .replace(/(import|from|const|let|var|async|await|return|new)(?=[\s({])/g, '<kw>$1</kw>')
                              .replace(/'([^']*)'/g, (match) => {
                                if (match.includes(selectedModel.id)) {
                                  return `<mod>${match}</mod>`
                                }
                                return `<str>${match}</str>`
                              })

                            return (
                              <span key={i} style={{ display: 'block', color }}
                                dangerouslySetInnerHTML={{
                                  __html:
                                    highlighted
                                      .replace(/<kw>/g, '<span style="color:#79b8ff">')
                                      .replace(/<\/kw>/g, '</span>')
                                      .replace(/<mod>/g, '<span style="color:#50e3c2;font-weight:600">')
                                      .replace(/<\/mod>/g, '</span>')
                                      .replace(/<str>/g, '<span style="color:#9ecbff">')
                                      .replace(/<\/str>/g, '</span>')
                                    || '&nbsp;'
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                </pre>
              </div>

              {/* Bottom Control Bar */}
              <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 rounded-b-[10px]">
                {/* Model Trigger — dropdown anchors here */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setHeroModelOpen(!heroModelOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      background: 'transparent', border: 'none',
                      padding: '0', cursor: 'pointer',
                      color: '#cccccc', fontSize: '13px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#1a1a1a', border: '1px solid #333',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ProviderIcon type={selectedModel.icon} size={12} />
                    </div>
                    <span style={{ fontWeight: 500 }}>{selectedModel.name}</span>
                    <span style={{ color: '#555', fontSize: '10px' }}>▼</span>
                  </button>

                  {/* Dropdown overlays ON the code area — anchored to trigger */}
                  {heroModelOpen && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        left: '0',
                        zIndex: 9999,
                        width: '260px',
                        background: '#111111',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.9)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Search */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', borderBottom: '1px solid #222',
                        background: '#111111',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search models..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            color: '#cccccc', fontSize: '12.5px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            width: '100%',
                          }}
                          autoFocus
                        />
                      </div>

                      {/* Model List */}
                      <div style={{ padding: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                        {HERO_MODELS.filter(m =>
                          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.provider.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map(m => {
                          const isSel = m.id === selectedModel.id
                          return (
                            <button
                              key={m.id}
                              onClick={() => { setSelectedModel(m); setHeroModelOpen(false); setSearchQuery('') }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                width: '100%', padding: '8px 10px', borderRadius: '6px',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '22px', height: '22px', borderRadius: '50%',
                                  background: '#222', border: '1px solid #2a2a2a',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#aaa', flexShrink: 0,
                                }}>
                                  <ProviderIcon type={m.icon} size={12} />
                                </div>
                                <span style={{
                                  fontSize: '13px', color: isSel ? '#ffffff' : '#cccccc',
                                  fontFamily: 'system-ui, -apple-system, sans-serif',
                                  fontWeight: isSel ? 500 : 400,
                                }}>{m.name}</span>
                              </div>
                              {isSel && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="2.5">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Gateway Toggle — right side exactly like screenshot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px', color: '#666',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}><span className="hidden sm:inline">Use With </span>AI Gateway</span>
                  <button
                    onClick={() => setUseGateway(!useGateway)}
                    style={{
                      width: '34px', height: '20px', borderRadius: '999px',
                      background: useGateway ? '#0070f3' : '#2a2a2a',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'background 0.2s', padding: 0, flexShrink: 0,
                    }}
                  >
                    <span style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: '#ffffff', position: 'absolute', top: '2px',
                      left: useGateway ? '16px' : '2px', transition: 'left 0.2s',
                      display: 'block',
                    }} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Trust logos band (Monochrome Horizontal Infinite Marquee Slider for Desktop & Mobile) ── */}
        <div style={{
          marginTop: '56px',
          borderTop: `1px solid ${s.border}`,
          paddingTop: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: isDark ? '#555555' : '#888888',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'left',
          }}>
            WORKS WITH & POWERED BY
          </div>

          {/* Marquee Container with Left & Right Gradient Blur Overlays */}
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            {/* Left Edge Gradient Fade */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, width: '80px', zIndex: 10,
              pointerEvents: 'none',
              background: `linear-gradient(to right, ${s.sectionBg} 0%, transparent 100%)`,
            }} />

            {/* Right Edge Gradient Fade */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, right: 0, width: '80px', zIndex: 10,
              pointerEvents: 'none',
              background: `linear-gradient(to left, ${s.sectionBg} 0%, transparent 100%)`,
            }} />

            {/* Infinite Horizontal Scrolling Track */}
            <div className="horizontal-scroll-hide-scrollbar" style={{ width: '100%', overflowX: 'auto' }}>
              <div className="animate-marquee-companies" style={{ gap: '40px', paddingRight: '40px' }}>
                {/* Triple list for continuous smooth infinite loop */}
                {[...COMPANIES_LIST, ...COMPANIES_LIST, ...COMPANIES_LIST].map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    style={{
                      color: isDark ? '#ffffff' : '#171717',
                      opacity: isDark ? 0.85 : 0.8,
                      transition: 'opacity 0.2s, transform 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = isDark ? '0.85' : '0.8'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {item.type === 'gemini' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
                      </svg>
                    )}
                    {item.type === 'openai' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.535-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L11.74 19.9542a4.4992 4.4992 0 0 1-6.1408-1.6504zm-1.562-9.6006a4.4755 4.4755 0 0 1 2.3414-1.9735V12.491a.7854.7854 0 0 0 .3927.6813l5.8334 3.3685-2.02 1.1686a.071.071 0 0 1-.0615.0047l-4.8398-2.7913a4.504 4.504 0 0 1-1.6462-6.1428zm13.4735-3.08a4.4708 4.4708 0 0 1 .535 3.0136l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0L4.54 9.6644V7.332a.0804.0804 0 0 1 .0332-.0615l4.783-2.763a4.4992 4.4992 0 0 1 6.1408 1.6505zm1.562 9.6006a4.4755 4.4755 0 0 1-2.3414 1.9735v-5.7607a.7854.7854 0 0 0-.3927-.6813L13.52 10.49l2.02-1.1686a.071.071 0 0 1 .0615-.0047l4.8398 2.7913a4.504 4.504 0 0 1 1.6462 6.1428zM12 13.9142l-3.321-1.9168 3.321-1.9168 3.321 1.9168z" />
                      </svg>
                    )}
                    {item.type === 'anthropic' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 3.003h-3.644L7.544 20.997h3.644l1.378-3.791h5.811l1.378 3.791h3.644L17.472 3.003zm-3.69 11.236l2.122-5.834 2.122 5.834h-4.244zM2.6 20.997h3.644L12.528 3.003H8.884L2.6 20.997z" />
                      </svg>
                    )}
                    {item.type === 'meta' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7.5h2v2z" />
                      </svg>
                    )}
                    {item.type === 'mistral' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm12 0h4v4h-4v-4z" />
                      </svg>
                    )}
                    {item.type === 'ts' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1.125 0C.507 0 0 .507 0 1.125v21.75C0 23.493.507 24 1.125 24h21.75c.618 0 1.125-.507 1.125-1.125V1.125C24 .507 23.493 0 22.875 0H1.125zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.79-.263 6.814 6.814 0 0 0-.916-.165 6.13 6.13 0 0 0-1.022-.075c-.504 0-.9.083-1.189.25-.288.166-.432.427-.432.783 0 .23.056.417.168.562.112.145.267.266.465.362.198.096.435.18.71.25.277.072.587.149.93.232.493.118.948.261 1.365.43.417.168.77.387 1.058.657.288.27.506.597.654.981.148.384.222.846.222 1.387 0 .762-.162 1.41-.486 1.944a4.343 4.343 0 0 1-1.353 1.373c-.58.337-1.272.576-2.077.717-.805.141-1.685.212-2.64.212-.876 0-1.7-.08-2.472-.24a10.026 10.026 0 0 1-2.037-.674v-2.64c.732.435 1.5.766 2.304.993.805.227 1.62.34 2.447.34.54 0 .977-.087 1.312-.262.335-.175.503-.45.503-.825 0-.255-.062-.46-.188-.615a1.8 1.8 0 0 0-.495-.412c-.205-.105-.445-.195-.72-.27-.275-.075-.572-.152-.892-.232-.51-.128-.977-.282-1.402-.462a3.844 3.844 0 0 1-1.088-.705 2.87 2.87 0 0 1-.682-1.012c-.158-.415-.237-.91-.237-1.485 0-.743.167-1.373.502-1.89.335-.518.803-.934 1.403-1.248.6-.315 1.315-.536 2.145-.664.83-.128 1.738-.192 2.723-.192zm-8.895 2.37v11.755H6.555V12.12H2.25V9.875h12.72v2.245H9.593z" />
                      </svg>
                    )}
                    {item.type === 'zod' && (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.75 3h16.5A.75.75 0 0121 3.75v3a.75.75 0 01-.75.75H8.31l12.19 11.25a.75.75 0 01.25.55v4.2a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-3a.75.75 0 01.75-.75h11.94L3.5 8.55A.75.75 0 013.25 8V3.75A.75.75 0 013.75 3z" />
                      </svg>
                    )}
                    {item.type === 'node' && (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1.5a1.5 1.5 0 0 0-.75.2l-8.25 4.76A1.5 1.5 0 0 0 2.25 7.76v9.48a1.5 1.5 0 0 0 .75 1.3l8.25 4.76a1.5 1.5 0 0 0 1.5 0l8.25-4.76a1.5 1.5 0 0 0 .75-1.3V7.76a1.5 1.5 0 0 0-.75-1.3L12.75 1.7A1.5 1.5 0 0 0 12 1.5zm-1.5 6.75h3a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 .75-.75z" />
                      </svg>
                    )}
                    <span style={{ fontWeight: 650, fontSize: '14.5px', letterSpacing: '-0.3px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §2 INTERACTIVE CODE WORKBENCH (Legacy vs Vulcan)
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${s.border}`,
        background: isDark ? '#050505' : '#ffffff',
        padding: 'clamp(48px, 6vw, 80px) clamp(16px, 4vw, 40px)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ marginBottom: '36px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0070f3', marginBottom: '10px' }}>
              Developer Workbench
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-1px', color: s.textPrimary, margin: '0 0 12px' }}>
              Built for Production. Not Demos.
            </h2>
            <p style={{ fontSize: '15px', color: s.textSecondary, maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' }}>
              Select a real-world scenario to see how Vulcan eliminates hundreds of lines of fragile graph boilerplate.
            </p>
          </div>

          {/* Scenario Tabs Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '28px',
          }}>
            {[
              { id: 'basic', label: 'Basic Agent & Tools' },
              { id: 'guardrails', label: 'Safety & Guardrails' },
              { id: 'handoffs', label: 'Multi-Agent Handoffs' },
            ].map(sc => (
              <button
                key={sc.id}
                onClick={() => setWorkbenchScenario(sc.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: workbenchScenario === sc.id
                    ? '1px solid #0070f3'
                    : `1px solid ${isDark ? '#222222' : '#e0e0e0'}`,
                  background: workbenchScenario === sc.id
                    ? (isDark ? 'rgba(0,112,243,0.15)' : '#0070f3')
                    : (isDark ? '#0a0a0a' : '#ffffff'),
                  color: workbenchScenario === sc.id
                    ? (isDark ? '#38bdf8' : '#ffffff')
                    : (isDark ? '#888888' : '#555555'),
                  transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                }}
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Interactive Metric Pill Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '999px',
              background: isDark ? '#111111' : '#f5f5f5',
              border: `1px solid ${isDark ? '#222' : '#e5e5e5'}`,
              fontSize: '12px', color: isDark ? '#cccccc' : '#444444',
            }}>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>Legacy Frameworks:</span> 80+ lines boilerplate
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '999px',
              background: isDark ? 'rgba(74,222,128,0.08)' : '#f0fdf4',
              border: `1px solid ${isDark ? 'rgba(74,222,128,0.25)' : '#bbf7d0'}`,
              fontSize: '12px', color: isDark ? '#4ade80' : '#166534', fontWeight: 600,
            }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>With Vulcan:</span> 85% less code & zero bloat
            </div>
          </div>

          {/* Side-by-Side Interactive Workbench Grid */}
          <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}` }}
            className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[#1a1a1a]">

            {/* Left Panel: Legacy Frameworks */}
            <div style={{ background: '#09090b', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '12px 18px',
                borderBottom: '1px solid #1c1c1f',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {workbenchScenario === 'basic' && 'LangChain / LangGraph (65+ Lines)'}
                    {workbenchScenario === 'guardrails' && 'Custom Interceptor Middleware (45+ Lines)'}
                    {workbenchScenario === 'handoffs' && 'Complex Graph State Routing (55+ Lines)'}
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#666' }}>Heavy Dependencies</span>
              </div>
              <pre style={{
                padding: '20px 22px',
                margin: 0,
                fontSize: '12.5px',
                lineHeight: '1.75',
                fontFamily: 'var(--font-mono)',
                color: '#71717a',
                textAlign: 'left',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flex: 1,
              }}>
                {workbenchScenario === 'basic' && `// 65+ lines of StateGraph & ToolNode setup
import { ChatOpenAI } from "@langchain/openai"
import { ToolNode } from "@langchain/langgraph"
import { StateGraph, MessagesAnnotation }
  from "@langchain/langgraph"

const model = new ChatOpenAI({ model: "gpt-4o" })
  .bindTools(tools)

function shouldContinue({ messages }) {
  const lastMsg = messages[messages.length - 1]
  if (lastMsg.tool_calls?.length) return "tools"
  return "__end__"
}

async function callModel(state) {
  const res = await model.invoke(state.messages)
  return { messages: [res] }
}

const workflow = new StateGraph(MessagesAnnotation)
workflow.addNode("agent", callModel)
workflow.addNode("tools", new ToolNode(tools))
workflow.addEdge("__start__", "agent")
workflow.addConditionalEdges("agent", shouldContinue)

const app = workflow.compile()
const res = await app.invoke({ messages: [input] })`}

                {workbenchScenario === 'guardrails' && `// Manual Regex Interceptor Classes
class PIIInterceptor {
  async intercept(input: string) {
    if (input.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)/)) {
      throw new Error("PII Leak Detected!")
    }
  }
}

class KeywordBlocker {
  constructor(private keywords: string[]) {}
  async check(text: string) {
    for (const kw of this.keywords) {
      if (text.toLowerCase().includes(kw)) return false
    }
    return true
  }
}
// Wrap manually around every execution node...`}

                {workbenchScenario === 'handoffs' && `// Complex conditional state graph routing
const workflow = new StateGraph(MultiAgentState)
workflow.addNode("billing_agent", billingHandler)
workflow.addNode("support_agent", supportHandler)

workflow.addConditionalEdges("triage", (state) => {
  if (state.visited.includes(state.target)) {
    throw new Error("Infinite handoff loop detected!")
  }
  return state.target
})

const app = workflow.compile()`}
              </pre>
            </div>

            {/* Right Panel: Vulcan Agentic SDK */}
            <div style={{ background: '#040404', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{
                padding: '12px 18px',
                borderBottom: '1px solid #1c1c1f',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: '#4ade80', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {workbenchScenario === 'basic' && 'Vulcan SDK (6 Clean Lines)'}
                    {workbenchScenario === 'guardrails' && 'Vulcan SDK (1 Line Guardrails)'}
                    {workbenchScenario === 'handoffs' && 'Vulcan SDK (3 Lines Handoff)'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const snippet = workbenchScenario === 'basic'
                      ? `import { Vulcan } from 'vulcan-agentic-sdk'\nconst agent = Vulcan.createAgent({ name: 'assistant', tools: [searchTool] })\nconst { output } = await Vulcan.run(agent, 'Query')`
                      : workbenchScenario === 'guardrails'
                        ? `import { Vulcan, PIIScrubberGuardrail } from 'vulcan-agentic-sdk'\nconst agent = Vulcan.createAgent({ name: 'safe-bot', guardrails: [new PIIScrubberGuardrail()] })`
                        : `const triage = Vulcan.createAgent({ name: 'triage' }).withHandoff(billingAgent)`
                    navigator.clipboard.writeText(snippet)
                    setWorkbenchCopied(true)
                    setTimeout(() => setWorkbenchCopied(false), 2000)
                  }}
                  style={{
                    color: workbenchCopied ? '#4ade80' : '#888888',
                    background: workbenchCopied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${workbenchCopied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.15s',
                  }}
                >
                  {workbenchCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <pre style={{
                padding: '20px 22px',
                margin: 0,
                fontSize: '12.5px',
                lineHeight: '1.75',
                fontFamily: 'var(--font-mono)',
                color: '#e4e4e7',
                textAlign: 'left',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flex: 1,
              }}>
                {workbenchScenario === 'basic' && (
                  <>
                    <span style={{ color: '#79b8ff' }}>import</span> {'{ Vulcan, z }'} <span style={{ color: '#79b8ff' }}>from</span> <span style={{ color: '#9ecbff' }}>'vulcan-agentic-sdk'</span>{'\n\n'}
                    <span style={{ color: '#79b8ff' }}>const</span> agent = <span style={{ color: '#ffab70' }}>Vulcan</span>.<span style={{ color: '#b39ddb' }}>createAgent</span>({`{\n`}
                    {'  '}name: <span style={{ color: '#9ecbff' }}>'assistant'</span>,{`\n`}
                    {'  '}instructions: <span style={{ color: '#9ecbff' }}>'Help the user with tools.'</span>,{`\n`}
                    {'  '}tools: [searchTool, calcTool],{`\n`}
                    {`}`}){'\n\n'}
                    <span style={{ color: '#79b8ff' }}>const</span> {'{ output }'} = <span style={{ color: '#79b8ff' }}>await</span> <span style={{ color: '#ffab70' }}>Vulcan</span>.<span style={{ color: '#b39ddb' }}>run</span>({`\n`}
                    {'  '}agent,{`\n`}
                    {'  '}<span style={{ color: '#9ecbff' }}>'What is 128 multiplied by 37?'</span>{`\n`}
                    ){'\n'}
                    <span style={{ color: '#555555', fontStyle: 'italic' }}>// ✓ Auto tool execution loop + Zod schema validation</span>
                  </>
                )}

                {workbenchScenario === 'guardrails' && (
                  <>
                    <span style={{ color: '#79b8ff' }}>import</span> {'{ Vulcan, PIIScrubberGuardrail, KeywordBlockGuardrail }'}{'\n'}
                    {'  '}<span style={{ color: '#79b8ff' }}>from</span> <span style={{ color: '#9ecbff' }}>'vulcan-agentic-sdk'</span>{'\n\n'}
                    <span style={{ color: '#79b8ff' }}>const</span> agent = <span style={{ color: '#ffab70' }}>Vulcan</span>.<span style={{ color: '#b39ddb' }}>createAgent</span>({`{\n`}
                    {'  '}name: <span style={{ color: '#9ecbff' }}>'secure-agent'</span>,{`\n`}
                    {'  '}instructions: <span style={{ color: '#9ecbff' }}>'Safe AI assistant.'</span>,{`\n`}
                    {'  '}guardrails: [{`\n`}
                    {'    '}<span style={{ color: '#79b8ff' }}>new</span> <span style={{ color: '#ffab70' }}>KeywordBlockGuardrail</span>([<span style={{ color: '#9ecbff' }}>'jailbreak'</span>]), <span style={{ color: '#555555', fontStyle: 'italic' }}>// Intercepts prompt</span>{`\n`}
                    {'    '}<span style={{ color: '#79b8ff' }}>new</span> <span style={{ color: '#ffab70' }}>PIIScrubberGuardrail</span>(),               <span style={{ color: '#555555', fontStyle: 'italic' }}>// Scrubs output PII</span>{`\n`}
                    {'  '}],{`\n`}
                    {`}`}){'\n\n'}
                    <span style={{ color: '#555555', fontStyle: 'italic' }}>// ✓ Intercepts prompt, tool inputs, and output text</span>
                  </>
                )}

                {workbenchScenario === 'handoffs' && (
                  <>
                    <span style={{ color: '#79b8ff' }}>const</span> billing = <span style={{ color: '#ffab70' }}>Vulcan</span>.<span style={{ color: '#b39ddb' }}>createAgent</span>({`{ name: `}<span style={{ color: '#9ecbff' }}>'billing'</span>{`, ... }`}){'\n'}
                    <span style={{ color: '#79b8ff' }}>const</span> support = <span style={{ color: '#ffab70' }}>Vulcan</span>.<span style={{ color: '#b39ddb' }}>createAgent</span>({`{ name: `}<span style={{ color: '#9ecbff' }}>'support'</span>{`, ... }`}){'\n\n'}
                    <span style={{ color: '#555555', fontStyle: 'italic' }}>// Built-in cycle detection & automatic state context transfer!</span>{'\n'}
                    <span style={{ color: '#79b8ff' }}>const</span> triage = <span style={{ color: '#ffab70' }}>Vulcan</span>.<span style={{ color: '#b39ddb' }}>createAgent</span>({`{ name: `}<span style={{ color: '#9ecbff' }}>'triage'</span>{` }`}){'\n'}
                    {'  '}.<span style={{ color: '#b39ddb' }}>withHandoff</span>(billing){'\n'}
                    {'  '}.<span style={{ color: '#b39ddb' }}>withHandoff</span>(support){'\n\n'}
                    <span style={{ color: '#79b8ff' }}>const</span> {'{ output }'} = <span style={{ color: '#79b8ff' }}>await</span> <span style={{ color: '#ffab70' }}>Vulcan</span>.<span style={{ color: '#b39ddb' }}>run</span>(triage, <span style={{ color: '#9ecbff' }}>'I need a refund.'</span>)
                  </>
                )}
              </pre>
            </div>
          </div>

          {/* 3 callout feature pills below */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '28px', justifyContent: 'center' }}>
            {[
              { bad: 'Fragile Graph Wiring', good: 'Declarative Agent Config' },
              { bad: 'Heavy Package Bloat', good: 'Zero Heavy Dependencies (< 50KB)' },
              { bad: 'Opaque Execution Graphs', good: 'Full OTLP Telemetry & Tracing' },
            ].map(item => (
              <div key={item.bad} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: isDark ? '#0a0a0a' : '#f5f5f5',
                border: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}`,
                borderRadius: '999px', padding: '6px 14px',
              }}>
                <span style={{ fontSize: '11.5px', color: '#777777', textDecoration: 'line-through' }}>{item.bad}</span>
                <span style={{ color: '#444', fontSize: '11.5px' }}>→</span>
                <span style={{ fontSize: '11.5px', color: '#4ade80', fontWeight: 600 }}>✓ {item.good}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §3 FEATURE GRID
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${s.border}`,
        background: s.sectionBg,
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0070f3', marginBottom: '10px' }}>
              Engineered Architecture
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-1px', color: s.textPrimary, margin: '0 0 10px' }}>
              Everything you need for production agents.
            </h2>
            <p style={{ fontSize: '15px', color: s.textSecondary, maxWidth: '540px', lineHeight: '1.65' }}>
              Nine core primitives. Cleanly decoupled. Composable in any combination.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {FEATURES.map(f => <FeatureCard key={f.num} {...f} isDark={isDark} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §4 INTERACTIVE SANDBOX
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${s.border}`,
        background: isDark ? '#050505' : '#ffffff',
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0070f3', marginBottom: '10px' }}>
                Interactive Demo
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.8px', color: s.textPrimary, margin: '0 0 8px' }}>
                Watch the agent loop run live.
              </h2>
              <p style={{ fontSize: '14px', color: s.textSecondary, margin: 0 }}>
                Simulate a real Vulcan.run() call — tool invocations, guardrails, and final output.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: s.textSecondary }}>agent runtime active</span>
            </div>
          </div>
          <div style={{
            borderRadius: '12px',
            border: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}`,
            overflow: 'hidden',
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.08)',
          }}>
            <InteractiveSandbox theme={theme} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §5 COMPARISON TABLE
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${s.border}`,
        background: s.sectionBg,
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0070f3', marginBottom: '10px' }}>
              Why Vulcan?
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.8px', color: s.textPrimary, margin: '0 0 10px' }}>
              You know the alternatives. Here are the tradeoffs.
            </h2>
            <p style={{ fontSize: '14.5px', color: s.textSecondary, maxWidth: '500px', margin: '0 auto', lineHeight: '1.65' }}>
              No marketing claims — just a factual feature matrix.
            </p>
          </div>

          <div style={{
            border: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: isDark ? '#0a0a0a' : '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: s.textSecondary, fontWeight: 600, borderBottom: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}`, fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Feature</th>
                  {['Vulcan', 'LangChain', 'AutoGPT'].map((col, ci) => (
                    <th key={col} style={{
                      textAlign: 'center', padding: '12px 16px',
                      color: ci === 0 ? '#0070f3' : s.textSecondary,
                      fontWeight: ci === 0 ? 700 : 500,
                      borderBottom: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}`,
                      fontSize: '12px', fontFamily: 'var(--font-mono)',
                      background: ci === 0 ? (isDark ? '#001a3a' : '#eff6ff') : 'transparent',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Zero-dependency core', '✓', '✗', '✗'],
                  ['Zod-validated tool args', '✓', '✗', '✗'],
                  ['Built-in cycle detection', '✓', '✗', '✗'],
                  ['Native TypeScript-first', '✓', 'Partial', '✗'],
                  ['Structured per-run traces', '✓', 'Plugin only', '✗'],
                  ['Custom storage adapters', '✓', 'Partial', '✗'],
                  ['< 50kb gzipped', '✓', '✗  (~3MB+)', '✗'],
                  ['MIT Licensed', '✓', '✓', '✓'],
                ].map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? (isDark ? '#030303' : '#fff') : (isDark ? '#060606' : '#fafafa') }}>
                    <td style={{ padding: '11px 16px', color: s.textSecondary, borderBottom: ri < 7 ? `1px solid ${isDark ? '#111' : '#f0f0f0'}` : 'none', fontSize: '13px' }}>{row[0]}</td>
                    {row.slice(1).map((cell, ci) => (
                      <td key={ci} style={{
                        padding: '11px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12.5px',
                        fontWeight: 700,
                        color: ci === 0 ? '#4ade80' : cell === '✗' ? '#ef4444' : cell === '✓' ? '#4ade80' : '#888',
                        borderBottom: ri < 7 ? `1px solid ${isDark ? '#111' : '#f0f0f0'}` : 'none',
                        background: ci === 0 ? (isDark ? '#001a3a0a' : '#eff6ff44') : 'transparent',
                      }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11.5px', color: s.textSecondary, textAlign: 'center', marginTop: '14px', opacity: 0.75 }}>
            Comparison reflects default installs as of writing. Verify against each project's current docs before relying on it.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §6 TESTIMONIALS (Horizontal Marquee Slider)
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${s.border}`,
        background: isDark ? '#050505' : '#ffffff',
        padding: '80px 0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto 48px', textAlign: 'center', padding: '0 40px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0070f3', marginBottom: '10px' }}>
            From the Community
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.8px', color: s.textPrimary, margin: 0 }}>
            What developers are saying.
          </h2>
          <p style={{ fontSize: '14px', color: s.textSecondary, margin: '8px 0 0' }}>
            Loved by tech leaders, open-source builders, and software engineers worldwide.
          </p>
        </div>

        {/* Horizontal Marquee Container with Left & Right Gradient Blur Overlays */}
        <div style={{
          width: '100%',
          position: 'relative',
          padding: '10px 0',
        }}>
          {/* Left Edge Gradient Fade */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '140px',
            zIndex: 10,
            pointerEvents: 'none',
            background: `linear-gradient(to right, ${isDark ? '#050505' : '#ffffff'} 0%, transparent 100%)`,
          }} />

          {/* Right Edge Gradient Fade */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '140px',
            zIndex: 10,
            pointerEvents: 'none',
            background: `linear-gradient(to left, ${isDark ? '#050505' : '#ffffff'} 0%, transparent 100%)`,
          }} />

          {/* Marquee list */}
          <div className="horizontal-scroll-hide-scrollbar" style={{ width: '100%', overflowX: 'auto' }}>
            <div className="animate-marquee" style={{ gap: '20px', paddingLeft: '20px' }}>
              {(() => {
                const testimonialsList = [
                  {
                    quote: 'Vulcan makes building AI agents clean and accessible for every TypeScript developer. Zero bloat, pure logic.',
                    name: 'Hitesh Choudhary', role: 'Tech Educator & Founder', initials: 'HC', color: '#0070f3',
                  },
                  {
                    quote: 'Type-safe tool calls with Zod validation out of the box is brilliant. No extra framework overhead, just solid code.',
                    name: 'Piyush Garg', role: 'Full Stack & AI Engineer', initials: 'PG', color: '#8b5cf6',
                  },
                  {
                    quote: 'The built-in web search and code sandbox tools saved our team hours of setup. Super fast and easy to use.',
                    name: 'Peeyush', role: 'Full Stack Developer', initials: 'P', color: '#06b6d4',
                  },
                  {
                    quote: 'Human-in-the-loop approvals and guardrails give us peace of mind when running AI workflows in production.',
                    name: 'Ayush', role: 'AI Engineer', initials: 'A', color: '#10b981',
                  },
                  {
                    quote: 'The event streaming API makes building interactive agent UIs so smooth. Truly developer-first!',
                    name: 'Vaishnavi', role: 'Frontend Specialist', initials: 'V', color: '#ec4899',
                  },
                  {
                    quote: 'Agent handoffs and cycle detection prevent infinite loops automatically. Essential for multi-agent apps.',
                    name: 'Dipak Kumar', role: 'Backend & Systems Dev', initials: 'DK', color: '#f59e0b',
                  },
                  {
                    quote: 'Lightweight, zero dependencies, and multi-provider support. Switching between Gemini, Groq, OpenAI, and Claude is seamless.',
                    name: 'Aman Singh', role: 'TypeScript Developer', initials: 'AS', color: '#3b82f6',
                  },
                  {
                    quote: 'The SQLite session storage and structured tracing are incredible. Everything you need for production agents.',
                    name: 'Sujal Rai', role: 'Software Engineer', initials: 'SR', color: '#6366f1',
                  },
                  {
                    quote: 'Clean API design and beautiful developer experience. Vulcan sets a new standard for TypeScript AI frameworks.',
                    name: 'Anushka', role: 'UI/UX & Frontend Engineer', initials: 'AN', color: '#a855f7',
                  },
                ]

                // Double the array for continuous seamless infinite loop
                return [...testimonialsList, ...testimonialsList].map((t, idx) => (
                  <div
                    key={`${t.name}-${idx}`}
                    style={{
                      width: '340px',
                      flexShrink: 0,
                      border: `1px solid ${isDark ? '#1f1f1f' : '#e5e5e5'}`,
                      borderRadius: '12px',
                      padding: '24px',
                      background: isDark ? '#0c0c0c' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '18px',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.04)',
                      transition: 'border-color 0.2s, transform 0.2s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = t.color
                      e.currentTarget.style.transform = 'translateY(-3px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isDark ? '#1f1f1f' : '#e5e5e5'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* Stars */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: '#fbbf24', fontSize: '13px' }}>★</span>
                      ))}
                    </div>

                    {/* Quote */}
                    <p style={{
                      fontSize: '13.5px',
                      lineHeight: '1.65',
                      color: isDark ? '#cccccc' : '#444444',
                      margin: 0,
                      flex: 1,
                      fontStyle: 'normal',
                    }}>
                      "{t.quote}"
                    </p>

                    {/* Author */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: `1px solid ${isDark ? '#1a1a1a' : '#f0f0f0'}`, paddingTop: '14px' }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: `${t.color}1e`, border: `1px solid ${t.color}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, color: t.color, fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                      }}>{t.initials}</div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 650, color: s.textPrimary, letterSpacing: '-0.2px' }}>{t.name}</div>
                        <div style={{ fontSize: '11px', color: s.textSecondary, marginTop: '1px' }}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §7 OPEN SOURCE CTA BAND
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${isDark ? '#1a1a1a' : '#e5e5e5'}`,
        background: '#000',
        padding: '72px 40px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-1.5px', color: '#fff', margin: 0, lineHeight: 1.15 }}>
            Open source forever.<br />Built by developers, for developers.
          </h2>

          <p style={{ fontSize: '15.5px', color: '#666', maxWidth: '500px', lineHeight: '1.7', margin: 0 }}>
            Vulcan is and always will be free and open source.
            Star it, fork it, contribute to it.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <a
              href="https://github.com/its-rahul-r15/VULCAN-SDK"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '42px', padding: '0 22px', borderRadius: '999px',
                background: '#fff', color: '#000',
                fontSize: '13.5px', fontWeight: 600, textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              View on GitHub
            </a>
            <button
              onClick={() => onViewChange('docs')}
              style={{
                height: '42px', padding: '0 22px', borderRadius: '999px',
                background: 'transparent', border: '1px solid #333', color: '#a1a1a1',
                fontSize: '13.5px', fontWeight: 500, cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#a1a1a1' }}
            >
              Read the Docs →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §8 FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: `1px solid ${isDark ? '#1a1a1a' : '#e5e5e5'}`,
        background: isDark ? '#000' : '#fff',
        padding: '56px 40px 36px',
        color: isDark ? '#444' : '#aaa',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '32px', marginBottom: '48px', textAlign: 'left' }}>
            {[
              {
                heading: 'Core SDK', links: [
                  { label: 'Agent Runner', action: () => onViewChange('docs') },
                  { label: 'Type-Safe Tools', action: () => onViewChange('docs') },
                  { label: 'Session Storage', action: () => onViewChange('docs') },
                  { label: 'Tracing', action: () => onViewChange('docs') },
                  { label: 'Streaming Events', action: () => onViewChange('docs') },
                ]
              },
              {
                heading: 'Guardrails', links: [
                  { label: 'PII Scrubber', action: () => onViewChange('docs') },
                  { label: 'MaxLength', action: () => onViewChange('docs') },
                  { label: 'Keyword Blocker', action: () => onViewChange('docs') },
                  { label: 'Blocked Tools', action: () => onViewChange('docs') },
                  { label: 'Custom Functions', action: () => onViewChange('docs') },
                ]
              },
              {
                heading: 'Providers', links: [
                  { label: 'Google Gemini', action: () => onViewChange('docs') },
                  { label: 'OpenAI GPT', action: () => onViewChange('docs') },
                  { label: 'Anthropic Claude', action: () => onViewChange('docs') },
                ]
              },
              {
                heading: 'Resources', links: [
                  { label: 'Quickstart', action: () => onViewChange('docs') },
                  { label: 'API Reference', action: () => onViewChange('docs') },
                  { label: 'Changelog', href: 'https://github.com/its-rahul-r15/VULCAN-SDK/releases' },
                  { label: 'GitHub', href: 'https://github.com/its-rahul-r15/VULCAN-SDK' },
                  { label: 'MIT License', href: 'https://github.com/its-rahul-r15/VULCAN-SDK/blob/master/LICENSE' },
                ]
              },
            ].map(col => (
              <div key={col.heading}>
                <h4 style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: isDark ? '#fff' : '#111', marginBottom: '14px',
                }}>{col.heading}</h4>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {col.links.map(l => (
                    <li key={l.label}>
                      {l.href ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '13px', color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#111'}
                          onMouseLeave={e => e.currentTarget.style.color = ''}
                        >{l.label}</a>
                      ) : (
                        <button onClick={l.action}
                          style={{ fontSize: '13px', color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s', textAlign: 'left' }}
                          onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#111'}
                          onMouseLeave={e => e.currentTarget.style.color = ''}
                        >{l.label}</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: `1px solid ${isDark ? '#1a1a1a' : '#f0f0f0'}`,
            paddingTop: '20px',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            fontSize: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 14, height: 14,
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                background: isDark ? '#fff' : '#111',
              }} />
              <span style={{ color: isDark ? '#555' : '#aaa' }}>© 2026 Vulcan SDK. Open source under MIT License.</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <button onClick={() => onViewChange('docs')}
                style={{ fontSize: '12px', color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#111'}
                onMouseLeave={e => e.currentTarget.style.color = ''}>Documentation</button>
              <a href="https://www.npmjs.com/package/vulcan-agentic-sdk" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#111'}
                onMouseLeave={e => e.currentTarget.style.color = ''}>npm Package</a>
              <a href="https://github.com/its-rahul-r15/VULCAN-SDK" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#111'}
                onMouseLeave={e => e.currentTarget.style.color = ''}>GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
        @media (max-width: 640px) {
          .hero-section { padding: 32px 16px 44px !important; overflow-x: hidden !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
          .hero-headline { font-size: 25px !important; letter-spacing: -0.5px !important; line-height: 1.22 !important; text-align: center !important; margin-left: auto !important; margin-right: auto !important; word-break: normal !important; overflow-wrap: break-word !important; }
          .hero-subtitle { font-size: 14px !important; line-height: 1.6 !important; margin-bottom: 20px !important; max-width: 100% !important; text-align: center !important; margin-left: auto !important; margin-right: auto !important; word-break: normal !important; overflow-wrap: break-word !important; }
          .hero-cta-row { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; width: 100% !important; gap: 10px !important; margin-left: auto !important; margin-right: auto !important; }
          .hero-cta-row button { width: 100% !important; max-width: 320px !important; margin: 0 auto !important; display: flex !important; justify-content: center !important; align-items: center !important; text-align: center !important; min-width: 0 !important; box-sizing: border-box !important; }
          .hero-copy-btn { font-size: 11.5px !important; padding: 0 12px !important; }
          .hero-metrics-row { grid-template-columns: repeat(2, 1fr) !important; gap: 14px 12px !important; text-align: center !important; max-width: 300px !important; margin-left: auto !important; margin-right: auto !important; }
          .hero-metrics-row > div { align-items: center !important; text-align: center !important; }
          section { padding-left: 16px !important; padding-right: 16px !important; box-sizing: border-box !important; }
          footer { padding-left: 16px !important; padding-right: 16px !important; box-sizing: border-box !important; }
        }
        @media (max-width: 380px) {
          .hero-section { padding: 24px 12px 36px !important; }
          .hero-headline { font-size: 22px !important; letter-spacing: -0.4px !important; line-height: 1.24 !important; }
          .hero-subtitle { font-size: 13px !important; line-height: 1.55 !important; margin-bottom: 16px !important; }
          .hero-cta-row button { max-width: 100% !important; height: 38px !important; font-size: 12px !important; }
          .hero-copy-btn { font-size: 10.5px !important; padding: 0 8px !important; gap: 5px !important; }
          .hero-metrics-row { gap: 10px 8px !important; max-width: 100% !important; }
          .hero-metrics-row span { font-size: 11.5px !important; }
          section { padding-left: 12px !important; padding-right: 12px !important; }
          footer { padding-left: 12px !important; padding-right: 12px !important; }
        }
      `}</style>
    </main>
  )
}