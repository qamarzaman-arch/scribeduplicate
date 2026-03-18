import { app, BrowserWindow, ipcMain, globalShortcut, protocol } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { Recorder } from './recorder'
import { createOverlayWindow, closeOverlayWindow } from './overlay'
import { Exporter } from './exporter'
import { dialog } from 'electron'
import Store from 'electron-store'

let mainWindow: BrowserWindow | null = null
const recorder = new Recorder()
const store = new Store()

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('app-data', (request, callback) => {
    const url = request.url.replace('app-data://', '')
    try {
      return callback(decodeURIComponent(url))
    } catch (error) {
      console.error(error)
    }
  })

  createWindow()

  globalShortcut.register('CommandOrControl+Shift+R', async () => {
    if (recorder.isRecording) {
      const process = recorder.stopRecording()
      closeOverlayWindow()
      mainWindow?.restore()
      mainWindow?.webContents.send('recording-stopped', process)
    } else {
      await recorder.startRecording('New Recording (Shortcut)')
      createOverlayWindow()
      mainWindow?.minimize()
    }
  })

  ipcMain.handle('start-recording', async (event, title) => {
    await recorder.startRecording(title)
    createOverlayWindow()
    mainWindow?.minimize()
  })

  ipcMain.handle('stop-recording', () => {
    const process = recorder.stopRecording()
    if (process) {
      const processes: any[] = store.get('processes', []) as any[]
      processes.push(process)
      store.set('processes', processes)
    }
    closeOverlayWindow()
    mainWindow?.restore()
    mainWindow?.webContents.send('recording-stopped', process)
    return process
  })

  ipcMain.handle('get-processes', () => {
    return store.get('processes', [])
  })

  ipcMain.handle('save-process', (event, updatedProcess) => {
    const processes: any[] = store.get('processes', []) as any[]
    const index = processes.findIndex(p => p.id === updatedProcess.id)
    if (index !== -1) {
      processes[index] = updatedProcess
      store.set('processes', processes)
    }
  })

  ipcMain.handle('delete-process', (event, id) => {
    const processes: any[] = store.get('processes', []) as any[]
    const processToDelete = processes.find(p => p.id === id)

    // Auto-cleanup unused screenshots
    if (processToDelete && processToDelete.steps) {
      processToDelete.steps.forEach((step: any) => {
        if (step.screenshot_path && fs.existsSync(step.screenshot_path)) {
          try {
            fs.unlinkSync(step.screenshot_path)
          } catch (e) {
            console.error('Failed to delete screenshot:', e)
          }
        }
      })
    }

    const newProcesses = processes.filter(p => p.id !== id)
    store.set('processes', newProcesses)
    return newProcesses
  })

  ipcMain.handle('export-html', async (event, process) => {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `${process.title}.html`,
      filters: [{ name: 'HTML', extensions: ['html'] }]
    })
    if (filePath) {
      await Exporter.exportToHTML(process, filePath)
      return true
    }
    return false
  })

  ipcMain.handle('export-pdf', async (event, process) => {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `${process.title}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (filePath) {
      const pdfWindow = new BrowserWindow({ show: false })

      // Temporary HTML to print
      const tempHtmlPath = join(app.getPath('temp'), `temp-${Date.now()}.html`)
      await Exporter.exportToHTML(process, tempHtmlPath)

      await pdfWindow.loadFile(tempHtmlPath)
      const data = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        marginsType: 1, // Default margins
      })

      fs.writeFileSync(filePath, data)
      pdfWindow.close()
      fs.unlinkSync(tempHtmlPath)
      return true
    }
    return false
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
