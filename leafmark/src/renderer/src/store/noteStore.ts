import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fs } from '../api/electron'

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileEntry[]
}

export interface OpenTab {
  path: string
  name: string
  content: string
  originalContent: string
  modified: boolean
}

export type ViewMode = 'edit' | 'split' | 'preview'
export type Theme = 'light' | 'dark' | 'system'

interface NoteState {
  workspaceDir: string
  fileTree: FileEntry[]
  openTabs: OpenTab[]
  activeTabPath: string
  theme: Theme
  sidebarVisible: boolean
  fontSize: number
  viewMode: ViewMode
  sidebarFilter: string
  showSearch: boolean
  showSettings: boolean

  // actions
  setWorkspaceDir: (dir: string) => void
  initWorkspace: () => Promise<void>
  refreshFileTree: () => Promise<void>
  openFile: (filePath: string, name: string) => Promise<void>
  updateContent: (path: string, content: string) => void
  saveFile: (path?: string) => Promise<void>
  saveAllFiles: () => Promise<void>
  closeTab: (path: string) => void
  setActiveTab: (path: string) => void
  createNote: (dirPath: string, fileName: string) => Promise<void>
  createFolder: (dirPath: string, folderName: string) => Promise<void>
  deleteItem: (path: string) => Promise<void>
  renameItem: (oldPath: string, newName: string) => Promise<void>
  importFile: (filePaths: string[]) => Promise<void>
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setFontSize: (size: number) => void
  setViewMode: (mode: ViewMode) => void
  setSidebarFilter: (filter: string) => void
  setShowSearch: (show: boolean) => void
  setShowSettings: (show: boolean) => void
  setWorkspaceDirAndRefresh: (dir: string) => Promise<void>
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      workspaceDir: '',
      fileTree: [],
      openTabs: [],
      activeTabPath: '',
      theme: 'system',
      sidebarVisible: true,
      fontSize: 14,
      viewMode: 'split',
      sidebarFilter: '',
      showSearch: false,
      showSettings: false,

      setWorkspaceDir: (dir) => set({ workspaceDir: dir }),

      initWorkspace: async () => {
        const dir = await fs.getDocumentsDir()
        set({ workspaceDir: dir })
        const tree = await fs.readDirTree(dir)
        set({ fileTree: tree })
      },

      refreshFileTree: async () => {
        const { workspaceDir } = get()
        if (!workspaceDir) return
        const tree = await fs.readDirTree(workspaceDir)
        set({ fileTree: tree })
      },

      openFile: async (filePath, name) => {
        const { openTabs } = get()
        const existing = openTabs.find((t) => t.path === filePath)
        if (existing) {
          set({ activeTabPath: filePath })
          return
        }
        const content = await fs.readFile(filePath)
        const newTab: OpenTab = {
          path: filePath,
          name,
          content,
          originalContent: content,
          modified: false
        }
        set({
          openTabs: [...openTabs, newTab],
          activeTabPath: filePath
        })
      },

      updateContent: (path, content) => {
        const { openTabs } = get()
        set({
          openTabs: openTabs.map((t) =>
            t.path === path ? { ...t, content, modified: content !== t.originalContent } : t
          )
        })
      },

      saveFile: async (path) => {
        const { openTabs, activeTabPath } = get()
        const targetPath = path || activeTabPath
        const tab = openTabs.find((t) => t.path === targetPath)
        if (!tab) return
        await fs.writeFile(tab.path, tab.content)
        set({
          openTabs: openTabs.map((t) =>
            t.path === tab.path ? { ...t, originalContent: t.content, modified: false } : t
          )
        })
      },

      saveAllFiles: async () => {
        const { openTabs } = get()
        for (const tab of openTabs) {
          if (tab.modified) {
            await fs.writeFile(tab.path, tab.content)
          }
        }
        set({
          openTabs: openTabs.map((t) => ({ ...t, originalContent: t.content, modified: false }))
        })
      },

      closeTab: (path) => {
        const { openTabs, activeTabPath } = get()
        const newTabs = openTabs.filter((t) => t.path !== path)
        let newActive = activeTabPath
        if (activeTabPath === path) {
          const idx = openTabs.findIndex((t) => t.path === path)
          newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.path || ''
        }
        set({ openTabs: newTabs, activeTabPath: newActive })
      },

      setActiveTab: (path) => set({ activeTabPath: path }),

      createNote: async (dirPath, fileName) => {
        const name = fileName.endsWith('.md') ? fileName : `${fileName}.md`
        const filePath = `${dirPath}/${name}`
        await fs.createFile(filePath)
        await get().refreshFileTree()
        await get().openFile(filePath, name)
      },

      createFolder: async (dirPath, folderName) => {
        const folderPath = `${dirPath}/${folderName}`
        await fs.createFolder(folderPath)
        await get().refreshFileTree()
      },

      deleteItem: async (path) => {
        await fs.deletePath(path)
        const { openTabs, activeTabPath } = get()
        const newTabs = openTabs.filter((t) => !t.path.startsWith(path))
        let newActive = activeTabPath
        if (activeTabPath.startsWith(path)) {
          newActive = newTabs[0]?.path || ''
        }
        set({ openTabs: newTabs, activeTabPath: newActive })
        await get().refreshFileTree()
      },

      renameItem: async (oldPath, newName) => {
        const dir = oldPath.substring(0, oldPath.lastIndexOf('/'))
        const newPath = `${dir}/${newName}`
        await fs.renamePath(oldPath, newPath)
        const { openTabs, activeTabPath } = get()
        set({
          openTabs: openTabs.map((t) =>
            t.path.startsWith(oldPath)
              ? { ...t, path: t.path.replace(oldPath, newPath), name: newName }
              : t
          ),
          activeTabPath: activeTabPath.startsWith(oldPath)
            ? activeTabPath.replace(oldPath, newPath)
            : activeTabPath
        })
        await get().refreshFileTree()
      },

      importFile: async (filePaths) => {
        const { workspaceDir } = get()
        for (const srcPath of filePaths) {
          const content = await fs.readFile(srcPath)
          const fileName = srcPath.split(/[/\\]/).pop() || 'imported.md'
          let destName = fileName
          const destPath = `${workspaceDir}/${destName}`
          if (await fs.pathExists(destPath)) {
            const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : ''
            const base = fileName.replace(ext, '')
            destName = `${base}_导入${ext}`
          }
          await fs.writeFile(`${workspaceDir}/${destName}`, content)
        }
        await get().refreshFileTree()
      },

      toggleTheme: () => {
        const { theme } = get()
        const themes: Theme[] = ['light', 'dark', 'system']
        const idx = themes.indexOf(theme)
        set({ theme: themes[(idx + 1) % themes.length] })
      },

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),

      setFontSize: (size) => set({ fontSize: Math.max(10, Math.min(24, size)) }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setSidebarFilter: (filter) => set({ sidebarFilter: filter }),

      setShowSearch: (show) => set({ showSearch: show }),

      setShowSettings: (show) => set({ showSettings: show }),

      setWorkspaceDirAndRefresh: async (dir) => {
        set({ workspaceDir: dir })
        const tree = await fs.readDirTree(dir)
        set({ fileTree: tree })
      }
    }),
    {
      name: 'leafmark-storage',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        viewMode: state.viewMode,
        sidebarVisible: state.sidebarVisible,
        workspaceDir: state.workspaceDir
      })
    }
  )
)
