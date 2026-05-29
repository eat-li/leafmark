import { useEffect, useCallback, useRef } from 'react'
import { useNoteStore } from './store/noteStore'
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
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
          saveAllFiles()
        } else {
          saveFile()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveFile, saveAllFiles])

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
    </div>
  )
}

export default App
