import React from 'react'

export function Header({ currentView, onViewChange }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-muted bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left Logo */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onViewChange('landing')}
            className="flex items-center gap-2.5 font-semibold tracking-tight transition hover:opacity-90"
          >
            {/* Volcano geometric logo */}
            <svg 
              className="h-6 w-6 text-accent-orange" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <polygon points="12 2 2 22 22 22" fill="currentColor" fillOpacity="0.1" />
              <polyline points="12 2 8 14 12 11 16 14 12 2" fill="currentColor" className="text-accent-amber" />
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent">
              Vulcan
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onViewChange('landing')}
              className={`text-sm font-medium transition ${
                currentView === 'landing' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onViewChange('docs')}
              className={`text-sm font-medium transition ${
                currentView === 'docs' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Docs
            </button>
            <span className="text-neutral-600">|</span>
            <span className="text-xs text-accent-orange font-mono bg-accent-orange/10 px-2 py-0.5 rounded border border-accent-orange/20">
              v1.0.0
            </span>
          </nav>
        </div>

        {/* Right CTA / GitHub */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/its-rahul-r15/VULCAN-SDK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button 
            onClick={() => onViewChange('docs')}
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-black transition hover:bg-neutral-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  )
}
