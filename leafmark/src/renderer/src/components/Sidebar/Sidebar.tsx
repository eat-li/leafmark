import { useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { dialog } from '../../api/electron'
import FileTreeNode from './FileTreeNode'
import {
  IconNewFile,
  IconNewFolder,
  IconImport,
  IconRefresh,
  IconSearch
} from '../Icons'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const {
    fileTree,
    sidebarFilter,
    setSidebarFilter,
    workspaceDir,
    createNote,
    createFolder,
    importFile,
    refreshFileTree
  } = useNoteStore()

  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [error, setError] = useState('')

  const filteredTree = sidebarFilter ? filterTree(fileTree, sidebarFilter.toLowerCase()) : fileTree

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
    } catch (e: any) {
      setError(e.message || '创建失败')
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
    } catch (e: any) {
      setError(e.message || '创建失败')
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
    } catch (e: any) {
      setError(e.message || '导入失败')
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

      <div className={styles.tree}>
        {filteredTree.length === 0 ? (
          <div className={styles.empty}>暂无文件</div>
        ) : (
          filteredTree.map((node) => <FileTreeNode key={node.path} node={node} level={0} />)
        )}
      </div>
    </div>
  )
}

function filterTree(nodes: any[], filter: string): any[] {
  return nodes.reduce((acc: any[], node: any) => {
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
