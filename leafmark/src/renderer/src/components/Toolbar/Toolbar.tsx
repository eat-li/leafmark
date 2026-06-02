import { useCallback, useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import { useNoteStore, IMAGE_EXTENSIONS } from '../../store/noteStore'
import { exportFile } from '../../api/electron'
import {
  IconBold,
  IconItalic,
  IconHeading,
  IconQuote,
  IconCode,
  IconLink,
  IconImage,
  IconList,
  IconOrderedList,
  IconDivider,
  IconTaskList,
  IconSidebar,
  IconEdit,
  IconSplit,
  IconPreview,
  IconSearch,
  IconTheme,
  IconSettings,
  IconSyncScroll,
  IconTypewriter,
  IconExport,
  IconOutline,
  IconHeatmap
} from '../Icons'
import styles from './Toolbar.module.css'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

function buildExportHTML(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; max-width: 760px; margin: 0 auto; padding: 32px; line-height: 1.85; color: #2c2a26; font-size: 15px; }
  h1, h2, h3, h4, h5, h6 { margin: 1.6em 0 0.6em; font-weight: 700; line-height: 1.3; }
  h1 { font-size: 2em; padding-bottom: 0.35em; border-bottom: 2px solid #c07a2a; color: #c07a2a; }
  h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid #ddd9cf; }
  h3 { font-size: 1.25em; }
  p { margin: 0.9em 0; }
  a { color: #c07a2a; text-decoration: none; }
  code { background: #e6e4dc; padding: 2px 7px; border-radius: 3px; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.88em; color: #c07a2a; border: 1px solid #ddd9cf; }
  pre { margin: 1.2em 0; border-radius: 8px; overflow-x: auto; border: 1px solid #ddd9cf; }
  pre code { display: block; padding: 18px 20px; background: #e6e4dc; color: #2c2a26; border: none; font-size: 0.87em; line-height: 1.6; }
  blockquote { margin: 1em 0; padding: 0.6em 1.2em; border-left: 3px solid #c07a2a; background: rgba(192,122,42,0.06); color: #5e5a52; border-radius: 0 5px 5px 0; }
  ul, ol { margin: 0.9em 0; padding-left: 1.8em; }
  li { margin: 0.35em 0; }
  img { max-width: 100%; border-radius: 8px; margin: 0.5em 0; }
  table { width: 100%; border-collapse: collapse; margin: 1.2em 0; font-size: 0.95em; }
  th, td { border: 1px solid #ddd9cf; padding: 8px 14px; text-align: left; }
  th { background: #efeee8; font-weight: 600; }
  hr { border: none; height: 1px; background: linear-gradient(to right, transparent, #ddd9cf, transparent); margin: 2.5em 0; }
  input[type="checkbox"] { margin-right: 6px; }
  .katex-block { margin: 1em 0; text-align: center; overflow-x: auto; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${body}
</body>
</html>`
}

interface FormatAction {
  icon: React.ReactNode
  title: string
  prefix: string
  suffix: string
  placeholder: string
  lineStart?: boolean
}

const formatActions: FormatAction[] = [
  {
    icon: <IconBold size={14} />,
    title: '粗体',
    prefix: '**',
    suffix: '**',
    placeholder: '粗体文本'
  },
  {
    icon: <IconItalic size={14} />,
    title: '斜体',
    prefix: '*',
    suffix: '*',
    placeholder: '斜体文本'
  },
  {
    icon: <IconHeading size={14} />,
    title: '标题',
    prefix: '## ',
    suffix: '',
    placeholder: '标题',
    lineStart: true
  },
  {
    icon: <IconQuote size={14} />,
    title: '引用',
    prefix: '> ',
    suffix: '',
    placeholder: '引用文本',
    lineStart: true
  },
  { icon: <IconCode size={14} />, title: '代码', prefix: '`', suffix: '`', placeholder: '代码' },
  {
    icon: <IconLink size={14} />,
    title: '链接',
    prefix: '[',
    suffix: '](url)',
    placeholder: '链接文本'
  },
  {
    icon: <IconImage size={14} />,
    title: '图片',
    prefix: '![',
    suffix: '](url)',
    placeholder: '图片描述'
  },
  {
    icon: <IconList size={14} />,
    title: '列表',
    prefix: '- ',
    suffix: '',
    placeholder: '列表项',
    lineStart: true
  },
  {
    icon: <IconOrderedList size={14} />,
    title: '有序列表',
    prefix: '1. ',
    suffix: '',
    placeholder: '列表项',
    lineStart: true
  },
  {
    icon: <IconDivider size={14} />,
    title: '分割线',
    prefix: '\n---\n',
    suffix: '',
    placeholder: ''
  },
  {
    icon: <IconTaskList size={14} />,
    title: '任务列表',
    prefix: '- [ ] ',
    suffix: '',
    placeholder: '任务',
    lineStart: true
  }
]

interface ToolbarProps {
  onInsertFormat?: (prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void
}

export default function Toolbar({ onInsertFormat }: ToolbarProps) {
  const viewMode = useNoteStore((s) => s.viewMode)
  const setViewMode = useNoteStore((s) => s.setViewMode)
  const fontSize = useNoteStore((s) => s.fontSize)
  const setFontSize = useNoteStore((s) => s.setFontSize)
  const toggleSidebar = useNoteStore((s) => s.toggleSidebar)
  const toggleTheme = useNoteStore((s) => s.toggleTheme)
  const setShowSearch = useNoteStore((s) => s.setShowSearch)
  const setShowSettings = useNoteStore((s) => s.setShowSettings)
  const setShowOutline = useNoteStore((s) => s.setShowOutline)
  const setShowHeatmap = useNoteStore((s) => s.setShowHeatmap)
  const syncScroll = useNoteStore((s) => s.syncScroll)
  const toggleSyncScroll = useNoteStore((s) => s.toggleSyncScroll)
  const typewriterMode = useNoteStore((s) => s.typewriterMode)
  const toggleTypewriterMode = useNoteStore((s) => s.toggleTypewriterMode)
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)

  const isImageFile = useMemo(() => {
    const tab = openTabs.find((t) => t.path === activeTabPath)
    if (!tab) return false
    if (tab.fileType === 'image') return true
    const ext = '.' + tab.path.split('.').pop()?.toLowerCase()
    return IMAGE_EXTENSIONS.includes(ext)
  }, [openTabs, activeTabPath])

  const handleExport = useCallback(async (format: 'pdf' | 'html') => {
    const state = useNoteStore.getState()
    const activeTab = state.openTabs.find((t) => t.path === state.activeTabPath)
    if (!activeTab) return

    const body = md.render(activeTab.content)
    const title = activeTab.name.replace(/\.md$/, '')
    const html = buildExportHTML(title, body)
    const defaultName = `${title}.${format}`

    if (format === 'pdf') {
      await exportFile.pdf(html, defaultName)
    } else {
      await exportFile.html(html, defaultName)
    }
  }, [])

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button className={styles.btn} onClick={toggleSidebar} title="切换侧边栏">
          <IconSidebar size={15} />
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        {formatActions.map((action) => (
          <button
            key={action.title}
            className={styles.btn}
            title={action.title}
            onClick={() =>
              onInsertFormat?.(
                action.prefix,
                action.suffix,
                action.placeholder,
                action.lineStart || false
              )
            }
          >
            {action.icon}
          </button>
        ))}
      </div>

      <div className={styles.separator} />

      {!isImageFile && (
        <>
          <div className={styles.group}>
            <button
              className={`${styles.btn} ${viewMode === 'edit' ? styles.active : ''}`}
              onClick={() => setViewMode('edit')}
              title="编辑模式"
            >
              <IconEdit size={14} />
            </button>
            <button
              className={`${styles.btn} ${viewMode === 'split' ? styles.active : ''}`}
              onClick={() => setViewMode('split')}
              title="分栏模式"
            >
              <IconSplit size={14} />
            </button>
            <button
              className={`${styles.btn} ${viewMode === 'preview' ? styles.active : ''}`}
              onClick={() => setViewMode('preview')}
              title="预览模式"
            >
              <IconPreview size={14} />
            </button>
          </div>

          <div className={styles.separator} />
        </>
      )}

      <div className={styles.group}>
        <button className={styles.btn} onClick={() => setFontSize(fontSize - 1)} title="减小字号">
          <span className={styles.fontSizeBtn}>A-</span>
        </button>
        <span className={styles.fontSizeLabel}>{fontSize}px</span>
        <button className={styles.btn} onClick={() => setFontSize(fontSize + 1)} title="增大字号">
          <span className={styles.fontSizeBtn}>A+</span>
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button
          className={`${styles.btn} ${syncScroll ? styles.active : ''}`}
          onClick={toggleSyncScroll}
          title={syncScroll ? '关闭同步滚动' : '开启同步滚动'}
        >
          <IconSyncScroll size={14} />
        </button>
        <button
          className={`${styles.btn} ${typewriterMode ? styles.active : ''}`}
          onClick={toggleTypewriterMode}
          title={typewriterMode ? '关闭打字机模式' : '开启打字机模式'}
        >
          <IconTypewriter size={14} />
        </button>
      </div>

      <div className={styles.spacer} />

      <div className={styles.group}>
        <button className={styles.btn} onClick={() => setShowOutline(true)} title="大纲">
          <IconOutline size={14} />
        </button>
        <button className={styles.btn} onClick={() => setShowHeatmap(true)} title="写作热力图 (Ctrl+H)">
          <IconHeatmap size={14} />
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button className={styles.btn} onClick={() => handleExport('pdf')} title="导出 PDF">
          <IconExport size={14} />
          <span className={styles.fontSizeBtn}>PDF</span>
        </button>
        <button className={styles.btn} onClick={() => handleExport('html')} title="导出 HTML">
          <IconExport size={14} />
          <span className={styles.fontSizeBtn}>HTML</span>
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button className={styles.btn} onClick={() => setShowSearch(true)} title="搜索 (Ctrl+F)">
          <IconSearch size={14} />
        </button>
        <button className={styles.btn} onClick={toggleTheme} title="切换主题">
          <IconTheme size={14} />
        </button>
        <button className={styles.btn} onClick={() => setShowSettings(true)} title="设置">
          <IconSettings size={14} />
        </button>
      </div>
    </div>
  )
}
