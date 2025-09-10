import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 引入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 这里的配置是正确的，让 '@' 指向 'src' 目录
      '@': path.resolve(__dirname, './src')
    }
  },

  // ----- 以下是为你添加的代理配置 -----
  server: {
    proxy: {
      // '/api' 是一个代理标识，在你的 request.js 中 baseURL 应设置为 '/api'
      '/api': {
        // target 指向你的后端真实接口地址
        target: 'http://183.230.195.24:7925', 
        
        // changeOrigin: true, // 开启代理，允许跨域
        changeOrigin: true,
        
        // rewrite 会将请求路径中的 /api 前缀去掉
        // 例如：请求 /api/user/login -> 会被代理到 http://183.230.195.24:7925/user/login
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // ----- 配置添加完毕 -----
})