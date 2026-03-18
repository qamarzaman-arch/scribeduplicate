import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Overlay from './components/Overlay'
import { useAppStore } from './store/store'
import './index.css'

const App: React.FC = () => {
  const isOverlay = window.location.hash === '#overlay'
  const [isPaused, setIsPaused] = useState(false)
  const { currentProcess, setCurrentProcess, setProcesses } = useAppStore()

  React.useEffect(() => {
    (window as any).electron.onRecordingStopped((process: any) => {
      setCurrentProcess(process)
      ;(window as any).electron.getProcesses().then((p: any) => setProcesses(p))
    })

    ;(window as any).electron.getProcesses().then((p: any) => setProcesses(p))
  }, [setCurrentProcess, setProcesses])

  if (isOverlay) {
    return (
      <Overlay
        isPaused={isPaused}
        onPause={() => setIsPaused(!isPaused)}
        onStop={() => (window as any).electron.stopRecording()}
      />
    )
  }

  if (currentProcess) {
    return <Editor />
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
