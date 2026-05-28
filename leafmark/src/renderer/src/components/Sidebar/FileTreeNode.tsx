import { useState } from 'react'
import type { FileEntry } from '../../store/noteStore'
import { useNoteStore } from '../../store/noteStore'
import {
  IconChevronDown,
  IconChevronRight,
  IconFile
} from '../Icons'
import styles from './FileTreeNode.module.css'

interface FileTreeNodeProps {
  node: FileEntry
  level: number
}

export default function FileTreeNode({ node, level }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2)
  const [showMenu, setShowMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(node.name)
  const [inputMode, setInputMode] = useState<'file' | 'folder' | null>(null)
  const [inputValue, setInputValue] = useState('')
  const { openFile, activeTabPath, createNote, createFolder, deleteItem, renameItem } = useNoteStore()

  const isActive = activeTabPath === node.path

  const handleClick = () => {
    if (node.type === 'directory') {
      setExpanded(!expanded)
    } else {
      openFile(node.path, node.name)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(true)
    const close = () => {
      setShowMenu(false)
      document.removeEventListener('click', close)
    }
    setTimeout(() => document.addEventListener('click', close), 0)
  }

  const handleRename = () => {
    setRenaming(true)
    setShowMenu(false)
  }

  const handleRenameConfirm = async () => {
    if (newName && newName !== node.name) {
      try {
        await renameItem(node.path, newName)
      } catch (e: any) {
        alert(e.message || '重命名失败')
      }
    }
    setRenaming(false)
  }

  const handleDelete = async () => {
    setShowMenu(false)
    if (confirm(`确定删除 "${node.name}" 吗？`)) {
      try {
        await deleteItem(node.path)
      } catch (e: any) {
        alert(e.message || '删除失败')
      }
    }
  }

  const startNewFile = () => {
    setShowMenu(false)
    setInputValue('')
    setInputMode('file')
    setExpanded(true)
  }

  const startNewFolder = () => {
    setShowMenu(false)
    setInputValue('')
    setInputMode('folder')
    setExpanded(true)
  }

  const handleInputConfirm = async () => {
    if (!inputValue.trim()) {
      setInputMode(null)
      return
    }
    try {
      if (inputMode === 'file') {
        await createNote(node.path, inputValue.trim())
      } else {
        await createFolder(node.path, inputValue.trim())
      }
    } catch (e: any) {
      alert(e.message || '创建失败')
    }
    setInputMode(null)
    setInputValue('')
  }

  return (
    <div>
      <div
        className={`${styles.node} ${isActive ? styles.active : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className={styles.icon}>
          {node.type === 'directory' ? (
            expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />
          ) : (
            <IconFile size={14} />
          )}
        </span>
        {renaming ? (
          <input
            className={styles.renameInput}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm()
              if (e.key === 'Escape') setRenaming(false)
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={styles.name}>{node.name}</span>
        )}

        {showMenu && (
          <div className={styles.contextMenu}>
            {node.type === 'directory' && (
              <>
                <button onClick={startNewFile}>新建笔记</button>
                <button onClick={startNewFolder}>新建文件夹</button>
                <div className={styles.menuDivider} />
              </>
            )}
            <button onClick={handleRename}>重命名</button>
            <button onClick={handleDelete} className={styles.danger}>删除</button>
          </div>
        )}
      </div>

      {node.type === 'directory' && expanded && (
        <>
          {inputMode && (
            <div
              className={styles.inputRow}
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
            >
              <input
                className={styles.inlineInput}
                placeholder={inputMode === 'file' ? '笔记名称...' : '文件夹名称...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInputConfirm()
                  if (e.key === 'Escape') setInputMode(null)
                }}
                onBlur={handleInputConfirm}
                autoFocus
              />
            </div>
          )}
          {node.children?.map((child) => (
            <FileTreeNode key={child.path} node={child} level={level + 1} />
          ))}
        </>
      )}
    </div>
  )
}
