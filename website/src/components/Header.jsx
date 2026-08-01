import React, { useState } from 'react'

export function Header({ currentView, onViewChange, theme, onToggleTheme }) {
  const isDark = theme === 'dark'
  const [bannerVisible, setBannerVisible] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className={`sticky top-0 z-50 w-full transition-colors duration-200`}>

      {/* ── Announcement Banner ── */}
      {bannerVisible && (
        <div style={{
          background: isDark ? '#0a0a0a' : '#171717',
          borderBottom: `1px solid ${isDark ? '#1f1f1f' : '#2a2a2a'}`,
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          position: 'relative',
        }}>
          <span style={{ color: '#0070f3', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>
            ⚡ NEW v1.1.0
          </span>
          <span className="hidden sm:inline" style={{ color: '#a1a1a1', fontSize: '12px', letterSpacing: '0.01em' }}>
            Vulcan v1.1.0 is live on npm — Built-in Tools (Search, Scraper, Sandbox, SQL) & HITL.
          </span>
          <span className="inline sm:hidden" style={{ color: '#a1a1a1', fontSize: '10.5px', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
            v1.1.0 live on npm
          </span>
          <a
            href="https://www.npmjs.com/package/vulcan-agentic-sdk"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              textDecoration: 'none',
              borderBottom: '1px solid #444',
              paddingBottom: '1px',
              flexShrink: 0,
            }}
          >
            View →
          </a>
          <button
            onClick={() => setBannerVisible(false)}
            style={{
              position: 'absolute',
              right: '12px',
              color: '#555',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              padding: '2px 4px',
            }}
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main Nav ── */}
      <header className={`w-full border-b transition-colors duration-200 ${isDark
          ? 'border-[#262626] bg-black/90 backdrop-blur-md text-white'
          : 'border-[#ebebeb] bg-white/90 backdrop-blur-md text-[#171717]'
        }`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Left Logo */}
          <div className="flex items-center gap-6 md:gap-8">
            <button
              onClick={() => { onViewChange('landing'); setMobileMenuOpen(false) }}
              className="flex items-center gap-2.5 font-semibold tracking-tight transition hover:opacity-80"
            >
              <div className={`h-5 w-5 flex items-center justify-center [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)] ${isDark ? 'bg-white' : 'bg-[#171717]'}`} />
              <span className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#171717]'}`}>
                Vulcan
              </span>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => onViewChange('landing')}
                className={`rounded-full px-3.5 py-1 text-sm transition ${currentView === 'landing'
                    ? (isDark ? 'text-white font-medium bg-[#1f1f1f]' : 'text-[#171717] font-medium bg-[#f5f5f5]')
                    : (isDark ? 'text-[#a1a1a1] hover:text-white hover:bg-[#1f1f1f]' : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]')
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => onViewChange('docs')}
                className={`rounded-full px-3.5 py-1 text-sm transition ${currentView === 'docs'
                    ? (isDark ? 'text-white font-medium bg-[#1f1f1f]' : 'text-[#171717] font-medium bg-[#f5f5f5]')
                    : (isDark ? 'text-[#a1a1a1] hover:text-white hover:bg-[#1f1f1f]' : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]')
                  }`}
              >
                Docs
              </button>
              <span className={isDark ? 'text-[#333333] px-1' : 'text-[#ebebeb] px-1'}>|</span>
              <a
                href="https://www.npmjs.com/package/vulcan-agentic-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className={`caption-mono text-[11px] px-2 py-0.5 rounded border transition hover:opacity-80 ${isDark
                    ? 'text-[#a1a1a1] bg-[#111111] border-[#262626]'
                    : 'text-[#888888] bg-[#f5f5f5] border-[#ebebeb]'
                  }`}
              >
                v1.1.0 on npm ↗
              </a>
            </nav>
          </div>

          {/* Right CTA / npm / GitHub / Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-full border transition flex items-center justify-center ${isDark
                  ? 'border-[#333333] bg-[#111111] text-amber-400 hover:bg-[#1f1f1f]'
                  : 'border-[#ebebeb] bg-[#f5f5f5] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#ebebeb]'
                }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* npm Link */}
            <a
              href="https://www.npmjs.com/package/vulcan-agentic-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 transition hidden sm:flex items-center gap-1 ${isDark ? 'text-[#a1a1a1] hover:text-white' : 'text-[#4d4d4d] hover:text-[#171717]'}`}
              title="npm package"
              aria-label="npm package"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M0 7.334v8h6.666v-1.334H4V10h2.666V8.666H1.334v6.668H0V7.334zm8 0h6.666v8h-4v-1.334h2.667V10H10.666v4.668H9.334V8.666H8V7.334zm9.334 0H24v8h-6.666V7.334zm5.333 1.333h-4v5.334h4V8.667zM1.334 8.667h2.666v1.333H1.334V8.667zm8 0h2.666v1.333H9.334V8.667z"/>
              </svg>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/its-rahul-r15/VULCAN-SDK"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 transition hidden sm:flex ${isDark ? 'text-[#a1a1a1] hover:text-white' : 'text-[#4d4d4d] hover:text-[#171717]'}`}
              aria-label="GitHub Repository"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>

            {/* Get Started CTA */}
            <button
              onClick={() => onViewChange('docs')}
              className={`hidden sm:inline-flex h-7 items-center justify-center rounded-md border px-3 text-xs font-medium transition ${isDark
                  ? 'border-[#333333] bg-[#111111] text-white hover:bg-[#1f1f1f]'
                  : 'border-[#ebebeb] bg-white text-[#171717] hover:bg-[#fafafa]'
                }`}
            >
              Get Started
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-1.5 rounded-md border transition flex items-center justify-center ${isDark
                  ? 'border-[#333333] bg-[#111111] text-white hover:bg-[#1f1f1f]'
                  : 'border-[#ebebeb] bg-[#f5f5f5] text-[#171717] hover:bg-[#ebebeb]'
                }`}
              aria-label="Toggle Mobile Navigation"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-b px-4 py-4 space-y-3 transition-all ${isDark ? 'bg-black/95 border-[#262626] text-white' : 'bg-white/95 border-[#ebebeb] text-[#171717]'}`}>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { onViewChange('landing'); setMobileMenuOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'landing'
                    ? (isDark ? 'bg-[#1f1f1f] text-white' : 'bg-[#f5f5f5] text-[#171717]')
                    : (isDark ? 'text-[#a1a1a1] hover:text-white' : 'text-[#4d4d4d] hover:text-[#171717]')
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => { onViewChange('docs'); setMobileMenuOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'docs'
                    ? (isDark ? 'bg-[#1f1f1f] text-white' : 'bg-[#f5f5f5] text-[#171717]')
                    : (isDark ? 'text-[#a1a1a1] hover:text-white' : 'text-[#4d4d4d] hover:text-[#171717]')
                  }`}
              >
                Documentation
              </button>
            </div>

            <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
              <a
                href="https://www.npmjs.com/package/vulcan-agentic-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>npm package</span>
                <span>v1.1.0 ↗</span>
              </a>
              <a
                href="https://github.com/its-rahul-r15/VULCAN-SDK"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-gray-400 hover:underline flex items-center gap-1"
              >
                <span>GitHub</span>
                <span>↗</span>
              </a>
            </div>

            <button
              onClick={() => { onViewChange('docs'); setMobileMenuOpen(false) }}
              className="w-full py-2 bg-[#0070f3] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold text-center transition"
            >
              Get Started with Vulcan SDK
            </button>
          </div>
        )}
      </header>
    </div>
  )
}

