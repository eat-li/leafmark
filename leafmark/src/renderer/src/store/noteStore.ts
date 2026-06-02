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
  fileType?: 'markdown' | 'image'
}

export type ViewMode = 'edit' | 'split' | 'preview'
export type Theme = 'light' | 'dark' | 'system'

// 支持预览的图片扩展名
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']

// 写作热力图 — 每日统计数据
export interface DayStats {
  /** 当日编辑过的文件去重列表 */
  filesEdited: string[]
  /** 保存时所有已打开笔记的总字符数，用于衡量当日写作量 */
  totalChars: number
}

// 标签颜色调色板（匹配 Amber & Ash 配色）
export const TAG_PALETTE = [
  '#c07a2a',
  '#5a7a9e',
  '#4a8c5c',
  '#a85a3a',
  '#7a6b8a',
  '#c44d3e',
  '#5e8a6e',
  '#8a6e3a',
  '#6a7a5a',
  '#9e5a6e',
  '#4a7a8a',
  '#7a5a4a'
]

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
  showOutline: boolean
  showHeatmap: boolean
  /** 写作热力图数据，key 为 "YYYY-MM-DD" */
  writingStats: Record<string, DayStats>
  autoSave: boolean
  autoSaveInterval: number
  closeToTray: boolean
  syncScroll: boolean
  typewriterMode: boolean
  tags: Record<string, string[]>
  tagColors: Record<string, string>
  tagFilter: string

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
  createNoteFromTemplate: (dirPath: string, fileName: string, content: string) => Promise<void>
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
  setShowOutline: (show: boolean) => void
  setShowHeatmap: (show: boolean) => void
  /** 更新今日写作统计（在保存文件时自动调用） */
  updateWritingStats: () => void
  setAutoSave: (enabled: boolean) => void
  setAutoSaveInterval: (seconds: number) => void
  setCloseToTray: (enabled: boolean) => void
  toggleSyncScroll: () => void
  toggleTypewriterMode: () => void
  addTag: (filePath: string, tagName: string) => void
  removeTag: (filePath: string, tagName: string) => void
  setTagFilter: (tag: string) => void
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
      showOutline: false,
      showHeatmap: false,
      writingStats: {},
      autoSave: false,
      autoSaveInterval: 30,
      closeToTray: false,
      syncScroll: true,
      typewriterMode: false,
      tags: {},
      tagColors: {},
      tagFilter: '',

      setWorkspaceDir: (dir) => set({ workspaceDir: dir }),

      initWorkspace: async () => {
        const dir = await fs.getDocumentsDir()
        set({ workspaceDir: dir })
        await fs.createFolder(`${dir}/assets`)
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
        const ext = '.' + filePath.split('.').pop()?.toLowerCase()
        const isImage = IMAGE_EXTENSIONS.includes(ext)

        let content: string
        let fileType: 'markdown' | 'image' = 'markdown'

        if (isImage) {
          content = (await fs.readImageAsDataUrl(filePath)) || ''
          fileType = 'image'
          // 图片文件自动切换到编辑模式（隐藏预览面板）
          set({ viewMode: 'edit' })
        } else {
          content = await fs.readFile(filePath)
        }

        const newTab: OpenTab = {
          path: filePath,
          name,
          content,
          originalContent: content,
          modified: false,
          fileType
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
        get().updateWritingStats()
      },

      saveAllFiles: async () => {
        const { openTabs } = get()
        const modifiedTabs = openTabs.filter((t) => t.modified)
        await Promise.all(modifiedTabs.map((t) => fs.writeFile(t.path, t.content)))
        set({
          openTabs: openTabs.map((t) => ({ ...t, originalContent: t.content, modified: false }))
        })
        get().updateWritingStats()
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

      createNoteFromTemplate: async (dirPath, fileName, content) => {
        const name = fileName.endsWith('.md') ? fileName : `${fileName}.md`
        const filePath = `${dirPath}/${name}`
        await fs.writeFile(filePath, content)
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
        const { openTabs, activeTabPath, tags } = get()
        const newTabs = openTabs.filter((t) => !t.path.startsWith(path))
        let newActive = activeTabPath
        if (activeTabPath.startsWith(path)) {
          newActive = newTabs[0]?.path || ''
        }
        // 清理标签
        const newTags = { ...tags }
        for (const key of Object.keys(newTags)) {
          if (key.startsWith(path)) delete newTags[key]
        }
        set({ openTabs: newTabs, activeTabPath: newActive, tags: newTags })
        await get().refreshFileTree()
      },

      renameItem: async (oldPath, newName) => {
        const dir = oldPath.substring(0, oldPath.lastIndexOf('/'))
        const newPath = `${dir}/${newName}`
        await fs.renamePath(oldPath, newPath)
        const { openTabs, activeTabPath, tags } = get()
        // 迁移标签到新路径
        const newTags = { ...tags }
        for (const [key, value] of Object.entries(newTags)) {
          if (key.startsWith(oldPath)) {
            delete newTags[key]
            newTags[key.replace(oldPath, newPath)] = value
          }
        }
        set({
          openTabs: openTabs.map((t) =>
            t.path.startsWith(oldPath)
              ? { ...t, path: t.path.replace(oldPath, newPath), name: newName }
              : t
          ),
          activeTabPath: activeTabPath.startsWith(oldPath)
            ? activeTabPath.replace(oldPath, newPath)
            : activeTabPath,
          tags: newTags
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

      setShowOutline: (show) => set({ showOutline: show }),

      setShowHeatmap: (show) => set({ showHeatmap: show }),

      updateWritingStats: () => {
        const { openTabs, writingStats } = get()
        // 当日键 "YYYY-MM-DD"
        const today = new Date()
        const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        // 收集所有已打开文件的字符总数
        const totalChars = openTabs.reduce((sum, t) => sum + t.content.length, 0)
        const fileNames = openTabs.map((t) => t.name)
        const prev = writingStats[key]
        // 合并文件列表（去重）
        const filesEdited = prev ? [...new Set([...prev.filesEdited, ...fileNames])] : fileNames
        set({
          writingStats: {
            ...writingStats,
            [key]: { filesEdited, totalChars }
          }
        })
      },

      setAutoSave: (enabled) => set({ autoSave: enabled }),

      setAutoSaveInterval: (seconds) => set({ autoSaveInterval: seconds }),

      setCloseToTray: (enabled) => set({ closeToTray: enabled }),

      toggleSyncScroll: () => set((s) => ({ syncScroll: !s.syncScroll })),

      toggleTypewriterMode: () => set((s) => ({ typewriterMode: !s.typewriterMode })),

      addTag: (filePath, tagName) => {
        const { tags, tagColors } = get()
        const name = tagName.trim()
        if (!name) return
        const fileTags = tags[filePath] || []
        if (fileTags.includes(name)) return
        const newColors = { ...tagColors }
        if (!newColors[name]) {
          const usedCount = Object.keys(newColors).length
          newColors[name] = TAG_PALETTE[usedCount % TAG_PALETTE.length]
        }
        set({
          tags: { ...tags, [filePath]: [...fileTags, name] },
          tagColors: newColors
        })
      },

      removeTag: (filePath, tagName) => {
        const { tags } = get()
        const fileTags = tags[filePath] || []
        const newFileTags = fileTags.filter((t) => t !== tagName)
        const newTags = { ...tags }
        if (newFileTags.length > 0) {
          newTags[filePath] = newFileTags
        } else {
          delete newTags[filePath]
        }
        set({ tags: newTags })
      },

      setTagFilter: (tag) => set((s) => ({ tagFilter: s.tagFilter === tag ? '' : tag })),

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
        workspaceDir: state.workspaceDir,
        autoSave: state.autoSave,
        autoSaveInterval: state.autoSaveInterval,
        closeToTray: state.closeToTray,
        syncScroll: state.syncScroll,
        typewriterMode: state.typewriterMode,
        tags: state.tags,
        tagColors: state.tagColors,
        writingStats: state.writingStats
      })
    }
  )
)
