import { useNoteStore } from '../../store/noteStore'
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
  IconSettings
} from '../Icons'
import styles from './Toolbar.module.css'

interface FormatAction {
  icon: React.ReactNode
  title: string
  prefix: string
  suffix: string
  placeholder: string
  lineStart?: boolean
}

const formatActions: FormatAction[] = [
  { icon: <IconBold size={14} />, title: '粗体', prefix: '**', suffix: '**', placeholder: '粗体文本' },
  { icon: <IconItalic size={14} />, title: '斜体', prefix: '*', suffix: '*', placeholder: '斜体文本' },
  { icon: <IconHeading size={14} />, title: '标题', prefix: '## ', suffix: '', placeholder: '标题', lineStart: true },
  { icon: <IconQuote size={14} />, title: '引用', prefix: '> ', suffix: '', placeholder: '引用文本', lineStart: true },
  { icon: <IconCode size={14} />, title: '代码', prefix: '`', suffix: '`', placeholder: '代码' },
  { icon: <IconLink size={14} />, title: '链接', prefix: '[', suffix: '](url)', placeholder: '链接文本' },
  { icon: <IconImage size={14} />, title: '图片', prefix: '![', suffix: '](url)', placeholder: '图片描述' },
  { icon: <IconList size={14} />, title: '列表', prefix: '- ', suffix: '', placeholder: '列表项', lineStart: true },
  { icon: <IconOrderedList size={14} />, title: '有序列表', prefix: '1. ', suffix: '', placeholder: '列表项', lineStart: true },
  { icon: <IconDivider size={14} />, title: '分割线', prefix: '\n---\n', suffix: '', placeholder: '' },
  { icon: <IconTaskList size={14} />, title: '任务列表', prefix: '- [ ] ', suffix: '', placeholder: '任务', lineStart: true }
]

interface ToolbarProps {
  onInsertFormat?: (prefix: string, suffix: string, placeholder: string, lineStart: boolean) => void
}

export default function Toolbar({ onInsertFormat }: ToolbarProps) {
  const {
    viewMode,
    setViewMode,
    fontSize,
    setFontSize,
    toggleSidebar,
    toggleTheme,
    setShowSearch,
    setShowSettings
  } = useNoteStore()

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

      <div className={styles.group}>
        <button className={styles.btn} onClick={() => setFontSize(fontSize - 1)} title="减小字号">
          <span className={styles.fontSizeBtn}>A-</span>
        </button>
        <span className={styles.fontSizeLabel}>{fontSize}px</span>
        <button className={styles.btn} onClick={() => setFontSize(fontSize + 1)} title="增大字号">
          <span className={styles.fontSizeBtn}>A+</span>
        </button>
      </div>

      <div className={styles.spacer} />

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
