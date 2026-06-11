import { useState, useEffect, useRef } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { fs } from '../../api/electron'
import styles from './BackgroundImage.module.css'

// 模块级缓存：路径 → data URL，避免重复 IPC 调用
const imageUrlCache = new Map<string, string>()

/**
 * 背景图片组件
 * 通过 IPC 加载本地图片为 data URL，带缓存防止重复加载
 */
export default function BackgroundImage() {
  const backgroundImage = useNoteStore((s) => s.backgroundImage)
  const backgroundImagePosition = useNoteStore((s) => s.backgroundImagePosition)
  const backgroundImageOpacity = useNoteStore((s) => s.backgroundImageOpacity)
  const backgroundImageBlur = useNoteStore((s) => s.backgroundImageBlur)

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!backgroundImage) {
      setImageUrl(null)
      setLoading(false)
      return
    }

    // 命中缓存 → 直接使用，无需等待 IPC
    const cached = imageUrlCache.get(backgroundImage)
    if (cached) {
      setImageUrl(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fs.readImageAsDataUrl(backgroundImage)
      .then((dataUrl) => {
        if (cancelled) return
        if (dataUrl) {
          imageUrlCache.set(backgroundImage, dataUrl)
          setImageUrl(dataUrl)
        } else {
          setImageUrl(null)
        }
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setImageUrl(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [backgroundImage])

  // 没有设置背景图片 → 只显示默认背景
  if (!backgroundImage) {
    return (
      <div className={styles.container}>
        <div className={styles.defaultBackground} />
      </div>
    )
  }

  // 图片尚未加载完成 → 保持默认背景（不闪烁）
  if (loading && !imageUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.defaultBackground} />
      </div>
    )
  }

  // 有图片（已缓存或刚加载完）→ 叠加显示
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    opacity: backgroundImageOpacity / 100,
    filter: backgroundImageBlur > 0 ? `blur(${backgroundImageBlur}px)` : undefined
  }

  const positionClass =
    styles[`position${backgroundImagePosition.charAt(0).toUpperCase() + backgroundImagePosition.slice(1)}`]

  return (
    <div className={styles.container}>
      <div className={styles.defaultBackground} />
      {imageUrl && (
        <div className={`${styles.image} ${positionClass}`} style={backgroundStyle} />
      )}
    </div>
  )
}
