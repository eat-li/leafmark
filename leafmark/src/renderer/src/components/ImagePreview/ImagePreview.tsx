import { useState, useRef, useCallback, useEffect } from 'react'
import { shell } from '../../api/electron'
import styles from './ImagePreview.module.css'

interface ImagePreviewProps {
  dataUrl: string
  fileName: string
  filePath?: string
}

export default function ImagePreview({ dataUrl, fileName, filePath }: ImagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  // 适应窗口
  const fitToView = useCallback(
    (natW?: number, natH?: number) => {
      const container = containerRef.current
      const img = imgRef.current
      if (!container || !img) return
      const cw = container.clientWidth
      const ch = container.clientHeight
      const w = natW ?? img.naturalWidth
      const h = natH ?? img.naturalHeight
      if (w === 0 || h === 0) return
      const padding = 40
      const scale = Math.min((cw - padding * 2) / w, (ch - padding * 2) / h, 1)
      setZoom(scale)
      setPanX(0)
      setPanY(0)
    },
    []
  )

  // 图片加载完成后记录尺寸并居中
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    fitToView(img.naturalWidth, img.naturalHeight)
  }, [fitToView])

  // 实际大小 (1:1)
  const actualSize = useCallback(() => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }, [])

  // 缩放（以容器中心为基准）
  const zoomAt = useCallback(
    (delta: number) => {
      setZoom((prev) => {
        const next = Math.min(Math.max(prev * (1 + delta), 0.05), 30)
        // 缩放时调整 pan 以保持视觉中心
        if (next !== prev) {
          const factor = next / prev - 1
          setPanX((px) => px - px * factor)
          setPanY((py) => py - py * factor)
        }
        return next
      })
    },
    []
  )

  const zoomIn = useCallback(() => zoomAt(0.2), [zoomAt])
  const zoomOut = useCallback(() => zoomAt(-0.2), [zoomAt])

  // 滚轮缩放（以鼠标位置为中心）
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - rect.width / 2
      const mouseY = e.clientY - rect.top - rect.height / 2

      const delta = e.deltaY < 0 ? 0.15 : -0.15
      const factor = 1 + delta
      const newZoom = Math.min(Math.max(zoom * factor, 0.05), 30)
      const actualFactor = newZoom / zoom

      if (newZoom !== zoom) {
        setZoom(newZoom)
        // 以鼠标位置为中心缩放
        setPanX((px) => mouseX - (mouseX - px) * actualFactor)
        setPanY((py) => mouseY - (mouseY - py) * actualFactor)
      }
    },
    [zoom]
  )

  // 拖拽平移
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      setIsPanning(true)
      panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
    },
    [panX, panY]
  )

  useEffect(() => {
    if (!isPanning) return

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y, panX: sx, panY: sy } = panStartRef.current
      setPanX(sx + (e.clientX - x))
      setPanY(sy + (e.clientY - y))
    }

    const handleMouseUp = () => setIsPanning(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning])

  // 双击重置
  const handleDoubleClick = useCallback(() => {
    fitToView()
  }, [fitToView])

  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomIn()
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomOut()
      }
      if (e.key === '0') {
        e.preventDefault()
        fitToView()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomIn, zoomOut, fitToView])

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onWheel={handleWheel}
    >
      {/* 文件名 */}
      <div className={styles.fileName}>{fileName}</div>

      {/* 图片 */}
      <img
        ref={imgRef}
        className={`${styles.image} ${zoom > 3 ? styles.pixelated : ''} ${isPanning ? styles.grabbing : ''}`}
        src={dataUrl}
        alt={fileName}
        draggable={false}
        onLoad={handleImageLoad}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          width: imageSize.width * zoom,
          height: imageSize.height * zoom,
          left: `calc(50% + ${panX}px)`,
          top: `calc(50% + ${panY}px)`,
          transform: 'translate(-50%, -50%)',
          cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default'
        }}
      />

      {/* 工具栏 */}
      <div className={styles.toolbar} onMouseDown={(e) => e.stopPropagation()}>
        <button className={styles.toolBtn} onClick={zoomOut} title="缩小 (-)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>

        <span
          className={styles.zoomLabel}
          onClick={actualSize}
          title="点击恢复 100%"
        >
          {zoomPercent}%
        </span>

        <button className={styles.toolBtn} onClick={zoomIn} title="放大 (+)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>

        <div className={styles.separator} />

        <button className={styles.toolBtn} onClick={() => fitToView()} title="适应窗口 (0)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>

        <button className={styles.toolBtn} onClick={actualSize} title="实际大小">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 3v18" />
          </svg>
        </button>

        {filePath && (
          <>
            <div className={styles.separator} />
            <button
              className={styles.toolBtn}
              onClick={() => shell.openPath(filePath)}
              title="用系统应用打开"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* 图片信息 */}
      {imageSize.width > 0 && (
        <div className={styles.imageInfo}>
          {imageSize.width} × {imageSize.height}
        </div>
      )}
    </div>
  )
}
