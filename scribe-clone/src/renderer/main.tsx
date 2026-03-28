import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Overlay from './components/Overlay'
import LegalConsentModal from './components/LegalConsentModal'
import TutorialModal from './components/TutorialModal'
import { useAppStore } from './store/store'
import { generateFlowDiagram, normalizeProcess } from '../common/process-helpers'
import './index.css'

const App: React.FC = () => {
  const isOverlay = window.location.hash === '#overlay'
  const [isPaused, setIsPaused] = useState(false)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false)
  const [isSavingLegalConsent, setIsSavingLegalConsent] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const { currentProcess, setCurrentProcess, setProcesses, setIsRecording } = useAppStore()

  React.useEffect(() => {
    document.title = currentProcess?.title || 'HachiAi Requirements Gathering Tool'
  }, [currentProcess])

  React.useEffect(() => {
    const unsubscribe = (window as any).electron.onRecordingStopped((process: any) => {
      setIsRecording(false)
      if (process) {
        setCurrentProcess(process)
      }
      ;(window as any).electron.getProcesses().then((p: any) => setProcesses(p))
    })

    const unsubscribeBranch = (window as any).electron.onBranchRecordingStopped((payload: any) => {
      setIsRecording(false)
      const { process, context } = payload || {}
      if (!process || !context?.stepId || !context?.branchId) return

      const current = useAppStore.getState().currentProcess
      if (!current || current.id !== context.processId) return

      const normalizedBranchProcess = normalizeProcess(process)
      const branchSteps = normalizedBranchProcess.steps.map((step: any, index: number) => ({
        ...step,
        step_number: index + 1,
        branches: step.branches || []
      }))

      const updatedProcess = {
        ...current,
        steps: current.steps.map((step) => {
          if (step.id !== context.stepId) return step
          return {
            ...step,
            branches: (step.branches || []).map((branch) => branch.id === context.branchId ? {
              ...branch,
              steps: branchSteps
            } : branch)
          }
        })
      }

      const updatedWithFlow = {
        ...updatedProcess,
        flow_diagram: generateFlowDiagram(updatedProcess)
      }

      setCurrentProcess(updatedWithFlow)
      ;(window as any).electron.saveProcess(updatedWithFlow)
      ;(window as any).electron.getProcesses().then((p: any) => setProcesses(p))
    })

    ;(window as any).electron.getProcesses().then((p: any) => setProcesses(p))
    ;(window as any).electron.getRecordingState().then((recording: boolean) => {
      setIsRecording(Boolean(recording))
    })
    ;(window as any).electron.getLegalConsentStatus().then((status: any) => {
      setIsLegalModalOpen(!status?.accepted)
    })
    try {
      const hasSeenTutorial = window.localStorage.getItem('hachiai_tutorial_seen')
      setIsTutorialOpen(!hasSeenTutorial)
    } catch {
      setIsTutorialOpen(true)
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
      if (typeof unsubscribeBranch === 'function') {
        unsubscribeBranch()
      }
    }
  }, [setCurrentProcess, setProcesses, setIsRecording])

  const handleAcceptLegalConsent = async () => {
    setIsSavingLegalConsent(true)
    try {
      await (window as any).electron.acceptLegalConsent()
      setIsLegalModalOpen(false)
    } finally {
      setIsSavingLegalConsent(false)
    }
  }

  const handleCloseTutorial = () => {
    try {
      window.localStorage.setItem('hachiai_tutorial_seen', 'true')
    } catch {
      // ignore storage issues
    }
    setIsTutorialOpen(false)
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
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
      />
      <Dashboard onOpenTutorial={() => setIsTutorialOpen(true)} />
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
