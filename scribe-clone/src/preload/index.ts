import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  startRecording: (intake: any) => ipcRenderer.invoke('start-recording', intake),
  startBranchRecording: (branchContext: any) => ipcRenderer.invoke('start-branch-recording', branchContext),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  onRecordingStopped: (callback: (process: any) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, process: any) => callback(process)
    ipcRenderer.on('recording-stopped', listener)
    return () => ipcRenderer.removeListener('recording-stopped', listener)
  },
  onBranchRecordingStopped: (callback: (payload: any) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload)
    ipcRenderer.on('branch-recording-stopped', listener)
    return () => ipcRenderer.removeListener('branch-recording-stopped', listener)
  },
  exportToHTML: (process: any) => ipcRenderer.invoke('export-html', process),
  exportToPDF: (process: any) => ipcRenderer.invoke('export-pdf', process),
  exportToDOCX: (process: any) => ipcRenderer.invoke('export-docx', process),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  getRecordingState: () => ipcRenderer.invoke('get-recording-state'),
  getLegalConsentStatus: () => ipcRenderer.invoke('get-legal-consent-status'),
  acceptLegalConsent: () => ipcRenderer.invoke('accept-legal-consent'),
  saveProcess: (process: any) => ipcRenderer.invoke('save-process', process),
  deleteProcess: (id: string) => ipcRenderer.invoke('delete-process', id),
  saveAnnotatedImage: (dataUrl: string) => ipcRenderer.invoke('save-annotated-image', dataUrl),
  loadImageData: (imagePath: string) => ipcRenderer.invoke('load-image-data', imagePath),
  openLocalPath: (targetPath: string) => ipcRenderer.invoke('open-local-path', targetPath),
  getBundledDocumentPath: (fileName: string) => ipcRenderer.invoke('get-bundled-document-path', fileName),
  saveBundledDocument: (fileName: string) => ipcRenderer.invoke('save-bundled-document', fileName)
})
