import { app, shell, BrowserWindow, Tray, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerFileHandlers } from './ipc/fileHandlers'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let closeToTray = false

// 待打开的文件路径（由系统传入，如双击 .md 文件）
// 渲染进程就绪后会通过 IPC 主动拉取
let pendingOpenFile: string | null = null

/** 将文件路径发送到渲染进程（如果已就绪），否则暂存 */
function sendFileToRenderer(filePath: string): void {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('app:openFile', filePath)
  }
  // 始终暂存，渲染进程可能还没注册监听器
  pendingOpenFile = filePath
}

/** 从命令行参数中提取 .md 文件路径 */
function getFilePathFromArgv(argv: string[]): string | null {
  for (const arg of argv.slice(1)) {
    if (arg.endsWith('.md') && !arg.startsWith('-')) {
      return arg
    }
  }
  return null
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    // 注意：不在这里发送 pendingOpenFile，因为此时渲染进程的 React 还未挂载
    // 由渲染进程挂载后通过 IPC 主动拉取
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 拦截关闭事件：如果启用关闭到托盘，隐藏窗口而非关闭
  mainWindow.on('close', (e) => {
    if (closeToTray && mainWindow) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        closeToTray = false // 绕过托盘拦截，真正退出
        app.quit()
      }
    }
  ])
  tray.setToolTip('LeafMark')
  tray.setContextMenu(contextMenu)

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// macOS：应用已打开后再通过系统打开 .md 文件
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (filePath.endsWith('.md')) {
    sendFileToRenderer(filePath)
    // 如果窗口被隐藏到托盘，显示出来
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  }
})

// Windows/Linux：第二次启动时将文件路径传给已有实例
app.on('second-instance', (_, argv) => {
  const filePath = getFilePathFromArgv(argv)
  if (filePath) {
    sendFileToRenderer(filePath)
  }
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.leafmark.editor')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerFileHandlers()

  // 关闭到托盘状态 IPC
  ipcMain.handle('app:setCloseToTray', (_, enabled: boolean) => {
    closeToTray = enabled
  })
  ipcMain.handle('app:getCloseToTray', () => {
    return closeToTray
  })
  ipcMain.handle('app:quitApp', () => {
    closeToTray = false
    app.quit()
  })

  // 渲染进程就绪后拉取待打开的文件路径
  ipcMain.handle('app:getPendingFile', () => {
    const filePath = pendingOpenFile
    pendingOpenFile = null
    return filePath
  })

  createWindow()
  createTray()

  // 首次启动：检查命令行是否传入了文件路径
  const fileFromArgv = getFilePathFromArgv(process.argv)
  if (fileFromArgv) {
    sendFileToRenderer(fileFromArgv)
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', () => {
  // 清理资源
})
