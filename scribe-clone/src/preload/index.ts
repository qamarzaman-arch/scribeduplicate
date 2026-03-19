import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  startRecording: (title: string) => ipcRenderer.invoke('start-recording', title),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  onRecordingStopped: (callback: (process: any) => void) => {
    ipcRenderer.on('recording-stopped', (_event, process) => callback(process))
  },
  exportToHTML: (process: any) => ipcRenderer.invoke('export-html', process),
  exportToPDF: (process: any) => ipcRenderer.invoke('export-pdf', process),
  exportToDOCX: (process: any) => ipcRenderer.invoke('export-docx', process),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  saveProcess: (process: any) => ipcRenderer.invoke('save-process', process),
  deleteProcess: (id: string) => ipcRenderer.invoke('delete-process', id),
  saveAnnotatedImage: (dataUrl: string) => ipcRenderer.invoke('save-annotated-image', dataUrl)
})
