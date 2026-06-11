import { useState, useEffect, useMemo } from 'react'
import { useNoteStore } from '../../store/noteStore'
import styles from './BackgroundImage.module.css'

/** 将本地文件路径转换为 local-image:// 协议 URL */
function toLocalImageUrl(filePath: string): string {
  // 统一用正斜杠，避免 Windows 反斜杠问题
  const normalized = filePath.replace(/\\/g, '/')
  // 仅编码 : 和空格等特殊字符，保留 / 使 URL 路径结构正确
  const encoded = normalized.replace(/:/g, '%3A').replace(/ /g, '%20')
  return `local-image:///${encoded}`
}

/**
 * 背景图片组件
 * 使用 local-image:// 协议直接从本地文件系统加载，无需 IPC 转 data URL
 */
export default function BackgroundImage() {
  const backgroundImage = useNoteStore((s) => s.backgroundImage)
  const backgroundImagePosition = useNoteStore((s) => s.backgroundImagePosition)
  const backgroundImageOpacity = useNoteStore((s) => s.backgroundImageOpacity)
  const backgroundImageBlur = useNoteStore((s) => s.backgroundImageBlur)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // 将路径转为 URL，路径不变则 URL 不变
  const imageUrl = useMemo(
    () => (backgroundImage ? toLocalImageUrl(backgroundImage) : null),
    [backgroundImage]
  )

  // 预加载图片：浏览器解码完成后才显示
  useEffect(() => {
    if (!imageUrl) {
      setLoaded(false)
      setError(false)
      return
    }

    let cancelled = false
    setLoaded(false)
    setError(false)

    const img = new Image()
    img.onload = () => {
      if (!cancelled) {
        setLoaded(true)
        setError(false)
      }
    }
    img.onerror = () => {
      if (!cancelled) {
        setLoaded(false)
        setError(true)
      }
    }
    img.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  // 没有背景图片或加载失败 → 只显示默认背景
  if (!backgroundImage || error) {
    return (
      <div className={styles.container}>
        <div className={styles.defaultBackground} />
      </div>
    )
  }

  // 图片尚未加载完成 → 显示默认背景（不显示 loading，避免闪烁）
  if (!loaded) {
    return (
      <div className={styles.container}>
        <div className={styles.defaultBackground} />
      </div>
    )
  }

  // 图片加载完成 → 叠加显示
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `url(${imageUrl})`,
    opacity: backgroundImageOpacity / 100,
    filter: backgroundImageBlur > 0 ? `blur(${backgroundImageBlur}px)` : undefined
  }

  const positionClass =
    styles[`position${backgroundImagePosition.charAt(0).toUpperCase() + backgroundImagePosition.slice(1)}`]

  return (
    <div className={styles.container}>
      <div className={styles.defaultBackground} />
      <div className={`${styles.image} ${positionClass}`} style={backgroundStyle} />
    </div>
  )
}
