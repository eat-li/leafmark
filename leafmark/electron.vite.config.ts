import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: 'esbuild',
      // 主进程不需要 sourcemap（减小体积 + 避免源码泄露）
      sourcemap: false,
      rollupOptions: {
        output: {
          // 固定文件名，避免每次构建产生不同 hash
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js'
        }
      }
    }
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js'
        }
      }
    }
  },

  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      // Electron 39 内置 Chromium 134 — 无需向下兼容，大幅减小转译体积
      target: 'chrome134',
      minify: 'esbuild',
      sourcemap: false,
      // 小于 8KB 的资源内联为 base64，减少文件 I/O
      assetsInlineLimit: 8192,
      // CSS 压缩与代码分割
      cssMinify: true,
      cssCodeSplit: true,
      // 关闭压缩体积报告（终端输出更干净，构建略快）
      reportCompressedSize: false,
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html')
        },
        // 激进 tree-shaking：对第三方库做更彻底的死代码消除
        treeshake: 'recommended',
        output: {
          // 短哈希 (8位) — 减少文件名体积且足够区分
          entryFileNames: 'assets/[name]-[hash:8].js',
          chunkFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8].[ext]',
          // 函数式分包：自动将 node_modules 按类别拆分，优于写死的名单
          manualChunks(id) {
            // React 全家桶（含 scheduler）
            if (id.includes('node_modules/react') ||
                id.includes('node_modules/react-dom') ||
                id.includes('node_modules/scheduler')) {
              return 'vendor-react'
            }
            // CodeMirror 编辑器核心（体积最大，独立分包避免影响首屏）
            if (id.includes('node_modules/@codemirror') ||
                id.includes('node_modules/@lezer') ||
                id.includes('node_modules/codemirror') ||
                id.includes('node_modules/crelt') ||
                id.includes('node_modules/style-mod')) {
              return 'vendor-codemirror'
            }
            // Markdown 渲染 + 代码高亮
            if (id.includes('node_modules/markdown-it') ||
                id.includes('node_modules/highlight.js') ||
                id.includes('node_modules/entities') ||
                id.includes('node_modules/linkify-it') ||
                id.includes('node_modules/mdurl') ||
                id.includes('node_modules/uc.micro')) {
              return 'vendor-render'
            }
            // KaTeX 数学公式（仅预览面板使用，独立分包可延迟加载）
            if (id.includes('node_modules/katex')) {
              return 'vendor-katex'
            }
            // Zustand 状态管理
            if (id.includes('node_modules/zustand')) {
              return 'vendor-store'
            }
            // 其余零散 node_modules 合并为一个 chunk
            if (id.includes('node_modules')) {
              return 'vendor-common'
            }
            // 应用代码不单独分包，让 Rollup 自动处理
            return undefined
          }
        }
      },
      chunkSizeWarningLimit: 800
    },
    css: {
      modules: {
        // 生产环境用短哈希
        generateScopedName: '[hash:base64:8]'
      }
    }
  }
})
