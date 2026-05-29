import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import MarkdownIt from 'markdown-it'
import katex from 'katex'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import ruby from 'highlight.js/lib/languages/ruby'
import php from 'highlight.js/lib/languages/php'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import bash from 'highlight.js/lib/languages/bash'
import shell from 'highlight.js/lib/languages/shell'
import scss from 'highlight.js/lib/languages/scss'
import less from 'highlight.js/lib/languages/less'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import diff from 'highlight.js/lib/languages/diff'
import makefile from 'highlight.js/lib/languages/makefile'
import ini from 'highlight.js/lib/languages/ini'
import perl from 'highlight.js/lib/languages/perl'
import scala from 'highlight.js/lib/languages/scala'
import haskell from 'highlight.js/lib/languages/haskell'
import lua from 'highlight.js/lib/languages/lua'
import r from 'highlight.js/lib/languages/r'
import dart from 'highlight.js/lib/languages/dart'
import c from 'highlight.js/lib/languages/c'
import latex from 'highlight.js/lib/languages/latex'
import protobuf from 'highlight.js/lib/languages/protobuf'
import graphql from 'highlight.js/lib/languages/graphql'
import 'highlight.js/styles/github-dark.css'

hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('c#', csharp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('php', php)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('kt', kotlin)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('less', less)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('diff', diff)
hljs.registerLanguage('makefile', makefile)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('perl', perl)
hljs.registerLanguage('pl', perl)
hljs.registerLanguage('scala', scala)
hljs.registerLanguage('haskell', haskell)
hljs.registerLanguage('hs', haskell)
hljs.registerLanguage('lua', lua)
hljs.registerLanguage('r', r)
hljs.registerLanguage('dart', dart)
hljs.registerLanguage('c', c)
hljs.registerLanguage('latex', latex)
hljs.registerLanguage('tex', latex)
hljs.registerLanguage('protobuf', protobuf)
hljs.registerLanguage('proto', protobuf)
hljs.registerLanguage('graphql', graphql)
hljs.registerLanguage('gql', graphql)
import { useNoteStore } from '../../store/noteStore'
import { fs } from '../../api/electron'
import styles from './PreviewPanel.module.css'

interface PreviewPanelProps {
  onScroll?: (percent: number) => void
  onRegisterScrollTo?: (fn: (percent: number) => void) => void
  isSyncing?: React.MutableRefObject<boolean>
}

export default function PreviewPanel({ onScroll, onRegisterScrollTo, isSyncing }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const openTabs = useNoteStore((s) => s.openTabs)
  const activeTabPath = useNoteStore((s) => s.activeTabPath)
  const fontSize = useNoteStore((s) => s.fontSize)
  const workspaceDir = useNoteStore((s) => s.workspaceDir)
  const activeTab = openTabs.find((t) => t.path === activeTabPath)
  const imageCacheRef = useRef<Record<string, string>>({})
  const [, forceUpdate] = useState(0)

  const loadImage = useCallback(
    async (src: string) => {
      if (imageCacheRef.current[src]) return
      if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return
      const fullPath = `${workspaceDir}/${src}`
      try {
        const dataUrl = await fs.readImageAsDataUrl(fullPath)
        if (dataUrl) {
          imageCacheRef.current = { ...imageCacheRef.current, [src]: dataUrl }
          forceUpdate((n) => n + 1)
        }
      } catch {
        // 忽略加载失败
      }
    },
    [workspaceDir]
  )

  // 注册 KaTeX 数学公式插件
  const md = useMemo(() => {
    const instance = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight(str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code>${
              hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
            }</code></pre>`
          } catch {
            /* empty */
          }
        }
        return `<pre class="hljs"><code>${instance!.utils.escapeHtml(str)}</code></pre>`
      }
    })

    // 块级公式：$$...$$
    const defaultFence = instance.renderer.rules.fence?.bind(instance.renderer.rules)
    instance.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      if (token.info === 'math' || token.info === 'latex' || token.info === 'tex') {
        try {
          return `<div class="katex-block">${katex.renderToString(token.content.trim(), { displayMode: true, throwOnError: false })}</div>`
        } catch {
          return `<div class="katex-error">${instance.utils.escapeHtml(token.content)}</div>`
        }
      }
      return defaultFence?.(tokens, idx, options, env, self) ?? ''
    }

    // 行内公式：$...$ 和块级 $$...$$
    instance.inline.ruler.after('escape', 'math_inline', (state, silent) => {
      const src = state.src
      const pos = state.pos

      // 块级 $$...$$
      if (src[pos] === '$' && src[pos + 1] === '$') {
        const end = src.indexOf('$$', pos + 2)
        if (end !== -1) {
          if (!silent) {
            const content = src.slice(pos + 2, end).trim()
            try {
              const html = katex.renderToString(content, { displayMode: true, throwOnError: false })
              const token = state.push('html_inline', '', 0)
              token.content = `<div class="katex-block">${html}</div>`
            } catch {
              const token = state.push('html_inline', '', 0)
              token.content = `<div class="katex-error">${state.md.utils.escapeHtml(content)}</div>`
            }
          }
          state.pos = end + 2
          return true
        }
      }

      // 行内 $...$
      if (src[pos] === '$' && src[pos + 1] !== '$') {
        // 不能紧跟空格
        if (src[pos + 1] === ' ') return false
        const end = src.indexOf('$', pos + 1)
        if (end !== -1) {
          // 不能前后紧跟数字（避免误匹配 $100）
          const before = pos > 0 ? src[pos - 1] : ' '
          const after = end + 1 < src.length ? src[end + 1] : ' '
          if (!/\d/.test(before) && !/\d/.test(after)) {
            if (!silent) {
              const content = src.slice(pos + 1, end).trim()
              try {
                const html = katex.renderToString(content, {
                  displayMode: false,
                  throwOnError: false
                })
                const token = state.push('html_inline', '', 0)
                token.content = html
              } catch {
                const token = state.push('html_inline', '', 0)
                token.content = `<span class="katex-error">${state.md.utils.escapeHtml(content)}</span>`
              }
            }
            state.pos = end + 1
            return true
          }
        }
      }

      return false
    })

    return instance
  }, [])

  useEffect(() => {
    if (!activeTab?.content || !workspaceDir) return
    const imageRegex = /!\[.*?\]\(([^)]+)\)/g
    let match
    const paths: string[] = []
    while ((match = imageRegex.exec(activeTab.content)) !== null) {
      const src = match[1]
      if (!src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
        paths.push(src)
      }
    }
    paths.forEach((src) => loadImage(src))
  }, [activeTab?.content, workspaceDir, loadImage])

  const html = useMemo(() => {
    if (!activeTab?.content) return ''
    let content = activeTab.content
    for (const [src, dataUrl] of Object.entries(imageCacheRef.current)) {
      content = content.split(src).join(dataUrl)
    }
    return md.render(content)
  }, [activeTab?.content, md, imageCacheRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = 0
  }, [activeTabPath])

  // 监听预览面板滚动，向外报告百分比
  useEffect(() => {
    const el = containerRef.current
    if (!el || !onScroll) return
    const handleScroll = () => {
      const syncing = isSyncing?.current ?? false
      if (syncing) return
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll <= 0) return
      onScroll(el.scrollTop / maxScroll)
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [onScroll, isSyncing])

  // 注册 scrollTo 回调，让 App 可以直接驱动预览面板滚动
  useEffect(() => {
    if (!onRegisterScrollTo) return
    const scrollTo = (percent: number) => {
      const el = containerRef.current
      if (!el) return
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll > 0) {
        el.scrollTop = percent * maxScroll
      }
    }
    onRegisterScrollTo(scrollTo)
  }, [onRegisterScrollTo])

  if (!activeTab) {
    return (
      <div className={styles.empty}>
        <span>预览区域</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={styles.preview} style={{ fontSize: `${fontSize}px` }}>
      <div className={styles.content} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
