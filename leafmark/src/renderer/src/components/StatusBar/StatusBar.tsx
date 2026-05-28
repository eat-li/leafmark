import { useNoteStore } from '../../store/noteStore'
import styles from './StatusBar.module.css'

export default function StatusBar() {
  const { openTabs, activeTabPath, viewMode } = useNoteStore()
  const activeTab = openTabs.find((t) => t.path === activeTabPath)

  const lineCount = activeTab ? activeTab.content.split('\n').length : 0
  const charCount = activeTab ? activeTab.content.length : 0

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        {activeTab && (
          <span className={styles.item}>
            {activeTab.modified ? '已修改' : '已保存'}
          </span>
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
