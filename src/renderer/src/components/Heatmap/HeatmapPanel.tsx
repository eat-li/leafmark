import { useMemo } from 'react'
import { useNoteStore } from '../../store/noteStore'
import type { DayStats } from '../../store/noteStore'
import styles from './HeatmapPanel.module.css'

// 5 级色阶（浅→深），匹配 Teal & Slate 主题
const HEAT_LEVELS = [
  'var(--bg-tertiary)', // 0：无数据
  'rgba(14, 138, 122, 0.15)', // 1：微量
  'rgba(14, 138, 122, 0.30)', // 2：少量
  'rgba(14, 138, 122, 0.50)', // 3：中等
  'rgba(14, 138, 122, 0.75)' // 4：大量
]

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月'
]

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 根据 values 的分布，把数值映射到 0-4 级 */
function calcLevels(stats: Record<string, DayStats>, days: Date[]): Map<string, number> {
  const map = new Map<string, number>()
  const values: number[] = []
  for (const d of days) {
    const k = dateKey(d)
    const s = stats[k]
    const v = s ? s.totalChars : 0
    map.set(k, v)
    if (v > 0) values.push(v)
  }
  if (values.length === 0) return map

  values.sort((a, b) => a - b)
  const p25 = values[Math.floor(values.length * 0.25)]
  const p50 = values[Math.floor(values.length * 0.5)]
  const p75 = values[Math.floor(values.length * 0.75)]

  const result = new Map<string, number>()
  for (const d of days) {
    const k = dateKey(d)
    const v = map.get(k) || 0
    if (v === 0) result.set(k, 0)
    else if (v <= p25) result.set(k, 1)
    else if (v <= p50) result.set(k, 2)
    else if (v <= p75) result.set(k, 3)
    else result.set(k, 4)
  }
  return result
}

export default function HeatmapPanel() {
  const writingStats = useNoteStore((s) => s.writingStats)
  const setShowHeatmap = useNoteStore((s) => s.setShowHeatmap)

  // 生成 52 周 × 7 天的日期网格
  const { weeks, monthLabels, levels, todayKey } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tk = dateKey(today)

    // 找到本周六（最后一行）
    const endDay = new Date(today)
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay())) // 本周六

    // 从 endDay 往前推 52 周 + 到周日
    const startDay = new Date(endDay)
    startDay.setDate(startDay.getDate() - 7 * 52 + 1 - startDay.getDay())

    // 初始化到最近的一个周日
    const cursor = new Date(startDay)
    cursor.setDate(cursor.getDate() - cursor.getDay())

    const days: Date[] = []
    for (let i = 0; i < 7 * 53; i++) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    // 按周分组
    const weeksArr: Date[][] = []
    for (let w = 0; w < 53; w++) {
      weeksArr.push(days.slice(w * 7, w * 7 + 7))
    }

    // 计算月份标签（每月第一天所在的周列索引）
    const ml: { col: number; label: string }[] = []
    for (let w = 0; w < weeksArr.length; w++) {
      const week = weeksArr[w]
      const firstDay = week[0] // 周日
      if (firstDay.getDate() <= 7 || w === 0) {
        ml.push({ col: w, label: MONTHS[firstDay.getMonth()] })
      }
    }

    const lvls = calcLevels(writingStats, days)

    return { weeks: weeksArr, monthLabels: ml, levels: lvls, todayKey: tk }
  }, [writingStats])

  // 统计数据
  const statsSummary = useMemo(() => {
    const entries = Object.values(writingStats)
    const totalDays = entries.length
    const totalChars = entries.reduce((s, e) => s + e.totalChars, 0)
    const avgChars = totalDays > 0 ? Math.round(totalChars / totalDays) : 0
    const maxChars = entries.reduce((m, e) => Math.max(m, e.totalChars), 0)
    return { totalDays, totalChars, avgChars, maxChars }
  }, [writingStats])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>写作热力图</span>
        <button
          className={styles.closeBtn}
          onClick={() => setShowHeatmap(false)}
          title="关闭 (Ctrl+Shift+H)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* 统计摘要 */}
      <div className={styles.summary}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{statsSummary.totalDays}</span>
          <span className={styles.statLabel}>活跃天数</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{statsSummary.avgChars.toLocaleString()}</span>
          <span className={styles.statLabel}>日均字符</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{statsSummary.totalChars.toLocaleString()}</span>
          <span className={styles.statLabel}>总计字符</span>
        </div>
      </div>

      {/* 热力图网格 */}
      <div className={styles.gridContainer}>
        {/* 月份标签行 */}
        <div className={styles.monthRow}>
          <div className={styles.weekdayGutter} />
          <div className={styles.monthLabels}>
            {monthLabels.map((m, i) => (
              <span key={i} className={styles.monthLabel} style={{ gridColumn: m.col + 1 }}>
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.gridBody}>
          {/* 周几标签 */}
          <div className={styles.weekdayGutter}>
            {WEEKDAYS.map((d) => (
              <span key={d} className={styles.weekday}>
                {d}
              </span>
            ))}
          </div>

          {/* 格子 */}
          <div className={styles.grid}>
            {weeks.map((week, wi) => (
              <div key={wi} className={styles.week}>
                {week.map((day) => {
                  const k = dateKey(day)
                  const level = levels.get(k) || 0
                  const stats = writingStats[k]
                  const isToday = k === todayKey

                  return (
                    <div
                      key={k}
                      className={`${styles.cell} ${level > 0 ? styles.active : ''} ${isToday ? styles.today : ''}`}
                      style={{ backgroundColor: HEAT_LEVELS[level] }}
                      title={
                        stats
                          ? `${k}\n${stats.filesEdited.length} 个文件\n${stats.totalChars.toLocaleString()} 字符`
                          : `${k}\n无记录`
                      }
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div className={styles.legend}>
          <span className={styles.legendLabel}>少</span>
          {HEAT_LEVELS.map((color, i) => (
            <div key={i} className={styles.legendCell} style={{ backgroundColor: color }} />
          ))}
          <span className={styles.legendLabel}>多</span>
        </div>
      </div>
    </div>
  )
}
