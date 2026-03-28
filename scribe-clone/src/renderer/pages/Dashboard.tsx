import React from 'react'
import { useAppStore } from '../store/store'
import { Plus, Play, Trash, Clock, ChevronRight, ClipboardList, Camera, Wand2, X, LifeBuoy, BookOpen, Presentation, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GuideIntakeDetails } from '../../common/types'

const slideDeckFileName = 'Client Engagement Model 2026.pdf'
const vmRequirementsFileName = 'Client VM Requirements _ HachiAI Knowledgebase.pdf'

const defaultIntake: GuideIntakeDetails = {
  processName: '',
  objective: '',
  owner: '',
  frequency: '',
  expectedCompletionTime: '',
  contactEmail: ''
}

const documentationGuideBullets = [
  'Why this matters: if you can teach a new hire using your document, the Intelligent Digital Worker can be trained just as easily.',
  'High-level flow: Start to input arrival to review to rule application to action to output to exceptions to end.',
  'The basics: explain what the process is, why it happens, and who is involved.',
  'Step-by-step: keep one action per step and add screenshots or a short recording whenever possible.',
  'Rules and checks: document business rules, validations, examples, triggers, timing, dependencies, and hand-offs in plain English.',
  'Best practice: focus on teaching the process clearly; the tool will handle formatting, structure, and diagrams.'
]

const frequencyOptions = [
  'Multiple times a day',
  'Daily',
  'Every business day',
  'Weekly',
  'Bi-weekly',
  'Twice a month',
  'Monthly',
  'Quarterly',
  'Semi-annually',
  'Annually',
  'On demand',
  'As needed'
]

const completionTimeOptions = [
  'Real time',
  'Within 1 hour',
  'Within 4 hours',
  'Within 8 hours',
  'Within 24 hours',
  'Within 2 business days',
  'Within business hours',
  'By end of day',
  'By next business day',
  'As scheduled'
]

const vmRequirementSections = [
  {
    title: 'Overview and purpose',
    text: 'This environment supports the HachiAI automation platform and the IDW thin client that receives workflow instructions and performs actions inside the client VM.'
  },
  {
    title: 'Operating system and hardware',
    text: 'Use Windows 10, Windows 11, or Windows Server 2022 with full disk encryption enabled. The recommended baseline is 4 vCores, 16 GB RAM, and 128 GB HDD or SSD.'
  },
  {
    title: 'Access and connectivity',
    text: 'Provide power-user access so approved users can install and run applications. The VM should have active internet access plus Anydesk, RDP, or VPN connectivity for secure remote access.'
  },
  {
    title: 'Software prerequisites',
    text: 'Install HeidiSQL, VS Code, and Google Chrome so the HachiAI team has the standard tooling needed for setup, testing, and delivery.'
  },
  {
    title: 'IP whitelisting',
    text: 'Whitelist the primary static IP 66.241.129.84 and the failover IP 38.132.48.186 so the IDW can communicate securely with the HachiAI platform.'
  },
  {
    title: 'Training environment',
    text: 'One additional VM is requested for training. It can be removed after training is complete.'
  }
]

const Dashboard: React.FC<{ onOpenTutorial: () => void }> = ({ onOpenTutorial }) => {
  const { processes, setProcesses, isRecording, setIsRecording, setCurrentProcess } = useAppStore()
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`
  const [isIntakeOpen, setIsIntakeOpen] = React.useState(false)
  const [intake, setIntake] = React.useState<GuideIntakeDetails>(defaultIntake)
  const [activeResource, setActiveResource] = React.useState<'playbook' | 'vm' | null>(null)

  const openBundledDocument = async (fileName: string) => {
    try {
      const targetPath = await (window as any).electron.getBundledDocumentPath(fileName)
      if (targetPath) {
        await (window as any).electron.openLocalPath(targetPath)
      }
    } catch (err) {
      console.error('Failed to open bundled document:', err)
    }
  }

  const saveBundledDocument = async (fileName: string) => {
    try {
      await (window as any).electron.saveBundledDocument(fileName)
    } catch (err) {
      console.error('Failed to save bundled document:', err)
    }
  }

  const handleStartRecording = async () => {
    try {
      await (window as any).electron.startRecording({
        ...intake,
        processName: intake.processName.trim(),
        objective: intake.objective.trim(),
        owner: intake.owner.trim(),
        frequency: intake.frequency.trim(),
        expectedCompletionTime: intake.expectedCompletionTime.trim(),
        contactEmail: intake.contactEmail.trim()
      })
      setIsRecording(true)
      setIsIntakeOpen(false)
      setIntake(defaultIntake)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const handleStopRecording = async () => {
    try {
      const process = await (window as any).electron.stopRecording()
      setIsRecording(false)
      if (process) {
        setCurrentProcess(process)
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
    }
  }

  const intakeFields: Array<{ key: keyof GuideIntakeDetails; label: string; placeholder: string; rows?: number }> = [
    { key: 'processName', label: 'Process Name', placeholder: 'Example: Create and send customer invoice' },
    { key: 'objective', label: 'What does this process achieve?', placeholder: 'Describe the outcome this guide should help a client accomplish.', rows: 3 },
    { key: 'owner', label: 'Who performs it?', placeholder: 'Example: Finance associate or operations manager' },
    { key: 'contactEmail', label: "Concerned person's email", placeholder: 'Example: process.owner@company.com' },
    { key: 'frequency', label: 'How often does it run?', placeholder: 'Example: Daily, weekly, monthly, or as needed' },
    { key: 'expectedCompletionTime', label: 'Expected completion time', placeholder: 'Example: Within 8 hours or by next business day' }
  ]

  const canStartRecording = intake.processName.trim().length > 0

  return (
    <div className="min-h-screen bg-[#FDFCFE] overflow-x-hidden">
      <div className="flex min-h-screen">
        <aside className="min-h-screen w-[260px] shrink-0 bg-[#2E2346] px-5 py-7 text-white shadow-2xl shadow-purple-950/20 lg:w-[290px] lg:px-7 lg:py-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6D4C82] shadow-lg shadow-purple-900/30">
              <BookOpen size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-200">Resources</span>
              <p className="mt-1 text-lg font-black text-white">Reference Library</p>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="text-sm font-medium text-purple-100/80">Helpful material for guides and client-facing documentation.</p>
          </div>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setActiveResource((current) => current === 'playbook' ? null : 'playbook')}
              className={`group w-full rounded-[1.25rem] border px-4 py-4 text-left transition-all duration-200 ${
                activeResource === 'playbook'
                  ? 'border-[#8D72A3] bg-[#6D4C82] text-white shadow-lg shadow-purple-950/30'
                  : 'border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:border-[#8D72A3] hover:bg-[#3A2D58] hover:shadow-lg hover:shadow-purple-950/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  activeResource === 'playbook' ? 'bg-white text-[#6D4C82]' : 'bg-white/10 text-purple-100 group-hover:bg-white/15'
                }`}>
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-[0.25em] ${activeResource === 'playbook' ? 'text-purple-100' : 'text-purple-200'}`}>Process Playbook</p>
                  <p className="mt-1 text-sm font-black">{activeResource === 'playbook' ? 'Hide Documentation Guide' : 'Open Documentation Guide'}</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openBundledDocument(slideDeckFileName)}
              className="group w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-left text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8D72A3] hover:bg-[#3A2D58] hover:shadow-lg hover:shadow-purple-950/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/10 text-purple-100 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-white/15">
                  <Presentation size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-200">Engagement Reference</p>
                  <p className="mt-1 text-sm font-black text-white">Open Client Presentation</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveResource((current) => current === 'vm' ? null : 'vm')}
              className={`group w-full rounded-[1.25rem] border px-4 py-4 text-left transition-all duration-200 ${
                activeResource === 'vm'
                  ? 'border-[#8D72A3] bg-[#6D4C82] text-white shadow-lg shadow-purple-950/30'
                  : 'border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:border-[#8D72A3] hover:bg-[#3A2D58] hover:shadow-lg hover:shadow-purple-950/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  activeResource === 'vm' ? 'bg-white text-[#6D4C82]' : 'bg-white/10 text-purple-100 group-hover:bg-white/15'
                }`}>
                  <ClipboardList size={20} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-[0.25em] ${activeResource === 'vm' ? 'text-purple-100' : 'text-purple-200'}`}>Client Environment</p>
                  <p className="mt-1 text-sm font-black">{activeResource === 'vm' ? 'Hide VM Requirements' : 'Open VM Requirements'}</p>
                </div>
              </div>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-16 rounded-[3rem] border border-purple-100 bg-white p-8 md:p-10 shadow-2xl shadow-purple-900/5 relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-50/80" />
            <img src={logoSrc} alt="HachiAi Logo" className="relative z-10 h-10 w-auto mb-6 object-contain" />
            <div className="relative z-10 w-full">
              <h1 className="text-4xl md:text-5xl font-black text-[#404040] tracking-tight leading-none">
                Build guides people can actually follow
              </h1>
              <div className="mt-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { icon: ClipboardList, title: 'Name the process first', text: 'Start each guide with a clear process name, expected outcome, process owner, and frequency so the final document reads professionally from the first line.' },
                    { icon: Camera, title: 'Capture every action clearly', text: 'Each recorded step keeps its screenshot and highlight so reviewers can see exactly what was clicked, entered, or checked during the task.' },
                    { icon: Wand2, title: 'Refine for client delivery', text: 'Update step wording, process details, branching paths, and business context before you export the guide for a client or internal team.' },
                    { icon: Play, title: 'Turn recordings into training assets', text: 'Use the saved guide as a reusable walkthrough for onboarding, process reviews, and future automation discovery with AI agents.' }
                  ].map((item) => (
                    <div key={item.title} className="rounded-[1.75rem] bg-[#FCFAFD] p-5 border border-purple-50 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-[#6D4C82]">
                        <item.icon size={20} />
                      </div>
                      <h3 className="mt-4 text-sm font-black text-[#404040]">{item.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={isRecording ? handleStopRecording : () => setIsIntakeOpen(true)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 shadow-2xl hover:-translate-y-0.5 ${
                    isRecording ? 'bg-red-500 text-white shadow-red-200 hover:bg-red-600 hover:shadow-red-300' : 'bg-[#6D4C82] text-white shadow-purple-200 hover:bg-[#5B3A72] hover:shadow-purple-300'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      New Guide
                    </>
                  )}
                </button>
                <button
                  onClick={onOpenTutorial}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 border border-purple-100 bg-white text-[#6D4C82] hover:-translate-y-0.5 hover:border-[#6D4C82]/30 hover:bg-purple-50 hover:shadow-lg hover:shadow-purple-100/70"
                >
                  <LifeBuoy size={18} />
                  Quick Tour
                </button>
              </div>
            </div>
          </motion.div>

          {activeResource === 'playbook' ? (
            <section className="mb-16">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2.5rem] border border-purple-100 bg-white p-8 shadow-xl shadow-purple-900/5"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6D4C82]">Guide</span>
                <h2 className="mt-2 text-3xl font-black text-[#404040]">How to Document Your Process for AI Agent (IDW) Automation</h2>
                <p className="mt-4 text-sm leading-7 text-gray-600">
                  A practical reference for capturing process steps, business rules, checks, timing, and exceptions in a way that is easy to automate later.
                </p>
                <div className="mt-6 space-y-3">
                  {documentationGuideBullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 rounded-[1.5rem] bg-[#FCFAFD] border border-purple-50 p-4">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#6D4C82] shrink-0" />
                      <p className="text-sm leading-7 text-gray-600">{bullet}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>
          ) : null}

          {activeResource === 'vm' ? (
            <section className="mb-16">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2.5rem] border border-purple-100 bg-white p-8 shadow-xl shadow-purple-900/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6D4C82]">Client Environment</span>
                    <h2 className="mt-2 text-3xl font-black text-[#404040]">Client VM Requirements</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">
                      A polished reference for the infrastructure, access, software, and network requirements needed before HachiAI automation is deployed in a client virtual machine.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveBundledDocument(vmRequirementsFileName)}
                    className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-[#FCFAFD] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#6D4C82] transition hover:border-[#6D4C82]/30 hover:bg-white hover:shadow-lg hover:shadow-purple-100/70"
                  >
                    <Download size={15} />
                    Download PDF
                  </button>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {vmRequirementSections.map((section) => (
                    <div key={section.title} className="rounded-[1.75rem] border border-purple-100 bg-[#FCFAFD] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6D4C82]">{section.title}</p>
                      <p className="mt-4 text-sm leading-7 text-gray-600">{section.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {processes.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="col-span-full py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-purple-100 shadow-inner"
                >
                  <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Play className="text-[#6D4C82] opacity-40" size={32} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-bold text-[#404040] mb-2">No guides yet</h3>
                  <p className="text-gray-400">Create your first guide to capture a process and turn it into a document.</p>
                </motion.div>
              ) : (
                processes.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white p-8 rounded-[2rem] shadow-xl shadow-purple-900/5 border border-purple-50 hover:border-[#6D4C82]/30 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => setCurrentProcess(p)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-500" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="p-3 bg-purple-50 rounded-2xl text-[#6D4C82]">
                        <Clock size={20} />
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const newProcesses = await (window as any).electron.deleteProcess(p.id)
                          setProcesses(newProcesses)
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash size={18} />
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-[#404040] mb-2 leading-tight break-words whitespace-normal group-hover:text-[#6D4C82] transition-colors">{p.title}</h3>
                    <p className="text-sm text-gray-500 min-h-[48px]">{p.intake?.objective || 'Guide summary will appear here after recording.'}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {p.intake?.owner ? (
                        <span className="rounded-full bg-[#FCFAFD] border border-purple-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#6D4C82]">
                          {p.intake.owner}
                        </span>
                      ) : null}
                      {p.intake?.frequency ? (
                        <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {p.intake.frequency}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-purple-50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {p.steps.length} {p.steps.length === 1 ? 'Step' : 'Steps'}
                      </span>
                      <div className="flex items-center gap-2 text-[#6D4C82] font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        Edit Guide <ChevronRight size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isIntakeOpen && (
          <div className="fixed inset-0 z-50 bg-[#404040]/65 backdrop-blur-md p-4 md:p-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-3xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-5rem)] rounded-[3rem] border border-purple-100 bg-white shadow-2xl shadow-purple-900/10 overflow-hidden flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 border-b border-purple-50 bg-[#FCFAFD] px-6 md:px-8 py-6 md:py-7 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6D4C82]">Before recording</span>
                  <h2 className="mt-3 text-3xl font-black text-[#404040]">Tell us about this process</h2>
                  <p className="mt-3 text-sm text-gray-500">This information becomes the guide name and the professional summary shown before the steps.</p>
                </div>
                <button
                  onClick={() => setIsIntakeOpen(false)}
                  className="rounded-2xl p-3 text-gray-400 hover:bg-white hover:text-[#404040] transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 md:px-8 py-6 md:py-8 flex-1 min-h-0">
                <div className="grid gap-6">
                  {intakeFields.map((field) => (
                    <label key={field.key} className="block">
                      <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{field.label}</span>
                      {field.key === 'frequency' || field.key === 'expectedCompletionTime' ? (
                        <div className="relative">
                          <select
                            value={field.key === 'frequency' ? intake.frequency : intake.expectedCompletionTime}
                            onChange={(event) => setIntake((current) => ({
                              ...current,
                              [field.key]: event.target.value
                            }))}
                            className="w-full appearance-none rounded-[1.75rem] border border-purple-100 bg-gradient-to-br from-[#FCFAFD] to-white px-5 py-4 pr-14 text-base font-semibold text-[#404040] outline-none transition focus:border-[#6D4C82] focus:bg-white focus:shadow-[0_0_0_4px_rgba(109,76,130,0.08)]"
                          >
                            <option value="" className="bg-[#FCFAFD] text-[#6D4C82] font-semibold">
                              {field.key === 'frequency' ? 'Select frequency' : 'Select expected completion time'}
                            </option>
                            {(field.key === 'frequency' ? frequencyOptions : completionTimeOptions).map((option) => (
                              <option key={option} value={option} className="bg-white text-[#404040] font-semibold">
                                {option}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#6D4C82] shadow-sm">
                              <ChevronRight size={16} className="rotate-90" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={intake[field.key]}
                          rows={field.rows || 2}
                          onChange={(event) => setIntake((current) => ({ ...current, [field.key]: event.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full resize-none rounded-[1.75rem] border border-purple-100 bg-[#FCFAFD] px-5 py-4 text-base font-semibold text-[#404040] outline-none transition focus:border-[#6D4C82] focus:bg-white"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-purple-50 px-6 md:px-8 py-5 md:py-6 md:flex-row md:items-center md:justify-between shrink-0 bg-white">
                <p className="text-sm text-gray-400">Tip: use plain business language so the final guide reads clearly for clients.</p>
                <button
                  onClick={handleStartRecording}
                  disabled={!canStartRecording}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-[#6D4C82] px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 transition hover:bg-[#5A3E6B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play size={16} />
                  Start Recording
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard
