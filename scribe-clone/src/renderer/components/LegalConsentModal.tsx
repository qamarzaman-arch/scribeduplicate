import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { privacyChecklist, privacySummarySections } from '../../common/legal'

interface LegalConsentModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onAccept: () => void;
}

const LegalConsentModal: React.FC<LegalConsentModalProps> = ({ isOpen, isSaving, onAccept }) => {
  if (!isOpen) return null
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`

  return (
    <div className="fixed inset-0 z-[100] bg-[#404040]/70 backdrop-blur-md flex items-center justify-center p-8">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-purple-100">
        <div className="px-10 py-8 border-b border-purple-50 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6D4C82]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#6D4C82]">Privacy Agreement</div>
              <h2 className="text-3xl font-black text-[#404040] mt-1">Review Before First Use</h2>
            </div>
          </div>
          <img src={logoSrc} alt="HachiAi" className="h-12 w-auto shrink-0 object-contain" />
        </div>

        <div className="px-10 py-8 overflow-auto max-h-[calc(90vh-120px)]">
          <p className="text-base text-gray-500 leading-7 mb-8">
            HachiAi can capture screenshots, interaction metadata, and active-window details in order to generate workflow documentation.
            Please review the privacy and permission expectations below before using the app.
          </p>

          <div className="grid gap-5 mb-8">
            {privacySummarySections.map((section) => (
              <div key={section.title} className="rounded-[1.75rem] border border-purple-100 bg-[#FCFAFE] p-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#6D4C82] mb-3">{section.title}</h3>
                <p className="text-sm leading-7 text-gray-600">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-6 mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#404040] mb-4">User Confirmation</h3>
            <div className="grid gap-3">
              {privacyChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-600 leading-6">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#6D4C82] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 flex-wrap">
            <p className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">
              Installing and using the app means the packaged software dependencies are already included.
            </p>
            <button
              onClick={onAccept}
              disabled={isSaving}
              className="px-8 py-4 rounded-2xl bg-[#6D4C82] text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-200 hover:bg-[#5a3e6b] transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {isSaving ? 'Saving...' : 'Accept & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LegalConsentModal
