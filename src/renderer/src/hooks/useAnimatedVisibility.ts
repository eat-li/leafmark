import { useState, useEffect, useCallback } from 'react'

/**
 * 一个用于管理带动画的显示/隐藏状态的 Hook
 * 支持进入和退出动画
 */
export function useAnimatedVisibility(
  isVisible: boolean,
  _enterDuration: number = 200,
  exitDuration: number = 150
) {
  const [shouldRender, setShouldRender] = useState(isVisible)
  const [animationClass, setAnimationClass] = useState<'enter' | 'exit' | ''>('')

  useEffect(() => {
    if (isVisible) {
      // 显示：立即渲染并播放进入动画
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 动画需要同步设置初始状态
      setShouldRender(true)
      setAnimationClass('enter')
    } else if (shouldRender) {
      // 隐藏：播放退出动画，动画结束后移除元素
      setAnimationClass('exit')
      const timer = setTimeout(() => {
        setShouldRender(false)
        setAnimationClass('')
      }, exitDuration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isVisible, shouldRender, exitDuration])

  const handleAnimationEnd = useCallback(() => {
    if (animationClass === 'enter') {
      setAnimationClass('')
    }
  }, [animationClass])

  return {
    shouldRender,
    animationClass,
    onAnimationEnd: handleAnimationEnd
  }
}
