import React from 'react'
import { Square, Pause, PlayCircle } from 'lucide-react'

interface OverlayProps {
  onStop: () => void;
  onPause: () => void;
  isPaused: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ onStop, onPause, isPaused }) => {
  return (
    <div className="bg-gray-900/80 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 select-none">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider">Recording</span>
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
          className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors"
        >
          <Square size={18} fill="currentColor" />
        </button>
      </div>
    </div>
  )
}

export default Overlay
