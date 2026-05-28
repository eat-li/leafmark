import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { useNoteStore } from '../../store/noteStore'
import styles from './EditorPanel.module.css'

interface EditorPanelProps {
  onEditorReady?: (
    insertFn: (prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void
  ) => void
}

export default function EditorPanel({ onEditorReady }: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isInternalUpdate = useRef(false)
  const { openTabs, activeTabPath, updateContent, fontSize } = useNoteStore()

  const activeTab = openTabs.find((t) => t.path === activeTabPath)

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

  useEffect(() => {
    onEditorReady?.(insertFormat)
  }, [insertFormat, onEditorReady])

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

    const theme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        lineHeight: '1.6'
      },
      '.cm-content': {
        padding: '12px 0'
      },
      '.cm-line': {
        padding: '0 16px'
      }
    })

    const view = new EditorView({
      state: EditorState.create({
        doc: activeTab?.content || '',
        extensions: [
          markdown({ codeLanguages: languages }),
          keymap.of([defaultKeymap, indentWithTab]),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          oneDark,
          theme,
          updateListener,
          placeholderExt('开始输入 Markdown...'),
          EditorView.lineWrapping
        ]
      }),
      parent: editorRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [activeTabPath]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // 更新字号
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: []
    })
    // Re-create with new font size would be ideal, but for simplicity:
    if (editorRef.current) {
      editorRef.current.style.setProperty('--editor-font-size', `${fontSize}px`)
    }
  }, [fontSize])

  if (!activeTab) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>LeafMark</div>
        <div className={styles.emptyDesc}>从左侧文件树打开一个文件，或创建新笔记开始</div>
      </div>
    )
  }

  return (
    <div className={styles.editorPanel}>
      <div ref={editorRef} className={styles.editor} />
    </div>
  )
}
