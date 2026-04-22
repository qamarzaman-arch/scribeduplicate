import { create } from 'zustand';
import { RecordingProcess } from '../../common/types';

interface AppState {
  processes: RecordingProcess[];
  currentProcess: RecordingProcess | null;
  isRecording: boolean;
  publishedUrl: string | null;
  setProcesses: (processes: RecordingProcess[]) => void;
  setCurrentProcess: (process: RecordingProcess | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setPublishedUrl: (url: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  processes: [],
  currentProcess: null,
  isRecording: false,
  publishedUrl: null,
  setProcesses: (processes) => set({ processes }),
  setCurrentProcess: (currentProcess) => set({ currentProcess }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setPublishedUrl: (publishedUrl) => set({ publishedUrl }),
}));
