import React, { useState } from 'react'
import { Header } from './components/Header'
import { LandingPage } from './components/LandingPage'
import { DocsPage } from './components/DocsPage'

function App() {
  const [view, setView] = useState('landing')

  return (
    <div className="min-h-screen flex flex-col bg-black text-white antialiased">
      {/* Shared Nav Header */}
      <Header currentView={view} onViewChange={setView} />

      {/* Main Page Content */}
      {view === 'landing' ? (
        <LandingPage onViewChange={setView} />
      ) : (
        <DocsPage />
      )}
    </div>
  )
}

export default App
