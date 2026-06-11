import { useEffect, useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import styles from './TitleBar.module.css'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const closeToTray = useNoteStore((s) => s.closeToTray)

  useEffect(() => {
    window.electronAPI.isMaximized().then(setMaximized)
  }, [])

  const handleMaximize = async () => {
    await window.electronAPI.maximizeWindow()
    const isMax = await window.electronAPI.isMaximized()
    setMaximized(isMax)
  }

  const handleClose = () => {
    if (closeToTray) {
      window.electronAPI.setCloseToTray(true)
      // 隐藏窗口：通过主进程的 close 事件拦截实现
      window.electronAPI.closeWindow()
    } else {
      window.electronAPI.closeWindow()
    }
  }

  return (
    <div className={styles.titleBar}>
      <div className={styles.dragRegion}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
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
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M1 9V3h6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect
                x="1.5"
                y="1.5"
                width="9"
                height="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          )}
        </button>
        <button className={`${styles.btn} ${styles.closeBtn}`} onClick={handleClose}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
