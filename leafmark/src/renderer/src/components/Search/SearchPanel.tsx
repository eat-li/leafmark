import { useState, useEffect, useRef, useCallback } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { fs } from '../../api/electron'
import styles from './SearchPanel.module.css'

interface SearchResult {
  path: string
  name: string
  line: number
  preview: string
}

interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileEntry[]
}

export default function SearchPanel() {
  const showSearch = useNoteStore((s) => s.showSearch)
  const setShowSearch = useNoteStore((s) => s.setShowSearch)
  const workspaceDir = useNoteStore((s) => s.workspaceDir)
  const openFile = useNoteStore((s) => s.openFile)
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

  const collectFiles = (nodes: FileEntry[]): string[] => {
    const files: string[] = []
    for (const node of nodes) {
      if (node.type === 'directory') {
        files.push(...collectFiles(node.children || []))
      } else {
        files.push(node.path)
      }
    }
    return files
  }

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !workspaceDir) return
    setSearching(true)

    try {
      const tree = await fs.readDirTree(workspaceDir)
      const filePaths = collectFiles(tree)

      // 并行读取所有文件并搜索
      const searchResults = await Promise.all(
        filePaths.map(async (filePath) => {
          try {
            const content = await fs.readFile(filePath)
            const lines = content.split('\n')
            const fileResults: SearchResult[] = []
            const fileName = filePath.split(/[/\\]/).pop() || ''
            lines.forEach((line, idx) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                fileResults.push({
                  path: filePath,
                  name: fileName,
                  line: idx + 1,
                  preview: line.trim().substring(0, 100)
                })
              }
            })
            return fileResults
          } catch {
            return []
          }
        })
      )

      setResults(searchResults.flat())
    } finally {
      setSearching(false)
    }
  }, [query, workspaceDir])

  const handleResultClick = useCallback((result: SearchResult) => {
    openFile(result.path, result.name)
  }, [openFile])

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