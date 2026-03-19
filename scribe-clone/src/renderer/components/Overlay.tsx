import React from 'react'
import { Square, Pause, PlayCircle } from 'lucide-react'

interface OverlayProps {
  onStop: () => void;
  onPause: () => void;
  isPaused: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ onStop, onPause, isPaused }) => {
  return (
    <div className="bg-[#404040]/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 select-none">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Recording</span>
      </div>

      <div className="h-6 w-px bg-white/20" />

      <div className="flex items-center gap-3">
        <button
          onClick={onPause}
          className="hover:bg-white/10 p-2 rounded-lg transition-colors"
        >
          {isPaused ? <PlayCircle size={18} /> : <Pause size={18} />}
        </button>
        <button
          onClick={onStop}
          className="bg-red-500 hover:bg-red-600 p-2 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-500/20"
        >
          <Square size={18} fill="currentColor" />
        </button>
      </div>
    </div>
  )
}

export default Overlay
