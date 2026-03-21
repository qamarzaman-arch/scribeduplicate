import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  startRecording: (title: string) => ipcRenderer.invoke('start-recording', title),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  onRecordingStopped: (callback: (process: any) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, process: any) => callback(process)
    ipcRenderer.on('recording-stopped', listener)
    return () => ipcRenderer.removeListener('recording-stopped', listener)
  },
  exportToHTML: (process: any) => ipcRenderer.invoke('export-html', process),
  exportToPDF: (process: any) => ipcRenderer.invoke('export-pdf', process),
  exportToDOCX: (process: any) => ipcRenderer.invoke('export-docx', process),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  getLegalConsentStatus: () => ipcRenderer.invoke('get-legal-consent-status'),
  acceptLegalConsent: () => ipcRenderer.invoke('accept-legal-consent'),
  saveProcess: (process: any) => ipcRenderer.invoke('save-process', process),
  deleteProcess: (id: string) => ipcRenderer.invoke('delete-process', id),
  saveAnnotatedImage: (dataUrl: string) => ipcRenderer.invoke('save-annotated-image', dataUrl),
  loadImageData: (imagePath: string) => ipcRenderer.invoke('load-image-data', imagePath)
})
