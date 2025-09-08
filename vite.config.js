import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // <-- 已为您引入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // ----- 以下是为您添加的配置 -----
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
  // ----- 配置添加完毕 -----
})