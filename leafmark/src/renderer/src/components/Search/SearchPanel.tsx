import { useState, useEffect, useRef } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { fs } from '../../api/electron'
import styles from './SearchPanel.module.css'

interface SearchResult {
  path: string
  name: string
  line: number
  preview: string
}

export default function SearchPanel() {
  const { showSearch, setShowSearch, workspaceDir, openFile } = useNoteStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowSearch])

  const handleSearch = async () => {
    if (!query.trim() || !workspaceDir) return
    setSearching(true)
    const found: SearchResult[] = []

    try {
      const tree = await fs.readDirTree(workspaceDir)
      const searchInTree = async (nodes: typeof tree) => {
        for (const node of nodes) {
          if (node.type === 'directory') {
            await searchInTree(node.children || [])
          } else {
            try {
              const content = await fs.readFile(node.path)
              const lines = content.split('\n')
              lines.forEach((line, idx) => {
                if (line.toLowerCase().includes(query.toLowerCase())) {
                  found.push({
                    path: node.path,
                    name: node.name,
                    line: idx + 1,
                    preview: line.trim().substring(0, 100)
                  })
                }
              })
            } catch {
              // 跳过读取失败的文件
            }
          }
        }
      }
      await searchInTree(tree)
    } finally {
      setResults(found)
      setSearching(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    openFile(result.path, result.name)
  }

  if (!showSearch) return null

  return (
    <div className={styles.overlay} onClick={() => setShowSearch(false)}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>全文搜索</span>
          <button className={styles.closeBtn} onClick={() => setShowSearch(false)}>
            ×
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="输入搜索关键词..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
          />
          <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
            {searching ? '搜索中...' : '搜索'}
          </button>
        </div>

        <div className={styles.results}>
          {results.length === 0 ? (
            <div className={styles.empty}>
              {query ? '无搜索结果' : '输入关键词开始搜索'}
            </div>
          ) : (
            results.map((result, idx) => (
              <div
                key={`${result.path}-${result.line}-${idx}`}
                className={styles.resultItem}
                onClick={() => handleResultClick(result)}
              >
                <div className={styles.resultFile}>
                  {result.name}
                  <span className={styles.resultLine}>:{result.line}</span>
                </div>
                <div className={styles.resultPreview}>{result.preview}</div>
              </div>
            ))
          )}
        </div>

        {results.length > 0 && (
          <div className={styles.resultCount}>{results.length} 个匹配</div>
        )}
      </div>
    </div>
  )
}
