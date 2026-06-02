import { useEffect, useCallback, useRef, useState } from 'react'
import { useNoteStore } from './store/noteStore'
import { dialog } from './api/electron'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'
import TabBar from './components/TabBar/TabBar'
import EditorPanel from './components/Editor/EditorPanel'
import PreviewPanel from './components/Preview/PreviewPanel'
import StatusBar from './components/StatusBar/StatusBar'
import SearchPanel from './components/Search/SearchPanel'
import SettingsPanel from './components/Settings/SettingsPanel'
import OutlinePanel from './components/Outline/OutlinePanel'
import HeatmapPanel from './components/Heatmap/HeatmapPanel'

function App(): React.JSX.Element {
  const sidebarVisible = useNoteStore((s) => s.sidebarVisible)
  const viewMode = useNoteStore((s) => s.viewMode)
  const theme = useNoteStore((s) => s.theme)
  const autoSave = useNoteStore((s) => s.autoSave)
  const autoSaveInterval = useNoteStore((s) => s.autoSaveInterval)
  const initWorkspace = useNoteStore((s) => s.initWorkspace)
  const saveFile = useNoteStore((s) => s.saveFile)
  const saveAllFiles = useNoteStore((s) => s.saveAllFiles)
  const syncScroll = useNoteStore((s) => s.syncScroll)
  const workspaceDir = useNoteStore((s) => s.workspaceDir)
  const createNote = useNoteStore((s) => s.createNote)
  const openFile = useNoteStore((s) => s.openFile)
  const showHeatmap = useNoteStore((s) => s.showHeatmap)
  const setShowHeatmap = useNoteStore((s) => s.setShowHeatmap)

  // 新建文件弹窗状态
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const insertFnRef = useRef<
    ((prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void) | null
  >(null)

  // 同步滚动：用 ref 直接通信，绕过 React state 异步延迟
  const previewScrollToRef = useRef<((percent: number) => void) | null>(null)
  const editorScrollToRef = useRef<((percent: number) => void) | null>(null)
  const previewSyncingRef = useRef(false)
  const editorSyncingRef = useRef(false)

  useEffect(() => {
    initWorkspace()
  }, [initWorkspace])

  // 主题处理
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    root.setAttribute('data-theme', theme)
    return undefined
  }, [theme])

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
          saveAllFiles()
        } else {
          saveFile()
        }
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault()
        setShowNewFileDialog(true)
        setNewFileName('')
      }
      if (ctrl && e.key === 'o') {
        e.preventDefault()
        dialog
          .open({
            properties: ['openFile'],
            title: '打开 Markdown 文件',
            filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
          })
          .then((paths) => {
            if (paths && paths.length > 0) {
              const p = paths[0]
              const name = p.split(/[/\\]/).pop() || p
              openFile(p, name)
            }
          })
          .catch((err: any) => {
            console.error('打开文件失败:', err)
          })
      }
      if (ctrl && e.key === 'h') {
        e.preventDefault()
        setShowHeatmap(!useNoteStore.getState().showHeatmap)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveFile, saveAllFiles, createNote, openFile, setShowHeatmap])

  // 自动保存定时器
  useEffect(() => {
    if (!autoSave) return
    const timer = setInterval(() => {
      saveAllFiles()
    }, autoSaveInterval * 1000)
    return () => clearInterval(timer)
  }, [autoSave, autoSaveInterval, saveAllFiles])

  const handleEditorReady = useCallback(
    (fn: (prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void) => {
      insertFnRef.current = fn
    },
    []
  )

  const handleInsertFormat = useCallback(
    (prefix: string, suffix: string, placeholder: string, lineStart: boolean) => {
      insertFnRef.current?.(prefix, suffix, placeholder, lineStart)
    },
    []
  )

  // 编辑器滚动时，直接驱动预览面板滚动
  const handleEditorScroll = useCallback((percent: number) => {
    if (previewSyncingRef.current) return
    editorSyncingRef.current = true
    previewScrollToRef.current?.(percent)
    setTimeout(() => { editorSyncingRef.current = false }, 50)
  }, [])

  // 预览面板滚动时，直接驱动编辑器滚动
  const handlePreviewScroll = useCallback((percent: number) => {
    if (editorSyncingRef.current) return
    previewSyncingRef.current = true
    editorScrollToRef.current?.(percent)
    setTimeout(() => { previewSyncingRef.current = false }, 50)
  }, [])

  // 编辑器注册自己的 scrollTo 回调
  const handleEditorRegisterScroll = useCallback((fn: (percent: number) => void) => {
    editorScrollToRef.current = fn
  }, [])

  // 预览注册自己的 scrollTo 回调
  const handlePreviewRegisterScroll = useCallback((fn: (percent: number) => void) => {
    previewScrollToRef.current = fn
  }, [])

  // 大纲面板：编辑器注册 scrollToLine 回调
  const scrollToLineRef = useRef<((line: number) => void) | null>(null)
  const handleEditorRegisterScrollToLine = useCallback((fn: (line: number) => void) => {
    scrollToLineRef.current = fn
  }, [])

  // 确认新建文件
  const handleCreateNewFile = useCallback(async () => {
    const name = newFileName.trim()
    if (!name || !workspaceDir) {
      setShowNewFileDialog(false)
      return
    }
    try {
      await createNote(workspaceDir, name)
    } catch (err: any) {
      console.error('创建文件失败:', err)
    }
    setShowNewFileDialog(false)
  }, [newFileName, workspaceDir, createNote])

  const isSplitMode = viewMode === 'split' && syncScroll

  return (
    <div className="app">
      <TitleBar />
      <Toolbar onInsertFormat={handleInsertFormat} />
      <div className="app-body">
        {sidebarVisible && <Sidebar />}
        <div className="main-content">
          <TabBar />
          <div className="editor-area">
            {(viewMode === 'edit' || viewMode === 'split') && (
              <EditorPanel
                onEditorReady={handleEditorReady}
                onScroll={isSplitMode ? handleEditorScroll : undefined}
                onRegisterScrollTo={isSplitMode ? handleEditorRegisterScroll : undefined}
                onRegisterScrollToLine={handleEditorRegisterScrollToLine}
                isSyncing={isSplitMode ? editorSyncingRef : undefined}
              />
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <PreviewPanel
                onScroll={isSplitMode ? handlePreviewScroll : undefined}
                onRegisterScrollTo={isSplitMode ? handlePreviewRegisterScroll : undefined}
                isSyncing={isSplitMode ? previewSyncingRef : undefined}
              />
            )}
          </div>
        </div>
      </div>
      <StatusBar />
      <SearchPanel />
      <SettingsPanel />
      <OutlinePanel onScrollToLine={(line) => scrollToLineRef.current?.(line)} />
      {showHeatmap && <HeatmapPanel />}

      {/* 新建文件弹窗 */}
      {showNewFileDialog && (
        <div
          className="dialog-overlay"
          onClick={() => setShowNewFileDialog(false)}
        >
          <div
            className="dialog-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-title">新建笔记</div>
            <input
              className="dialog-input"
              type="text"
              placeholder="输入文件名称..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewFile()
                if (e.key === 'Escape') setShowNewFileDialog(false)
              }}
              autoFocus
            />
            <div className="dialog-actions">
              <button className="dialog-btn dialog-btn-cancel" onClick={() => setShowNewFileDialog(false)}>
                取消
              </button>
              <button className="dialog-btn dialog-btn-confirm" onClick={handleCreateNewFile}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
