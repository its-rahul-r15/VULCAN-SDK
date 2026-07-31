import React, { useState } from 'react'
import { InteractiveSandbox } from './InteractiveSandbox'

export function LandingPage({ onViewChange }) {
  const [copied, setCopied] = useState(false)
  const [copiedCard, setCopiedCard] = useState(null)

  const copyTemplate = (text, cardId) => {
    navigator.clipboard.writeText(text)
    setCopiedCard(cardId)
    setTimeout(() => setCopiedCard(null), 2000)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText('npm install vulcan-agentic-sdk')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex-1 w-full bg-black relative overflow-hidden">
      {/* Background neon elements */}
      <div className="absolute top-[-10%] left-[-20%] h-[600px] w-[600px] rounded-full bg-accent-orange/10 ambient-glow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-20%] h-[700px] w-[700px] rounded-full bg-accent-amber/5 ambient-glow-2 pointer-events-none"></div>

      {/* Hero section */}
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Column */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              Type-safe AI agents. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-accent-orange to-accent-amber bg-clip-text text-transparent">Zero framework bloat.</span>
            </h1>
            <p className="mt-6 max-w-md text-base sm:text-lg text-neutral-400 leading-relaxed text-center lg:text-left">
              Build resilient, multi-turn agent workflows with Zod-validated tools, cycle-blocking handoffs, and custom guardrails.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => onViewChange('docs')}
                className="w-full sm:w-auto h-12 inline-flex items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Read the docs ↗
              </button>
              
              <button 
                onClick={copyToClipboard}
                className="w-full sm:w-auto h-12 inline-flex items-center justify-between rounded-lg border border-border-muted bg-black px-4 text-xs font-mono text-neutral-400 hover:text-white transition hover:border-neutral-700 relative"
              >
                <span className="flex items-center gap-2">
                  <span className="text-accent-orange font-bold">$</span>
                  <span>npm i vulcan-agentic-sdk</span>
                </span>
                <span className="ml-4 flex items-center justify-center text-neutral-500 hover:text-neutral-300">
                  {copied ? (
                    <span className="text-accent-amber font-sans font-medium text-[10px] animate-fade-in">Copied!</span>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Hero Right Column (Interactive Sandbox) */}
          <div className="lg:col-span-6 w-full hidden lg:block">
            <div className="relative rounded-2xl border border-border-muted/50 p-2 bg-black/40 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-orange/5 to-accent-amber/5 rounded-2xl pointer-events-none"></div>
              {/* Dummy text layout */}
              <div className="text-[10px] font-mono text-neutral-500 text-left pl-4 pb-2">
                Vulcan SDK CLI v1.0.0
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sandbox Grid Component placement */}
      <section className="border-t border-border-muted bg-neutral-950/20 py-8 relative">
        <InteractiveSandbox />
      </section>

      {/* Core Primitives Features List */}
      <section className="border-t border-border-muted py-24 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center lg:text-left max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need for production agents.
          </h2>
          <p className="mt-4 text-neutral-400">
            Vulcan provides clean, scalable primitives that separate configuration from state, making your applications robust.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="rounded-xl border border-border-muted bg-bg-card p-6 flex flex-col text-left transition hover:border-neutral-800">
            <div className="h-10 w-10 rounded-lg bg-accent-orange/10 flex items-center justify-center text-accent-orange mb-4">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Type-safe Tools</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Auto-validates tool arguments generated by LLMs using Zod schemas before triggering execution, with built-in retry correct loops.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-border-muted bg-bg-card p-6 flex flex-col text-left transition hover:border-neutral-800">
            <div className="h-10 w-10 rounded-lg bg-accent-amber/10 flex items-center justify-center text-accent-amber mb-4">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Safe Multi-Agent Handoffs</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Route user requests dynamically across specialized support/billing agents. Features cycle blocker loops to prevent infinite recursions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-border-muted bg-bg-card p-6 flex flex-col text-left transition hover:border-neutral-800">
            <div className="h-10 w-10 rounded-lg bg-accent-orange/10 flex items-center justify-center text-accent-orange mb-4">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Safety Guardrails</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Interpose input/output borders. Features KeywordBlock, PII Scrubber (emails/phones), MaxLength limits, and custom policy rules.
            </p>
          </div>
        </div>
      </section>

      {/* Build with the Vulcan SDK today Section */}
      <section className="border-t border-border-muted py-24 bg-neutral-950/20">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex flex-col sm:flex-row sm:items-center gap-3">
              <span>Build with the Vulcan</span>
              <span className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-3.5 py-0.5 text-lg font-mono text-neutral-400 bg-neutral-900/40 w-fit">SDK</span>
              <span>today</span>
            </h2>
            <button 
              onClick={() => onViewChange('docs')}
              className="h-10 inline-flex items-center justify-center rounded-full bg-white px-5 text-xs font-semibold text-black transition hover:bg-neutral-200"
            >
              Read the docs ↗
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Card 1 */}
            <div className="rounded-xl border border-border-muted bg-bg-card p-6 flex flex-col justify-between min-h-[220px] transition hover:border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Chatbot Starter Template</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Learn how to build a full-featured AI chatbot with persistence, multi-modal chat, and more.
                </p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => copyTemplate('npx tsx examples/basic-agent.ts', 'basic')}
                  className="w-full h-10 inline-flex items-center justify-between rounded-lg border border-border-muted bg-black/40 px-4 text-xs font-mono text-neutral-400 hover:text-white transition hover:border-neutral-700"
                >
                  <span>{copiedCard === 'basic' ? 'Copied prompt!' : 'Copy install prompt'}</span>
                  <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-border-muted bg-bg-card p-6 flex flex-col justify-between min-h-[220px] transition hover:border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Build a Slackbot Agent</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Learn how to build a Slackbot that responds to direct messages and mentions in channels.
                </p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => copyTemplate('npx tsx examples/multi-agent-handoff.ts', 'handoff')}
                  className="w-full h-10 inline-flex items-center justify-between rounded-lg border border-border-muted bg-black/40 px-4 text-xs font-mono text-neutral-400 hover:text-white transition hover:border-neutral-700"
                >
                  <span>{copiedCard === 'handoff' ? 'Copied prompt!' : 'Copy install prompt'}</span>
                  <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-border-muted bg-bg-card p-6 flex flex-col justify-between min-h-[220px] transition hover:border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Build a SQL Agent</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Learn how to build an app that interacts with a PostgreSQL database using natural language.
                </p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => copyTemplate('npx tsx examples/structured-output.ts', 'sql')}
                  className="w-full h-10 inline-flex items-center justify-between rounded-lg border border-border-muted bg-black/40 px-4 text-xs font-mono text-neutral-400 hover:text-white transition hover:border-neutral-700"
                >
                  <span>{copiedCard === 'sql' ? 'Copied prompt!' : 'Copy install prompt'}</span>
                  <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expanded Links Footer */}
      <footer className="border-t border-border-muted bg-black pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 text-left mb-16">
            <div>
              <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Agent Stack</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><button onClick={() => onViewChange('docs')} className="hover:text-white transition">Agent SDK</button></li>
                <li><a href="#" className="hover:text-white transition">Agent Gateway</a></li>
                <li><a href="#" className="hover:text-white transition">Guardrails</a></li>
                <li><a href="#" className="hover:text-white transition">Memory Adapters</a></li>
                <li><a href="#" className="hover:text-white transition">Tracer Core</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Core Platform</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><a href="#" className="hover:text-white transition">CI/CD Deploy</a></li>
                <li><a href="#" className="hover:text-white transition">Content Delivery</a></li>
                <li><a href="#" className="hover:text-white transition">Edge Functions</a></li>
                <li><a href="#" className="hover:text-white transition">Streaming APIs</a></li>
                <li><a href="#" className="hover:text-white transition">Global Registry</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Security</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><a href="#" className="hover:text-white transition">WAF</a></li>
                <li><a href="#" className="hover:text-white transition">Audit Logs</a></li>
                <li><a href="#" className="hover:text-white transition">PII Scrubbing</a></li>
                <li><a href="#" className="hover:text-white transition">Data Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Tools</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer">Vercel Drop <span className="bg-neutral-800 text-[9px] text-accent-orange font-sans px-1 rounded">New</span></span></li>
                <li><a href="#" className="hover:text-white transition">Vulcan Agent</a></li>
                <li><span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer">Playground <span className="bg-neutral-800 text-[9px] text-accent-amber font-sans px-1 rounded">New</span></span></li>
                <li><a href="#" className="hover:text-white transition">CLI Sandbox</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Frameworks</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><a href="#" className="hover:text-white transition">Next.js</a></li>
                <li><a href="#" className="hover:text-white transition">React</a></li>
                <li><a href="#" className="hover:text-white transition">Vite</a></li>
                <li><a href="#" className="hover:text-white transition">Remix</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">SDK References</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><button onClick={() => onViewChange('docs')} className="hover:text-white transition text-left">Quickstart</button></li>
                <li><button onClick={() => onViewChange('docs')} className="hover:text-white transition text-left">Installation</button></li>
                <li><button onClick={() => onViewChange('docs')} className="hover:text-white transition text-left">API Docs</button></li>
                <li><a href="https://github.com/its-rahul-r15/VULCAN-SDK" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">GitHub Repo</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border-muted pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
            <div>
              © 2026 Vulcan SDK. Open Source under MIT License.
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => onViewChange('docs')} className="hover:text-white transition">Documentation</button>
              <a href="https://github.com/its-rahul-r15/VULCAN-SDK" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
