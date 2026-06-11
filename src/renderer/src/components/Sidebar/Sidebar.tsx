import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNoteStore, type FileEntry } from '../../store/noteStore'
import { dialog } from '../../api/electron'
import FileTreeNode from './FileTreeNode'
import { IconNewFile, IconNewFolder, IconImport, IconRefresh, IconSearch } from '../Icons'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const fileTree = useNoteStore((s) => s.fileTree)
  const sidebarFilter = useNoteStore((s) => s.sidebarFilter)
  const setSidebarFilter = useNoteStore((s) => s.setSidebarFilter)
  const workspaceDir = useNoteStore((s) => s.workspaceDir)
  const createNote = useNoteStore((s) => s.createNote)
  const createFolder = useNoteStore((s) => s.createFolder)
  const importFile = useNoteStore((s) => s.importFile)
  const refreshFileTree = useNoteStore((s) => s.refreshFileTree)
  const tags = useNoteStore((s) => s.tags)
  const tagColors = useNoteStore((s) => s.tagColors)
  const tagFilter = useNoteStore((s) => s.tagFilter)
  const setTagFilter = useNoteStore((s) => s.setTagFilter)

  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [error, setError] = useState('')

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭右键菜单
  useEffect(() => {
    if (!contextMenu) return
    const close = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [contextMenu])

  const handleTreeContextMenu = useCallback((e: React.MouseEvent) => {
    // 只在空白区域触发，如果点击的是文件节点则跳过（由 FileTreeNode 自行处理）
    const target = e.target as HTMLElement
    if (target.closest('[data-tree-node]')) return
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const fileTags of Object.values(tags)) {
      for (const t of fileTags) tagSet.add(t)
    }
    return Array.from(tagSet).sort()
  }, [tags])

  const filteredTree = useMemo(() => {
    let tree = fileTree
    // 标签筛选
    if (tagFilter) {
      tree = filterTreeByTag(tree, tagFilter, tags)
    }
    // 文件名搜索
    if (sidebarFilter) {
      tree = filterTree(tree, sidebarFilter.toLowerCase())
    }
    return tree
  }, [fileTree, sidebarFilter, tagFilter, tags])

  const handleNewFile = async () => {
    if (!newItemName.trim()) {
      setShowNewFileInput(false)
      setNewItemName('')
      return
    }
    try {
      setError('')
      await createNote(workspaceDir, newItemName.trim())
      setShowNewFileInput(false)
      setNewItemName('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }

  const handleNewFolder = async () => {
    if (!newItemName.trim()) {
      setShowNewFolderInput(false)
      setNewItemName('')
      return
    }
    try {
      setError('')
      await createFolder(workspaceDir, newItemName.trim())
      setShowNewFolderInput(false)
      setNewItemName('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }

  const handleImport = async () => {
    try {
      const paths = await dialog.open({
        properties: ['openFile', 'multiSelections'],
        title: '导入文件',
        filters: [{ name: '支持的文件', extensions: ['md', 'txt'] }]
      })
      if (paths && paths.length > 0) {
        await importFile(paths)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '导入失败')
    }
  }

  const openNewFileInput = () => {
    setShowNewFolderInput(false)
    setNewItemName('')
    setShowNewFileInput(true)
    setError('')
  }

  const openNewFolderInput = () => {
    setShowNewFileInput(false)
    setNewItemName('')
    setShowNewFolderInput(true)
    setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, confirm: () => void) => {
    if (e.key === 'Enter') confirm()
    if (e.key === 'Escape') {
      setShowNewFileInput(false)
      setShowNewFolderInput(false)
      setNewItemName('')
      setError('')
    }
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.title}>文件</span>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={openNewFileInput} title="新建笔记">
            <IconNewFile size={14} />
          </button>
          <button className={styles.actionBtn} onClick={openNewFolderInput} title="新建文件夹">
            <IconNewFolder size={14} />
          </button>
          <button className={styles.actionBtn} onClick={handleImport} title="导入文件">
            <IconImport size={14} />
          </button>
          <button className={styles.actionBtn} onClick={refreshFileTree} title="刷新">
            <IconRefresh size={14} />
          </button>
        </div>
      </div>

      <div className={styles.search}>
        <div className={styles.searchWrapper}>
          <IconSearch size={12} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="搜索文件..."
            value={sidebarFilter}
            onChange={(e) => setSidebarFilter(e.target.value)}
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className={styles.tagFilterBar}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.tagFilterChip} ${tagFilter === tag ? styles.active : ''}`}
              onClick={() => setTagFilter(tag)}
            >
              <span
                className={styles.tagFilterDot}
                style={{ backgroundColor: tagColors[tag] || '#999' }}
              />
              {tag}
            </button>
          ))}
        </div>
      )}

      {(showNewFileInput || showNewFolderInput) && (
        <div className={styles.newItemRow}>
          <input
            className={styles.newItemInput}
            placeholder={showNewFileInput ? '笔记名称...' : '文件夹名称...'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, showNewFileInput ? handleNewFile : handleNewFolder)}
            onBlur={showNewFileInput ? handleNewFile : handleNewFolder}
            autoFocus
          />
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tree} onContextMenu={handleTreeContextMenu}>
        {filteredTree.length === 0 ? (
          <div className={styles.empty}>{tagFilter ? '该标签下暂无文件' : '暂无文件'}</div>
        ) : (
          filteredTree.map((node) => <FileTreeNode key={node.path} node={node} level={0} />)
        )}

        {contextMenu && (
          <div
            ref={contextMenuRef}
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                setContextMenu(null)
                openNewFileInput()
              }}
            >
              <IconNewFile size={14} />
              <span>新建笔记</span>
            </button>
            <button
              onClick={() => {
                setContextMenu(null)
                openNewFolderInput()
              }}
            >
              <IconNewFolder size={14} />
              <span>新建文件夹</span>
            </button>
            <div className={styles.menuDivider} />
            <button
              onClick={() => {
                setContextMenu(null)
                refreshFileTree()
              }}
            >
              <IconRefresh size={14} />
              <span>刷新</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function filterTree(nodes: FileEntry[], filter: string): FileEntry[] {
  return nodes.reduce((acc: FileEntry[], node: FileEntry) => {
    if (node.type === 'directory') {
      const children = filterTree(node.children || [], filter)
      if (children.length > 0) {
        acc.push({ ...node, children })
      }
    } else if (node.name.toLowerCase().includes(filter)) {
      acc.push(node)
    }
    return acc
  }, [])
}

function filterTreeByTag(
  nodes: FileEntry[],
  tag: string,
  tags: Record<string, string[]>
): FileEntry[] {
  return nodes.reduce((acc: FileEntry[], node: FileEntry) => {
    if (node.type === 'directory') {
      const children = filterTreeByTag(node.children || [], tag, tags)
      if (children.length > 0) {
        acc.push({ ...node, children })
      }
    } else if ((tags[node.path] || []).includes(tag)) {
      acc.push(node)
    }
    return acc
  }, [])
}
