import React from 'react'
import { useAppStore } from '../store/store'
import { Plus, Play, Trash, FileEdit } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { processes, setProcesses, isRecording, setIsRecording, setCurrentProcess } = useAppStore()

  const handleStartRecording = async () => {
    try {
      const title = 'New Recording ' + new Date().toLocaleString()
      await (window as any).electron.startRecording(title)
      setIsRecording(true)
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
        // Switch to editor page or update processes list
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="HachiAi Logo" className="h-10" />
          <h1 className="text-2xl font-bold text-[#404040]">Requirements <span className="text-[#6D4C82]">Gathering</span></h1>
        </div>
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg ${
            isRecording
              ? 'bg-red-500 text-white shadow-red-200'
              : 'bg-[#6D4C82] text-white shadow-purple-200'
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Play className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-lg">No guides yet. Start recording your first process!</p>
          </div>
        ) : (
          processes.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(p.created_at).toLocaleDateString()} • {p.steps.length} steps
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentProcess(p)}
                  className="p-2 text-[#6D4C82] hover:bg-purple-50 rounded-lg"
                >
                  <FileEdit size={18} />
                </button>
                <button
                  onClick={async () => {
                    const newProcesses = await (window as any).electron.deleteProcess(p.id)
                    setProcesses(newProcesses)
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-auto"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
