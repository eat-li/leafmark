import styles from './Slider.module.css'

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  disabled?: boolean
}

/**
 * 可复用的滑块组件
 * 支持标签、最小值、最大值、单位等属性
 */
export default function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  disabled = false
}: SliderProps) {
  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>
        <span className={styles.value}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  )
}
