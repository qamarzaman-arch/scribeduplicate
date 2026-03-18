import { create } from 'zustand';
import { RecordingProcess } from '../../common/types';

interface AppState {
  processes: RecordingProcess[];
  currentProcess: RecordingProcess | null;
  isRecording: boolean;
  setProcesses: (processes: RecordingProcess[]) => void;
  setCurrentProcess: (process: RecordingProcess | null) => void;
  setIsRecording: (isRecording: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  processes: [],
  currentProcess: null,
  isRecording: false,
  setProcesses: (processes) => set({ processes }),
  setCurrentProcess: (currentProcess) => set({ currentProcess }),
  setIsRecording: (isRecording) => set({ isRecording }),
}));
