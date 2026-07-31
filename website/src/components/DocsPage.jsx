import React, { useState } from 'react'
import { docsData } from '../data/docsData'

const SIDEBAR_ITEMS = [
  {
    category: 'Getting Started',
    pages: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'installation', title: 'Installation' },
      { id: 'quickstart', title: 'Quickstart' }
    ]
  },
  {
    category: 'Core Primitives',
    pages: [
      { id: 'tools', title: 'Tools System' },
      { id: 'guardrails', title: 'Guardrails & Safety' },
      { id: 'memory-sessions', title: 'Memory & Sessions' }
    ]
  },
  {
    category: 'Advanced Patterns',
    pages: [
      { id: 'handoffs', title: 'Agent Handoffs' },
      { id: 'tracing', title: 'Tracing' }
    ]
  }
]

export function DocsPage() {
  const [activePageId, setActivePageId] = useState('introduction')
  const activePage = docsData[activePageId]

  return (
    <div className="flex-1 w-full bg-black border-t border-border-muted">
      <div className="mx-auto flex max-w-7xl">
        
        {/* Left Navigation Sidebar */}
        <aside className="sticky top-16 hidden md:block h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border-muted bg-black px-4 py-8 overflow-y-auto">
          <div className="flex flex-col gap-6 text-left">
            {SIDEBAR_ITEMS.map((group) => (
              <div key={group.category} className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider pl-3">
                  {group.category}
                </h4>
                <div className="flex flex-col gap-0.5">
                  {group.pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setActivePageId(page.id)}
                      className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition ${
                        activePageId === page.id
                          ? 'bg-neutral-900 text-white font-medium border border-neutral-800'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Central Content Column */}
        <main className="min-w-0 flex-1 px-6 py-12 lg:px-12 text-left">
          <div className="max-w-3xl">
            {/* Breadcrumb / Category */}
            <div className="text-xs font-semibold text-accent-orange uppercase tracking-wider mb-2">
              {activePage.category}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none mb-4">
              {activePage.title}
            </h1>

            {/* Subtitle description */}
            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed border-b border-border-muted pb-8 mb-8">
              {activePage.description}
            </p>

            {/* Section Renders */}
            <div className="flex flex-col gap-10">
              {activePage.sections.map((section, index) => (
                <div key={index} className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {section.title}
                  </h3>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    {section.content}
                  </p>

                  {/* Render code block if exists */}
                  {section.code && (
                    <div className="rounded-xl border border-border-muted bg-neutral-950 overflow-hidden font-mono text-xs leading-relaxed mt-2">
                      {/* Code Header Bar */}
                      <div className="flex items-center justify-between bg-black/40 border-b border-border-muted px-4 py-2 text-[10px] text-neutral-500 uppercase tracking-wider">
                        <span>{section.codeLanguage ?? 'code'}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(section.code)}
                          className="hover:text-white transition"
                        >
                          Copy
                        </button>
                      </div>
                      {/* Code Scrollable Block */}
                      <div className="p-4 overflow-x-auto max-h-[300px]">
                        <pre className="text-neutral-300 text-left">
                          <code>{section.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Table of Contents Sidebar */}
        <aside className="sticky top-16 hidden lg:block h-[calc(100vh-4rem)] w-60 shrink-0 px-6 py-12 overflow-y-auto text-left">
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
            On this page
          </h4>
          <div className="flex flex-col gap-3">
            {activePage.sections.map((section, index) => (
              <a
                key={index}
                href={`#section-${index}`}
                className="text-xs text-neutral-400 hover:text-white transition leading-relaxed block"
              >
                {section.title}
              </a>
            ))}
          </div>
        </aside>

      </div>
    </div>
  )
}
