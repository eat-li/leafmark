import { useNoteStore } from '../../store/noteStore'
import { IconClose } from '../Icons'
import styles from './TabBar.module.css'

export default function TabBar() {
  const { openTabs, activeTabPath, setActiveTab, closeTab } = useNoteStore()

  if (openTabs.length === 0) return null

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {openTabs.map((tab) => (
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
