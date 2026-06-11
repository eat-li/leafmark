import { useEffect, useCallback, useRef, useState, lazy, Suspense } from 'react'
import { useNoteStore } from './store/noteStore'
import { dialog, appSettings } from './api/electron'
import {
  ensureBuiltInTemplates,
  loadTemplates,
  applyTemplate,
  getBuiltInVars,
  WELCOME_NOTE_CONTENT,
  type TemplateInfo
} from './utils/template'
import {
  IconTemplateBlank,
  IconTemplateDiary,
  IconTemplateMeeting,
  IconTemplateBook,
  IconTemplateCustom
} from './components/Icons'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'
import TabBar from './components/TabBar/TabBar'
import EditorPanel from './components/Editor/EditorPanel'
import StatusBar from './components/StatusBar/StatusBar'
// 懒加载非首屏组件，减少初始 bundle 体积
const PreviewPanel = lazy(() => import('./components/Preview/PreviewPanel'))
const SearchPanel = lazy(() => import('./components/Search/SearchPanel'))
const SettingsPanel = lazy(() => import('./components/Settings/SettingsPanel'))
const OutlinePanel = lazy(() => import('./components/Outline/OutlinePanel'))
const HeatmapPanel = lazy(() => import('./components/Heatmap/HeatmapPanel'))

// 预加载函数：当用户切换到预览模式时触发
let previewPreloaded = false
function preloadPreview() {
  if (!previewPreloaded) {
    previewPreloaded = true
    import('./components/Preview/PreviewPanel')
  }
}


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
  const createNoteFromTemplate = useNoteStore((s) => s.createNoteFromTemplate)
  const openFile = useNoteStore((s) => s.openFile)
  const showHeatmap = useNoteStore((s) => s.showHeatmap)
  const setShowHeatmap = useNoteStore((s) => s.setShowHeatmap)

  // 新建文件弹窗状态
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(-1) // -1 = 空白笔记

  const insertFnRef = useRef<
    ((prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void) | null
  >(null)

  // 同步滚动：用 ref 直接通信，绕过 React state 异步延迟
  const previewScrollToRef = useRef<((percent: number) => void) | null>(null)
  const editorScrollToRef = useRef<((percent: number) => void) | null>(null)
  const previewSyncingRef = useRef(false)
  const editorSyncingRef = useRef(false)

  useEffect(() => {
    initWorkspace().then(() => {
      const state = useNoteStore.getState()
      const dir = state.workspaceDir
      if (dir) ensureBuiltInTemplates(dir).catch(() => {})
      // 首次启动：创建欢迎笔记并打开
      if (!state.welcomed && state.fileTree.length === 0) {
        const vars = getBuiltInVars('欢迎使用 LeafMark')
        const content = applyTemplate(WELCOME_NOTE_CONTENT, vars)
        state.createNoteFromTemplate(dir, '欢迎使用 LeafMark', content).then(() => {
          useNoteStore.setState({ welcomed: true })
        })
      }
    })
  }, [initWorkspace])

  // 当用户切换到包含预览的模式时，预加载 PreviewPanel
  useEffect(() => {
    if (viewMode === 'preview' || viewMode === 'split') {
      preloadPreview()
    }
  }, [viewMode])

  // 监听系统传入的文件打开事件（如双击 .md 文件，应用已在运行时）
  useEffect(() => {
    appSettings.onOpenFile((filePath: string) => {
      const name = filePath.split(/[/\\]/).pop() || filePath
      useNoteStore.getState().openFile(filePath, name)
    })

    // 主动拉取启动时暂存的待打开文件（解决 React 未挂载时 IPC 消息丢失的问题）
    appSettings.getPendingFile().then((filePath) => {
      if (filePath) {
        const name = filePath.split(/[/\\]/).pop() || filePath
        useNoteStore.getState().openFile(filePath, name)
      }
    })
  }, [])

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
        setSelectedTemplateIdx(-1)
        // 加载模板列表
        const dir = useNoteStore.getState().workspaceDir
        if (dir) {
          ensureBuiltInTemplates(dir)
            .then(() => loadTemplates(dir))
            .then((tpls) => setTemplates(tpls))
            .catch(() => {})
        }
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
      if (ctrl && e.shiftKey && e.key === 'H') {
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
    setTimeout(() => {
      editorSyncingRef.current = false
    }, 50)
  }, [])

  // 预览面板滚动时，直接驱动编辑器滚动
  const handlePreviewScroll = useCallback((percent: number) => {
    if (editorSyncingRef.current) return
    previewSyncingRef.current = true
    editorScrollToRef.current?.(percent)
    setTimeout(() => {
      previewSyncingRef.current = false
    }, 50)
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
      if (selectedTemplateIdx >= 0 && selectedTemplateIdx < templates.length) {
        const tpl = templates[selectedTemplateIdx]
        const vars = getBuiltInVars(name.replace(/\.md$/, ''))
        const content = applyTemplate(tpl.content, vars)
        await createNoteFromTemplate(workspaceDir, name, content)
      } else {
        await createNote(workspaceDir, name)
      }
    } catch (err: any) {
      console.error('创建文件失败:', err)
    }
    setShowNewFileDialog(false)
  }, [newFileName, workspaceDir, createNote, createNoteFromTemplate, selectedTemplateIdx, templates])

  const isSplitMode = viewMode === 'split' && syncScroll

  return (
    <div className="app">
      <TitleBar />
      <Toolbar onInsertFormat={handleInsertFormat} />
      <div className="app-body">
        <div className={`sidebar-container ${sidebarVisible ? '' : 'sidebar-hidden'}`}>
          <Sidebar />
        </div>
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
              <Suspense fallback={<div className="preview-loading">加载预览...</div>}>
                <PreviewPanel
                  onScroll={isSplitMode ? handlePreviewScroll : undefined}
                  onRegisterScrollTo={isSplitMode ? handlePreviewRegisterScroll : undefined}
                  isSyncing={isSplitMode ? previewSyncingRef : undefined}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
      <StatusBar />
      <Suspense fallback={null}>
        <SearchPanel />
        <SettingsPanel />
        <OutlinePanel onScrollToLine={(line) => scrollToLineRef.current?.(line)} />
        {showHeatmap && <HeatmapPanel />}
      </Suspense>

      {/* 新建文件弹窗 */}
      {showNewFileDialog && (
        <div className="dialog-overlay" onClick={() => setShowNewFileDialog(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
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
            {templates.length > 0 && (
              <div className="template-section">
                <div className="template-label">模板</div>
                <div className="template-list">
                  <button
                    className={`template-item ${selectedTemplateIdx === -1 ? 'template-item-active' : ''}`}
                    onClick={() => setSelectedTemplateIdx(-1)}
                  >
                    <span className="template-icon"><IconTemplateBlank size={16} /></span>
                    <span>空白笔记</span>
                  </button>
                  {templates.map((tpl, idx) => (
                    <button
                      key={tpl.name}
                      className={`template-item ${selectedTemplateIdx === idx ? 'template-item-active' : ''}`}
                      onClick={() => setSelectedTemplateIdx(idx)}
                    >
                      <span className="template-icon">
                        {tpl.name === '日记' && <IconTemplateDiary size={16} />}
                        {tpl.name === '会议记录' && <IconTemplateMeeting size={16} />}
                        {tpl.name === '读书笔记' && <IconTemplateBook size={16} />}
                        {!['日记', '会议记录', '读书笔记'].includes(tpl.name) && (
                          <IconTemplateCustom size={16} />
                        )}
                      </span>
                      <span>{tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() => setShowNewFileDialog(false)}
              >
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
