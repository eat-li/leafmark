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

function App(): React.JSX.Element {
  const { sidebarVisible, viewMode, theme, initWorkspace, saveFile, saveAllFiles } = useNoteStore()

  const insertFnRef = useRef<
    ((prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void) | null
  >(null)

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
              <EditorPanel onEditorReady={handleEditorReady} />
            )}
            {(viewMode === 'preview' || viewMode === 'split') && <PreviewPanel />}
          </div>
        </div>
      </div>
      <StatusBar />
      <SearchPanel />
      <SettingsPanel />
    </div>
  )
}

export default App
