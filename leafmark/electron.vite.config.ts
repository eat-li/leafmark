import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: 'esbuild'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: 'esbuild'
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
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            // 将 React 相关库打包到一起
            'vendor-react': ['react', 'react-dom'],
            // 将 CodeMirror 相关库独立分包（体积最大）
            'vendor-codemirror': [
              '@codemirror/view',
              '@codemirror/state',
              '@codemirror/commands',
              '@codemirror/lang-markdown',
              '@codemirror/language',
              '@codemirror/language-data',
              '@codemirror/theme-one-dark',
              '@lezer/highlight',
              'codemirror'
            ],
            // 将 markdown 渲染和高亮独立分包
            'vendor-render': ['markdown-it', 'highlight.js'],
            // 状态管理
            'vendor-store': ['zustand']
          }
        }
      },
      // 提高 chunk 大小警告阈值（Electron 不需要太严格）
      chunkSizeWarningLimit: 1000
    },
    css: {
      modules: {
        // CSS Modules 的类名生成规则，生产环境用短哈希减小体积
        generateScopedName: '[hash:base64:8]'
      }
    }
  }
})
