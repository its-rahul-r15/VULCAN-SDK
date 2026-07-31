import React, { useState, useEffect } from 'react'

const CODE_TEMPLATES = {
  standard: {
    title: 'Standard Agent Loop',
    desc: 'Native tool calling loop powered by Gemini 2.5 Flash.',
    code: `import { Vulcan, z } from '@its_rahul_r15/vulcan-sdk'

// 1. Create agent with a custom calculator tool
const agent = Vulcan.createAgent({
  name: 'math-agent',
  instructions: 'Always use calculator for arithmetic.',
  tools: [calculatorTool]
})

// 2. Run standard LLM tool iteration
const result = await Vulcan.run(agent, 'What is 42 * 13?')
console.log(result.output) // Output: 546`,
    steps: [
      { text: '🚀 AgentRunner initialized with Session Storage', delay: 400 },
      { text: '🤖 Calling Gemini 2.5 Flash... (Request: "What is 42 * 13?")', delay: 800 },
      { text: '🔧 Model requested tool execution: "calculator({ op: \'multiply\', a: 42, b: 13 })"', delay: 1000 },
      { text: '✅ Tool "calculator" succeeded. Result: { result: 546 }', delay: 700 },
      { text: '🤖 Calling Gemini 2.5 Flash with tool result context...', delay: 800 },
      { text: '🎉 Run completed. Output: "42 multiplied by 13 is 546."', delay: 600 },
      { text: '📊 Trace logged. Status: completed, Turns: 3, Tokens: 720', delay: 500 },
    ]
  },
  harness: {
    title: 'Structured Reasoning (Harness Mode)',
    desc: 'Enforce step-by-step reasoning pipeline (INITIAL → THINK → ANALYSE → OUTPUT).',
    code: `const thinker = Vulcan.createAgent({
  name: 'deep-reasoner',
  instructions: 'Break down complex requests.',
  reasoningMode: 'harness' // 👈 Enables pipeline
})

// Logs step-by-step updates in real-time
for await (const event of thinker.stream('Solve: 2 + 2 - 5')) {
  if (event.type === 'harness_step') {
    console.log(\`[\${event.data.step}] \${event.data.text}\`)
  }
}`,
    steps: [
      { text: '🚀 Harness Mode enabled. Compiling structured prompt...', delay: 500 },
      { text: '💭 [INITIAL] User wants to compute: 2 + 2 - 5', delay: 800 },
      { text: '💭 [THINK] First compute addition: 2 + 2 = 4', delay: 900 },
      { text: '💭 [ANALYSE] Verify intermediate result: 4 is correct. Now subtract 5.', delay: 1000 },
      { text: '💭 [THINK] Compute final step: 4 - 5 = -1', delay: 700 },
      { text: '🎉 [OUTPUT] The answer is -1.', delay: 600 },
    ]
  },
  handoffs: {
    title: 'Multi-Agent Handoffs',
    desc: 'Delegate tasks between agents with built-in loop protection.',
    code: `const billingAgent = Vulcan.createAgent({
  name: 'billing',
  instructions: 'Handle invoices and billing support.'
})

const triage = Vulcan.createAgent({
  name: 'triage',
  instructions: 'Route query. Billing queries go to billingAgent.'
}).withHandoff(billingAgent) // 👈 Injects routing tool

const result = await Vulcan.run(triage, 'Find invoice INV-2026')`,
    steps: [
      { text: '🚀 Triage Agent started.', delay: 400 },
      { text: '🤖 Calling Gemini 2.5 Flash...', delay: 800 },
      { text: '🔄 Handoff triggered: triage ➜ billing (Turn 1)', delay: 1000 },
      { text: '🛡️  Checking visited log: [triage]. No loops detected.', delay: 600 },
      { text: '🤖 Switched agent context. Calling Billing Specialist...', delay: 900 },
      { text: '🔧 Tool requested: lookup_invoice({ invoice: "INV-2026" })', delay: 700 },
      { text: '🎉 Run completed. Output: "Invoice details: Paid on 2026-07-15."', delay: 600 },
    ]
  },
  guardrails: {
    title: 'Border Safety Guardrails',
    desc: 'Intercept payloads at input, output, or tool execution borders.',
    code: `import { PIIScrubberGuardrail, KeywordBlockGuardrail } from '@its_rahul_r15/vulcan-sdk'

const secureAgent = Vulcan.createAgent({
  name: 'secure-agent',
  instructions: 'Help users retrieve context safely.',
  guardrails: [
    new KeywordBlockGuardrail(['hack', 'exploit'], { type: 'input' }),
    new PIIScrubberGuardrail() // Scrubs emails from output
  ]
})`,
    steps: [
      { text: '🚀 Guardrail check: evaluation started.', delay: 400 },
      { text: '🛡️  Evaluating input guardrails...', delay: 600 },
      { text: '✅ KeywordBlockGuardrail passed.', delay: 500 },
      { text: '🤖 LLM generated response...', delay: 800 },
      { text: '🛡️  Evaluating output guardrails...', delay: 600 },
      { text: '🧼 PIIScrubberGuardrail: email scrubbed: "***@***.com"', delay: 700 },
      { text: '🎉 Completed with scrubbed payload output.', delay: 500 },
    ]
  }
}

const MODELS = [
  { name: 'Gemini 2.5 Flash', tag: 'default', active: true },
  { name: 'Claude 3.5 Sonnet', tag: 'anthropic', active: false },
  { name: 'GPT-4o', tag: 'openai', active: false },
  { name: 'Gemini 1.5 Pro', tag: 'google', active: false },
]

export function InteractiveSandbox() {
  const [activeTab, setActiveTab] = useState('standard')
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash')
  const [dropdownOpen, setDropdownOpen] = useState(true) // keep dropdown open by default like screenshot
  const [terminalLogs, setTerminalLogs] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [toggleHarness, setToggleHarness] = useState(true)

  // Reset logs when tab changes
  useEffect(() => {
    setTerminalLogs([`Click 'Run Code' to execute simulator...`])
    setIsRunning(false)
  }, [activeTab])

  const runSimulator = async () => {
    if (isRunning) return
    setIsRunning(true)
    setTerminalLogs([])

    const steps = CODE_TEMPLATES[activeTab].steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, steps[i].delay))
      setTerminalLogs((prev) => [...prev, steps[i].text])
    }
    setIsRunning(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto w-full px-6 py-12">
      {/* Left Code panel */}
      <div className="lg:col-span-7 flex flex-col rounded-xl border border-border-muted bg-bg-card overflow-hidden">
        {/* Editor Tabs Header */}
        <div className="flex items-center justify-between border-b border-border-muted bg-black/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {Object.keys(CODE_TEMPLATES).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  if (tab === 'harness') setToggleHarness(true)
                }}
                className={`rounded px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-neutral-900 text-white border border-neutral-800' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-orange animate-pulse"></span>
            <span className="text-[10px] font-mono text-neutral-500">sandbox.ts</span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-5 font-mono text-sm leading-relaxed text-neutral-300 text-left overflow-x-auto min-h-[320px] bg-black/60 relative">
          <pre>
            <code className="text-xs sm:text-sm">
              {CODE_TEMPLATES[activeTab].code.split('\n').map((line, idx) => {
                // simple syntax highlighter
                let styledLine = line;
                if (line.startsWith('import ') || line.startsWith('const ') || line.startsWith('await ')) {
                  styledLine = line.replace(/(import|from|const|await)/g, '<span class="text-accent-orange">$1</span>')
                }
                if (line.includes('//')) {
                  styledLine = `<span class="text-neutral-500">${line}</span>`
                }
                return (
                  <span 
                    key={idx} 
                    className="block" 
                    dangerouslySetInnerHTML={{ __html: styledLine }}
                  />
                )
              })}
            </code>
          </pre>

          {/* Floating dropdown overlay simulating screenshot layout */}
          {dropdownOpen && (
            <div className="absolute bottom-6 right-6 z-10 w-64 rounded-lg border border-border-muted bg-black/90 p-2 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-border-muted px-2.5 py-1.5 text-xs text-neutral-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search models...</span>
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {MODELS.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => {
                      setSelectedModel(model.name)
                      setDropdownOpen(false)
                    }}
                    className="flex items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition hover:bg-neutral-900"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-amber"></span>
                      <span className={selectedModel === model.name ? 'text-white font-medium' : 'text-neutral-400'}>
                        {model.name}
                      </span>
                    </span>
                    {selectedModel === model.name && (
                      <svg className="h-3.5 w-3.5 text-accent-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="border-t border-border-muted bg-black/40 px-4 py-3 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-300">Model:</span>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-white hover:text-accent-orange transition underline decoration-dotted"
            >
              {selectedModel}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Use with memory:</span>
            <button
              onClick={() => setToggleHarness(!toggleHarness)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                toggleHarness ? 'bg-accent-orange' : 'bg-neutral-800'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                toggleHarness ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Terminal simulator */}
      <div className="lg:col-span-5 flex flex-col h-full rounded-xl border border-border-muted bg-bg-card overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-border-muted bg-black/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-neutral-800"></span>
            <span className="h-3 w-3 rounded-full bg-neutral-800"></span>
            <span className="h-3 w-3 rounded-full bg-neutral-800"></span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Tracer Console</span>
        </div>

        {/* Console Log Screen */}
        <div className="flex-1 p-5 font-mono text-xs leading-relaxed text-left text-neutral-300 min-h-[260px] max-h-[340px] overflow-y-auto bg-black/80">
          <div className="flex flex-col gap-2">
            {terminalLogs.map((log, index) => (
              <div 
                key={index} 
                className={`transition-all duration-300 ${
                  log.includes('✅') || log.includes('[✓') ? 'text-accent-amber' : 
                  log.includes('🔄') ? 'text-accent-orange' : 
                  log.includes('❌') || log.includes('🛡️') ? 'text-rose-400' : 'text-neutral-300'
                }`}
              >
                {log}
              </div>
            ))}
            {isRunning && (
              <div className="flex items-center gap-1.5 text-neutral-500">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-ping"></span>
                <span>Executing runner thread...</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="border-t border-border-muted bg-black/40 p-4">
          <button
            onClick={runSimulator}
            disabled={isRunning}
            className={`w-full h-10 inline-flex items-center justify-center rounded-lg font-semibold text-sm transition-all ${
              isRunning 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-neutral-200 active:scale-95'
            }`}
          >
            {isRunning ? 'Running Simulator...' : 'Run Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
