import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: 'esbuild',
      sourcemap: false,
      // 主进程单入口，内联动态导入避免额外 chunk 文件 I/O
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          inlineDynamicImports: true
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
          chunkFileNames: '[name].js',
          inlineDynamicImports: true
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

    // 开发阶段：预打包重型依赖，避免启动时反复重建
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand', 'markdown-it', 'katex'],
      // CodeMirror 和 highlight.js 按需加载，不参与预打包
      exclude: ['@codemirror/language-data']
    },

    build: {
      // Electron 39 = Chromium 134，无需向下兼容
      target: 'chrome134',
      cssTarget: 'chrome134',
      minify: 'esbuild',
      sourcemap: false,
      // Electron 环境不需要 module preload polyfill
      modulePreload: false,
      // 小于 4KB 的资源内联为 base64（减少文件 I/O 次数）
      assetsInlineLimit: 4096,
      cssMinify: true,
      reportCompressedSize: false,
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html')
        },
        treeshake: 'recommended',
        output: {
          entryFileNames: 'assets/[name]-[hash:8].js',
          chunkFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8].[ext]',
          manualChunks(id) {
            // React 全家桶
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')
            ) {
              return 'vendor-react'
            }
            // CodeMirror 编辑器核心
            if (
              id.includes('node_modules/@codemirror') ||
              id.includes('node_modules/@lezer') ||
              id.includes('node_modules/codemirror') ||
              id.includes('node_modules/crelt') ||
              id.includes('node_modules/style-mod')
            ) {
              return 'vendor-codemirror'
            }
            // Markdown 渲染 + 代码高亮
            if (
              id.includes('node_modules/markdown-it') ||
              id.includes('node_modules/highlight.js') ||
              id.includes('node_modules/entities') ||
              id.includes('node_modules/linkify-it') ||
              id.includes('node_modules/mdurl') ||
              id.includes('node_modules/uc.micro')
            ) {
              return 'vendor-render'
            }
            // KaTeX 数学公式（独立分包，可延迟加载）
            if (id.includes('node_modules/katex')) {
              return 'vendor-katex'
            }
            // Zustand 状态管理
            if (id.includes('node_modules/zustand')) {
              return 'vendor-store'
            }
            // 其余 node_modules
            if (id.includes('node_modules')) {
              return 'vendor-common'
            }
            return undefined
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    css: {
      modules: {
        generateScopedName: '[hash:base64:8]'
      }
    }
  }
})
