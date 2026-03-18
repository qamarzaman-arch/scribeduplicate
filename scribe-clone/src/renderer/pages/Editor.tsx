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
import { ChevronLeft, Save, Share, Trash2, GripVertical, Edit3 } from 'lucide-react'
import { RecordingStep } from '../../common/types'
import AnnotationCanvas from '../components/AnnotationCanvas'

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
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden flex"
    >
      <div {...attributes} {...listeners} className="p-4 bg-gray-50 flex items-center cursor-grab active:cursor-grabbing">
        <GripVertical className="text-gray-400" size={20} />
      </div>
      <div className="p-6 flex-1 flex gap-6">
        <div className="w-48 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0">
          {step.screenshot_path && (
            <div className="relative w-full h-full">
              <img
                src={`app-data://${step.screenshot_path}`}
                alt={`Step ${step.step_number}`}
                className="w-full h-full object-cover"
              />
              {step.action_type === 'click' && step.metadata.x && step.metadata.y && (
                <div
                  className="absolute w-8 h-8 border-4 border-indigo-600 rounded-full bg-indigo-600/20 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(step.metadata.x / 1280) * 100}%`,
                    top: `${(step.metadata.y / (1280 * (9/16))) * 100}%` // Assuming 16:9 for approximation
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-indigo-600 uppercase">Step {step.step_number}</span>
            <div className="flex gap-2">
              <button
                onClick={() => onEditScreenshot(step.id)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Annotate Screenshot"
              >
                <Edit3 size={18} />
              </button>
              <button onClick={() => onDelete(step.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <input
            type="text"
            value={step.description}
            className="w-full text-lg font-medium text-gray-900 border-none focus:ring-0 p-0 mb-1"
            onChange={(e) => onUpdateDescription(step.id, e.target.value)}
          />
          <p className="text-sm text-gray-500">
            {step.metadata.app_name} {step.metadata.window_title ? `• ${step.metadata.window_title}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

const Editor: React.FC = () => {
  const { currentProcess, setCurrentProcess } = useAppStore()
  const [editingStepId, setEditingStepId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!currentProcess) return null

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = currentProcess.steps.findIndex((s) => s.id === active.id)
      const newIndex = currentProcess.steps.findIndex((s) => s.id === over.id)

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

  const handleUpdateScreenshot = (id: string, dataUrl: string) => {
    // In a real app, we'd save this to a file and update the path.
    // For now, we update the screenshot_path to the dataUrl (which Electron can display).
    const newSteps = currentProcess.steps.map((s) =>
      s.id === id ? { ...s, screenshot_path: dataUrl } : s
    )
    setCurrentProcess({ ...currentProcess, steps: newSteps })
  }

  const editingStep = currentProcess.steps.find(s => s.id === editingStepId)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentProcess(null)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{currentProcess.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window as any).electron.exportToHTML(currentProcess)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share size={18} />
              Export HTML
            </button>
            <button
              onClick={() => (window as any).electron.exportToPDF(currentProcess)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share size={18} />
              Export PDF
            </button>
            <button
              onClick={handleSaveGuide}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Save size={18} />
              Save Guide
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl p-8 mb-12 shadow-sm border border-gray-100">
          <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs mb-4 block">Process Summary</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{currentProcess.title}</h2>
          <p className="text-gray-500 leading-relaxed max-w-2xl">
            This automated documentation captures the step-by-step workflow for the process.
            Review each step for accuracy before exporting or sharing.
          </p>
          <div className="flex gap-6 mt-8 pt-8 border-t border-gray-50 text-sm font-medium text-gray-400 uppercase tracking-wider">
            <span>{currentProcess.steps.length} Total Steps</span>
            <span>Created {new Date(currentProcess.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentProcess.steps.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {currentProcess.steps.map((step) => (
              <SortableStepItem
                key={step.id}
                step={step}
                onDelete={handleDeleteStep}
                onUpdateDescription={handleUpdateDescription}
                onEditScreenshot={setEditingStepId}
              />
            ))}
          </SortableContext>
        </DndContext>
      </main>

      {editingStep && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Annotate Screenshot - Step {editingStep.step_number}</h3>
              <button
                onClick={() => setEditingStepId(null)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Apply & Close
              </button>
            </div>
            <div className="p-10 flex-1 overflow-auto bg-gray-100/30">
              <AnnotationCanvas
                imageSrc={editingStep.screenshot_path.startsWith('data:') ? editingStep.screenshot_path : `app-data://${editingStep.screenshot_path}`}
                onSave={(dataUrl) => handleUpdateScreenshot(editingStep.id, dataUrl)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Editor
