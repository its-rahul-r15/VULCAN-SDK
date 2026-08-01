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
      { id: 'hitlApprovals', title: 'Human-in-the-Loop (HITL)' },
      { id: 'handoffs', title: 'Agent Handoffs' },
      { id: 'tracing', title: 'Tracing & Observability' },
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

function CodeBlock({ code, language, isDark }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#0a0a0a',
      boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#000000',
        borderBottom: '1px solid #1a1a1a',
        padding: '8px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* traffic lights */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
          </div>
          <span style={{
            color: '#555',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginLeft: '4px',
          }}>
            {language ?? 'code'}
          </span>
        </div>
        <button
          onClick={copy}
          style={{
            color: copied ? '#4ade80' : '#666',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'color 0.15s',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      {/* Code content */}
      <div style={{ overflowX: 'auto', padding: '16px 18px', maxHeight: '420px', overflowY: 'auto' }}>
        <pre style={{
          margin: 0,
          color: '#d4d4d4',
          fontSize: '13px',
          lineHeight: '1.7',
          fontFamily: 'var(--font-mono)',
          textAlign: 'left',
        }}>
          <code>{code}</code>
        </pre>
      </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            minWidth: 22,
            height: 22,
            borderRadius: '50%',
            background: isDark ? '#1a1a1a' : '#f5f5f5',
            border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#0070f3',
            fontFamily: 'var(--font-mono)',
            marginTop: '1px',
          }}>{i + 1}</div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.65',
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
                color: isDark ? '#444' : '#999',
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
              {activePage.description}
            </p>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {activePage.sections.map((section, i) => (
                <div
                  key={i}
                  ref={el => sectionRefs.current[i] = el}
                  id={`section-${i}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px', scrollMarginTop: '80px' }}
                >
                  {/* Section Heading with anchor */}
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

                  {/* Content text */}
                  {section.content && (
                    <p style={{
                      fontSize: '14.5px',
                      lineHeight: '1.72',
                      color: isDark ? '#888888' : '#555555',
                      margin: 0,
                    }}>
                      {section.content}
                    </p>
                  )}

                  {/* Numbered Steps */}
                  {section.steps && (
                    <StepsList steps={section.steps} isDark={isDark} />
                  )}

                  {/* Callout box */}
                  {section.callout && (
                    <CalloutBox type={section.callout.type} text={section.callout.text} isDark={isDark} />
                  )}

                  {/* Data Table */}
                  {section.table && (
                    <DataTable headers={section.table.headers} rows={section.table.rows} isDark={isDark} />
                  )}

                  {/* Code Block */}
                  {section.code && (
                    <CodeBlock code={section.code} language={section.codeLanguage} isDark={isDark} />
                  )}
                </div>
              ))}
            </div>

            {/* ─── Prev / Next Navigation ─── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: `1px solid ${isDark ? '#1a1a1a' : '#e8e8e8'}`,
              marginTop: '56px',
              paddingTop: '28px',
              gap: '16px',
            }}>
              {prevPage ? (
                <button
                  onClick={() => navigateTo(prevPage.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
                    background: isDark ? '#0d0d0d' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s',
                    maxWidth: '45%',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#0070f3'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isDark ? '#262626' : '#e5e5e5'}
                >
                  <span style={{ fontSize: '11px', color: isDark ? '#555' : '#999', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>← PREVIOUS</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: isDark ? '#e5e5e5' : '#171717' }}>{prevPage.title}</span>
                </button>
              ) : <div />}

              {nextPage ? (
                <button
                  onClick={() => navigateTo(nextPage.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
                    background: isDark ? '#0d0d0d' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'right',
                    transition: 'border-color 0.15s',
                    maxWidth: '45%',
                    marginLeft: 'auto',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#0070f3'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isDark ? '#262626' : '#e5e5e5'}
                >
                  <span style={{ fontSize: '11px', color: isDark ? '#555' : '#999', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>NEXT →</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: isDark ? '#e5e5e5' : '#171717' }}>{nextPage.title}</span>
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
                borderLeft: `2px solid ${activeSection === i ? '#0070f3' : (isDark ? '#1a1a1a' : '#e5e5e5')}`,
                color: activeSection === i
                  ? '#0070f3'
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

      {/* Responsive sidebar CSS */}
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
          color: #0070f3 !important;
          border-left-color: #0070f3 !important;
        }
      `}</style>
    </div>
  )
}
