import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { app } from 'electron'

let overlayWindow: BrowserWindow | null = null

function getAppIconPath() {
  return join(app.getAppPath(), 'public', 'logo-mark.png')
}

function getRendererHtmlPath() {
  return join(app.getAppPath(), 'dist', 'index.html')
}

export function createOverlayWindow() {
  if (overlayWindow) return overlayWindow

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: 280,
    height: 96,
    x: width - 300,
    y: height - 116,
    icon: getAppIconPath(),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    overlayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#overlay`)
  } else {
    overlayWindow.loadFile(getRendererHtmlPath(), { hash: 'overlay' })
  }

  return overlayWindow
}

export function closeOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.close()
    overlayWindow = null
  }
}
