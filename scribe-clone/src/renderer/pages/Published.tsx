import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ExternalLink, ArrowLeft, Share2 } from 'lucide-react'
import { useAppStore } from '../store/store'

const Published: React.FC = () => {
  const { publishedUrl, setPublishedUrl, setCurrentProcess } = useAppStore()

  const handleBackToDashboard = () => {
    setPublishedUrl(null)
    setCurrentProcess(null)
  }

  const handleOpenUrl = () => {
    if (publishedUrl) {
      (window as any).electron.openExternal(publishedUrl)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[4rem] p-16 max-w-2xl w-full shadow-2xl shadow-purple-900/5 border border-purple-50 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 opacity-30" />

        <div className="relative z-10">
          <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-green-500 shadow-xl shadow-green-100">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl font-black text-[#404040] mb-6 tracking-tight">Successfully Published!</h1>
          <p className="text-gray-400 text-lg font-medium leading-relaxed mb-12">
            Your guide has been converted to a professional HTML document and is now ready for sharing.
          </p>

          <div className="bg-gray-50 p-6 rounded-3xl mb-12 flex items-center justify-between border border-gray-100">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="p-3 bg-white rounded-2xl text-[#6D4C82] shadow-sm">
                <Share2 size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 truncate text-left">
                {publishedUrl}
              </p>
            </div>
            <button
              onClick={handleOpenUrl}
              className="p-3 hover:bg-white hover:text-[#6D4C82] rounded-2xl text-gray-400 transition-all active:scale-90"
            >
              <ExternalLink size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center justify-center gap-3 px-12 py-5 bg-[#6D4C82] text-white font-black text-sm uppercase tracking-widest rounded-[2rem] shadow-xl shadow-purple-200 hover:bg-[#5a3e6b] transition-all active:scale-95 w-full"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Published
