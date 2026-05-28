import { useMemo, useRef, useEffect } from 'react'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { useNoteStore } from '../../store/noteStore'
import styles from './PreviewPanel.module.css'

export default function PreviewPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { openTabs, activeTabPath, fontSize } = useNoteStore()
  const activeTab = openTabs.find((t) => t.path === activeTabPath)

  const md = useMemo(() => {
    return new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight(str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code>${
              hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
            }</code></pre>`
          } catch {
            /* empty */
          }
        }
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
      }
    })
  }, [])

  const html = useMemo(() => {
    if (!activeTab?.content) return ''
    return md.render(activeTab.content)
  }, [activeTab?.content, md])

  // 同步滚动
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // 重置滚动位置
    el.scrollTop = 0
  }, [activeTabPath])

  if (!activeTab) {
    return (
      <div className={styles.empty}>
        <span>预览区域</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={styles.preview}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
