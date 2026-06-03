import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { IconClose } from '../Icons'
import styles from './TabBar.module.css'

export default function TabBar() {
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)
  const setActiveTab = useNoteStore((s) => s.setActiveTab)
  const closeTab = useNoteStore((s) => s.closeTab)
  const saveFile = useNoteStore((s) => s.saveFile)

  // 滑动指示器状态
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // 待关闭确认的标签页
  const [pendingClose, setPendingClose] = useState<{
    path: string
    name: string
    /** 关闭所有时为 true，用于在确认后继续关闭剩余未保存标签 */
    closeAll?: boolean
  } | null>(null)

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭右键菜单
  useEffect(() => {
    if (!contextMenu) return
    const close = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [contextMenu])

  // 仅提取展示所需字段，避免 content 变化导致 memo 失效
  const tabDisplayData = useMemo(
    () => openTabs.map((t) => ({ path: t.path, name: t.name, modified: t.modified })),
    [openTabs]
  )

  // 更新滑动指示器位置
  useEffect(() => {
    const tabsContainer = tabsRef.current
    if (!tabsContainer) return

    const activeTab = tabsContainer.querySelector(`.${styles.active}`) as HTMLElement
    if (activeTab) {
      const containerRect = tabsContainer.getBoundingClientRect()
      const tabRect = activeTab.getBoundingClientRect()
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width
      })
    }
  }, [activeTabPath, tabDisplayData])

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
    // 如果是关闭所有模式，继续检查下一个未保存标签
    if (pendingClose.closeAll) {
      const remaining = useNoteStore.getState().openTabs.filter((t) => t.modified)
      if (remaining.length > 0) {
        setPendingClose({ path: remaining[0].path, name: remaining[0].name, closeAll: true })
        return
      }
    }
    setPendingClose(null)
  }, [pendingClose, saveFile, closeTab])

  const handleDiscardAndClose = useCallback(() => {
    if (!pendingClose) return
    closeTab(pendingClose.path)
    // 如果是关闭所有模式，继续检查下一个未保存标签
    if (pendingClose.closeAll) {
      const remaining = useNoteStore.getState().openTabs.filter((t) => t.modified)
      if (remaining.length > 0) {
        setPendingClose({ path: remaining[0].path, name: remaining[0].name, closeAll: true })
        return
      }
    }
    setPendingClose(null)
  }, [pendingClose, closeTab])

  const handleCancelClose = useCallback(() => {
    setPendingClose(null)
  }, [])

  // 右键菜单：关闭当前标签
  const handleMenuCloseCurrent = useCallback(() => {
    setContextMenu(null)
    const active = useNoteStore.getState().openTabs.find((t) => t.path === activeTabPath)
    if (!active) return
    if (active.modified) {
      setPendingClose({ path: active.path, name: active.name })
    } else {
      closeTab(active.path)
    }
  }, [activeTabPath, closeTab])

  // 右键菜单：关闭所有标签
  const handleMenuCloseAll = useCallback(() => {
    setContextMenu(null)
    const tabs = useNoteStore.getState().openTabs
    const firstModified = tabs.find((t) => t.modified)
    if (firstModified) {
      setPendingClose({ path: firstModified.path, name: firstModified.name, closeAll: true })
    } else {
      // 没有未保存的，直接全部关闭
      tabs.forEach((t) => closeTab(t.path))
    }
  }, [closeTab])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  if (tabDisplayData.length === 0) return null

  return (
    <div className={styles.tabBar} onContextMenu={handleContextMenu}>
      <div className={styles.tabs} ref={tabsRef}>
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
        <div
          className={styles.indicator}
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`
          }}
        />
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={handleMenuCloseCurrent}>
            <span>关闭当前文件</span>
          </button>
          <button onClick={handleMenuCloseAll}>
            <span>关闭所有文件</span>
          </button>
        </div>
      )}

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
