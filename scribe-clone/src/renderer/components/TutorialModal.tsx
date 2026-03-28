import React from 'react'
import { Compass, CirclePlay, ClipboardList, Edit3, Download, X } from 'lucide-react'

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    icon: CirclePlay,
    title: '1. Click "New Guide"',
    body: 'Start by selecting the main action button on the dashboard. This opens a short setup form before recording begins.'
  },
  {
    icon: ClipboardList,
    title: '2. Complete the process details',
    body: 'Enter the process name, expected outcome, who performs the task, and how often it runs. These details appear in the final guide.'
  },
  {
    icon: Compass,
    title: '3. Perform the process normally',
    body: 'Once recording starts, carry out the task as you usually would. The app captures actions, screenshots, and highlights automatically.'
  },
  {
    icon: Edit3,
    title: '4. Refine the guide',
    body: 'Review the steps, improve the wording if needed, classify items such as business rules or exceptions, and adjust screenshots or the flow diagram.'
  },
  {
    icon: Download,
    title: '5. Save and export',
    body: 'Select "Save Guide" to keep your changes, then export the guide in HTML, PDF, or DOCX format for your client or team.'
  }
]

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`

  return (
    <div className="fixed inset-0 z-[110] bg-[#404040]/72 backdrop-blur-md flex items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-5xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] overflow-hidden rounded-[2.75rem] bg-white shadow-2xl border border-purple-100 flex flex-col">
        <div className="px-6 md:px-10 py-6 md:py-7 border-b border-purple-50 flex items-start justify-between gap-6 bg-[#FCFAFD] shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6D4C82] shrink-0">
              <Compass size={28} />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#6D4C82]">Quick Tutorial</div>
              <h2 className="text-3xl font-black text-[#404040] mt-1">How to create your first guide</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
                Follow these steps the first time you use the tool. The goal is to make the process clear even if you have never used workflow software before.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <img src={logoSrc} alt="HachiAi" className="h-12 w-auto hidden md:block object-contain" />
            <button
              onClick={onClose}
              className="p-3 rounded-2xl text-gray-400 hover:bg-white hover:text-[#404040] transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 md:px-10 py-6 md:py-8 overflow-y-auto flex-1 min-h-0">
          <div className="grid gap-5 md:grid-cols-2">
            {tutorialSteps.map((step) => (
              <div key={step.title} className="rounded-[2rem] border border-purple-100 bg-white p-6 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6D4C82] mb-4">
                  <step.icon size={20} />
                </div>
                <h3 className="text-lg font-black text-[#404040]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] border border-purple-100 bg-[#FCFAFD] p-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#6D4C82] mb-3">Helpful tips</h3>
            <div className="grid gap-3 text-sm text-gray-600 leading-7">
              <p>Use plain business language when naming the process so the final guide is ready to share with clients.</p>
              <p>Pause briefly on important screens while recording so the screenshots are easy to understand.</p>
              <p>Use the editor to correct wording, classify special rules, and fine-tune screenshots before export.</p>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-10 py-5 md:py-6 border-t border-purple-50 flex justify-end shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-2xl bg-[#6D4C82] text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-200 hover:bg-[#5a3e6b] transition-all"
          >
            Start Using The Tool
          </button>
        </div>
      </div>
    </div>
  )
}

export default TutorialModal
