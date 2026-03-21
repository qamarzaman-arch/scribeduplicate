import { app, BrowserWindow, ipcMain, globalShortcut, protocol, shell } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { Recorder } from './recorder'
import { Exporter } from './exporter'
import { createOverlayWindow, closeOverlayWindow } from './overlay'
import { dialog } from 'electron'
import Store from 'electron-store'
import { LEGAL_CONSENT_VERSION } from '../common/legal'

let mainWindow: BrowserWindow | null = null
const recorder = new Recorder()
const store = new Store()
const APP_ID = 'com.hachiai.requirementsgatheringtool'
const APP_TITLE = 'HachiAi Requirements Gathering Tool'

function getAppIconPath() {
  return join(app.getAppPath(), 'public', 'logo-mark.png')
}

function getRendererHtmlPath() {
  return join(app.getAppPath(), 'dist', 'index.html')
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 860,
    title: APP_TITLE,
    icon: getAppIconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false // Necessary for loading local files even with custom protocols sometimes
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(getRendererHtmlPath())
  }
}

app.whenReady().then(() => {
  app.setName(APP_TITLE)
  app.setAppUserModelId(APP_ID)
  createWindow()

  globalShortcut.register('CommandOrControl+Shift+R', async () => {
    if (recorder.isRecording) {
      const process = recorder.stopRecording()
      if (process) {
        const processes: any[] = store.get('processes', []) as any[]
        processes.push(process)
        store.set('processes', processes)
      }
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
    try {
      await recorder.startRecording(title)
      createOverlayWindow()
      mainWindow?.minimize()
      return true
    } catch (err) {
      console.error('[Main] Failed to start recording:', err)
      throw err
    }
  })

  ipcMain.handle('stop-recording', () => {
    try {
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
    } catch (err) {
      console.error('[Main] Failed to stop recording:', err)
      throw err
    }
  })

  ipcMain.handle('get-processes', () => {
    return store.get('processes', [])
  })

  ipcMain.handle('get-legal-consent-status', () => {
    const consent = store.get('legalConsent', null) as null | { accepted: boolean; version: string; acceptedAt: number }
    return {
      accepted: consent?.accepted === true && consent?.version === LEGAL_CONSENT_VERSION,
      version: LEGAL_CONSENT_VERSION,
      acceptedAt: consent?.acceptedAt ?? null
    }
  })

  ipcMain.handle('accept-legal-consent', () => {
    const consent = {
      accepted: true,
      version: LEGAL_CONSENT_VERSION,
      acceptedAt: Date.now()
    }
    store.set('legalConsent', consent)
    return consent
  })

  ipcMain.handle('save-process', (event, updatedProcess) => {
    const processes: any[] = store.get('processes', []) as any[]
    const index = processes.findIndex((p: any) => p.id === updatedProcess.id)
    const oldProcess = index !== -1 ? processes[index] : null

    if (oldProcess) {
      const newPaths = new Set(updatedProcess.steps.map((s: any) => s.screenshot_path))
      oldProcess.steps.forEach((step: any) => {
        if (!newPaths.has(step.screenshot_path) && step.screenshot_path && fs.existsSync(step.screenshot_path)) {
          try {
            fs.unlinkSync(step.screenshot_path)
          } catch (e) {
            console.error('Failed to cleanup old screenshot:', e)
          }
        }
      })
    }

    if (index !== -1) {
      processes[index] = updatedProcess
    } else {
      processes.push(updatedProcess)
    }

    store.set('processes', processes)
  })

  ipcMain.handle('save-annotated-image', (event, dataUrl) => {
    try {
      const screenshotsDir = join(app.getPath('userData'), 'screenshots')
      fs.mkdirSync(screenshotsDir, { recursive: true })
      const filename = `annotated-${Date.now()}.jpg`
      const filepath = join(screenshotsDir, filename)

      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      fs.writeFileSync(filepath, base64Data, 'base64')
      return filepath
    } catch (err) {
      console.error('[Main] Failed to save annotated image:', err)
      throw err
    }
  })

  ipcMain.handle('load-image-data', (event, imagePath) => {
    try {
      if (!imagePath) return ''
      if (typeof imagePath === 'string' && imagePath.startsWith('data:')) {
        return imagePath
      }

      const extension = join(imagePath).split('.').pop()?.toLowerCase()
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg'
      const imageBuffer = fs.readFileSync(imagePath)
      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
    } catch (err) {
      console.error('[Main] Failed to load image data:', err)
      throw err
    }
  })

  ipcMain.handle('publish-process', async (event, process) => {
    const publishedDir = join(app.getPath('userData'), 'published')
    if (!fs.existsSync(publishedDir)) {
      fs.mkdirSync(publishedDir, { recursive: true })
    }

    const filename = `published-${process.id}.html`
    const filepath = join(publishedDir, filename)

    await Exporter.exportToHTML(process, filepath)

    // Return a URL-like path that the renderer can display
    return `file://${filepath}`
  })

  ipcMain.handle('open-external', async (event, url) => {
    if (url.startsWith('file://')) {
      return shell.openPath(url.replace('file://', ''))
    }
    return shell.openExternal(url)
  })

  ipcMain.handle('delete-process', (event, id) => {
    try {
      const processes: any[] = store.get('processes', []) as any[]
      const processToDelete = processes.find((p: any) => p.id === id)

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

      const newProcesses = processes.filter((p: any) => p.id !== id)
      store.set('processes', newProcesses)
      return newProcesses
    } catch (err) {
      console.error('[Main] Failed to delete process:', err)
      throw err
    }
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

  ipcMain.handle('export-docx', async (event, process) => {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `${process.title}.docx`,
      filters: [{ name: 'Word Document', extensions: ['docx'] }]
    })
    if (filePath) {
      await Exporter.exportToDOCX(process, filePath)
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
      const tempHtmlPath = join(app.getPath('temp'), `temp-${Date.now()}.html`)
      await Exporter.exportToHTML(process, tempHtmlPath)

      await pdfWindow.loadFile(tempHtmlPath)
      const data = await pdfWindow.webContents.printToPDF({
        printBackground: true
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
