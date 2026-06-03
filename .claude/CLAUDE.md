# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发环境（Electron + Vite HMR）
pnpm build            # 类型检查 + 构建
pnpm build:win        # 构建 Windows 安装包
pnpm build:mac        # 构建 macOS 安装包
pnpm build:linux      # 构建 Linux 安装包
pnpm lint             # ESLint 检查
pnpm format           # Prettier 格式化
pnpm typecheck        # 类型检查（主进程 + 渲染进程）
pnpm typecheck:node   # 仅检查主进程/预加载类型
pnpm typecheck:web    # 仅检查渲染进程类型
```

注意：所有命令需在 `leafmark/` 目录下执行。

## 项目结构

仓库根目录包含 `leafmark/`（实际 Electron 应用）和 `plan.md`（迁移计划文档）。开发工作在 `leafmark/` 内进行。

## 技术栈

- **桌面框架**: Electron 39，使用 `electron-vite` 构建
- **前端**: React 19 + TypeScript，Vite 7 开发服务器
- **编辑器**: CodeMirror 6（`@codemirror/view`, `@codemirror/lang-markdown`）
- **Markdown 渲染**: `markdown-it` + `highlight.js`
- **数学公式**: KaTeX（支持 `$...$` 行内和 `$$...$$` 块级）
- **状态管理**: Zustand（`persist` 中间件持久化到 localStorage）
- **样式**: CSS Modules + CSS 自定义属性主题系统
- **包管理**: pnpm

## 架构

项目使用 Electron 三进程架构，通过 IPC 通信：

### 三层结构

```
src/main/           # 主进程（Node.js 环境）
  ├── index.ts      # BrowserWindow 创建、系统托盘、窗口控制
  └── ipc/
      └── fileHandlers.ts  # IPC 处理器：文件系统、对话框、窗口、剪贴板、Shell
src/preload/        # 预加载脚本（contextBridge）
  ├── index.ts      # 通过 contextBridge.exposeInMainWorld 暴露 electronAPI
  └── index.d.ts    # TypeScript 类型声明（window.electronAPI）
src/renderer/       # 渲染进程（React 应用）
  ├── index.html    # 入口 HTML，含 CSP 策略
  └── src/
      ├── main.tsx   # React 入口
      ├── App.tsx    # 根组件：布局组装 + 全局快捷键 + 主题 + 自动保存
      ├── api/electron.ts  # IPC 调用封装层（根据通道分组：fs/win/dialog/clipboard/appSettings/shell）
      ├── store/noteStore.ts  # Zustand 全局状态（文件树、标签页、主题、设置）
      ├── styles/global.css   # CSS 自定义属性主题系统（有机纸感设计）
      └── components/
          ├── TitleBar/     # 自定义标题栏（无边框窗口拖拽）
          ├── Sidebar/      # 文件树（FileTreeNode 递归组件）
          ├── Editor/       # CodeMirror 6 编辑器（含深浅双主题 + Compartment 动态字号）
          ├── Preview/      # markdown-it 渲染面板（支持本地图片 lazy base64 加载）
          ├── Toolbar/      # 格式插入工具栏（通过 insertFnRef 回调注入编辑器）
          ├── TabBar/       # 多标签页管理
          ├── StatusBar/    # 底部状态栏
          ├── Search/       # 全屏搜索面板
          └── Settings/     # 设置面板（主题/字号/自动保存/托盘等）
```

### 数据流

1. **渲染进程调用** → `api/electron.ts`（按通道分组：`fs`/`win`/`dialog`/`clipboard`/`appSettings`/`shell`）
2. **IPC 通道** → 字符串命名约定：`fs:readFile`, `win:minimize`, `dialog:open` 等
3. **主进程处理** → `ipc/fileHandlers.ts` 中通过 `ipcMain.handle()` 注册
4. **预加载桥接** → `preload/index.ts` 中的 `contextBridge.exposeInMainWorld`

### Zustand Store 核心状态

单一 store（`useNoteStore`），用 `zustand/middleware/persist` 持久化到 `localStorage`（key: `leafmark-storage`）。持久化字段：`theme`, `fontSize`, `viewMode`, `sidebarVisible`, `workspaceDir`, `autoSave`, `autoSaveInterval`, `closeToTray`。不持久化：`fileTree`, `openTabs`, `activeTabPath` 等运行时状态。

### 编辑器数据流

- `activeTab.content` 变化 → 编辑器通过 `useEffect` 检测差异 → `view.dispatch` 全量替换文档
- 编辑器内容变更 → `EditorView.updateListener` → `updateContent` action → 更新 store 中的 tab.content 和 modified 标记
- `isInternalUpdate` ref 用于防止外部更新触发的循环（store → editor → store）
- 工具栏格式插入 → `insertFnRef` 回调（从 `EditorPanel` 向上传递到 `App`，再传给 `Toolbar`）

### 主题系统

- CSS 自定义属性定义在 `styles/global.css`（`:root` 和 `[data-theme="dark"]`）
- `data-theme` 属性由 `App.tsx` 的 `useEffect` 根据 `theme` 状态设置到 `document.documentElement`
- `theme === 'system'` 时监听 `prefers-color-scheme` 媒体查询
- CodeMirror 有两套独立主题（`leafmarkLightTheme` + `leafmarkLightHighlight`, `oneDark` + `leafmarkDarkTheme`），通过 `isDark` memo 切换

### 工作区模式

应用在 `Documents/LeafMark Notes` 下操作，作为单工作区编辑器。文件树仅显示 `.md` 文件，目录优先排序。
