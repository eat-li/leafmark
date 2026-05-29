import { useMemo } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { IconClose } from '../Icons'
import styles from './TabBar.module.css'

export default function TabBar() {
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)
  const setActiveTab = useNoteStore((s) => s.setActiveTab)
  const closeTab = useNoteStore((s) => s.closeTab)

  // 仅提取展示所需字段，避免 content 变化导致 memo 失效
  const tabDisplayData = useMemo(
    () => openTabs.map((t) => ({ path: t.path, name: t.name, modified: t.modified })),
    [openTabs]
  )

  if (tabDisplayData.length === 0) return null

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {tabDisplayData.map((tab) => (
          <div
            key={tab.path}
            className={`${styles.tab} ${tab.path === activeTabPath ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.path)}
          >
            <span className={styles.tabName}>
              {tab.modified && <span className={styles.dot} />}
              {tab.name}
            </span>
            <button
              className={styles.closeBtn}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.path)
              }}
            >
              <IconClose size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}