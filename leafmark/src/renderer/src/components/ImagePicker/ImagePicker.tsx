import { useState, useEffect } from 'react'
import { dialog, fs } from '../../api/electron'
import styles from './ImagePicker.module.css'

interface ImagePickerProps {
  value: string | null
  onChange: (image: string | null) => void
  placeholder?: string
}

/**
 * 图片选择组件
 * 支持预览、删除图片，复用于设置面板
 */
export default function ImagePicker({
  value,
  onChange,
  placeholder = '选择图片'
}: ImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // 加载图片预览
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      setError(false)
      return
    }

    setLoading(true)
    setError(false)

    // 尝试读取图片为 data URL
    fs.readImageAsDataUrl(value)
      .then((dataUrl) => {
        setPreviewUrl(dataUrl)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [value])

  const handleSelect = async () => {
    try {
      const paths = await dialog.open({
        properties: ['openFile'],
        title: '选择背景图片',
        filters: [
          { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }
        ]
      })

      if (paths && paths.length > 0) {
        onChange(paths[0])
      }
    } catch (err) {
      console.error('选择图片失败:', err)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>背景图片</label>
      <div
        className={`${styles.picker} ${previewUrl ? styles.hasImage : ''} ${error ? styles.hasError : ''}`}
        onClick={handleSelect}
      >
        {loading ? (
          <div className={styles.placeholder}>
            <span className={styles.spinner} />
            <span>加载中...</span>
          </div>
        ) : previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="背景图片预览"
              className={styles.preview}
              onError={() => setError(true)}
            />
            <div className={styles.overlay}>
              <span className={styles.changeText}>点击更换</span>
            </div>
            <button
              className={styles.removeBtn}
              onClick={handleRemove}
              title="移除图片"
            >
              ×
            </button>
          </>
        ) : error ? (
          <div className={styles.placeholder}>
            <span className={styles.errorIcon}>⚠</span>
            <span>图片加载失败</span>
            <span className={styles.errorHint}>点击重新选择</span>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.addIcon}>+</span>
            <span>{placeholder}</span>
            <span className={styles.hint}>支持 PNG, JPG, GIF, WebP, SVG, BMP</span>
          </div>
        )}
      </div>
    </div>
  )
}
