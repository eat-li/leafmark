import { useEffect, useState } from 'react'
import styles from './TitleBar.module.css'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI.isMaximized().then(setMaximized)
  }, [])

  const handleMaximize = async () => {
    await window.electronAPI.maximizeWindow()
    const isMax = await window.electronAPI.isMaximized()
    setMaximized(isMax)
  }

  return (
    <div className={styles.titleBar}>
      <div className={styles.dragRegion}>
        <span className={styles.title}>LeafMark</span>
      </div>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={() => window.electronAPI.minimizeWindow()}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button className={styles.btn} onClick={handleMaximize}>
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 9V3h6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
        <button className={`${styles.btn} ${styles.closeBtn}`} onClick={() => window.electronAPI.closeWindow()}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
