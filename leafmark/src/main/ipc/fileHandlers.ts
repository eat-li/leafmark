import { ipcMain, app, dialog, BrowserWindow, clipboard, shell } from 'electron'
import { promises as fsp } from 'fs'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'

interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileEntry[]
}

// 支持在文件树中显示的图片扩展名
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']

async function readDirTree(dirPath: string, depth = 10): Promise<FileEntry[]> {
  if (depth <= 0) return []
  const entries = await fsp.readdir(dirPath, { withFileTypes: true })
  const result: FileEntry[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dirPath, entry.name).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
        children: await readDirTree(path.join(dirPath, entry.name), depth - 1)
      })
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      if (ext === '.md' || IMAGE_EXTENSIONS.includes(ext)) {
        result.push({ name: entry.name, path: fullPath, type: 'file' })
      }
    }
  }
  result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'directory' ? -1 : 1
  })
  return result
}

export function registerFileHandlers(): void {
  // ---------- 文件系统读取 ----------
  ipcMain.handle('fs:readDirTree', async (_, dirPath: string, depth?: number) => {
    try {
      return await readDirTree(dirPath, depth ?? 10)
    } catch (err: any) {
      throw new Error(`读取目录失败: ${err.message}`)
    }
  })

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      return await fsp.readFile(filePath, 'utf-8')
    } catch (err: any) {
      throw new Error(`读取文件失败: ${err.message}`)
    }
  })

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        await fsp.mkdir(dir, { recursive: true })
      }
      await fsp.writeFile(filePath, content, 'utf-8')
    } catch (err: any) {
      throw new Error(`写入文件失败: ${err.message}`)
    }
  })

  ipcMain.handle('fs:createFile', async (_, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        throw new Error(`文件已存在: ${filePath}`)
      }
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        await fsp.mkdir(dir, { recursive: true })
      }
      await fsp.writeFile(filePath, '', 'utf-8')
    } catch (err: any) {
      throw new Error(err.message || `创建文件失败`)
    }
  })

  ipcMain.handle('fs:createFolder', async (_, folderPath: string) => {
    try {
      await fsp.mkdir(folderPath, { recursive: true })
    } catch (err: any) {
      throw new Error(`创建文件夹失败: ${err.message}`)
    }
  })

  ipcMain.handle('fs:deletePath', async (_, targetPath: string) => {
    try {
      const stat = await fsp.stat(targetPath)
      if (stat.isDirectory()) {
        await fsp.rm(targetPath, { recursive: true })
      } else {
        await fsp.unlink(targetPath)
      }
    } catch (err: any) {
      throw new Error(`删除失败: ${err.message}`)
    }
  })

  ipcMain.handle('fs:renamePath', async (_, oldPath: string, newPath: string) => {
    try {
      await fsp.rename(oldPath, newPath)
    } catch (err: any) {
      throw new Error(`重命名失败: ${err.message}`)
    }
  })

  ipcMain.handle('fs:pathExists', async (_, targetPath: string) => {
    return fs.existsSync(targetPath)
  })

  ipcMain.handle('fs:getDocumentsDir', async () => {
    const dir = path.join(app.getPath('documents'), 'LeafMark Notes')
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true })
    }
    return dir.replace(/\\/g, '/')
  })

  // ---------- 窗口控制 ----------
  ipcMain.handle('win:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('win:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle('win:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('win:isMaximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  // ---------- 原生对话框 ----------
  ipcMain.handle('dialog:open', async (_, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(options)
    return result.filePaths
  })

  // ---------- 应用设置 ----------
  ipcMain.handle('app:setAutoLaunch', (_, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
  })

  ipcMain.handle('app:getAutoLaunch', () => {
    return app.getLoginItemSettings().openAtLogin
  })

  // ---------- .md 文件关联 ----------
  const APP_ID = 'com.leafmark.editor'
  const PROG_ID = `${APP_ID}.md`

  /** 通过注册表检查 .md 文件是否已关联到本应用 */
  function checkFileAssociation(): Promise<boolean> {
    return new Promise((resolve) => {
      if (process.platform !== 'win32') {
        resolve(false)
        return
      }
      execFile('reg', ['query', `HKCU\\Software\\Classes\\.md`, '/ve'], (err, stdout) => {
        if (err) {
          resolve(false)
          return
        }
        resolve(stdout.includes(PROG_ID))
      })
    })
  }

  /** 通过注册表设置 .md 文件关联到本应用 */
  function setFileAssociation(enabled: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      if (process.platform !== 'win32') {
        resolve(false)
        return
      }

      if (!enabled) {
        // 取消关联：删除 .md 的默认值
        execFile('reg', ['delete', `HKCU\\Software\\Classes\\.md`, '/ve', '/f'], (err) => {
          resolve(!err)
        })
        return
      }

      const exePath = process.execPath.replace(/\\/g, '\\\\')
      // 构建注册表命令：设置 .md 默认值 + 注册 ProgId + 设置打开命令
      const cmd = [
        `reg add "HKCU\\Software\\Classes\\.md" /ve /d "${PROG_ID}" /f &&`,
        `reg add "HKCU\\Software\\Classes\\${PROG_ID}" /ve /d "Markdown 文档" /f &&`,
        `reg add "HKCU\\Software\\Classes\\${PROG_ID}\\DefaultIcon" /ve /d "${exePath},0" /f &&`,
        `reg add "HKCU\\Software\\Classes\\${PROG_ID}\\shell\\open\\command" /ve /d "\\"${exePath}\\" \\"%1\\"" /f`
      ].join(' ')

      require('child_process').exec(cmd, (err: any) => {
        resolve(!err)
      })
    })
  }

  ipcMain.handle('app:getFileAssociation', async () => {
    return await checkFileAssociation()
  })

  ipcMain.handle('app:setFileAssociation', async (_, enabled: boolean) => {
    return await setFileAssociation(enabled)
  })

  // ---------- 剪贴板图片 ----------
  ipcMain.handle('fs:readImageAsDataUrl', async (_, filePath: string) => {
    try {
      const data = await fsp.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase().replace('.', '')
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        bmp: 'image/bmp'
      }
      const mime = mimeMap[ext] || `image/${ext}`
      return `data:${mime};base64,${data.toString('base64')}`
    } catch {
      return null
    }
  })

  ipcMain.handle('clipboard:readImage', () => {
    const image = clipboard.readImage()
    if (image.isEmpty()) return null
    return image.toDataURL()
  })

  ipcMain.handle('clipboard:saveImage', async (_, base64: string, dirPath: string) => {
    try {
      const assetsDir = path.join(dirPath, 'assets')
      if (!fs.existsSync(assetsDir)) {
        await fsp.mkdir(assetsDir, { recursive: true })
      }
      const fileName = `img_${Date.now()}.png`
      const filePath = path.join(assetsDir, fileName)
      const data = base64.replace(/^data:image\/png;base64,/, '')
      await fsp.writeFile(filePath, Buffer.from(data, 'base64'))
      return `assets/${fileName}`
    } catch (err: any) {
      console.error('保存图片失败:', err.message)
      throw err
    }
  })

  // ---------- 系统操作 ----------
  ipcMain.handle('shell:openPath', (_, targetPath: string) => {
    return shell.openPath(targetPath)
  })

  // ---------- 导出 ----------
  ipcMain.handle('export:pdf', async (_, html: string, defaultName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出为 PDF',
      defaultPath: defaultName,
      filters: [{ name: 'PDF 文件', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return false

    const win = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true, sandbox: false }
    })
    try {
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const pdf = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { marginType: 'default' }
      })
      await fsp.writeFile(filePath, pdf)
      return true
    } finally {
      win.destroy()
    }
  })

  ipcMain.handle('export:html', async (_, html: string, defaultName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出为 HTML',
      defaultPath: defaultName,
      filters: [{ name: 'HTML 文件', extensions: ['html'] }]
    })
    if (canceled || !filePath) return false
    await fsp.writeFile(filePath, html, 'utf-8')
    return true
  })
}
