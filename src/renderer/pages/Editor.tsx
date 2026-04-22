import React from 'react'
import { useAppStore } from '../store/store'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronLeft, Save, Trash2, GripVertical, Edit3, Sparkles, Workflow, Download, CheckCircle2, Pencil } from 'lucide-react'
import { RecordingProcess, RecordingStep, StepClassification } from '../../common/types'
import AnnotationCanvas, { AnnotationCanvasHandle } from '../components/AnnotationCanvas'
import FlowDiagramEditor from '../components/FlowDiagramEditor'
import { motion } from 'framer-motion'
import { generateFlowDiagram, STEP_KIND_LABELS } from '../../common/process-helpers'

const STEP_KIND_OPTIONS: StepClassification[] = ['process', 'step', 'business-rule', 'exception']
const EXPECTED_COMPLETION_TIME_OPTIONS = [
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

const getScreenshotSrc = (screenshotPath: string) => {
  if (!screenshotPath) return ''
  if (screenshotPath.startsWith('data:')) return screenshotPath
  if (screenshotPath.startsWith('file://')) return screenshotPath

  try {
    return new URL(screenshotPath.replace(/\\/g, '/'), 'file:///').toString()
  } catch {
    const normalizedPath = screenshotPath.replace(/\\/g, '/')
    const encodedPath = normalizedPath
      .split('/')
      .map((segment, index) => (index === 0 && /^[a-zA-Z]:$/.test(segment) ? segment : encodeURIComponent(segment)))
      .join('/')

    return `file:///${encodedPath}`
  }
}

const mergeFlowDiagram = (process: RecordingProcess): RecordingProcess => {
  return {
    ...process,
    flow_diagram: generateFlowDiagram(process)
  }
}

const findStepById = (process: RecordingProcess, stepId: string): RecordingStep | null => {
  for (const step of process.steps) {
    if (step.id === stepId) return step
  }
  return null
}

const updateScreenshotPath = (process: RecordingProcess, stepId: string, screenshotPath: string): RecordingProcess => {
  return {
    ...process,
    steps: process.steps.map((step) => step.id === stepId ? { ...step, screenshot_path: screenshotPath } : step)
  }
}

const EditHint = ({ className = '' }: { className?: string }) => (
  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 ${className}`}>
    <Pencil size={14} />
  </span>
)

const StepKindSelector = ({
  value,
  onChange
}: {
  value: StepClassification;
  onChange: (value: StepClassification) => void;
}) => (
  <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-purple-100 bg-[#FCFAFD] p-2">
    {STEP_KIND_OPTIONS.map((option) => {
      const active = option === value
      return (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
            active
              ? 'bg-[#6D4C82] text-white shadow-lg shadow-purple-200'
              : 'bg-white text-gray-400 border border-purple-100 hover:text-[#6D4C82]'
          }`}
        >
          {STEP_KIND_LABELS[option]}
        </button>
      )
    })}
  </div>
)

const DragStepPreview = ({ step }: { step: RecordingStep }) => {
  const highlight = step.metadata.highlight

  return (
    <div className="w-[min(720px,78vw)] rounded-[1.75rem] border border-[#6D4C82]/20 bg-white shadow-2xl shadow-purple-900/15 overflow-hidden">
      <div className="flex items-center gap-4 border-b border-purple-50 bg-[#FCFAFD] px-5 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-[#6D4C82]">
          <GripVertical size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#6D4C82]">
            {STEP_KIND_LABELS[step.step_kind]} {step.step_number}
          </p>
          <p className="mt-1 truncate text-sm font-black text-[#404040]">{step.title || 'Untitled step'}</p>
        </div>
      </div>
      <div className="flex gap-4 p-5">
        <div className="h-28 w-40 shrink-0 overflow-hidden rounded-[1.25rem] border border-gray-200 bg-gray-100">
          {step.screenshot_path ? (
            <img
              src={getScreenshotSrc(step.screenshot_path)}
              alt={`Preview for step ${step.step_number}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No screenshot</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-relaxed text-gray-600">{step.description}</p>
          {highlight?.label ? (
            <div className="mt-3 inline-flex rounded-full bg-purple-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#6D4C82]">
              {highlight.label}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const SortableStepItem = ({
  step,
  onDelete,
  onUpdateStep,
  onEditScreenshot
}: {
  step: RecordingStep;
  onDelete: (id: string) => void;
  onUpdateStep: (id: string, patch: Partial<RecordingStep>) => void;
  onEditScreenshot: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const screenshotWidth = step.metadata.screenshotWidth || 1920
  const screenshotHeight = step.metadata.screenshotHeight || 1080
  const highlight = step.metadata.highlight

  const highlightStyle = highlight && highlight.x !== undefined && highlight.y !== undefined
    ? {
        left: `${(highlight.x / screenshotWidth) * 100}%`,
        top: `${(highlight.y / screenshotHeight) * 100}%`
      }
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-purple-50 rounded-[1.75rem] mb-4 overflow-hidden flex group/item hover:border-[#6D4C82]/20 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300 ${isDragging ? 'opacity-40 scale-[0.98]' : ''}`}
    >
      <div {...attributes} {...listeners} className="p-3 bg-gray-50 flex items-center cursor-grab active:cursor-grabbing">
        <GripVertical className="text-gray-400" size={20} />
      </div>
      <div className="p-4 md:p-5 flex-1 flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-64 shrink-0">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-[10px] font-black text-[#6D4C82] uppercase tracking-widest">Step {step.step_number}</span>
          </div>
          <button
            type="button"
            onClick={() => onEditScreenshot(step.id)}
            className="w-full text-left"
          >
            <div className="w-full h-40 bg-gray-100 rounded-[1.25rem] overflow-hidden border border-gray-200 relative">
              {step.screenshot_path ? (
                <>
                  <img
                    src={getScreenshotSrc(step.screenshot_path)}
                    alt={`Step ${step.step_number}`}
                    className="w-full h-full object-cover"
                  />
                  {highlightStyle ? (
                    <div
                      className="absolute w-9 h-9 border-4 border-[#6D4C82] rounded-full bg-[#6D4C82]/20 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-purple-500/30"
                      style={highlightStyle}
                    />
                  ) : null}
                  {highlight?.label ? (
                    <div className="absolute left-3 right-3 bottom-3 rounded-xl bg-[#404040]/85 px-3 py-2 text-[11px] font-black tracking-wide text-white">
                      {highlight.label}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No screenshot</div>
              )}
            </div>
          </button>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-3">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between gap-3 flex-wrap">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step Type</label>
                <EditHint />
              </div>
              <StepKindSelector
                value={step.step_kind}
                onChange={(value) => onUpdateStep(step.id, { step_kind: value })}
              />
            </div>
            <div className="flex gap-2 text-gray-300">
              <button onClick={() => onEditScreenshot(step.id)} className="p-2 hover:text-[#6D4C82] hover:bg-purple-50 rounded-xl transition-all">
                <Edit3 size={18} />
              </button>
              <button onClick={() => onDelete(step.id)} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between gap-3 flex-wrap">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Human-friendly action</label>
            <EditHint />
          </div>
          <textarea
            value={step.title}
            rows={2}
            className="w-full text-lg font-black text-[#404040] border border-purple-100 rounded-[1.25rem] focus:ring-0 focus:border-[#6D4C82] p-3 mb-3 bg-[#FCFAFD] resize-none leading-snug break-words whitespace-pre-wrap overflow-hidden outline-none"
            onChange={(e) => onUpdateStep(step.id, { title: e.target.value })}
          />

          <div className="mb-2 flex items-center justify-between gap-3 flex-wrap">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Guidance for the reader</label>
            <EditHint />
          </div>
          <textarea
            value={step.description}
            rows={3}
            className="w-full text-sm font-medium text-[#404040] border border-purple-100 rounded-[1.25rem] focus:ring-0 focus:border-[#6D4C82] p-3 mb-2 bg-white resize-none leading-relaxed outline-none"
            onChange={(e) => onUpdateStep(step.id, { description: e.target.value })}
          />

          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            {step.metadata.app_name || 'Application'} {step.metadata.window_title ? `• ${step.metadata.window_title}` : ''}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

const Editor: React.FC = () => {
  const { currentProcess, setCurrentProcess } = useAppStore()
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`
  const [editingStepId, setEditingStepId] = React.useState<string | null>(null)
  const [hasPendingAnnotation, setHasPendingAnnotation] = React.useState(false)
  const [isSavingAnnotation, setIsSavingAnnotation] = React.useState(false)
  const [annotationImageSrc, setAnnotationImageSrc] = React.useState('')
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeDragStepId, setActiveDragStepId] = React.useState<string | null>(null)
  const annotationCanvasRef = React.useRef<AnnotationCanvasHandle | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!currentProcess) return null

  React.useEffect(() => {
    const needsFlowRefresh = !currentProcess.flow_diagram
      || currentProcess.flow_diagram.nodes.some((node) => node.stepId && !node.sequenceLabel)

    if (needsFlowRefresh) {
      setCurrentProcess(mergeFlowDiagram(currentProcess))
    }
  }, [currentProcess, setCurrentProcess])

  const updateProcess = (nextProcess: RecordingProcess) => {
    setCurrentProcess(nextProcess)
  }

  const handleUpdateTitle = (title: string) => {
    updateProcess({ ...currentProcess, title, intake: { ...currentProcess.intake, processName: title } })
  }

  const handleUpdateIntake = (field: 'objective' | 'owner' | 'frequency' | 'expectedCompletionTime' | 'contactEmail', value: string) => {
    updateProcess({ ...currentProcess, intake: { ...currentProcess.intake, [field]: value } })
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveDragStepId(null)
    if (!over || active.id === over.id) return

    const oldIndex = currentProcess.steps.findIndex((s) => s.id === active.id)
    const newIndex = currentProcess.steps.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const newSteps = arrayMove(currentProcess.steps, oldIndex, newIndex).map((step, index) => ({
      ...step,
      step_number: index + 1
    }))

    updateProcess(mergeFlowDiagram({ ...currentProcess, steps: newSteps }))
  }

  const handleDragStart = (event: any) => {
    setActiveDragStepId(String(event.active.id))
  }

  const handleDragCancel = () => {
    setActiveDragStepId(null)
  }

  const handleDeleteStep = (id: string) => {
    const newSteps = currentProcess.steps
      .filter((s) => s.id !== id)
      .map((step, index) => ({
        ...step,
        step_number: index + 1
      }))
    updateProcess(mergeFlowDiagram({ ...currentProcess, steps: newSteps }))
  }

  const handleUpdateStep = (id: string, patch: Partial<RecordingStep>) => {
    const newSteps = currentProcess.steps.map((step) => step.id === id ? { ...step, ...patch } : step)
    updateProcess(mergeFlowDiagram({ ...currentProcess, steps: newSteps }))
  }

  const handleSaveGuide = async () => {
    const nextProcess = mergeFlowDiagram(currentProcess)
    updateProcess(nextProcess)
    setSaveState('saving')
    await (window as any).electron.saveProcess(nextProcess)
    setSaveState('saved')
    window.setTimeout(() => setSaveState('idle'), 2000)
  }

  const handleExport = async (format: 'html' | 'pdf' | 'docx') => {
    const nextProcess = mergeFlowDiagram(currentProcess)
    updateProcess(nextProcess)
    if (format === 'html') await (window as any).electron.exportToHTML(nextProcess)
    if (format === 'pdf') await (window as any).electron.exportToPDF(nextProcess)
    if (format === 'docx') await (window as any).electron.exportToDOCX(nextProcess)
  }

  const handleUpdateScreenshot = async (id: string, dataUrl: string) => {
    const filePath = await (window as any).electron.saveAnnotatedImage(dataUrl)
    updateProcess(updateScreenshotPath(currentProcess, id, filePath))
  }

  const editingStep = editingStepId ? findStepById(currentProcess, editingStepId) : null
  const activeDragStep = activeDragStepId ? currentProcess.steps.find((step) => step.id === activeDragStepId) || null : null

  const handleOpenAnnotation = (id: string) => {
    setEditingStepId(id)
    setHasPendingAnnotation(false)
    setAnnotationImageSrc('')
  }

  const handleCloseAnnotation = (force = false) => {
    if (isSavingAnnotation && !force) return
    setEditingStepId(null)
    setHasPendingAnnotation(false)
    setAnnotationImageSrc('')
  }

  const handleApplyAnnotation = async () => {
    if (!editingStep || !annotationCanvasRef.current) {
      handleCloseAnnotation()
      return
    }

    if (!hasPendingAnnotation) {
      handleCloseAnnotation()
      return
    }

    const dataUrl = annotationCanvasRef.current.exportImage()
    if (!dataUrl) return

    setIsSavingAnnotation(true)
    try {
      await handleUpdateScreenshot(editingStep.id, dataUrl)
      handleCloseAnnotation(true)
    } finally {
      setIsSavingAnnotation(false)
    }
  }

  React.useEffect(() => {
    if (!editingStep) return

    let isActive = true

    ;(async () => {
      try {
        const imageSrc = await (window as any).electron.loadImageData(editingStep.screenshot_path)
        if (isActive) {
          setAnnotationImageSrc(imageSrc || getScreenshotSrc(editingStep.screenshot_path))
        }
      } catch {
        if (isActive) {
          setAnnotationImageSrc(getScreenshotSrc(editingStep.screenshot_path))
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [editingStep])

  return (
    <div className="min-h-screen bg-[#FDFCFE] pb-32">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-b border-purple-50 sticky top-0 z-30 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4 md:gap-8 min-w-0">
            <button
              onClick={() => setCurrentProcess(null)}
              className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-4 min-w-0">
              <img src={logoSrc} alt="HachiAi Logo" className="h-10 w-auto object-contain" />
              <div className="h-6 w-px bg-purple-100 hidden md:block" />
              <textarea
                value={currentProcess.title}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                placeholder="Guide title"
                rows={2}
                className="text-sm md:text-base font-black text-[#404040] tracking-wide max-w-[520px] w-full bg-transparent border-none focus:ring-0 p-0 resize-none leading-snug break-words whitespace-pre-wrap overflow-hidden outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex bg-gray-100/50 p-1 rounded-2xl flex-wrap">
              <button onClick={() => handleExport('html')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#6D4C82] transition-colors flex items-center gap-2"><Download size={14} />HTML</button>
              <button onClick={() => handleExport('pdf')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#6D4C82] transition-colors">PDF</button>
              <button onClick={() => handleExport('docx')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#6D4C82] transition-colors">DOCX</button>
            </div>
            <button
              onClick={handleSaveGuide}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#6D4C82] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-200 hover:bg-[#5a3e6b] transition-all active:scale-95"
            >
              {saveState === 'saved' ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save Guide'}
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto py-10 md:py-16 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-8 md:p-14 mb-12 shadow-2xl shadow-purple-900/5 border border-purple-50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-50 rounded-full -mr-40 -mt-40 opacity-30" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 p-2 px-4 bg-purple-50 rounded-full text-[#6D4C82] w-fit">
                <Sparkles size={14} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Guide Builder</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#FCFAFD] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#6D4C82] border border-purple-100">
                <Workflow size={14} />
                Guide details are editable
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between gap-3 flex-wrap">
              <EditHint />
            </div>
            <textarea
              value={currentProcess.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              placeholder="Name this guide"
              rows={2}
              className="text-4xl md:text-6xl font-black text-[#404040] mb-4 tracking-tight leading-none max-w-4xl w-full bg-transparent border-none focus:ring-0 p-0 resize-none break-words whitespace-pre-wrap overflow-hidden outline-none"
            />

            <div className="mb-10 rounded-[2rem] border border-purple-100 bg-[#FCFAFD] p-6">
              <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6D4C82]">Process Summary</span>
                <EditHint />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Who performs it</label>
                  <textarea
                    value={currentProcess.intake.owner}
                    rows={2}
                    onChange={(event) => handleUpdateIntake('owner', event.target.value)}
                    className="w-full rounded-[1.5rem] border border-purple-100 bg-white px-4 py-3 text-sm font-semibold text-[#404040] resize-none outline-none focus:border-[#6D4C82]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">What it achieves</label>
                  <textarea
                    value={currentProcess.intake.objective}
                    rows={2}
                    onChange={(event) => handleUpdateIntake('objective', event.target.value)}
                    className="w-full rounded-[1.5rem] border border-purple-100 bg-white px-4 py-3 text-sm font-semibold text-[#404040] resize-none outline-none focus:border-[#6D4C82]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">How often</label>
                  <textarea
                    value={currentProcess.intake.frequency}
                    rows={2}
                    onChange={(event) => handleUpdateIntake('frequency', event.target.value)}
                    className="w-full rounded-[1.5rem] border border-purple-100 bg-white px-4 py-3 text-sm font-semibold text-[#404040] resize-none outline-none focus:border-[#6D4C82]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Expected completion time</label>
                  <div className="relative">
                    <select
                      value={currentProcess.intake.expectedCompletionTime}
                      onChange={(event) => handleUpdateIntake('expectedCompletionTime', event.target.value)}
                      className="w-full appearance-none rounded-[1.5rem] border border-purple-100 bg-white px-4 py-3 pr-12 text-sm font-semibold text-[#404040] outline-none transition focus:border-[#6D4C82]"
                    >
                      <option value="">Select expected completion time</option>
                      {EXPECTED_COMPLETION_TIME_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6D4C82]">
                      <Pencil size={14} className="opacity-70" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Concerned person's email</label>
                  <textarea
                    value={currentProcess.intake.contactEmail}
                    rows={2}
                    onChange={(event) => handleUpdateIntake('contactEmail', event.target.value)}
                    className="w-full rounded-[1.5rem] border border-purple-100 bg-white px-4 py-3 text-sm font-semibold text-[#404040] resize-none outline-none focus:border-[#6D4C82]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <section className="mb-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6D4C82]">Recorded steps</span>
            <h2 className="mt-2 text-3xl font-black text-[#404040]">Refine the document before export</h2>
          </div>
          <div className="rounded-[1.5rem] border border-purple-100 bg-white px-5 py-4 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Guide quality</p>
            <p className="mt-2 text-sm font-semibold text-[#404040]">Refine each step so it reads clearly for a first-time user and is ready to share with a client.</p>
          </div>
        </section>

        <section className="mb-8 rounded-[2rem] border border-purple-100 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6D4C82]">Editing Tips</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Use action titles that begin with a clear instruction, such as "Select", "Enter", or "Review". Keep the supporting text focused on what the user should confirm before moving forward.
          </p>
        </section>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={currentProcess.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {currentProcess.steps.map((step) => (
              <SortableStepItem
                key={step.id}
                step={step}
                onDelete={handleDeleteStep}
                onUpdateStep={handleUpdateStep}
                onEditScreenshot={handleOpenAnnotation}
              />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDragStep ? <DragStepPreview step={activeDragStep} /> : null}
          </DragOverlay>
        </DndContext>

        <section className="mt-14">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6D4C82]">Flow diagram</span>
              <h2 className="mt-2 text-3xl font-black text-[#404040]">Review the process flow after the steps</h2>
            </div>
            <EditHint />
          </div>
          <FlowDiagramEditor
            diagram={currentProcess.flow_diagram}
            onUpdate={(flow_diagram) => updateProcess({ ...currentProcess, flow_diagram })}
          />
        </section>
      </main>

      {editingStep && (
        <div className="fixed inset-0 bg-[#404040]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-12">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] w-full max-w-6xl max-h-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 md:p-8 border-b border-purple-50 flex flex-col gap-4 md:flex-row md:justify-between md:items-center bg-gray-50/30">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#6D4C82] uppercase tracking-widest">Step {editingStep.step_number}</span>
                <h3 className="text-2xl font-black text-[#404040]">Annotate or redact screenshot</h3>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleCloseAnnotation} className="px-8 py-4 bg-white text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 hover:text-gray-700 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleApplyAnnotation}
                  disabled={isSavingAnnotation}
                  className="px-10 py-4 bg-[#6D4C82] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-200 hover:bg-[#5a3e6b] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                >
                  {isSavingAnnotation ? 'Saving...' : 'Apply & Close'}
                </button>
              </div>
            </div>
            <div className="p-6 md:p-12 flex-1 overflow-auto bg-gray-100/20">
              <AnnotationCanvas
                key={editingStep.id}
                ref={annotationCanvasRef}
                imageSrc={annotationImageSrc}
                onChange={setHasPendingAnnotation}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Editor
