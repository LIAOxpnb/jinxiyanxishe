import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 引入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 这里的配置是正确的,让 '@' 指向 'src' 目录
      '@': path.resolve(__dirname, './src')
    }
  },

  // ----- 以下是为你添加的代理配置 -----
  server: {
    proxy: {
      // '/api' 是一个代理标识,在你的 request.js 中 baseURL 应设置为 '/api'
      '/api': {
        // target 指向你的后端真实接口地址
        target: 'http://183.230.195.24:7925', 
        
        // changeOrigin: true, // 开启代理,允许跨域
        changeOrigin: true,
        
        // rewrite 会将请求路径中的 /api 前缀去掉
        // 例如:请求 /api/user/login -> 会被代理到 http://183.230.195.24:7925/user/login
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // ----- 配置添加完毕 -----

  // 构建优化配置
  build: {
    // 调整 chunk 大小警告的限制 (可选)
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // 手动配置代码分割
        manualChunks: (id) => {
          // 将 node_modules 中的依赖分离到不同的 chunk
          if (id.includes('node_modules')) {
            // Vue 核心库单独打包
            if (id.includes('vue') || id.includes('vue-router')) {
              return 'vue-vendor'
            }
            
            // 富文本编辑器单独打包
            if (id.includes('@wangeditor')) {
              return 'wangeditor-vendor'
            }
            
            // Office 预览组件单独打包
            if (id.includes('@vue-office')) {
              return 'vue-office-vendor'
            }
            
            // Excel 处理库单独打包
            if (id.includes('xlsx')) {
              return 'xlsx-vendor'
            }
            
            // 视频播放器单独打包
            if (id.includes('video.js')) {
              return 'videojs-vendor'
            }
            
            // 其他第三方库
            return 'vendor'
          }
        },
        
        // 用于从入口点创建的块的打包输出格式
        entryFileNames: 'assets/[name]-[hash].js',
        // 用于命名代码拆分时创建的共享块的输出命名
        chunkFileNames: 'assets/[name]-[hash].js',
        // 用于输出静态资源的命名
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // 启用/禁用 CSS 代码拆分
    cssCodeSplit: true,
    
    // 启用/禁用 gzip 压缩大小报告
    reportCompressedSize: true,
  }
})