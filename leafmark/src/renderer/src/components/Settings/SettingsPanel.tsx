import { useEffect, useState } from 'react'
import { useNoteStore, type Theme } from '../../store/noteStore'
import { dialog, appSettings } from '../../api/electron'
import styles from './SettingsPanel.module.css'

export default function SettingsPanel() {
  const showSettings = useNoteStore((s) => s.showSettings)

  if (!showSettings) return null
  return <SettingsPanelContent />
}

function SettingsPanelContent() {
  const setShowSettings = useNoteStore((s) => s.setShowSettings)
  const theme = useNoteStore((s) => s.theme)
  const setTheme = useNoteStore((s) => s.setTheme)
  const fontSize = useNoteStore((s) => s.fontSize)
  const setFontSize = useNoteStore((s) => s.setFontSize)
  const workspaceDir = useNoteStore((s) => s.workspaceDir)
  const setWorkspaceDirAndRefresh = useNoteStore((s) => s.setWorkspaceDirAndRefresh)
  const autoSave = useNoteStore((s) => s.autoSave)
  const setAutoSave = useNoteStore((s) => s.setAutoSave)
  const autoSaveInterval = useNoteStore((s) => s.autoSaveInterval)
  const setAutoSaveInterval = useNoteStore((s) => s.setAutoSaveInterval)
  const closeToTray = useNoteStore((s) => s.closeToTray)
  const setCloseToTray = useNoteStore((s) => s.setCloseToTray)

  const [autoLaunch, setAutoLaunch] = useState(false)

  useEffect(() => {
    appSettings.getAutoLaunch().then(setAutoLaunch)
  }, [])

  const handleAutoLaunch = async (enabled: boolean) => {
    await appSettings.setAutoLaunch(enabled)
    setAutoLaunch(enabled)
  }

  const handleCloseToTray = async (enabled: boolean) => {
    await appSettings.setCloseToTray(enabled)
    setCloseToTray(enabled)
  }

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
            <h3 className={styles.sectionTitle}>行为</h3>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingName}>开机自启</span>
                <span className={styles.settingDesc}>系统启动时自动打开 LeafMark</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={autoLaunch}
                  onChange={(e) => handleAutoLaunch(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingName}>自动保存</span>
                <span className={styles.settingDesc}>定时保存已修改的笔记</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            {autoSave && (
              <div className={styles.intervalRow}>
                <label className={styles.label}>保存间隔</label>
                <div className={styles.intervalButtons}>
                  {[
                    { value: 15, label: '15 秒' },
                    { value: 30, label: '30 秒' },
                    { value: 60, label: '1 分钟' },
                    { value: 120, label: '2 分钟' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.intervalBtn} ${autoSaveInterval === opt.value ? styles.active : ''}`}
                      onClick={() => setAutoSaveInterval(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingName}>关闭到托盘</span>
                <span className={styles.settingDesc}>关闭窗口时最小化到系统托盘而非退出</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={closeToTray}
                  onChange={(e) => handleCloseToTray(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
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
