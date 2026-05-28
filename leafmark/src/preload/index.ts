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

  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke('win:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('win:maximize'),
  closeWindow: () => ipcRenderer.invoke('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:isMaximized'),

  // 对话框
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:open', options)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
