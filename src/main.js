import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router' // 引入 router
import { getGlobalConfig } from '@/utils/globalConfig'

// 引入本地字体包 - 思源黑体（Noto Sans SC）
// 引入多个字重以支持不同粗细
import '@fontsource/noto-sans-sc/300.css' // Light
import '@fontsource/noto-sans-sc/400.css' // Regular
import '@fontsource/noto-sans-sc/500.css' // Medium
import '@fontsource/noto-sans-sc/700.css' // Bold

// 引入全局主题样式 - 统一紫色主题
import './assets/style/global-theme.css'

// 引入页面顶部 Banner 统一样式
import './assets/style/page-header.css'

// 动态设置页面标题和图标
async function initGlobalSettings() {
  try {
    const config = await getGlobalConfig()
    if (config) {
      // 设置页面标题
      if (config.sysName) {
        document.title = config.sysName
      }
      
      // 设置页面图标
      if (config.iconUrl) {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
        link.type = 'image/x-icon'
        link.rel = 'icon'
        link.href = config.iconUrl
        if (!document.querySelector("link[rel*='icon']")) {
          document.getElementsByTagName('head')[0].appendChild(link)
        }
      }
    }
  } catch (error) {
    console.error('获取全局设置失败:', error)
  }
}

const app = createApp(App)

app.use(ElementPlus, { locale: zhCn })
app.use(router) // 使用 router

// 初始化全局设置后再挂载应用
initGlobalSettings().finally(() => {
  app.mount('#app')
})
