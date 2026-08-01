import React, { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { LandingPage } from './components/LandingPage'
import { DocsPage } from './components/DocsPage'

function App() {
  const [view, setView] = useState('landing')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vulcan_theme') || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('vulcan_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${
      theme === 'dark' ? 'bg-black text-white' : 'bg-[#fafafa] text-[#171717]'
    }`}>
      {/* Shared Nav Header with Theme Toggle */}
      <Header 
        currentView={view} 
        onViewChange={setView} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Page Content */}
      {view === 'landing' ? (
        <LandingPage onViewChange={setView} theme={theme} />
      ) : (
        <DocsPage theme={theme} />
      )}
    </div>
  )
}

export default App
