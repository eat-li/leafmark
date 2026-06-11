import { useMemo, useCallback } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useAnimatedVisibility } from '../../hooks/useAnimatedVisibility'
import styles from './OutlinePanel.module.css'

interface Heading {
  level: number
  text: string
  line: number
}

function parseHeadings(content: string): Heading[] {
  const headings: Heading[] = []
  const lines = content.split('\n')
  let inCodeBlock = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/[#*`~_[]]/g, '').trim(),
        line: i + 1
      })
    }
  }
  return headings
}

interface OutlinePanelProps {
  onScrollToLine?: (line: number) => void
}

export default function OutlinePanel({ onScrollToLine }: OutlinePanelProps) {
  const showOutline = useNoteStore((s) => s.showOutline)
  const setShowOutline = useNoteStore((s) => s.setShowOutline)
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)

  const { shouldRender, animationClass, onAnimationEnd } = useAnimatedVisibility(
    showOutline,
    200,
    150
  )

  const activeTab = openTabs.find((t) => t.path === activeTabPath)

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- React Compiler 无法推断可选链依赖
  const headings = useMemo(() => {
    if (!activeTab?.content) return []
    return parseHeadings(activeTab.content)
  }, [activeTab?.content])

  const handleClick = useCallback(
    (line: number) => {
      onScrollToLine?.(line)
      setShowOutline(false)
    },
    [onScrollToLine, setShowOutline]
  )

  if (!shouldRender) return null

  return (
    <div
      className={`${styles.overlay} ${animationClass === 'enter' ? styles.overlayEnter : animationClass === 'exit' ? styles.overlayExit : ''}`}
      onClick={() => setShowOutline(false)}
      onAnimationEnd={onAnimationEnd}
    >
      <div
        className={`${styles.panel} ${animationClass === 'enter' ? styles.panelEnter : animationClass === 'exit' ? styles.panelExit : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.title}>大纲</span>
          <button className={styles.closeBtn} onClick={() => setShowOutline(false)}>
            ×
          </button>
        </div>
        <div className={styles.body}>
          {!activeTab ? (
            <div className={styles.empty}>请先打开一个文件</div>
          ) : headings.length === 0 ? (
            <div className={styles.empty}>当前文档没有标题</div>
          ) : (
            headings.map((h, idx) => (
              <button
                key={idx}
                className={styles.item}
                style={{ paddingLeft: `${(h.level - 1) * 14 + 12}px` }}
                onClick={() => handleClick(h.line)}
              >
                <span className={styles.levelDot}>H{h.level}</span>
                <span className={styles.itemText}>{h.text}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
