import { useState, useEffect, useMemo } from 'react'
import { useNoteStore } from '../../store/noteStore'
import styles from './BackgroundImage.module.css'

/**
 * 将本地文件路径转换为 app-img:// 协议 URL
 * 该协议在主进程中注册，绕过 CORS 直接提供本地文件
 */
function toAppImgUrl(filePath: string): string {
  // 统一正斜杠
  const normalized = filePath.replace(/\\/g, '/')
  // 编码特殊字符，保留 /
  const encoded = normalized.replace(/ /g, '%20').replace(/#/g, '%23')
  return `app-img:///${encoded}`
}

/**
 * 背景图片组件
 * 使用 app-img:// 协议直接引用本地文件，无需 IPC 转 data URL
 */
export default function BackgroundImage() {
  const backgroundImage = useNoteStore((s) => s.backgroundImage)
  const backgroundImagePosition = useNoteStore((s) => s.backgroundImagePosition)
  const backgroundImageOpacity = useNoteStore((s) => s.backgroundImageOpacity)
  const backgroundImageBlur = useNoteStore((s) => s.backgroundImageBlur)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const imageUrl = useMemo(
    () => (backgroundImage ? toAppImgUrl(backgroundImage) : null),
    [backgroundImage]
  )

  // 预加载图片
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
      if (!cancelled) setLoaded(true)
    }
    img.onerror = () => {
      if (!cancelled) setError(true)
    }
    img.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  if (!backgroundImage || error) {
    return (
      <div className={styles.container}>
        <div className={styles.defaultBackground} />
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className={styles.container}>
        <div className={styles.defaultBackground} />
      </div>
    )
  }

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
