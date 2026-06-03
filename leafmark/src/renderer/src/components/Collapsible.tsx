import { useState, useEffect, useRef, type ReactNode } from 'react'

interface CollapsibleProps {
  expanded: boolean
  children: ReactNode
  duration?: number
}

/**
 * 一个带动画的折叠/展开容器组件
 */
export function Collapsible({ expanded, children, duration = 200 }: CollapsibleProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(expanded ? undefined : 0)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    if (expanded) {
      // 展开：从 0 到内容高度
      const contentHeight = content.scrollHeight
      setHeight(0)
      // 强制重绘
      requestAnimationFrame(() => {
        setHeight(contentHeight)
        setTimeout(() => {
          setHeight(undefined)
        }, duration)
      })
    } else {
      // 折叠：从当前高度到 0
      const contentHeight = content.scrollHeight
      setHeight(contentHeight)
      requestAnimationFrame(() => {
        setHeight(0)
      })
    }
  }, [expanded, duration])

  const style: React.CSSProperties = {
    overflow: 'hidden',
    transition: `height ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    height: height === undefined ? 'auto' : `${height}px`,
    opacity: expanded ? 1 : 0,
    transitionProperty: 'height, opacity',
    transitionDuration: `${duration}ms, ${duration * 0.6}ms`,
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }

  return (
    <div ref={contentRef} style={style}>
      {children}
    </div>
  )
}
