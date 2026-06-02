import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // 文件系统操作
  readDirTree: (dirPath: string, depth?: number) =>
    ipcRenderer.invoke('fs:readDirTree', dirPath, depth),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),
  createFile: (filePath: string) => ipcRenderer.invoke('fs:createFile', filePath),
  createFolder: (folderPath: string) => ipcRenderer.invoke('fs:createFolder', folderPath),
  deletePath: (targetPath: string) => ipcRenderer.invoke('fs:deletePath', targetPath),
  renamePath: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('fs:renamePath', oldPath, newPath),
  pathExists: (targetPath: string) => ipcRenderer.invoke('fs:pathExists', targetPath),
  getDocumentsDir: () => ipcRenderer.invoke('fs:getDocumentsDir'),
  readImageAsDataUrl: (filePath: string) => ipcRenderer.invoke('fs:readImageAsDataUrl', filePath),

  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke('win:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('win:maximize'),
  closeWindow: () => ipcRenderer.invoke('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:isMaximized'),

  // 对话框
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:open', options),

  // 剪贴板
  readClipboardImage: () => ipcRenderer.invoke('clipboard:readImage'),
  saveClipboardImage: (base64: string, dirPath: string) =>
    ipcRenderer.invoke('clipboard:saveImage', base64, dirPath),

  // 应用设置
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('app:setAutoLaunch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('app:getAutoLaunch'),
  setCloseToTray: (enabled: boolean) => ipcRenderer.invoke('app:setCloseToTray', enabled),
  getCloseToTray: () => ipcRenderer.invoke('app:getCloseToTray'),
  quitApp: () => ipcRenderer.invoke('app:quitApp'),

  // 系统操作
  openInSystem: (targetPath: string) => ipcRenderer.invoke('shell:openPath', targetPath),

  // 导出
  exportPDF: (html: string, defaultName: string) => ipcRenderer.invoke('export:pdf', html, defaultName),
  exportHTML: (html: string, defaultName: string) => ipcRenderer.invoke('export:html', html, defaultName),

}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
