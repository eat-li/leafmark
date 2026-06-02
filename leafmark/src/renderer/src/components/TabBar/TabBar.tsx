import { useMemo, useState, useCallback } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { IconClose } from '../Icons'
import styles from './TabBar.module.css'

export default function TabBar() {
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)
  const setActiveTab = useNoteStore((s) => s.setActiveTab)
  const closeTab = useNoteStore((s) => s.closeTab)
  const saveFile = useNoteStore((s) => s.saveFile)

  // 待关闭确认的标签页
  const [pendingClose, setPendingClose] = useState<{ path: string; name: string } | null>(null)

  // 仅提取展示所需字段，避免 content 变化导致 memo 失效
  const tabDisplayData = useMemo(
    () => openTabs.map((t) => ({ path: t.path, name: t.name, modified: t.modified })),
    [openTabs]
  )

  const handleCloseClick = useCallback(
    (e: React.MouseEvent, path: string, name: string, modified: boolean) => {
      e.stopPropagation()
      if (modified) {
        setPendingClose({ path, name })
      } else {
        closeTab(path)
      }
    },
    [closeTab]
  )

  const handleSaveAndClose = useCallback(async () => {
    if (!pendingClose) return
    await saveFile(pendingClose.path)
    closeTab(pendingClose.path)
    setPendingClose(null)
  }, [pendingClose, saveFile, closeTab])

  const handleDiscardAndClose = useCallback(() => {
    if (!pendingClose) return
    closeTab(pendingClose.path)
    setPendingClose(null)
  }, [pendingClose, closeTab])

  const handleCancelClose = useCallback(() => {
    setPendingClose(null)
  }, [])

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
              onClick={(e) => handleCloseClick(e, tab.path, tab.name, tab.modified)}
            >
              <IconClose size={12} />
            </button>
          </div>
        ))}
      </div>

      {pendingClose && (
        <div className={styles.overlay} onClick={handleCancelClose}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>是否保存更改？</div>
            <div className={styles.dialogDesc}>
              文件「{pendingClose.name}」有未保存的更改，是否保存后再关闭？
            </div>
            <div className={styles.dialogActions}>
              <button className={styles.dialogBtn} onClick={handleCancelClose}>
                取消
              </button>
              <button
                className={`${styles.dialogBtn} ${styles.dangerBtn}`}
                onClick={handleDiscardAndClose}
              >
                不保存
              </button>
              <button
                className={`${styles.dialogBtn} ${styles.primaryBtn}`}
                onClick={handleSaveAndClose}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}