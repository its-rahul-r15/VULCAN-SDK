import React, { useState } from 'react'
import { InteractiveSandbox } from './InteractiveSandbox'

// ── Models list for Hero Selector ──────────────────────────────────────────
// Real Vulcan SDK supported models only
const HERO_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: 'openai' },
  { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: 'anthropic' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', icon: 'gemini' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: 'openai' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', icon: 'anthropic' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', icon: 'gemini' },
]

function ProviderIcon({ type, size = 15 }) {
  if (type === 'openai') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.535-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L11.74 19.9542a4.4992 4.4992 0 0 1-6.1408-1.6504zm-1.562-9.6006a4.4755 4.4755 0 0 1 2.3414-1.9735V12.491a.7854.7854 0 0 0 .3927.6813l5.8334 3.3685-2.02 1.1686a.071.071 0 0 1-.0615.0047l-4.8398-2.7913a4.504 4.504 0 0 1-1.6462-6.1428zm13.4735-3.08a4.4708 4.4708 0 0 1 .535 3.0136l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0L4.54 9.6644V7.332a.0804.0804 0 0 1 .0332-.0615l4.783-2.763a4.4992 4.4992 0 0 1 6.1408 1.6505zm1.562 9.6006a4.4755 4.4755 0 0 1-2.3414 1.9735v-5.7607a.7854.7854 0 0 0-.3927-.6813L13.52 10.49l2.02-1.1686a.071.071 0 0 1 .0615-.0047l4.8398 2.7913a4.504 4.504 0 0 1 1.6462 6.1428zM12 13.9142l-3.321-1.9168 3.321-1.9168 3.321 1.9168z"/>
      </svg>
    )
  }
  if (type === 'gemini') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"/>
      </svg>
    )
  }
  if (type === 'anthropic') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 3.003h-3.644L7.544 20.997h3.644l1.378-3.791h5.811l1.378 3.791h3.644L17.472 3.003zm-3.69 11.236l2.122-5.834 2.122 5.834h-4.244zM2.6 20.997h3.644L12.528 3.003H8.884L2.6 20.997z"/>
      </svg>
    )
  }
  if (type === 'meta') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7.5h2v2z"/>
      </svg>
    )
  }
  if (type === 'mistral') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm12 0h4v4h-4v-4z"/>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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

// ── Hero Code Tab Templates ──────────────────────────────────────────────────
const HERO_TEMPLATES = {
  // Run agent — 4 lines total
  Run: `import { Vulcan } from 'vulcan-agentic-sdk'

const agent = Vulcan.createAgent({
  name: 'assistant',
  instructions: 'You are a helpful AI.',
  tools: [searchTool, calcTool],
})

const { output } = await Vulcan.run(agent, 'What is 128 × 37?')
// → "128 multiplied by 37 is 4,736."`,

  // Tools — show just the result, not the full definition
  Tools: `import { Vulcan, z } from 'vulcan-agentic-sdk'

// Define a tool with Zod — args are auto-validated
const getWeather = Vulcan.createTool({
  name: 'get_weather',
  inputSchema: z.object({ city: z.string() }),
  async execute({ city }) {
    return { temp: 24, unit: 'C', city }
  },
})

// Agent calls the tool automatically
const { output } = await Vulcan.run(agent, 'Weather in Tokyo?')
// → "It is 24°C in Tokyo."`,

  // Handoffs — clean routing
  Handoffs: `const billing = Vulcan.createAgent({ name: 'billing', ... })
const support = Vulcan.createAgent({ name: 'support', ... })

// Wire handoffs with one call — cycle detection built-in
const triage = Vulcan.createAgent({ name: 'triage', ... })
  .withHandoff(billing)
  .withHandoff(support)

const { output } = await Vulcan.run(triage, userMessage, {
  session: 'user-abc123',
})`,

  // Guardrails — minimal
  Guardrails: `import { PIIScrubberGuardrail, KeywordBlockGuardrail }
  from 'vulcan-agentic-sdk'

const agent = Vulcan.createAgent({
  name: 'secure-bot',
  instructions: 'Help users safely.',
  guardrails: [
    new KeywordBlockGuardrail(['jailbreak']), // input
    new PIIScrubberGuardrail(),               // output
  ],
})`,
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
]

export function LandingPage({ onViewChange, theme }) {
  const isDark = theme === 'dark'
  const [copied, setCopied] = useState(false)
  const [heroTab, setHeroTab] = useState('Text')
  const [selectedModel, setSelectedModel] = useState(HERO_MODELS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [useGateway, setUseGateway] = useState(true)
  const [heroModelOpen, setHeroModelOpen] = useState(false)

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
      <section style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '72px 40px 80px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingTop: '12px' }}>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-2px',
              lineHeight: 1.1,
              margin: '0 0 20px',
              color: s.textPrimary,
            }}>
              Type-safe AI agents.<br />
              <span style={{ color: '#0070f3' }}>Zero framework bloat.</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: s.textSecondary,
              maxWidth: '460px',
              margin: '0 0 28px',
            }}>
              Build resilient, multi-turn agent workflows with Zod-validated tools,
              cycle-blocking handoffs, and custom safety guardrails — all in TypeScript.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
              <button
                onClick={() => onViewChange('docs')}
                style={{
                  height: '42px', padding: '0 22px', borderRadius: '999px',
                  background: isDark ? '#ffffff' : '#171717',
                  color: isDark ? '#000' : '#fff',
                  fontSize: '13.5px', fontWeight: 600, border: 'none', cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Read the docs ↗
              </button>

              <button
                onClick={copyInstall}
                style={{
                  height: '42px', padding: '0 18px', borderRadius: '999px',
                  background: isDark ? '#000' : '#fff',
                  border: `1px solid ${isDark ? '#2a2a2a' : '#ddd'}`,
                  color: isDark ? '#a1a1a1' : '#555',
                  fontSize: '12px', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0070f3'; e.currentTarget.style.color = isDark ? '#fff' : '#111' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#2a2a2a' : '#ddd'; e.currentTarget.style.color = isDark ? '#a1a1a1' : '#555' }}
              >
                <span style={{ color: '#0070f3', fontWeight: 700 }}>$</span>
                <span>npm i vulcan-agentic-sdk</span>
                <span style={{ color: copied ? '#4ade80' : '#666', fontSize: '11px' }}>
                  {copied ? '✓ Copied' : '⎘'}
                </span>
              </button>
            </div>

            {/* Real verifiable facts only */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '20px',
              borderTop: `1px solid ${s.border}`,
              paddingTop: '20px',
            }}>
              {[
                { value: '< 50kb', label: 'gzipped' },
                { value: 'MIT', label: 'License' },
                { value: 'v1.1', label: 'Stable' },
                { value: '3', label: 'LLM Providers' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: s.textPrimary }}>{m.value}</span>
                  <span style={{ fontSize: '11px', color: s.textSecondary, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{m.label}</span>
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
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid #1a1a1a', background: '#000000',
              }}>
                <div style={{ display: 'flex', borderRight: '1px solid #1a1a1a' }}>
                  {['Text', 'Tools', 'Handoffs', 'Guardrails', 'Streaming'].map((tab, idx) => {
                    const isActive = heroTab === tab
                    return (
                      <button
                        key={tab}
                        onClick={() => setHeroTab(tab)}
                        style={{
                          padding: '9px 18px',
                          fontSize: '12.5px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontWeight: isActive ? 600 : 400,
                          background: isActive ? '#111111' : 'transparent',
                          border: 'none',
                          borderRight: '1px solid #1a1a1a',
                          cursor: 'pointer',
                          color: isActive ? '#ffffff' : '#777777',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#cccccc' }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#777777' }}
                      >{tab}</button>
                    )
                  })}
                </div>
              </div>

              {/* Code Body with Line Numbers */}
              <div style={{ padding: '18px 20px 22px', height: '265px', overflowY: 'auto', overflowX: 'auto', background: '#000' }}>
                <pre style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.75', fontFamily: 'var(--font-mono)' }}>
                  {(() => {
                    const codeStr = getHeroCodeString(heroTab, selectedModel.id)
                    const lines = codeStr.split('\n')
                    return (
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {/* Line numbers column */}
                        <div style={{ userSelect: 'none', opacity: 0.35, textAlign: 'right', minWidth: '16px', color: '#888' }}>
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
                                dangerouslySetInnerHTML={{ __html:
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
              <div style={{
                borderTop: '1px solid #1a1a1a', background: '#0a0a0a',
                padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: '0 0 10px 10px',
              }}>
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
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
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
                                  <path d="M20 6L9 17l-5-5"/>
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
                  }}>Use With AI Gateway</span>
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

        {/* ── Trust logos band (Monochrome Company Logos) ── */}
        <div style={{
          marginTop: '64px',
          borderTop: `1px solid ${s.border}`,
          paddingTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
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
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px 36px',
            padding: '4px 0',
          }}>
            {/* Google Gemini */}
            <div
              style={{
                color: isDark ? '#ffffff' : '#171717',
                opacity: isDark ? 0.85 : 0.8,
                transition: 'opacity 0.2s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isDark ? '0.85' : '0.8'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"/>
              </svg>
              <span style={{ fontWeight: 650, fontSize: '15px', letterSpacing: '-0.3px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Google <span style={{ fontWeight: 400, opacity: 0.8 }}>Gemini</span>
              </span>
            </div>

            {/* OpenAI */}
            <div
              style={{
                color: isDark ? '#ffffff' : '#171717',
                opacity: isDark ? 0.85 : 0.8,
                transition: 'opacity 0.2s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isDark ? '0.85' : '0.8'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.535-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L11.74 19.9542a4.4992 4.4992 0 0 1-6.1408-1.6504zm-1.562-9.6006a4.4755 4.4755 0 0 1 2.3414-1.9735V12.491a.7854.7854 0 0 0 .3927.6813l5.8334 3.3685-2.02 1.1686a.071.071 0 0 1-.0615.0047l-4.8398-2.7913a4.504 4.504 0 0 1-1.6462-6.1428zm13.4735-3.08a4.4708 4.4708 0 0 1 .535 3.0136l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0L4.54 9.6644V7.332a.0804.0804 0 0 1 .0332-.0615l4.783-2.763a4.4992 4.4992 0 0 1 6.1408 1.6505zm1.562 9.6006a4.4755 4.4755 0 0 1-2.3414 1.9735v-5.7607a.7854.7854 0 0 0-.3927-.6813L13.52 10.49l2.02-1.1686a.071.071 0 0 1 .0615-.0047l4.8398 2.7913a4.504 4.504 0 0 1 1.6462 6.1428zM12 13.9142l-3.321-1.9168 3.321-1.9168 3.321 1.9168z"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.4px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                OpenAI
              </span>
            </div>

            {/* Anthropic */}
            <div
              style={{
                color: isDark ? '#ffffff' : '#171717',
                opacity: isDark ? 0.85 : 0.8,
                transition: 'opacity 0.2s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isDark ? '0.85' : '0.8'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 3.003h-3.644L7.544 20.997h3.644l1.378-3.791h5.811l1.378 3.791h3.644L17.472 3.003zm-3.69 11.236l2.122-5.834 2.122 5.834h-4.244zM2.6 20.997h3.644L12.528 3.003H8.884L2.6 20.997z"/>
              </svg>
              <span style={{ fontWeight: 600, fontSize: '15.5px', letterSpacing: '-0.2px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Anthropic
              </span>
            </div>

            {/* TypeScript */}
            <div
              style={{
                color: isDark ? '#ffffff' : '#171717',
                opacity: isDark ? 0.85 : 0.8,
                transition: 'opacity 0.2s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isDark ? '0.85' : '0.8'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.125 0C.507 0 0 .507 0 1.125v21.75C0 23.493.507 24 1.125 24h21.75c.618 0 1.125-.507 1.125-1.125V1.125C24 .507 23.493 0 22.875 0H1.125zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.79-.263 6.814 6.814 0 0 0-.916-.165 6.13 6.13 0 0 0-1.022-.075c-.504 0-.9.083-1.189.25-.288.166-.432.427-.432.783 0 .23.056.417.168.562.112.145.267.266.465.362.198.096.435.18.71.25.277.072.587.149.93.232.493.118.948.261 1.365.43.417.168.77.387 1.058.657.288.27.506.597.654.981.148.384.222.846.222 1.387 0 .762-.162 1.41-.486 1.944a4.343 4.343 0 0 1-1.353 1.373c-.58.337-1.272.576-2.077.717-.805.141-1.685.212-2.64.212-.876 0-1.7-.08-2.472-.24a10.026 10.026 0 0 1-2.037-.674v-2.64c.732.435 1.5.766 2.304.993.805.227 1.62.34 2.447.34.54 0 .977-.087 1.312-.262.335-.175.503-.45.503-.825 0-.255-.062-.46-.188-.615a1.8 1.8 0 0 0-.495-.412c-.205-.105-.445-.195-.72-.27-.275-.075-.572-.152-.892-.232-.51-.128-.977-.282-1.402-.462a3.844 3.844 0 0 1-1.088-.705 2.87 2.87 0 0 1-.682-1.012c-.158-.415-.237-.91-.237-1.485 0-.743.167-1.373.502-1.89.335-.518.803-.934 1.403-1.248.6-.315 1.315-.536 2.145-.664.83-.128 1.738-.192 2.723-.192zm-8.895 2.37v11.755H6.555V12.12H2.25V9.875h12.72v2.245H9.593z"/>
              </svg>
              <span style={{ fontWeight: 600, fontSize: '14.5px', letterSpacing: '-0.3px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                TypeScript
              </span>
            </div>

            {/* Zod */}
            <div
              style={{
                color: isDark ? '#ffffff' : '#171717',
                opacity: isDark ? 0.85 : 0.8,
                transition: 'opacity 0.2s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isDark ? '0.85' : '0.8'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.75 3h16.5A.75.75 0 0121 3.75v3a.75.75 0 01-.75.75H8.31l12.19 11.25a.75.75 0 01.25.55v4.2a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-3a.75.75 0 01.75-.75h11.94L3.5 8.55A.75.75 0 013.25 8V3.75A.75.75 0 013.75 3z"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '15.5px', letterSpacing: '0.4px', fontFamily: 'var(--font-mono)' }}>
                ZOD
              </span>
            </div>

            {/* Node.js */}
            <div
              style={{
                color: isDark ? '#ffffff' : '#171717',
                opacity: isDark ? 0.85 : 0.8,
                transition: 'opacity 0.2s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isDark ? '0.85' : '0.8'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1.5a1.5 1.5 0 0 0-.75.2l-8.25 4.76A1.5 1.5 0 0 0 2.25 7.76v9.48a1.5 1.5 0 0 0 .75 1.3l8.25 4.76a1.5 1.5 0 0 0 1.5 0l8.25-4.76a1.5 1.5 0 0 0 .75-1.3V7.76a1.5 1.5 0 0 0-.75-1.3L12.75 1.7A1.5 1.5 0 0 0 12 1.5zm-1.5 6.75h3a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 .75-.75z"/>
              </svg>
              <span style={{ fontWeight: 650, fontSize: '15px', letterSpacing: '-0.3px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Node.js
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §2 BEFORE / AFTER (Problem → Solution)
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${s.border}`,
        background: isDark ? '#050505' : '#ffffff',
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0070f3', marginBottom: '10px' }}>
              Problem → Solution
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 700, letterSpacing: '-1px', color: s.textPrimary, margin: '0 0 12px' }}>
              Most frameworks are designed for demos.
            </h2>
            <p style={{ fontSize: '15px', color: s.textSecondary, maxWidth: '560px', margin: '0 auto', lineHeight: '1.65' }}>
              Vulcan is designed for production. Compare the same agent in LangChain vs Vulcan.
            </p>
          </div>

          {/* Two-panel code comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}` }}
            className="compare-grid">
            {/* Before */}
            <div style={{ background: '#0a0a0a' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#555', letterSpacing: '0.06em' }}>BEFORE — LangChain</span>
              </div>
              <pre style={{ padding: '20px', margin: 0, fontSize: '12px', lineHeight: '1.7', fontFamily: 'var(--font-mono)', color: '#666', textAlign: 'left', overflowX: 'auto' }}>{`// 80+ lines of boilerplate
import { ChatOpenAI } from "@langchain/openai"
import { ToolNode } from "@langchain/langgraph"
import { StateGraph, MessagesAnnotation }
  from "@langchain/langgraph"

const model = new ChatOpenAI({ model: "gpt-4o" })
  .bindTools(tools)

function shouldContinue({ messages }) {
  const lastMessage = messages[messages.length - 1]
  if (lastMessage.tool_calls?.length) {
    return "tools"
  }
  return "__end__"
}

async function callModel(state) {
  const response = await model.invoke(state.messages)
  return { messages: [response] }
}

const workflow = new StateGraph(MessagesAnnotation)
workflow.addNode("agent", callModel)
workflow.addNode("tools", new ToolNode(tools))
workflow.addEdge("__start__", "agent")
workflow.addConditionalEdges("agent", shouldContinue)
workflow.addEdge("tools", "agent")

const app = workflow.compile()
const result = await app.invoke({ messages: [input] })`}</pre>
            </div>
            {/* After */}
            <div style={{ background: '#000' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#4ade80', letterSpacing: '0.06em' }}>WITH Vulcan</span>
              </div>
              <pre style={{ padding: '20px', margin: 0, fontSize: '12px', lineHeight: '1.7', fontFamily: 'var(--font-mono)', color: '#d4d4d4', textAlign: 'left', overflowX: 'auto' }}>{`import { Vulcan } from 'vulcan-agentic-sdk'

const agent = Vulcan.createAgent({
  name: 'assistant',
  instructions: 'Help the user.',
  tools: [myTool],
})

const { output } = await Vulcan.run(
  agent,
  'User input here',
  { session: 'user-123' }
)

// That's it. Vulcan handles:
// ✓ Tool call / result loop
// ✓ Zod argument validation
// ✓ Session persistence
// ✓ Structured tracing
// ✓ Guardrail evaluation`}</pre>
            </div>
          </div>

          {/* 3 callout pills below */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
            {[
              { bad: 'Graph wiring boilerplate', good: 'Declarative agent config' },
              { bad: 'Vendor lock-in', good: 'Swap models in one line' },
              { bad: 'Opaque execution graphs', good: 'Full structured trace per run' },
            ].map(item => (
              <div key={item.bad} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: isDark ? '#0a0a0a' : '#f5f5f5',
                border: `1px solid ${isDark ? '#1f1f1f' : '#e0e0e0'}`,
                borderRadius: '999px', padding: '6px 14px',
              }}>
                <span style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through' }}>{item.bad}</span>
                <span style={{ color: '#444', fontSize: '12px' }}>→</span>
                <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>✓ {item.good}</span>
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
              Six core primitives. Cleanly decoupled. Composable in any combination.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
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
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
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
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §6 TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${s.border}`,
        background: isDark ? '#050505' : '#ffffff',
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0070f3', marginBottom: '10px' }}>
              From the Community
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.8px', color: s.textPrimary, margin: 0 }}>
              What developers are saying.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[
              {
                quote: 'Switched from LangChain to Vulcan in a weekend. The Zod type safety alone saved us from three production incidents in the first month.',
                name: 'Arjun K.', role: 'Senior Backend Engineer', initials: 'AK', color: '#0070f3',
              },
              {
                quote: 'The guardrails system is exactly what we needed for our healthcare AI. The PII scrubber worked out of the box — no custom code at all.',
                name: 'Meera S.', role: 'Founding Engineer', initials: 'MS', color: '#8b5cf6',
              },
              {
                quote: 'Agent handoff cycle detection is a killer feature. We routed billing → tech → billing by mistake and Vulcan caught it instantly in staging.',
                name: 'James L.', role: 'AI Platform Lead', initials: 'JL', color: '#06b6d4',
              },
            ].map(t => (
              <div key={t.name} style={{
                border: `1px solid ${isDark ? '#1a1a1a' : '#e5e5e5'}`,
                borderRadius: '10px',
                padding: '24px',
                background: isDark ? '#050505' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = t.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = isDark ? '#1a1a1a' : '#e5e5e5'}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: '#fbbf24', fontSize: '13px' }}>★</span>
                  ))}
                </div>
                {/* Quote */}
                <p style={{ fontSize: '14px', lineHeight: '1.7', color: s.textSecondary, margin: 0, flex: 1, fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `${t.color}22`, border: `1px solid ${t.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: t.color, fontFamily: 'var(--font-mono)',
                  }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: s.textPrimary }}>{t.name}</div>
                    <div style={{ fontSize: '11.5px', color: s.textSecondary }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
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
          {/* MIT badge */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#4ade80',
            background: '#4ade8010',
            border: '1px solid #4ade8033',
            padding: '4px 12px', borderRadius: '999px',
          }}>
            Open Source · MIT License · No Vendor Lock-in
          </span>

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

          {/* Verifiable stats only */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', marginTop: '8px', justifyContent: 'center' }}>
            {[['MIT', 'License'], ['v1.0', 'Stable'], ['< 50kb', 'Gzipped'], ['3', 'LLM Providers']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>{val}</div>
                <div style={{ fontSize: '11px', color: '#555', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: '3px' }}>{label}</div>
              </div>
            ))}
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
          .hero-grid { grid-template-columns: 1fr !important; }
          .compare-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
          footer { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </main>
  )
}
