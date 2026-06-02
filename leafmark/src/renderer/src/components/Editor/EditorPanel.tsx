import { useEffect, useRef, useCallback, useMemo } from 'react'
import { EditorView, keymap, placeholder as placeholderExt, ViewPlugin } from '@codemirror/view'
import { EditorState, Extension, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { useNoteStore, IMAGE_EXTENSIONS } from '../../store/noteStore'
import { clipboard } from '../../api/electron'
import ImagePreview from '../ImagePreview/ImagePreview'
import styles from './EditorPanel.module.css'

// 自定义浅色主题 — Amber & Ash
const leafmarkLightTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: '#2c2a26',
    backgroundColor: '#f7f5f0'
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    lineHeight: '1.7'
  },
  '.cm-content': {
    padding: '16px 0',
    caretColor: '#c07a2a'
  },
  '.cm-line': {
    padding: '0 20px'
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#c07a2a',
    borderLeftWidth: '2px'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'rgba(192, 122, 42, 0.12) !important'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(192, 122, 42, 0.04)'
  },
  '.cm-gutters': {
    backgroundColor: '#efeee8',
    color: '#8a857b',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: '#c07a2a'
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#e6e4dc',
    border: 'none',
    color: '#5e5a52'
  },
  '.cm-tooltip': {
    backgroundColor: '#faf9f6',
    border: '1px solid #ddd9cf',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(40, 30, 15, 0.08)'
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '4px 8px'
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'rgba(192, 122, 42, 0.1)',
    color: '#2c2a26'
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(192, 122, 42, 0.2)',
    outline: '1px solid rgba(192, 122, 42, 0.35)'
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'rgba(192, 122, 42, 0.35)'
  }
})

// Amber & Ash — 浅色语法高亮
const leafmarkLightHighlight = HighlightStyle.define([
  { tag: tags.heading, color: '#2c2a26', fontWeight: '700' },
  { tag: tags.heading1, fontSize: '1.4em', color: '#c07a2a' },
  { tag: tags.heading2, fontSize: '1.2em', color: '#a86a22' },
  { tag: tags.heading3, fontSize: '1.05em' },
  { tag: tags.strong, fontWeight: '700', color: '#2c2a26' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#5e5a52' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#8a857b' },
  { tag: tags.link, color: '#c07a2a', textDecoration: 'underline' },
  { tag: tags.url, color: '#5e5a52' },
  { tag: tags.atom, color: '#c07a2a' },
  { tag: tags.bool, color: '#c07a2a' },
  { tag: tags.labelName, color: '#5e5a52' },
  { tag: tags.string, color: '#4a8c5c' },
  { tag: tags.special(tags.string), color: '#4a8c5c' },
  { tag: tags.regexp, color: '#a85a3a' },
  { tag: tags.quote, color: '#5e5a52', fontStyle: 'italic' },
  { tag: tags.comment, color: '#8a857b', fontStyle: 'italic' },
  { tag: tags.meta, color: '#8a857b' },
  { tag: tags.variableName, color: '#2c2a26' },
  { tag: tags.local(tags.variableName), color: '#2c2a26' },
  { tag: tags.definition(tags.variableName), color: '#c07a2a' },
  { tag: tags.function(tags.variableName), color: '#c07a2a' },
  { tag: tags.typeName, color: '#c07a2a' },
  { tag: tags.namespace, color: '#5a7a9e' },
  { tag: tags.className, color: '#c07a2a' },
  { tag: tags.macroName, color: '#c07a2a' },
  { tag: tags.propertyName, color: '#5a7a9e' },
  { tag: tags.operator, color: '#c07a2a' },
  { tag: tags.compareOperator, color: '#c07a2a' },
  { tag: tags.arithmeticOperator, color: '#c07a2a' },
  { tag: tags.logicOperator, color: '#c07a2a' },
  { tag: tags.updateOperator, color: '#c07a2a' },
  { tag: tags.punctuation, color: '#8a857b' },
  { tag: tags.paren, color: '#5e5a52' },
  { tag: tags.squareBracket, color: '#5e5a52' },
  { tag: tags.brace, color: '#5e5a52' },
  { tag: tags.number, color: '#c07a2a' },
  { tag: tags.keyword, color: '#a85a3a' },
  { tag: tags.operatorKeyword, color: '#a85a3a' },
  { tag: tags.escape, color: '#c07a2a' },
  { tag: tags.processingInstruction, color: '#8a857b' },
  { tag: tags.inserted, color: '#4a8c5c' },
  { tag: tags.deleted, color: '#c44d3e' },
  { tag: tags.changed, color: '#c07a2a' },
  { tag: tags.invalid, color: '#c44d3e', textDecoration: 'underline' },
  { tag: tags.content, color: '#2c2a26' },
  { tag: tags.list, color: '#5e5a52' },
  { tag: tags.contentSeparator, color: '#ddd9cf' }
])

// 深色主题的编辑器微调 — Midnight Sepia
const leafmarkDarkTheme = EditorView.theme({
  '&': {
    height: '100%'
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    lineHeight: '1.7'
  },
  '.cm-content': {
    padding: '16px 0'
  },
  '.cm-line': {
    padding: '0 20px'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(217, 146, 58, 0.06)'
  }
})

// 打字机模式主题：给内容区域添加上下 padding，使首尾行也能居中
// 使用 vh 单位（相对于视口高度），50% padding 相当于让首/末行也能滚动到屏幕中间
const typewriterTheme = EditorView.theme({
  '.cm-content': {
    paddingTop: '45vh',
    paddingBottom: '45vh'
  }
})

// 打字机模式：光标行居中
function makeTypewriterExt(): Extension {
  return [
    typewriterTheme,
    ViewPlugin.fromClass(
      class {
        update(update: ViewUpdate) {
          if (update.selectionSet || update.docChanged) {
            // 延迟到下一帧，确保在 CodeMirror 内部滚动逻辑之后执行
            requestAnimationFrame(() => {
              const view = update.view
              const pos = view.state.selection.main.head
              const coords = view.coordsAtPos(pos)
              if (!coords) return
              const scroller = view.scrollDOM
              const viewportHeight = scroller.clientHeight
              // coords.top 是光标相对于视口顶部的 Y 坐标
              // 要把光标移到视口中央，需要滚动到：scrollTop + cursorTop - viewportHeight/2
              const cursorCenter = (coords.top + coords.bottom) / 2
              const targetScrollTop = scroller.scrollTop + cursorCenter - viewportHeight / 2
              // 不使用 smooth 动画，直接设置，避免被 CodeMirror 内部逻辑覆盖
              scroller.scrollTop = targetScrollTop
            })
          }
        }
      },
      { eventHandlers: {} }
    )
  ]
}

// 导入 ViewUpdate
import { ViewUpdate } from '@codemirror/view'

// 字号 Compartment
const fontSizeCompartment = new Compartment()

// 打字机模式 Compartment
const typewriterCompartment = new Compartment()

function makeFontSizeExt(size: number): Extension {
  return EditorView.theme({
    '&': { fontSize: `${size}px` }
  })
}

interface EditorPanelProps {
  onEditorReady?: (
    insertFn: (prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void
  ) => void
  onScroll?: (percent: number) => void
  onRegisterScrollTo?: (fn: (percent: number) => void) => void
  onRegisterScrollToLine?: (fn: (line: number) => void) => void
  isSyncing?: React.MutableRefObject<boolean>
}

export default function EditorPanel({
  onEditorReady,
  onScroll,
  onRegisterScrollTo,
  onRegisterScrollToLine,
  isSyncing
}: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isInternalUpdate = useRef(false)
  const onScrollRef = useRef(onScroll)
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)
  const updateContent = useNoteStore((s) => s.updateContent)
  const fontSize = useNoteStore((s) => s.fontSize)
  const theme = useNoteStore((s) => s.theme)
  const typewriterMode = useNoteStore((s) => s.typewriterMode)

  const activeTab = openTabs.find((t) => t.path === activeTabPath)

  const isDark = useMemo(() => {
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [theme])

  const insertFormat = useCallback(
    (prefix: string, suffix: string, placeholder: string, lineStart: boolean) => {
      const view = viewRef.current
      if (!view) return
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to) || placeholder
      isInternalUpdate.current = true
      view.dispatch({
        changes: {
          from: lineStart ? view.state.doc.lineAt(from).from : from,
          to,
          insert: lineStart ? `${prefix}${selected}` : `${prefix}${selected}${suffix}`
        }
      })
      isInternalUpdate.current = false
    },
    []
  )

  const insertAtCursor = useCallback((text: string) => {
    const view = viewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    isInternalUpdate.current = true
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length }
    })
    isInternalUpdate.current = false
  }, [])

  // 粘贴后光标跳到下一行
  const moveCursorToNextLine = useCallback(() => {
    const view = viewRef.current
    if (!view) return
    const pos = view.state.selection.main.head
    const line = view.state.doc.lineAt(pos)
    isInternalUpdate.current = true
    if (line.to < view.state.doc.length) {
      // 当前行后面还有内容，跳到下一行行首
      view.dispatch({
        selection: { anchor: line.to + 1 }
      })
    } else {
      // 已在文档末尾，先添加一个新行，再将光标移过去
      view.dispatch({
        changes: { from: view.state.doc.length, insert: '\n' },
        selection: { anchor: view.state.doc.length + 1 }
      })
    }
    isInternalUpdate.current = false
  }, [])

  useEffect(() => {
    onEditorReady?.(insertFormat)
  }, [insertFormat, onEditorReady])

  // 始终保持 ref 为最新值
  useEffect(() => {
    onScrollRef.current = onScroll
  }, [onScroll])

  // 注册 scrollTo 回调，让 App 可以直接驱动编辑器滚动
  useEffect(() => {
    if (!onRegisterScrollTo) return
    const scrollTo = (percent: number) => {
      const view = viewRef.current
      if (!view) return
      const scroller = view.scrollDOM
      const maxScroll = scroller.scrollHeight - scroller.clientHeight
      if (maxScroll > 0) {
        scroller.scrollTop = percent * maxScroll
      }
    }
    onRegisterScrollTo(scrollTo)
  }, [onRegisterScrollTo])

  // 创建 / 重建编辑器视图
  useEffect(() => {
    if (!editorRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isInternalUpdate.current) {
        const content = update.state.doc.toString()
        const path = useNoteStore.getState().activeTabPath
        if (path) {
          updateContent(path, content)
        }
      }
    })

    const pasteHandler = EditorView.domEventHandlers({
      paste: (event) => {
        const filePath = useNoteStore.getState().activeTabPath
        const workspaceDir = useNoteStore.getState().workspaceDir
        if (!filePath || !workspaceDir) return false
        const text = event.clipboardData?.getData('text/plain')
        if (text) {
          // 文本粘贴：手动插入文本并移动光标到下一行，不依赖 CodeMirror 默认行为
          event.preventDefault()
          const view = viewRef.current
          if (!view) return true
          const { from, to } = view.state.selection.main
          isInternalUpdate.current = true
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length }
          })
          isInternalUpdate.current = false
          moveCursorToNextLine()
          return true
        }
        event.preventDefault()
        handleImagePaste(workspaceDir, insertAtCursor, moveCursorToNextLine)
        return true
      }
    })

    const themeExtensions: Extension[] = isDark
      ? [oneDark, leafmarkDarkTheme]
      : [leafmarkLightTheme, syntaxHighlighting(leafmarkLightHighlight)]

    const view = new EditorView({
      state: EditorState.create({
        doc: activeTab?.content || '',
        extensions: [
          markdown({ codeLanguages: languages }),
          keymap.of([...defaultKeymap, indentWithTab]),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          ...themeExtensions,
          fontSizeCompartment.of(makeFontSizeExt(fontSize)),
          typewriterCompartment.of(typewriterMode ? makeTypewriterExt() : []),
          updateListener,
          pasteHandler,
          placeholderExt('开始输入 Markdown...'),
          EditorView.lineWrapping
        ]
      }),
      parent: editorRef.current
    })

    viewRef.current = view

    // 每次编辑器重建后，重新注册 scrollToLine 回调（大纲面板跳转用）
    if (onRegisterScrollToLine) {
      onRegisterScrollToLine((line: number) => {
        const v = viewRef.current
        if (!v) return
        if (line < 1 || line > v.state.doc.lines) return
        const pos = v.state.doc.line(line).from
        // 用 CodeMirror 内置 scrollIntoView 滚动，比手动设 scrollTop 更可靠
        v.dispatch({
          selection: { anchor: pos },
          effects: EditorView.scrollIntoView(pos, { y: 'start', yMargin: 60 })
        })
      })
    }

    // 滚动同步：使用 requestAnimationFrame 轮询
    let lastScrollTop = -1
    let rafId = 0
    const pollScroll = () => {
      const scrollDOM = view.scrollDOM
      const scrollTop = scrollDOM.scrollTop
      // isSyncing 表示正在被外部（预览面板）驱动滚动，此时不应报告
      const syncing = isSyncing?.current ?? false
      if (scrollTop !== lastScrollTop && !syncing) {
        lastScrollTop = scrollTop
        const callback = onScrollRef.current
        if (callback) {
          const maxScroll = scrollDOM.scrollHeight - scrollDOM.clientHeight
          if (maxScroll > 0) {
            callback(scrollTop / maxScroll)
          }
        }
      }
      rafId = requestAnimationFrame(pollScroll)
    }
    rafId = requestAnimationFrame(pollScroll)

    return () => {
      cancelAnimationFrame(rafId)
      view.destroy()
      viewRef.current = null
    }
  }, [activeTabPath, insertAtCursor, isDark, onRegisterScrollToLine, moveCursorToNextLine]) // eslint-disable-line react-hooks/exhaustive-deps

  // 动态更新字号
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: fontSizeCompartment.reconfigure(makeFontSizeExt(fontSize))
    })
  }, [fontSize])

  // 动态开关打字机模式
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: typewriterCompartment.reconfigure(typewriterMode ? makeTypewriterExt() : [])
    })
  }, [typewriterMode])

  // 更新编辑器内容（切换标签时）
  useEffect(() => {
    const view = viewRef.current
    if (!view || !activeTab) return
    const currentContent = view.state.doc.toString()
    if (currentContent !== activeTab.content) {
      isInternalUpdate.current = true
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: activeTab.content
        }
      })
      isInternalUpdate.current = false
    }
  }, [activeTab?.content])

  if (!activeTab) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
        <div className={styles.emptyTitle}>LeafMark</div>
        <div className={styles.emptyDesc}>从左侧文件树打开一个文件，或创建新笔记开始</div>
        <div className={styles.emptyHint}>
          <span>Ctrl+N</span> 新建 · <span>Ctrl+O</span> 打开
        </div>
      </div>
    )
  }

  // 图片文件：渲染图片预览组件
  const fileExt = '.' + activeTab.path.split('.').pop()?.toLowerCase()
  if (activeTab.fileType === 'image' || IMAGE_EXTENSIONS.includes(fileExt)) {
    return (
      <ImagePreview
        dataUrl={activeTab.content}
        fileName={activeTab.name}
        filePath={activeTab.path}
      />
    )
  }

  return (
    <div className={styles.editorPanel}>
      <div ref={editorRef} className={styles.editor} />
    </div>
  )
}

async function handleImagePaste(
  workspaceDir: string,
  insertAtCursor: (text: string) => void,
  moveCursorToNextLine: () => void
) {
  try {
    const imageData = await clipboard.readImage()
    if (!imageData) return
    const relativePath = await clipboard.saveImage(imageData, workspaceDir)
    insertAtCursor(`![图片](${relativePath})`)
    moveCursorToNextLine()
  } catch {
    // 出错则不干预
  }
}
