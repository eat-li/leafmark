import { useMemo } from 'react'
import { useNoteStore } from '../../store/noteStore'
import styles from './StatusBar.module.css'

export default function StatusBar() {
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)
  const viewMode = useNoteStore((s) => s.viewMode)

  const { activeTab, lineCount, charCount } = useMemo(() => {
    const tab = openTabs.find((t) => t.path === activeTabPath)
    if (!tab) return { activeTab: null, lineCount: 0, charCount: 0 }
    return {
      activeTab: tab,
      lineCount: tab.content.split('\n').length,
      charCount: tab.content.length
    }
  }, [openTabs, activeTabPath])

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        {activeTab && (
          <span className={styles.item}>{activeTab.modified ? '已修改' : '已保存'}</span>
        )}
      </div>
      <div className={styles.right}>
        {activeTab && (
          <>
            <span className={styles.item}>{lineCount} 行</span>
            <span className={styles.item}>{charCount} 字符</span>
            <span className={styles.separator}>|</span>
          </>
        )}
        <span className={styles.item}>
          {viewMode === 'edit' ? '编辑' : viewMode === 'split' ? '分栏' : '预览'}
        </span>
        <span className={styles.item}>Markdown</span>
      </div>
    </div>
  )
}
