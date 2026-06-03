import { useState, useEffect } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { fs } from '../../api/electron'
import styles from './BackgroundImage.module.css'

/**
 * 背景图片组件
 * 根据配置渲染背景图片，支持位置、透明度、模糊度设置
 */
export default function BackgroundImage() {
  const backgroundImage = useNoteStore((s) => s.backgroundImage)
  const backgroundImagePosition = useNoteStore((s) => s.backgroundImagePosition)
  const backgroundImageOpacity = useNoteStore((s) => s.backgroundImageOpacity)
  const backgroundImageBlur = useNoteStore((s) => s.backgroundImageBlur)
  const setBackgroundImage = useNoteStore((s) => s.setBackgroundImage)

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // 加载图片
  useEffect(() => {
    if (!backgroundImage) {
      setImageUrl(null)
      setError(false)
      return
    }

    setLoading(true)
    setError(false)

    // 尝试读取图片为 data URL
    fs.readImageAsDataUrl(backgroundImage)
      .then((dataUrl) => {
        setImageUrl(dataUrl)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
        // 图片加载失败时清除设置
        setBackgroundImage(null)
      })
  }, [backgroundImage, setBackgroundImage])

  // 如果没有背景图片或加载失败，只显示默认背景
  if (!backgroundImage || error) {
    return (
      <div className={styles.container}>
        <div className={styles.defaultBackground} />
      </div>
    )
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  // 计算背景样式
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    opacity: backgroundImageOpacity / 100,
    filter: backgroundImageBlur > 0 ? `blur(${backgroundImageBlur}px)` : undefined
  }

  // 根据位置模式设置样式
  const positionClass = styles[`position${backgroundImagePosition.charAt(0).toUpperCase() + backgroundImagePosition.slice(1)}`]

  return (
    <div className={styles.container}>
      <div className={styles.defaultBackground} />
      <div
        className={`${styles.image} ${positionClass}`}
        style={backgroundStyle}
      />
    </div>
  )
}
