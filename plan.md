# MD Editor 重构计划：Tauri + Vue → Electron + Vite + React

## 一、技术栈映射

| 维度 | 旧方案（Tauri + Vue） | 新方案（Electron + React） |
|---|---|---|
| 桌面框架 | Tauri 2（Rust 后端） | Electron（Node.js 后端） |
| 前端框架 | Vue 3 Composition API | React 18+ |
| 构建工具 | Vite + @vitejs/plugin-vue | Vite + @vitejs/plugin-react |
| 状态管理 | Pinia | Zustand（轻量、简洁、类 Pinia 体验） |
| 编辑器 | CodeMirror 6 | CodeMirror 6（保留不变） |
| Markdown 渲染 | markdown-it + highlight.js | markdown-it + highlight.js（保留不变） |
| 样式 | CSS Variables + 全局 CSS | CSS Modules + CSS Variables（保留变量体系） |
| 包管理 | pnpm | pnpm |
| 语言 | TypeScript | TypeScript |

**选型理由：**

- **Zustand**：API 极简，无 Provider 包裹，与 Pinia 的"单一 store"风格最为接近，迁移成本最低
- **CodeMirror 6 / markdown-it / highlight.js**：纯 JS 库，与框架无关，直接复用
- **CSS Variables + CSS Modules**：保留现有主题 token 体系，CSS Modules 提供 React 生态的样式隔离

---

## 二、项目初始化

### 2.1 创建项目骨架

```bash
pnpm create @quick-start/electron
pnpm add zustand codemirror @codemirror/lang-markdown @codemirror/language \
  @codemirror/language-data @codemirror/state @codemirror/theme-one-dark \
  @codemirror/view markdown-it highlight.js
```

### 2.2 目标目录结构

```
md-editor-react/
├── electron/
│   ├── main.ts                    # Electron 主进程
│   ├── preload.ts                 # 预加载脚本（暴露 IPC API）
│   └── ipc/
│       └── fileHandlers.ts        # 文件系统 IPC handlers（替代 Rust commands）
├── src/
│   ├── main.tsx                   # React 入口
│   ├── App.tsx                    # 主应用根组件
│   ├── StickyApp.tsx              # 便签窗口根组件
│   ├── api/
│   │   └── electron.ts            # IPC 调用封装层（替代 tauri.ts）
│   ├── hooks/
│   │   └── useDialog.ts           # 弹窗 Hook（替代 useDialog composable）
│   ├── store/
│   │   └── noteStore.ts           # Zustand Store（替代 Pinia note.ts）
│   ├── styles/
│   │   └── global.css             # 全局样式 + 主题系统（直接复用）
│   └── components/
│       ├── TitleBar/
│       │   ├── TitleBar.tsx
│       │   └── TitleBar.module.css
│       ├── Sidebar/
│       │   ├── Sidebar.tsx
│       │   ├── Sidebar.module.css
│       │   ├── FileTreeNode.tsx
│       │   └── FileTreeNode.module.css
│       ├── Toolbar/
│       │   ├── Toolbar.tsx
│       │   └── Toolbar.module.css
│       ├── Editor/
│       │   ├── EditorPanel.tsx
│       │   └── EditorPanel.module.css
│       ├── Preview/
│       │   ├── PreviewPanel.tsx
│       │   └── PreviewPanel.module.css
│       ├── TabBar/
│       │   ├── TabBar.tsx
│       │   └── TabBar.module.css
│       ├── StatusBar/
│       │   ├── StatusBar.tsx
│       │   └── StatusBar.module.css
│       ├── Search/
│       │   ├── SearchPanel.tsx
│       │   └── SearchPanel.module.css
│       ├── Settings/
│       │   ├── SettingsPanel.tsx
│       │   └── SettingsPanel.module.css
│       └── Dialog/
│           ├── DialogContainer.tsx
│           └── DialogContainer.module.css
├── index.html
├── sticky.html                    # 便签窗口独立入口
├── vite.config.ts
├── tsconfig.json
├── electron-builder.json
└── package.json
```

---

## 三、分步实施计划

### Phase 1：Electron 主进程 + IPC 通道（替代 Tauri 后端）

#### 3.1 `electron/main.ts` — 主进程

实现内容：

- `BrowserWindow` 创建（1200x800，minWidth 800，minHeight 600，frame: false 自定义标题栏）
- 加载 Vite dev server URL 或打包后的 index.html
- 便签窗口创建：`new BrowserWindow({ width: 360, height: 400, frame: false, alwaysOnTop: true })`，加载 sticky.html
- 系统托盘：关闭到托盘行为
- 全局快捷键注册：`globalShortcut.register()`
- 开机自启：`app.setLoginItemSettings()`

#### 3.2 `electron/preload.ts` — 预加载脚本

通过 `contextBridge.exposeInMainWorld` 暴露 API：

```typescript
window.electronAPI = {
  // 文件系统操作（对应原 Tauri Commands）
  readDirTree: (dirPath, depth?) => ipcRenderer.invoke('fs:readDirTree', dirPath, depth),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),
  createFolder: (folderPath) => ipcRenderer.invoke('fs:createFolder', folderPath),
  deletePath: (path) => ipcRenderer.invoke('fs:deletePath', path),
  renamePath: (oldPath, newPath) => ipcRenderer.invoke('fs:renamePath', oldPath, newPath),
  pathExists: (path) => ipcRenderer.invoke('fs:pathExists', path),
  getDocumentsDir: () => ipcRenderer.invoke('fs:getDocumentsDir'),

  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke('win:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('win:maximize'),
  closeWindow: () => ipcRenderer.invoke('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('win:setAlwaysOnTop', flag),
  startDragging: () => ipcRenderer.invoke('win:startDragging'),

  // 便签窗口
  createStickyWindow: (filePath) => ipcRenderer.invoke('sticky:create', filePath),
  onStickyClosed: (callback) => ipcRenderer.on('sticky-closed', (_, path) => callback(path)),

  // 对话框
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:open', options),

  // 全局快捷键
  registerGlobalShortcut: (accelerator) => ipcRenderer.invoke('shortcut:register', accelerator),

  // 开机自启
  setAutoLaunch: (enabled) => ipcRenderer.invoke('app:setAutoLaunch', enabled),
}
```

#### 3.3 `electron/ipc/fileHandlers.ts` — 文件系统 IPC 处理

用 Node.js `fs` / `fs-extra` 替代 Rust 实现全部 9 个文件操作：

- `readDirTree`：递归读取目录，跳过 `.` 开头隐藏文件，目录优先+字母排序
- `readFile`：`fs.readFileSync(path, 'utf-8')`
- `writeFile`：`fs.writeFileSync`（自动 `fs.mkdirSync(dirname, { recursive: true })`）
- `createFile`：存在则报错，否则 `fs.writeFileSync(path, '')`
- `createFolder`：`fs.mkdirSync(path, { recursive: true })`
- `deletePath`：`fs.statSync` 判断文件/目录，分别 `unlinkSync` / `rmSync(recursive: true)`
- `renamePath`：`fs.renameSync`
- `pathExists`：`fs.existsSync`
- `getDocumentsDir`：`path.join(app.getPath('documents'), 'MD Editor Notes')`，不存在则创建

---

### Phase 2：前端状态管理迁移（Pinia → Zustand）

#### 3.4 `src/store/noteStore.ts`

```typescript
import { create } from 'zustand'

interface OpenTab {
  path: string
  name: string
  content: string
  originalContent: string
  modified: boolean
}

type ViewMode = 'edit' | 'split' | 'preview'

interface NoteState {
  // --- 所有 State ---
  workspaceDir: string
  fileTree: FileEntry[]
  openTabs: OpenTab[]
  activeTabPath: string
  theme: 'light' | 'dark' | 'system'
  sidebarVisible: boolean
  fontSize: number
  viewMode: ViewMode
  sidebarFilter: string
  showSettings: boolean
  // ... 其余设置项

  // --- Computed（Zustand 用 getter 实现） ---
  activeTab: () => OpenTab | undefined
  filteredFileTree: () => FileEntry[]

  // --- Methods ---
  initWorkspace: () => Promise<void>
  refreshFileTree: () => Promise<void>
  openFile: (path: string, name: string) => Promise<void>
  updateContent: (path: string, content: string) => void
  saveFile: (path?: string) => Promise<void>
  closeTab: (path: string) => void
  createNote: (dirPath: string, fileName: string) => Promise<void>
  createFolder: (dirPath: string, folderName: string) => Promise<void>
  importFile: () => Promise<void>
  deleteItem: (path: string) => Promise<void>
  addStickyNote: () => Promise<void>
  toggleTheme: () => void
  toggleSidebar: () => void
  changeFontSize: (delta: number) => void
}
```

迁移要点：

- Pinia 的 `ref()` / `computed()` → Zustand 的 `get()` / `set()`
- Pinia 的 `store.$patch()` → Zustand 的 `set({ ... })`
- `editorInsert` 回调从 store 移到 React ref 或 context 中管理
- localStorage 持久化可通过 `zustand/middleware/persist` 实现

---

### Phase 3：组件逐个迁移（Vue SFC → React FC）

#### 3.5 迁移顺序（从叶子到根，按依赖关系）

**第一批：无状态 / 纯展示组件**

| 旧组件 | 新组件 | 迁移要点 |
|---|---|---|
| `DialogContainer.vue` | `DialogContainer.tsx` | Vue `v-if/v-for` → React 条件渲染/`.map()`；`useDialog` composable → React Hook + Context |
| `StatusBar.vue` | `StatusBar.tsx` | 纯展示 + store 读取，直接映射 |
| `TabBar.vue` | `TabBar.tsx` | `v-for` tabs → `.map()`；点击/关闭事件处理 |

**第二批：编辑器核心**

| 旧组件 | 新组件 | 迁移要点 |
|---|---|---|
| `EditorPanel.vue` | `EditorPanel.tsx` | CodeMirror 6 初始化从 `onMounted` → `useRef` + `useEffect`；`watch` → `useEffect` 依赖数组；`isInternalUpdate` 标志保留 |
| `PreviewPanel.vue` | `PreviewPanel.tsx` | `computed` → `useMemo`；markdown-it 实例用 `useRef` 缓存 |
| `Toolbar.vue` | `Toolbar.tsx` | 视图切换 + 格式插入，简单映射 |

**第三批：交互复杂组件**

| 旧组件 | 新组件 | 迁移要点 |
|---|---|---|
| `FileTreeNode.vue` | `FileTreeNode.tsx` | Vue 递归组件 → React 递归组件；右键菜单用 `onContextMenu` + 状态控制 |
| `Sidebar.vue` | `Sidebar.tsx` | `v-model` 搜索框 → `useState` + onChange；文件树递归渲染 |
| `SearchPanel.vue` | `SearchPanel.tsx` | 全屏遮罩 + 异步搜索逻辑；Vue `v-model` → React 受控输入 |
| `SettingsPanel.vue` | `SettingsPanel.tsx` | 多组设置项 + Toggle Switch；Vue `v-model` → React 受控组件 |

**第四批：根组件**

| 旧组件 | 新组件 | 迁移要点 |
|---|---|---|
| `TitleBar.vue` | `TitleBar.tsx` | 窗口拖动 + 控制按钮调用 `window.electronAPI` |
| `App.vue` | `App.tsx` | 布局组装 + 快捷键监听 (`useEffect` + `addEventListener`) |
| `StickyApp.vue` | `StickyApp.tsx` | 便签窗口逻辑，textarea + 防抖保存 |

#### 3.6 Vue → React 语法映射速查

| Vue 概念 | React 等价 |
|---|---|
| `<template>` | JSX 返回 |
| `ref()` / `reactive()` | `useState()` / `useRef()` |
| `computed()` | `useMemo()` |
| `watch()` / `watchEffect()` | `useEffect()` |
| `onMounted()` | `useEffect(() => {}, [])` |
| `onUnmounted()` | `useEffect(() => { return () => {} }, [])` |
| `v-model` | `value` + `onChange` 受控模式 |
| `v-if` | `&&` / 三元表达式 |
| `v-for` | `.map()` |
| `@click` | `onClick` |
| `@keydown` | `onKeyDown` |
| `props` | 函数参数 `props` / 解构 |
| `emit()` | 回调 props `onXxx` |
| `provide/inject` | `React.Context` |
| CSS scoped | CSS Modules (`.module.css`) |
| composable | 自定义 Hook (`useXxx`) |

---

### Phase 4：构建配置

#### 3.7 `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: { outDir: 'dist-electron' }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) { args.reload() },
        vite: {
          build: { outDir: 'dist-electron' }
        }
      }
    ]),
    electronRenderer(),
  ],
  build: {
    outDir: 'dist',
  }
})
```

#### 3.8 `electron-builder.json`（打包配置）

```json
{
  "appId": "com.mdeditor.editor",
  "productName": "MD Editor",
  "directories": { "output": "release" },
  "files": ["dist", "dist-electron"],
  "win": {
    "target": "nsis",
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

---

## 四、数据与配置持久化策略

| 数据 | 旧方案 | 新方案 |
|---|---|---|
| 主题/字号偏好 | localStorage | `electron-store` 或 JSON 文件 + localStorage |
| 工作区目录 | Tauri `app.getPath('documents')` | Electron `app.getPath('documents')` |
| 全局快捷键 | Tauri 全局快捷键 | Electron `globalShortcut.register()` |
| 开机自启 | Tauri 插件 | Electron `app.setLoginItemSettings()` |
| 文件对话框 | `@tauri-apps/plugin-dialog` | Electron `dialog.showOpenDialog()` |
| 系统托盘 | Tauri 托盘 | Electron `Tray` |

---

## 五、测试验证清单

完成迁移后逐一验证：

- [ ] 主窗口创建与显示（1200x800，自定义标题栏可拖动）
- [ ] 工作区初始化（自动创建 `Documents/MD Editor Notes`）
- [ ] 文件树读取与展示（目录优先、字母排序、隐藏文件过滤）
- [ ] 新建笔记 / 新建文件夹 / 删除 / 重命名
- [ ] 文件导入（同名加 `_导入` 后缀）
- [ ] CodeMirror 编辑器加载、输入、语法高亮
- [ ] 分栏预览实时同步（编辑/分栏/预览三模式切换）
- [ ] 多标签页：打开、切换、关闭、未保存标记
- [ ] 保存：Ctrl+S 保存到磁盘
- [ ] 全局搜索：Ctrl+F，全文搜索 + 点击跳转
- [ ] 主题切换：亮色/暗色/跟随系统
- [ ] 字号调节：10-24px 范围滑块
- [ ] 工具栏格式插入：粗体、斜体、标题、引用、代码、链接、图片、列表
- [ ] 便签窗口：新建、打开、置顶、防抖自动保存、关闭同步
- [ ] 设置面板：所有开关、目录选择、快捷键录制
- [ ] 弹窗系统：confirm / prompt / alert + Enter/ESC 快捷操作
- [ ] 关闭到托盘 + 托盘图标点击恢复
- [ ] 打包构建：生成 Windows 安装包

---

## 六、注意事项

1. **CodeMirror 6 是框架无关的**，核心编辑器逻辑几乎不需要改，只需把 Vue 的生命周期映射到 React 的 `useEffect` + `useRef`
2. **样式体系（CSS Variables）完全保留**，只需把 Vue 的 `<style scoped>` 拆成 CSS Modules，全局 `global.css` 直接复制
3. **便签窗口**在 Electron 中通过创建第二个 `BrowserWindow` 实现，用 `ipcMain` / `ipcRenderer` 通信替代 Tauri 的 WebviewWindow 事件
4. **窗口无边框**（`frame: false`）后需要自己实现标题栏拖动，用 `-webkit-app-region: drag` CSS 属性
5. **迁移过程中保持功能 1:1 对应**，不引入新功能，不重构已有逻辑，只做技术栈替换
