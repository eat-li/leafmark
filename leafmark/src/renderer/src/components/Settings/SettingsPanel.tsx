import { useNoteStore, type Theme } from '../../store/noteStore'
import { dialog } from '../../api/electron'
import styles from './SettingsPanel.module.css'

export default function SettingsPanel() {
  const {
    showSettings,
    setShowSettings,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    workspaceDir,
    setWorkspaceDirAndRefresh
  } = useNoteStore()

  if (!showSettings) return null

  const handleChangeWorkspace = async () => {
    const paths = await dialog.open({
      properties: ['openDirectory'],
      title: '选择工作区目录'
    })
    if (paths && paths.length > 0) {
      await setWorkspaceDirAndRefresh(paths[0])
    }
  }

  return (
    <div className={styles.overlay} onClick={() => setShowSettings(false)}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>设置</span>
          <button className={styles.closeBtn} onClick={() => setShowSettings(false)}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>外观</h3>

            <div className={styles.item}>
              <label className={styles.label}>主题</label>
              <div className={styles.themeButtons}>
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    className={`${styles.themeBtn} ${theme === t ? styles.active : ''}`}
                    onClick={() => setTheme(t)}
                  >
                    {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.item}>
              <label className={styles.label}>编辑器字号: {fontSize}px</label>
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className={styles.range}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>工作区</h3>

            <div className={styles.item}>
              <label className={styles.label}>当前目录</label>
              <div className={styles.pathRow}>
                <span className={styles.path}>{workspaceDir || '未设置'}</span>
                <button className={styles.changeBtn} onClick={handleChangeWorkspace}>
                  更改
                </button>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>关于</h3>
            <div className={styles.item}>
              <label className={styles.label}>LeafMark</label>
              <span className={styles.version}>v1.0.0</span>
              <p className={styles.desc}>一款简洁的 Markdown 笔记编辑器</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
