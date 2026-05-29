import { memo, useState, useCallback, useMemo } from 'react'
import type { FileEntry } from '../../store/noteStore'
import { useNoteStore } from '../../store/noteStore'
import { shell } from '../../api/electron'
import { IconChevronDown, IconChevronRight, IconFile } from '../Icons'
import styles from './FileTreeNode.module.css'

interface FileTreeNodeProps {
  node: FileEntry
  level: number
}

const EMPTY_TAGS: string[] = []

function FileTreeNode({ node, level }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2)
  const [showMenu, setShowMenu] = useState(false)
  const [showTagPanel, setShowTagPanel] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(node.name)
  const [inputMode, setInputMode] = useState<'file' | 'folder' | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [newTagInput, setNewTagInput] = useState('')

  const isActive = useNoteStore((s) => s.activeTabPath === node.path)
  const fileTags = useNoteStore((s) => s.tags[node.path] || EMPTY_TAGS)
  const tagColors = useNoteStore((s) => s.tagColors)
  const allTags = useMemo(() => {
    const store = useNoteStore.getState()
    const tagSet = new Set<string>()
    for (const tags of Object.values(store.tags)) {
      for (const t of tags) tagSet.add(t)
    }
    return Array.from(tagSet)
  }, [])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setShowTagPanel(false)
  }, [])

  const handleClick = useCallback(() => {
    if (node.type === 'directory') {
      setExpanded((prev) => !prev)
    } else {
      useNoteStore.getState().openFile(node.path, node.name)
    }
  }, [node.path, node.type, node.name])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(true)
    setShowTagPanel(false)
    const close = () => {
      setShowMenu(false)
      setShowTagPanel(false)
      document.removeEventListener('click', close)
    }
    setTimeout(() => document.addEventListener('click', close), 0)
  }, [])

  const handleRename = useCallback(() => {
    setRenaming(true)
    closeMenu()
  }, [closeMenu])

  const handleRenameConfirm = useCallback(async () => {
    if (newName && newName !== node.name) {
      try {
        await useNoteStore.getState().renameItem(node.path, newName)
      } catch (e: any) {
        alert(e.message || '重命名失败')
      }
    }
    setRenaming(false)
  }, [newName, node.path, node.name])

  const handleDelete = useCallback(async () => {
    closeMenu()
    if (confirm(`确定删除 "${node.name}" 吗？`)) {
      try {
        await useNoteStore.getState().deleteItem(node.path)
      } catch (e: any) {
        alert(e.message || '删除失败')
      }
    }
  }, [node.name, node.path, closeMenu])

  const startNewFile = useCallback(() => {
    closeMenu()
    setInputValue('')
    setInputMode('file')
    setExpanded(true)
  }, [closeMenu])

  const startNewFolder = useCallback(() => {
    closeMenu()
    setInputValue('')
    setInputMode('folder')
    setExpanded(true)
  }, [closeMenu])

  const handleInputConfirm = useCallback(async () => {
    if (!inputValue.trim()) {
      setInputMode(null)
      return
    }
    try {
      if (inputMode === 'file') {
        await useNoteStore.getState().createNote(node.path, inputValue.trim())
      } else {
        await useNoteStore.getState().createFolder(node.path, inputValue.trim())
      }
    } catch (e: any) {
      alert(e.message || '创建失败')
    }
    setInputMode(null)
    setInputValue('')
  }, [inputValue, inputMode, node.path])

  const handleOpenTagPanel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    setShowTagPanel(true)
  }, [])

  const handleAddTag = useCallback(
    (tagName: string) => {
      const name = tagName.trim()
      if (!name) return
      useNoteStore.getState().addTag(node.path, name)
      setNewTagInput('')
    },
    [node.path]
  )

  const handleRemoveTag = useCallback(
    (tagName: string) => {
      useNoteStore.getState().removeTag(node.path, tagName)
    },
    [node.path]
  )

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && newTagInput.trim()) {
        handleAddTag(newTagInput)
      }
      if (e.key === 'Escape') {
        setShowTagPanel(false)
        setNewTagInput('')
      }
    },
    [newTagInput, handleAddTag]
  )

  // 已有标签中过滤掉当前文件已有的
  const suggestedTags = allTags.filter((t) => !fileTags.includes(t))

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
            expanded ? (
              <IconChevronDown size={12} />
            ) : (
              <IconChevronRight size={12} />
            )
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

        {fileTags.length > 0 && (
          <span className={styles.tagDots}>
            {fileTags.map((tag) => (
              <span
                key={tag}
                className={styles.tagDot}
                style={{ backgroundColor: tagColors[tag] || '#999' }}
                title={tag}
              />
            ))}
          </span>
        )}

        {showMenu && (
          <div className={styles.contextMenu}>
            <button
              onClick={() => {
                closeMenu()
                shell.openPath(node.path)
              }}
            >
              用系统应用打开
            </button>
            <div className={styles.menuDivider} />
            {node.type === 'directory' && (
              <>
                <button onClick={startNewFile}>新建笔记</button>
                <button onClick={startNewFolder}>新建文件夹</button>
                <div className={styles.menuDivider} />
              </>
            )}
            <button onClick={handleOpenTagPanel}>标签</button>
            <div className={styles.menuDivider} />
            <button onClick={handleRename}>重命名</button>
            <button onClick={handleDelete} className={styles.danger}>
              删除
            </button>
          </div>
        )}

        {showTagPanel && (
          <div className={styles.tagPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.tagPanelTitle}>标签管理</div>

            {fileTags.length > 0 &&
              fileTags.map((tag) => (
                <div key={tag} className={styles.tagChip}>
                  <span
                    className={styles.tagChipDot}
                    style={{ backgroundColor: tagColors[tag] || '#999' }}
                  />
                  <span className={styles.tagName}>{tag}</span>
                  <button
                    className={styles.tagRemove}
                    onClick={() => handleRemoveTag(tag)}
                    title="移除标签"
                  >
                    ×
                  </button>
                </div>
              ))}

            <input
              className={styles.tagInput}
              placeholder="输入标签名，回车添加..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              autoFocus
            />

            {suggestedTags.length > 0 && (
              <div className={styles.tagSuggestions}>
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    className={styles.tagSuggestion}
                    onClick={() => handleAddTag(tag)}
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
          </div>
        )}
      </div>

      {node.type === 'directory' && expanded && (
        <>
          {inputMode && (
            <div className={styles.inputRow} style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}>
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

export default memo(FileTreeNode)
