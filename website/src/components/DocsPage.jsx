import React, { useState, useRef, useEffect } from 'react'
import { docsData } from '../data/docsData'

const SIDEBAR_ITEMS = [
  {
    category: 'Getting Started',
    pages: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'installation', title: 'Installation' },
      { id: 'quickstart', title: 'Quickstart' },
    ]
  },
  {
    category: 'Core Primitives',
    pages: [
      { id: 'tools', title: 'Tools System' },
      { id: 'builtinTools', title: 'Built-in Tools' },
      { id: 'guardrails', title: 'Guardrails & Safety' },
      { id: 'memory-sessions', title: 'Memory & Sessions' },
    ]
  },
  {
    category: 'Advanced & Production',
    pages: [
      { id: 'budgets-reliability', title: 'Budgets & Self-Healing' },
      { id: 'hitlApprovals', title: 'Human-in-the-Loop (HITL)' },
      { id: 'handoffs', title: 'Agent Handoffs' },
      { id: 'tracing', title: 'Tracing & Observability' },
    ]
  },
  {
    category: 'Reference',
    pages: [
      { id: 'examples', title: 'Examples & Recipes' },
      { id: 'api-reference', title: 'API Reference' },
    ]
  }
]

const CALLOUT_STYLES = {
  tip: {
    dark: { border: '#2d6a4f', bg: 'rgba(29,105,79,0.12)', icon: '💡', label: 'Tip', labelColor: '#4ade80' },
    light: { border: '#86efac', bg: '#f0fdf4', icon: '💡', label: 'Tip', labelColor: '#16a34a' },
  },
  note: {
    dark: { border: '#1d4ed8', bg: 'rgba(29,78,216,0.1)', icon: 'ℹ', label: 'Note', labelColor: '#60a5fa' },
    light: { border: '#93c5fd', bg: '#eff6ff', icon: 'ℹ', label: 'Note', labelColor: '#2563eb' },
  },
  warning: {
    dark: { border: '#92400e', bg: 'rgba(120,53,15,0.15)', icon: '⚠', label: 'Warning', labelColor: '#fbbf24' },
    light: { border: '#fcd34d', bg: '#fffbeb', icon: '⚠', label: 'Warning', labelColor: '#d97706' },
  },
  danger: {
    dark: { border: '#991b1b', bg: 'rgba(127,29,29,0.15)', icon: '⛔', label: 'Danger', labelColor: '#f87171' },
    light: { border: '#fca5a5', bg: '#fef2f2', icon: '⛔', label: 'Danger', labelColor: '#dc2626' },
  },
  important: {
    dark: { border: '#7c3aed', bg: 'rgba(124,58,237,0.12)', icon: '✦', label: 'Important', labelColor: '#a78bfa' },
    light: { border: '#c4b5fd', bg: '#f5f3ff', icon: '✦', label: 'Important', labelColor: '#7c3aed' },
  },
}

function CalloutBox({ type, text, isDark }) {
  const style = CALLOUT_STYLES[type]?.[isDark ? 'dark' : 'light'] ?? CALLOUT_STYLES.note[isDark ? 'dark' : 'light']
  return (
    <div style={{
      borderLeft: `3px solid ${style.border}`,
      background: style.bg,
      borderRadius: '0 6px 6px 0',
      padding: '10px 14px',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '14px', marginTop: '1px' }}>{style.icon}</span>
      <div>
        <span style={{ color: style.labelColor, fontWeight: 600, fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', marginRight: '8px' }}>
          {style.label.toUpperCase()}
        </span>
        <span style={{ color: isDark ? '#a1a1a1' : '#4d4d4d', fontSize: '13.5px', lineHeight: '1.6' }}>
          {text}
        </span>
      </div>
    </div>
  )
}

// ── Inline code renderer: converts `backtick text` → styled <code> pills ──
function renderInlineContent(text, isDark) {
  if (!text || !text.includes('`')) {
    return <span>{text}</span>
  }
  const parts = text.split(/(`[^`]+`)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const code = part.slice(1, -1)
          return (
            <code key={i} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12.5px',
              background: isDark ? '#1a1a1a' : '#f0f0f0',
              border: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
              color: isDark ? '#e4e4e7' : '#111',
              padding: '1px 6px',
              borderRadius: '4px',
              letterSpacing: '-0.2px',
            }}>{code}</code>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ── Escape HTML for use in dangerouslySetInnerHTML ──
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ── Syntax highlighter — ordered to avoid double-highlighting ──
function highlightCodeLine(line, language) {
  if (!line || line.trim() === '') return '&nbsp;'

  // Bash / Terminal: comments & prompt keywords
  if (language === 'bash' || language === 'shell') {
    if (line.trim().startsWith('#'))
      return `<span style="color:#555555;font-style:italic">${escapeHtml(line)}</span>`
    return escapeHtml(line)
      .replace(/^(\$|npm|pnpm|yarn|npx)\b/g, '<span style="color:#0070f3;font-weight:600">$1</span>')
      .replace(/\b(install|add|run|build|test|-g|--save|-D)\b/g, '<span style="color:#50e3c2">$1</span>')
  }

  // Text / pre-formatted output — no coloring
  if (language === 'text') {
    return `<span style="color:#71717a">${escapeHtml(line)}</span>`
  }

  // JSON — simple key/value coloring
  if (language === 'json') {
    let html = escapeHtml(line)
    html = html.replace(/("[^"]+")(\s*:)/g, '<span style="color:#79b8ff">$1</span>$2')
    html = html.replace(/:\s*("[^"]+")/g, ': <span style="color:#9ecbff">$1</span>')
    html = html.replace(/\b(true|false|null)\b/g, '<span style="color:#50e3c2;font-weight:600">$1</span>')
    return html
  }

  // Full-line comment
  if (line.trim().startsWith('//')) {
    return `<span style="color:#4a4a4a;font-style:italic">${escapeHtml(line)}</span>`
  }

  let html = escapeHtml(line)
  const tokens = []

  function addToken(match, style) {
    const id = `___TOK_${tokens.length}___`
    tokens.push({ id, html: `<span style="${style}">${match}</span>` })
    return id
  }

  // 1. Inline comments (must run first so later passes don't colorize inside them)
  html = html.replace(/(\/\/.+)$/, (_, m) => addToken(m, 'color:#4a4a4a;font-style:italic'))

  // 2. Template literals & Strings
  html = html.replace(/(`[^`]*`|'[^']*'|"[^"]*")/g, (m) => addToken(m, 'color:#9ecbff'))

  // 3. Keywords
  html = html.replace(
    /\b(import|from|export|const|let|var|await|async|return|new|function|class|if|else|try|catch|for|of|in|type|interface|default|typeof|implements|extends)\b/g,
    (m) => addToken(m, 'color:#79b8ff;font-weight:500')
  )

  // 4. Vulcan / SDK core classes
  html = html.replace(
    /\b(Vulcan|Tool|Agent|AgentRunner|RunContext|PIIScrubberGuardrail|MaxLengthGuardrail|KeywordBlockGuardrail|FunctionGuardrail|BlockedToolsGuardrail|SQLiteStorage|InMemoryStorage|RedisStorage|globalTracer|SessionStorage|Message)\b/g,
    (m) => addToken(m, 'color:#ffab70;font-weight:600')
  )

  // 5. SDK methods / Zod helpers
  html = html.replace(
    /\b(createAgent|createTool|run|stream|generateStructured|createWebSearchTool|createWebScraperTool|createCodeSandboxTool|createSQLQueryTool|createVectorStoreTool|execute|errorHandler|onApproval|withHandoff|getTrace|export|getMessages|appendMessages|clearSession|z|object|string|number|boolean|enum|array|url|min|max|optional|describe|default)\b(?=\s*[\(:])/g,
    (m) => addToken(m, 'color:#b39ddb')
  )

  // 6. Booleans & special values
  html = html.replace(
    /\b(true|false|null|undefined)\b/g,
    (m) => addToken(m, 'color:#50e3c2;font-weight:600')
  )

  // Restore tokens in reverse order or exact order
  for (const t of tokens) {
    html = html.replace(t.id, t.html)
  }

  return html
}

// ── Code Snippet Explainer helper ──
function getExplanationForSnippet(filename, code) {
  const normFile = filename ? filename.toLowerCase() : '';
  const normCode = code ? code.toLowerCase() : '';

  if (normFile === 'terminal') {
    return "Installs the Vulcan SDK package and its dependencies, initializing the core library for environment execution.";
  }
  if (normFile === '.env') {
    return "Loads local environment variables securely. The SDK reads these standard keys to authorize provider requests (Gemini, OpenAI, Anthropic).";
  }
  if (normFile === 'tsconfig.json') {
    return "Enables modern ECMAScript standard compilation (`ES2022` and ESM `NodeNext` resolution), essential for the async and module features in the SDK.";
  }
  if (normFile.includes('tool') || normCode.includes('vulcan.createtool')) {
    return "Defines a schema-validated tool: 1) metadata description for LLM reasoning, 2) Zod schema for argument verification, and 3) async execution handler.";
  }
  if (normFile.includes('agent') || normCode.includes('vulcan.createagent')) {
    return "Initializes an Agent configuration. Couples specific instructions, local tools, safety guardrails, and persistent storage modules together.";
  }
  if (normFile.includes('storage') || normCode.includes('storage') || normCode.includes('inmemorystorage')) {
    return "Binds conversation history storage. Vulcan's stateless executor loads and saves message history lists dynamically using session ids.";
  }
  if (normCode.includes('globaltracer') || normCode.includes('tracer')) {
    return "Inspects execution logs using the Tracer hook. Resolves tokens, time span, and tool execution status logs per single-run context.";
  }
  if (normCode.includes('withhandoff')) {
    return "Configures multi-agent conditional delegation routes. Injects automated routing tools with recursive visited-chain cycle checking.";
  }
  if (normCode.includes('createwebsearchtool') || normCode.includes('createwebscrapertool') || normCode.includes('createcodesandboxtool')) {
    return "Sets up zero-dependency built-in tools. These carry production-grade schemas, standard request timeouts, and error fallback handlers.";
  }
  return "Code Breakdown: Illustrates type-safe agent orchestration. Parameters are validated by schema filters before reaching the handler execution context.";
}

// ── Code Block ──────────────────────────────────────────────────────────────
const COLLAPSE_THRESHOLD = 16 // lines before auto-collapsing
const COLLAPSED_HEIGHT = 280  // px when collapsed

function CodeBlock({ code = '', language, filename, isDark }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // Check if code contains tabbed package manager comments
  const safeCode = code || ''
  const hasTabs = safeCode.includes('# npm') && safeCode.includes('# pnpm') && safeCode.includes('# yarn')
  let parsedTabs = {}
  let tabs = null

  if (hasTabs) {
    const parts = safeCode.split(/# (npm|pnpm|yarn)\s*\r?\n/)
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i]
      const val = parts[i + 1] ? parts[i + 1].trim() : ''
      if (key) {
        parsedTabs[key] = val
      }
    }
    // Only use tabs if we parsed all three package managers correctly
    if (parsedTabs.npm && parsedTabs.pnpm && parsedTabs.yarn) {
      tabs = ['npm', 'pnpm', 'yarn']
    }
  }

  const [selectedTab, setSelectedTab] = useState(tabs ? 'npm' : null)
  const activeCode = (selectedTab && parsedTabs[selectedTab]) ? parsedTabs[selectedTab] : safeCode
  const lines = activeCode.trim().split('\n')
  const isLong = lines.length > COLLAPSE_THRESHOLD
  const showToggle = isLong
  const collapsed = isLong && !expanded

  const copy = () => {
    navigator.clipboard.writeText(activeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      border: `1px solid #262626`,
      borderRadius: '10px',
      overflow: 'hidden',
      background: '#09090b',
      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.1)',
      margin: '8px 0 16px',
      position: 'relative',
    }}>
      {/* ── Header bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#000000',
        borderBottom: '1px solid #1f1f1f',
        padding: '9px 14px',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
          </div>

          {/* Tab switches for npm/pnpm/yarn */}
          {tabs ? (
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid transparent' }}>
              {tabs.map(tab => {
                const isActive = selectedTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    style={{
                      color: isActive ? '#50e3c2' : '#888888',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 8px 6px',
                      borderBottom: isActive ? '2px solid #50e3c2' : '2px solid transparent',
                      transition: 'all 0.15s',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              {/* Filename tab (if provided) */}
              {filename && (
                <span style={{
                  color: '#cccccc',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  padding: '1px 8px 2px',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '200px',
                }}>
                  {filename}
                </span>
              )}

              {/* Language label */}
              <span style={{
                color: '#555',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {language ?? 'typescript'}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Sparkles / Explain button */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            style={{
              color: showExplanation ? '#50e3c2' : '#888888',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.15s',
            }}
            title="Explain this code"
            aria-label="Explain code snippet with AI"
            onMouseEnter={e => { if (!showExplanation) e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={e => { if (!showExplanation) e.currentTarget.style.color = '#888888' }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904zM18.096 5.187L17.5 9l-.596-3.813L13 5l3.904-.596L17.5 1l.596 3.813L22 5l-3.904.596z" />
            </svg>
          </button>

          {/* Copy button */}
          <button
            onClick={copy}
            style={{
              color: copied ? '#4ade80' : '#888888',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.15s',
            }}
            title="Copy code"
            aria-label="Copy code to clipboard"
            onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#888888' }}
          >
            {copied ? (
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Code body ── */}
      <div style={{
        position: 'relative',
        maxHeight: collapsed ? `${COLLAPSED_HEIGHT}px` : 'none',
        overflow: collapsed ? 'hidden' : 'visible',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{ overflowX: 'auto', padding: '18px 20px', overflowY: 'auto', background: '#09090b' }}>
          <pre style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: '1.75',
            fontFamily: 'var(--font-mono)',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: '18px' }}>
              {/* Line numbers */}
              <div style={{ userSelect: 'none', opacity: 0.25, textAlign: 'right', minWidth: '20px', color: '#888888' }}>
                {lines.map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
              </div>
              {/* Syntax-colored code lines */}
              <div style={{ flex: 1, color: '#e4e4e7', minWidth: 0 }}>
                {lines.map((line, idx) => (
                  <span
                    key={idx}
                    style={{ display: 'block' }}
                    dangerouslySetInnerHTML={{ __html: highlightCodeLine(line, language) }}
                  />
                ))}
              </div>
            </div>
          </pre>
        </div>

        {/* Gradient fade overlay when collapsed */}
        {collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            background: 'linear-gradient(to bottom, transparent 0%, #09090b 100%)',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* ── Expand / Collapse toggle ── */}
      {showToggle && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 0',
            background: '#0d0d0d',
            border: 'none',
            borderTop: '1px solid #1f1f1f',
            color: '#555',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0070f3'; e.currentTarget.style.background = '#111' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = '#0d0d0d' }}
        >
          {expanded
            ? <>↑ COLLAPSE</>
            : <>{`↓ SHOW FULL CODE (${lines.length} lines)`}</>
          }
        </button>
      )}

      {/* ── AI Explanation panel ── */}
      {showExplanation && (
        <div style={{
          background: '#0c0c0e',
          borderTop: '1px dashed #262626',
          padding: '14px 20px',
          fontSize: '12.5px',
          lineHeight: '1.6',
          color: isDark ? '#b5b5b5' : '#4d4d4d',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#50e3c2', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.04em' }}>
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904zM18.096 5.187L17.5 9l-.596-3.813L13 5l3.904-.596L17.5 1l.596 3.813L22 5l-3.904.596z" />
            </svg>
            AI EXPLANATION
          </div>
          <p style={{ margin: 0 }}>
            {getExplanationForSnippet(filename, code)}
          </p>
        </div>
      )}
    </div>
  )
}

function DataTable({ headers, rows, isDark }) {
  return (
    <div style={{
      border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
        <thead>
          <tr style={{ background: isDark ? '#111111' : '#f5f5f5' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left',
                padding: '9px 14px',
                color: isDark ? '#888' : '#666',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderBottom: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0
                ? (isDark ? '#0a0a0a' : '#ffffff')
                : (isDark ? '#0d0d0d' : '#fafafa'),
              transition: 'background 0.1s',
            }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '9px 14px',
                  color: ci === 0
                    ? (isDark ? '#e5e5e5' : '#171717')
                    : (isDark ? '#a1a1a1' : '#4d4d4d'),
                  fontFamily: ci <= 1 ? 'var(--font-mono)' : 'inherit',
                  fontSize: ci <= 1 ? '12.5px' : '13.5px',
                  borderBottom: ri < rows.length - 1 ? `1px solid ${isDark ? '#1a1a1a' : '#f0f0f0'}` : 'none',
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StepsList({ steps, isDark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            minWidth: 22,
            height: 22,
            borderRadius: '50%',
            background: isDark ? '#0d0d0d' : '#f5f5f5',
            border: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#0070f3',
            fontFamily: 'var(--font-mono)',
            marginTop: '2px',
            flexShrink: 0,
          }}>{i + 1}</div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.7',
            color: isDark ? '#a1a1a1' : '#4d4d4d',
          }}>
            <strong style={{ color: isDark ? '#e5e5e5' : '#171717', fontWeight: 600 }}>
              {step.split(':')[0]}:
            </strong>
            {step.includes(':') ? step.slice(step.indexOf(':') + 1) : ''}
          </p>
        </div>
      ))}
    </div>
  )
}

export function DocsPage({ theme }) {
  const isDark = theme === 'dark'
  const [activePageId, setActivePageId] = useState('introduction')
  const [activeSection, setActiveSection] = useState(0)
  const mainRef = useRef(null)
  const sectionRefs = useRef([])
  const activePage = docsData[activePageId]

  // Navigate page and scroll to top
  const navigateTo = (id) => {
    setActivePageId(id)
    setActiveSection(0)
    if (mainRef.current) mainRef.current.scrollTop = 0
  }

  // Highlight active section in TOC on scroll
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => {
      let found = 0
      sectionRefs.current.forEach((ref, i) => {
        if (ref && ref.getBoundingClientRect().top < 160) found = i
      })
      setActiveSection(found)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [activePageId])

  // Find prev/next pages for navigation
  const allPages = SIDEBAR_ITEMS.flatMap(g => g.pages)
  const currentIdx = allPages.findIndex(p => p.id === activePageId)
  const prevPage = currentIdx > 0 ? allPages[currentIdx - 1] : null
  const nextPage = currentIdx < allPages.length - 1 ? allPages[currentIdx + 1] : null

  return (
    <div style={{
      flex: 1,
      width: '100%',
      background: isDark ? '#000000' : '#fafafa',
      color: isDark ? '#e5e5e5' : '#171717',
      transition: 'background 0.2s, color 0.2s',
      display: 'flex',
      minHeight: 'calc(100vh - 64px)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', width: '100%' }}>

        {/* ──────── LEFT SIDEBAR ──────── */}
        <aside style={{
          position: 'sticky',
          top: '64px',
          height: 'calc(100vh - 64px)',
          width: '240px',
          minWidth: '240px',
          borderRight: `1px solid ${isDark ? '#1a1a1a' : '#e5e5e5'}`,
          background: isDark ? '#000000' : '#fafafa',
          overflowY: 'auto',
          padding: '28px 0',
          display: 'none',
          flexDirection: 'column',
          gap: '24px',
        }} className="docs-sidebar">
          {SIDEBAR_ITEMS.map((group) => (
            <div key={group.category} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: group.category === 'Getting Started'
                  ? '#10b981'
                  : (isDark ? '#444' : '#999'),
                padding: '0 10px',
                marginBottom: '4px',
              }}>{group.category}</span>
              {group.pages.map((page) => {
                const isActive = activePageId === page.id
                return (
                  <button
                    key={page.id}
                    onClick={() => navigateTo(page.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '13.5px',
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      border: isActive ? `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}` : '1px solid transparent',
                      background: isActive
                        ? (isDark ? '#111111' : '#ffffff')
                        : 'transparent',
                      color: isActive
                        ? (isDark ? '#ffffff' : '#171717')
                        : (isDark ? '#666666' : '#666666'),
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = isDark ? '#cccccc' : '#333333'
                        e.currentTarget.style.background = isDark ? '#0d0d0d' : '#f0f0f0'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = isDark ? '#666666' : '#666666'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {page.title}
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        {/* ──────── MAIN CONTENT ──────── */}
        <main
          ref={mainRef}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '48px 40px 80px',
            overflowY: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: '64px',
            textAlign: 'left',
          }}
        >
          <div style={{ maxWidth: '700px' }}>

            {/* Breadcrumb */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#0070f3',
              marginBottom: '10px',
            }}>
              {activePage.category}
            </div>

            {/* Page Title */}
            <h1 style={{
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '-1.2px',
              lineHeight: 1.15,
              color: isDark ? '#ffffff' : '#111111',
              margin: '0 0 14px',
            }}>
              {activePage.title}
            </h1>

            {/* Page Description */}
            <p style={{
              fontSize: '15.5px',
              lineHeight: '1.7',
              color: isDark ? '#888888' : '#555555',
              borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#e8e8e8'}`,
              paddingBottom: '28px',
              marginBottom: '36px',
            }}>
              {renderInlineContent(activePage.description, isDark)}
            </p>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '44px' }}>
              {activePage.sections.map((section, i) => (
                <div
                  key={i}
                  ref={el => sectionRefs.current[i] = el}
                  id={`section-${i}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px', scrollMarginTop: '80px' }}
                >
                  {/* Section heading */}
                  <h2 style={{
                    fontSize: '19px',
                    fontWeight: 650,
                    letterSpacing: '-0.5px',
                    color: isDark ? '#f0f0f0' : '#171717',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <a href={`#section-${i}`} style={{ color: 'inherit', textDecoration: 'none' }}>{section.title}</a>
                  </h2>

                  {/* Section content with inline backtick rendering */}
                  {section.content && (
                    <p style={{
                      fontSize: '14.5px',
                      lineHeight: '1.75',
                      color: isDark ? '#888888' : '#555555',
                      margin: 0,
                    }}>
                      {renderInlineContent(section.content, isDark)}
                    </p>
                  )}

                  {/* Steps list */}
                  {section.steps && (
                    <StepsList steps={section.steps} isDark={isDark} />
                  )}

                  {/* Callout */}
                  {section.callout && (
                    <CalloutBox type={section.callout.type} text={section.callout.text} isDark={isDark} />
                  )}

                  {/* Data table */}
                  {section.table && (
                    <DataTable headers={section.table.headers} rows={section.table.rows} isDark={isDark} />
                  )}

                  {/* Code block — passes filename if available */}
                  {section.code && (
                    <CodeBlock
                      code={section.code}
                      language={section.codeLanguage}
                      filename={section.codeFilename}
                      isDark={isDark}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* ─── Prev / Next Navigation ─── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '56px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDark ? '#1a1a1a' : '#e8e8e8'}`,
              gap: '16px',
            }}>
              {prevPage ? (
                <button
                  onClick={() => navigateTo(prevPage.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isDark ? '#a1a1a1' : '#555555',
                    padding: '8px 0',
                    transition: 'color 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = isDark ? '#ffffff' : '#111111'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? '#a1a1a1' : '#555555'}
                >
                  <svg style={{ width: 14, height: 14, color: isDark ? '#666666' : '#999999', marginTop: '1px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{prevPage.title}</span>
                </button>
              ) : <div />}

              {nextPage ? (
                <button
                  onClick={() => navigateTo(nextPage.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isDark ? '#a1a1a1' : '#555555',
                    padding: '8px 0',
                    transition: 'color 0.15s',
                    textAlign: 'right',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = isDark ? '#ffffff' : '#111111'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? '#a1a1a1' : '#555555'}
                >
                  <span>{nextPage.title}</span>
                  <svg style={{ width: 14, height: 14, color: isDark ? '#666666' : '#999999', marginTop: '1px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : <div />}
            </div>

          </div>
        </main>

        {/* ──────── RIGHT TABLE OF CONTENTS ──────── */}
        <aside style={{
          position: 'sticky',
          top: '64px',
          height: 'calc(100vh - 64px)',
          width: '220px',
          minWidth: '220px',
          overflowY: 'auto',
          padding: '40px 16px 40px 24px',
          display: 'none',
          flexDirection: 'column',
          gap: '6px',
        }} className="docs-toc">
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: isDark ? '#444' : '#999',
            marginBottom: '8px',
            display: 'block',
          }}>On This Page</span>
          {activePage.sections.map((section, i) => (
            <a
              key={i}
              href={`#section-${i}`}
              style={{
                display: 'block',
                fontSize: '12.5px',
                lineHeight: '1.5',
                textDecoration: 'none',
                padding: '4px 8px',
                borderLeft: `2px solid ${activeSection === i ? '#10b981' : (isDark ? '#1a1a1a' : '#e5e5e5')}`,
                color: activeSection === i
                  ? '#10b981'
                  : (isDark ? '#555555' : '#888888'),
                transition: 'all 0.15s',
                fontWeight: activeSection === i ? 600 : 400,
              }}
              onClick={(e) => {
                e.preventDefault()
                sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setActiveSection(i)
              }}
            >
              {section.title}
            </a>
          ))}
        </aside>

      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 768px) {
          .docs-sidebar { display: flex !important; }
        }
        @media (min-width: 1200px) {
          .docs-toc { display: flex !important; }
        }
        @media (max-width: 1200px) {
          main { padding: 36px 28px 64px !important; }
        }
        @media (max-width: 768px) {
          main { padding: 28px 18px 48px !important; }
        }
        .docs-toc a:hover {
          color: #10b981 !important;
          border-left-color: #10b981 !important;
        }
      `}</style>
    </div>
  )
}
