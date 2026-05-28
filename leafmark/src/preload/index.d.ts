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
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<string[]>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
