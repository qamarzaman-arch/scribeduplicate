import React from 'react'
import { useAppStore } from '../store/store'
import { Plus, Play, Trash, Clock, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Dashboard: React.FC = () => {
  const { processes, setProcesses, isRecording, setIsRecording, setCurrentProcess } = useAppStore()
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`

  const handleStartRecording = async () => {
    try {
      const title = `Requirements Gathering Session ${new Date().toLocaleDateString()}`
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
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFE] p-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-1"
          >
            <img src={logoSrc} alt="HachiAi Logo" className="h-10 w-auto mb-5 object-contain" />
            <h1 className="text-4xl font-black text-[#404040] tracking-tight">
              My <span className="text-[#6D4C82]">Requirements</span>
            </h1>
            <p className="text-gray-400 font-medium">Capture and document your workflows with intelligence.</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl ${
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
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <h3 className="text-xl font-bold text-[#404040] mb-2">No recordings yet</h3>
                <p className="text-gray-400">Click the button above to start your first guide.</p>
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
      </div>
    </div>
  )
}

export default Dashboard
