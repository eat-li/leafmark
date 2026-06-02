interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileEntry[]
}

interface ElectronAPI {
  readDirTree: (dirPath: string, depth?: number) => Promise<FileEntry[]>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<void>
  createFile: (filePath: string) => Promise<void>
  createFolder: (folderPath: string) => Promise<void>
  deletePath: (targetPath: string) => Promise<void>
  renamePath: (oldPath: string, newPath: string) => Promise<void>
  pathExists: (targetPath: string) => Promise<boolean>
  getDocumentsDir: () => Promise<string>
  readImageAsDataUrl: (filePath: string) => Promise<string | null>
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<string[]>
  readClipboardImage: () => Promise<string | null>
  saveClipboardImage: (base64: string, dirPath: string) => Promise<string>
  setAutoLaunch: (enabled: boolean) => Promise<void>
  getAutoLaunch: () => Promise<boolean>
  setCloseToTray: (enabled: boolean) => Promise<void>
  getCloseToTray: () => Promise<boolean>
  quitApp: () => Promise<void>
  getFileAssociation: () => Promise<boolean>
  setFileAssociation: (enabled: boolean) => Promise<boolean>
  getPendingFile: () => Promise<string | null>
  onOpenFile: (callback: (filePath: string) => void) => void
  openInSystem: (targetPath: string) => Promise<string>
  exportPDF: (html: string, defaultName: string) => Promise<boolean>
  exportHTML: (html: string, defaultName: string) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
