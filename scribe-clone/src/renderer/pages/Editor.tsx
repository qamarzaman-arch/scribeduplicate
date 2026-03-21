import React from 'react'
import { useAppStore } from '../store/store'
import {
  DndContext,
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
import { ChevronLeft, Save, Trash2, GripVertical, Edit3, Sparkles } from 'lucide-react'
import { RecordingStep } from '../../common/types'
import AnnotationCanvas, { AnnotationCanvasHandle } from '../components/AnnotationCanvas'
import { motion } from 'framer-motion'

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

const SortableStepItem = ({
  step,
  onDelete,
  onUpdateDescription,
  onEditScreenshot
}: {
  step: RecordingStep;
  onDelete: (id: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onEditScreenshot: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      ref={setNodeRef}
      style={style}
      className="bg-white border border-purple-50 rounded-[2rem] mb-6 overflow-hidden flex group/item hover:border-[#6D4C82]/20 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300"
    >
      <div {...attributes} {...listeners} className="p-4 bg-gray-50 flex items-center cursor-grab active:cursor-grabbing">
        <GripVertical className="text-gray-400" size={20} />
      </div>
      <div className="p-6 flex-1 flex gap-6">
        <div className="w-48 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0">
          {step.screenshot_path ? (
            <div className="relative w-full h-full group-hover/item:scale-105 transition-transform duration-500">
              <img
                src={getScreenshotSrc(step.screenshot_path)}
                alt={`Step ${step.step_number}`}
                className="w-full h-full object-cover"
              />
              {step.action_type === 'click' && step.metadata.x && step.metadata.y && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute w-6 h-6 border-3 border-[#6D4C82] rounded-full bg-[#6D4C82]/20 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-purple-500/50"
                  style={{
                    left: `${(step.metadata.x / 1920) * 100}%`,
                    top: `${(step.metadata.y / 1080) * 100}%`
                  }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No screenshot</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-[#6D4C82] uppercase tracking-widest">Step {step.step_number}</span>
            <div className="flex gap-2 text-gray-300">
              <button onClick={() => onEditScreenshot(step.id)} className="p-1.5 hover:text-[#6D4C82] hover:bg-purple-50 rounded-lg transition-all">
                <Edit3 size={18} />
              </button>
              <button onClick={() => onDelete(step.id)} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <textarea
            value={step.description}
            rows={2}
            className="w-full text-lg font-bold text-[#404040] border-none focus:ring-0 p-0 mb-1 bg-transparent resize-none leading-snug break-words whitespace-pre-wrap overflow-hidden"
            onChange={(e) => onUpdateDescription(step.id, e.target.value)}
          />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {step.metadata.app_name} {step.metadata.window_title ? `• ${step.metadata.window_title}` : ''}
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
  const annotationCanvasRef = React.useRef<AnnotationCanvasHandle | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!currentProcess) return null

  const handleUpdateTitle = (title: string) => {
    setCurrentProcess({ ...currentProcess, title })
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (active.id !== over.id) {
      const oldIndex = currentProcess.steps.findIndex((s) => s.id === active.id)
      const newIndex = currentProcess.steps.findIndex((s) => s.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return

      const newSteps = arrayMove(currentProcess.steps, oldIndex, newIndex).map((step, index) => ({
        ...step,
        step_number: index + 1
      }))

      setCurrentProcess({ ...currentProcess, steps: newSteps })
    }
  }

  const handleDeleteStep = (id: string) => {
    const newSteps = currentProcess.steps
      .filter((s) => s.id !== id)
      .map((step, index) => ({
        ...step,
        step_number: index + 1
      }))
    setCurrentProcess({ ...currentProcess, steps: newSteps })
  }

  const handleUpdateDescription = (id: string, description: string) => {
    const newSteps = currentProcess.steps.map((s) =>
      s.id === id ? { ...s, description } : s
    )
    setCurrentProcess({ ...currentProcess, steps: newSteps })
  }

  const handleSaveGuide = async () => {
    await (window as any).electron.saveProcess(currentProcess)
    setCurrentProcess(null)
  }

  const handleUpdateScreenshot = async (id: string, dataUrl: string) => {
    const filePath = await (window as any).electron.saveAnnotatedImage(dataUrl)
    const newSteps = currentProcess.steps.map((s) =>
      s.id === id ? { ...s, screenshot_path: filePath } : s
    )
    setCurrentProcess({ ...currentProcess, steps: newSteps })
  }

  const editingStep = currentProcess.steps.find(s => s.id === editingStepId)

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
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setCurrentProcess(null)}
              className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-4">
              <img src={logoSrc} alt="HachiAi Logo" className="h-10 w-auto object-contain" />
              <div className="h-6 w-px bg-purple-100" />
              <textarea
                value={currentProcess.title}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                placeholder="Guide title"
                rows={2}
                className="text-sm font-black text-[#404040] tracking-wide max-w-[460px] w-full bg-transparent border-none focus:ring-0 p-0 resize-none leading-snug break-words whitespace-pre-wrap overflow-hidden"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100/50 p-1 rounded-2xl">
              <button onClick={() => (window as any).electron.exportToHTML(currentProcess)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#6D4C82] transition-colors">Save as HTML</button>
              <button onClick={() => (window as any).electron.exportToPDF(currentProcess)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#6D4C82] transition-colors">Save as PDF</button>
              <button onClick={() => (window as any).electron.exportToDOCX(currentProcess)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#6D4C82] transition-colors">Save as DOCX</button>
            </div>
            <button
              onClick={handleSaveGuide}
              className="flex items-center gap-2 px-8 py-3 bg-[#6D4C82] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-200 hover:bg-[#5a3e6b] transition-all active:scale-95"
            >
              <Save size={16} />
              Save Guide
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto py-20 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[4rem] p-20 mb-20 shadow-2xl shadow-purple-900/5 border border-purple-50 relative overflow-hidden text-center"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-50 rounded-full -mr-40 -mt-40 opacity-30" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-10 p-2 px-4 bg-purple-50 rounded-full text-[#6D4C82] w-fit">
              <Sparkles size={14} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">AI Analysis Complete</span>
            </div>
            <textarea
              value={currentProcess.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              placeholder="Name this guide"
              rows={2}
              className="text-6xl font-black text-[#404040] mb-10 tracking-tight leading-none max-w-4xl w-full text-center bg-transparent border-none focus:ring-0 p-0 resize-none break-words whitespace-pre-wrap overflow-hidden"
            />
            <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-2xl mb-12">
              HachiAi has successfully converted your actions into a structured process document.
            </p>
            <div className="flex gap-16 py-8 px-12 bg-gray-50 rounded-[2.5rem]">
              <div className="flex flex-col gap-1 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Workflow Size</span>
                <span className="text-2xl font-black text-[#6D4C82]">{currentProcess.steps.length} Steps</span>
              </div>
              <div className="h-10 w-px bg-gray-200 self-center" />
              <div className="flex flex-col gap-1 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Generated On</span>
                <span className="text-2xl font-black text-[#404040]">{new Date(currentProcess.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={currentProcess.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {currentProcess.steps.map((step) => (
              <SortableStepItem key={step.id} step={step} onDelete={handleDeleteStep} onUpdateDescription={handleUpdateDescription} onEditScreenshot={handleOpenAnnotation} />
            ))}
          </SortableContext>
        </DndContext>
      </main>

      {editingStep && (
        <div className="fixed inset-0 bg-[#404040]/80 backdrop-blur-md z-50 flex items-center justify-center p-12">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] w-full max-w-6xl max-h-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-purple-50 flex justify-between items-center bg-gray-50/30">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#6D4C82] uppercase tracking-widest">Step {editingStep.step_number}</span>
                <h3 className="text-2xl font-black text-[#404040]">Annotate & Redact</h3>
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
            <div className="p-12 flex-1 overflow-auto bg-gray-100/20">
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
