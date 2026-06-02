/**
 * 模板工具 — 变量替换 + 文件系统操作
 *
 * 变量语法：{{变量名}}
 * 未识别的变量保留原样，不报错。
 *
 * 模板存储在工作区 .leafmark/templates/ 下，本质是普通 .md 文件。
 */

import { fs } from '../api/electron'
import { BUILT_IN_TEMPLATES } from './builtInTemplates'

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const TEMPLATES_DIR_NAME = '.leafmark/templates'

export interface TemplateInfo {
  name: string
  content: string
}

// ---------- 变量替换 ----------

/** 获取内置变量集合 */
export function getBuiltInVars(title: string): Record<string, string> {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return {
    title,
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    datetime: `${year}-${month}-${day} ${hours}:${minutes}`,
    year,
    month,
    day,
    weekday: WEEKDAYS[now.getDay()]
  }
}

/** 将模板中的 {{变量名}} 替换为实际值 */
export function applyTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return vars[key] ?? `{{${key}}}`
  })
}

// ---------- 模板文件操作 ----------

/** 获取模板目录路径 */
function getTemplatesDir(workspaceDir: string): string {
  return `${workspaceDir}/${TEMPLATES_DIR_NAME}`
}

/**
 * 确保内置模板已写入模板目录。
 * 仅在模板文件不存在时写入，不覆盖用户修改。
 */
export async function ensureBuiltInTemplates(workspaceDir: string): Promise<void> {
  const dir = getTemplatesDir(workspaceDir)
  await fs.createFolder(dir)
  for (const tpl of BUILT_IN_TEMPLATES) {
    const filePath = `${dir}/${tpl.name}.md`
    const exists = await fs.pathExists(filePath)
    if (!exists) {
      await fs.writeFile(filePath, tpl.content)
    }
  }
}

/** 加载所有模板（内置 + 自定义） */
export async function loadTemplates(workspaceDir: string): Promise<TemplateInfo[]> {
  const dir = getTemplatesDir(workspaceDir)
  const exists = await fs.pathExists(dir)
  if (!exists) return []

  const entries = await fs.readDirTree(dir, 1)
  const templates: TemplateInfo[] = []

  for (const entry of entries) {
    if (entry.type === 'file' && entry.name.endsWith('.md')) {
      try {
        const content = await fs.readFile(entry.path)
        const name = entry.name.replace(/\.md$/, '')
        templates.push({ name, content })
      } catch {
        // 跳过读取失败的模板
      }
    }
  }

  return templates
}

/** 将当前文件保存为模板 */
export async function saveAsTemplate(
  workspaceDir: string,
  templateName: string,
  content: string
): Promise<void> {
  const dir = getTemplatesDir(workspaceDir)
  await fs.createFolder(dir)
  const filePath = `${dir}/${templateName}.md`
  await fs.writeFile(filePath, content)
}

/** 欢迎笔记模板内容 */
export const WELCOME_NOTE_CONTENT = `# 欢迎使用 LeafMark 🍃

> {{date}} · 这是你的第一篇笔记

LeafMark 是一款简洁的桌面 Markdown 编辑器，以下是一些快速上手提示。

## 快捷键速查

### 文件操作

| 快捷键 | 功能 |
|--------|------|
| Ctrl+N | 新建笔记 |
| Ctrl+O | 打开文件 |
| Ctrl+S | 保存当前文件 |
| Ctrl+Shift+S | 保存所有文件 |

### 编辑

| 快捷键 | 功能 |
|--------|------|
| Ctrl+F | 在文件内查找 |
| Ctrl+H | 查找并替换 |
| Ctrl+Z | 撤销 |
| Ctrl+Y | 重做 |

### 视图

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+F | 全工作区搜索 |
| Ctrl+Shift+P | 命令面板 |
| Ctrl+Shift+H | 写作热力图 |

## 快速开始

1. 在左侧文件树中管理你的笔记
2. 使用工具栏按钮或快捷键插入 Markdown 格式
3. 按 Ctrl+N 新建笔记时可以选择模板
4. 右键文件可以保存为模板，方便复用

## 模板功能

创建新笔记时（Ctrl+N），可以从内置模板中选择：

- **日记** — 每日记录
- **会议记录** — 结构化会议纪要
- **读书笔记** — 阅读摘录与思考

你也可以把任意笔记保存为自定义模板。

---

> 这篇笔记可以随时删除。祝写作愉快 ✨
`
