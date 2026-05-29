export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileEntry[]
}

const api = window.electronAPI

export const fs = {
  readDirTree: (dirPath: string, depth?: number): Promise<FileEntry[]> =>
    api.readDirTree(dirPath, depth),
  readFile: (filePath: string): Promise<string> => api.readFile(filePath),
  writeFile: (filePath: string, content: string): Promise<void> => api.writeFile(filePath, content),
  createFile: (filePath: string): Promise<void> => api.createFile(filePath),
  createFolder: (folderPath: string): Promise<void> => api.createFolder(folderPath),
  deletePath: (targetPath: string): Promise<void> => api.deletePath(targetPath),
  renamePath: (oldPath: string, newPath: string): Promise<void> => api.renamePath(oldPath, newPath),
  pathExists: (targetPath: string): Promise<boolean> => api.pathExists(targetPath),
  getDocumentsDir: (): Promise<string> => api.getDocumentsDir(),
  readImageAsDataUrl: (filePath: string): Promise<string | null> => api.readImageAsDataUrl(filePath)
}

export const win = {
  minimize: () => api.minimizeWindow(),
  maximize: () => api.maximizeWindow(),
  close: () => api.closeWindow(),
  isMaximized: (): Promise<boolean> => api.isMaximized()
}

export const dialog = {
  open: (options: {
    properties?: string[]
    title?: string
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }): Promise<string[]> => api.showOpenDialog(options as any)
}

export const clipboard = {
  readImage: (): Promise<string | null> => api.readClipboardImage(),
  saveImage: (base64: string, dirPath: string): Promise<string> =>
    api.saveClipboardImage(base64, dirPath)
}

export const appSettings = {
  setAutoLaunch: (enabled: boolean): Promise<void> => api.setAutoLaunch(enabled),
  getAutoLaunch: (): Promise<boolean> => api.getAutoLaunch(),
  setCloseToTray: (enabled: boolean): Promise<void> => api.setCloseToTray(enabled),
  getCloseToTray: (): Promise<boolean> => api.getCloseToTray(),
  quitApp: (): Promise<void> => api.quitApp()
}

export const shell = {
  openPath: (targetPath: string): Promise<string> => api.openInSystem(targetPath)
}

export const exportFile = {
  pdf: (html: string, defaultName: string): Promise<boolean> => api.exportPDF(html, defaultName),
  html: (html: string, defaultName: string): Promise<boolean> => api.exportHTML(html, defaultName)
}
