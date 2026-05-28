import { ipcMain, app, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'

// 文件/目录条目结构
interface FileEntry {
  name: string // 名称
  path: string // 绝对路径
  type: 'file' | 'directory' // 类型
  children?: FileEntry[] // 子条目（仅目录有）
}

/**
 * 递归读取目录树，仅包含 .md 文件，跳过隐藏文件（以点开头）
 * @param dirPath 目录路径
 * @param depth 递归深度（默认 10，防止过深）
 * @returns 排序后的条目数组（目录优先，名称字母排序）
 */
function readDirTree(dirPath: string, depth = 10): FileEntry[] {
  if (depth <= 0) return []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const result: FileEntry[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue // 跳过隐藏文件/目录
    const fullPath = path.join(dirPath, entry.name).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
        children: readDirTree(path.join(dirPath, entry.name), depth - 1)
      })
    } else if (entry.name.endsWith('.md')) {
      result.push({ name: entry.name, path: fullPath, type: 'file' })
    }
  }
  // 排序：目录排在文件前，同类型按字母排序
  result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'directory' ? -1 : 1
  })
  return result
}

/**
 * 注册所有与文件系统、窗口控制、对话框相关的 IPC 处理器
 * 应在 Electron 主进程中调用（例如 app.whenReady() 之后）
 */
export function registerFileHandlers(): void {
  // ---------- 文件系统读取 ----------
  // 读取目录树（递归），返回 FileEntry 数组
  ipcMain.handle('fs:readDirTree', (_, dirPath: string, depth?: number) => {
    return readDirTree(dirPath, depth ?? 10)
  })

  // 读取文件内容（UTF-8 文本）
  ipcMain.handle('fs:readFile', (_, filePath: string) => {
    return fs.readFileSync(filePath, 'utf-8')
  })

  // 写入文件内容（自动创建不存在的目录）
  ipcMain.handle('fs:writeFile', (_, filePath: string, content: string) => {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content, 'utf-8')
  })

  // 创建一个空文件，如果文件已存在则抛出错误
  ipcMain.handle('fs:createFile', (_, filePath: string) => {
    if (fs.existsSync(filePath)) {
      throw new Error(`文件已存在: ${filePath}`)
    }
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, '', 'utf-8')
  })

  // 创建文件夹（支持递归创建多级目录）
  ipcMain.handle('fs:createFolder', (_, folderPath: string) => {
    fs.mkdirSync(folderPath, { recursive: true })
  })

  // 删除文件或文件夹（文件夹会递归删除所有内容）
  ipcMain.handle('fs:deletePath', (_, targetPath: string) => {
    const stat = fs.statSync(targetPath)
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true })
    } else {
      fs.unlinkSync(targetPath)
    }
  })

  // 重命名文件或文件夹（也可用于移动）
  ipcMain.handle('fs:renamePath', (_, oldPath: string, newPath: string) => {
    fs.renameSync(oldPath, newPath)
  })

  // 检查路径是否存在
  ipcMain.handle('fs:pathExists', (_, targetPath: string) => {
    return fs.existsSync(targetPath)
  })

  // 获取文档目录下的 LeafMark Notes 文件夹路径，若不存在则自动创建
  ipcMain.handle('fs:getDocumentsDir', () => {
    const dir = path.join(app.getPath('documents'), 'LeafMark Notes')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return dir.replace(/\\/g, '/')
  })

  // ---------- 窗口控制 ----------
  // 最小化当前窗口
  ipcMain.handle('win:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  // 最大化 / 还原当前窗口（根据当前状态切换）
  ipcMain.handle('win:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  // 关闭当前窗口
  ipcMain.handle('win:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  // 查询当前窗口是否处于最大化状态
  ipcMain.handle('win:isMaximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  // ---------- 原生对话框 ----------
  // 打开系统文件选择对话框，返回选择的文件路径数组
  ipcMain.handle('dialog:open', async (_, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(options)
    return result.filePaths
  })
}
