import styles from './PositionSelector.module.css'

type Position = 'center' | 'tile' | 'stretch'

interface PositionSelectorProps {
  value: Position
  onChange: (position: Position) => void
}

/**
 * 位置选择组件
 * 支持三种基础模式：居中、拉伸、平铺
 */
export default function PositionSelector({ value, onChange }: PositionSelectorProps) {
  const positions: { key: Position; label: string; icon: React.ReactNode }[] = [
    {
      key: 'center',
      label: '居中',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" opacity="0.3" />
        </svg>
      )
    },
    {
      key: 'stretch',
      label: '拉伸',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" opacity="0.3" />
        </svg>
      )
    },
    {
      key: 'tile',
      label: '平铺',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="5" y="5" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="10" y="5" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="15" y="5" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="5" y="10" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="10" y="10" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="15" y="10" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="5" y="15" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="10" y="15" width="4" height="4" fill="currentColor" opacity="0.3" />
          <rect x="15" y="15" width="4" height="4" fill="currentColor" opacity="0.3" />
        </svg>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <label className={styles.label}>图片位置</label>
      <div className={styles.options}>
        {positions.map((pos) => (
          <button
            key={pos.key}
            className={`${styles.option} ${value === pos.key ? styles.active : ''}`}
            onClick={() => onChange(pos.key)}
            title={pos.label}
          >
            <span className={styles.icon}>{pos.icon}</span>
            <span className={styles.text}>{pos.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
