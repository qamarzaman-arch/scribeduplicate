import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Published from './pages/Published'
import Overlay from './components/Overlay'
import LegalConsentModal from './components/LegalConsentModal'
import { useAppStore } from './store/store'
import './index.css'

const App: React.FC = () => {
  const isOverlay = window.location.hash === '#overlay'
  const [isPaused, setIsPaused] = useState(false)
  const { currentProcess, setCurrentProcess, setProcesses, publishedUrl } = useAppStore()

  React.useEffect(() => {
    document.title = currentProcess?.title || 'HachiAi Requirements Gathering Tool'
  }, [currentProcess])

  React.useEffect(() => {
    const unsubscribe = (window as any).electron.onRecordingStopped((process: any) => {
      if (process) {
        setCurrentProcess(process)
      }
      ;(window as any).electron.getProcesses().then((p: any) => setProcesses(p))
    })

    ;(window as any).electron.getProcesses().then((p: any) => setProcesses(p))
    ;(window as any).electron.getLegalConsentStatus().then((status: any) => {
      setIsLegalModalOpen(!status?.accepted)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [setCurrentProcess, setProcesses])

  const handleAcceptLegalConsent = async () => {
    setIsSavingLegalConsent(true)
    try {
      await (window as any).electron.acceptLegalConsent()
      setIsLegalModalOpen(false)
    } finally {
      setIsSavingLegalConsent(false)
    }
  }

  if (isOverlay) {
    return (
      <Overlay
        isPaused={isPaused}
        onPause={() => setIsPaused(!isPaused)}
        onStop={() => (window as any).electron.stopRecording()}
      />
    )
  }

  if (publishedUrl) {
    return <Published />
  }

  if (currentProcess) {
    return <Editor />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LegalConsentModal
        isOpen={isLegalModalOpen}
        isSaving={isSavingLegalConsent}
        onAccept={handleAcceptLegalConsent}
      />
      <Dashboard />
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
