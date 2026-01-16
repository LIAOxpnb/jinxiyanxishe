<template>
  <div id="app">
    <Header v-if="!isLoginPage && !route.meta.fullScreen" />
    
    <main class="app-main-content" :class="{ 'login-page': isLoginPage, 'full-screen-main': route.meta.fullScreen }">
      <router-view />
    </main>
    
    <PageFooter v-if="!isLoginPage && !route.meta.fullScreen" />
    <!-- 水印组件 -->
    <Watermark v-if="showWatermark" :text="watermarkText" />
    <!-- 全局图片预览组件 -->
    <ImagePreview />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/common/Header.vue';
import PageFooter from './components/common/PageFooter.vue';
import Watermark from './components/common/Watermark.vue';
import { getUserInfo } from '@/api/common/user.js';
import { getGlobalConfig } from '@/utils/globalConfig';

const route = useRoute()

// 检查当前是否为登录页面
const isLoginPage = computed(() => route.name === 'Login')

// 水印相关
const showWatermark = ref(false)
const watermarkText = ref('')
const watermarkEnabled = ref(true) // 全局水印开关，默认开启

// 获取全局水印配置
const fetchWatermarkConfig = async () => {
  // 先检查登录状态
  const token = sessionStorage.getItem('token')
  if (!token || isLoginPage.value) {
    return
  }
  
  try {
    const config = await getGlobalConfig()
    if (config) {
      // 1 表示开启，0 表示关闭
      watermarkEnabled.value = config.watermark === 1
    }
  } catch (error) {
    console.warn('获取全局水印配置失败，将使用默认设置:', error)
    watermarkEnabled.value = true // 失败时默认开启
  }
}

// 获取用户信息并设置水印
const setupWatermark = async () => {
  try {
    // 先隐藏水印
    showWatermark.value = false
    
    // 检查是否在登录页，如果是则直接返回
    if (isLoginPage.value) {
      return
    }
    
    const token = sessionStorage.getItem('token')
    
    // 只在用户已登录时显示水印
    if (!token) {
      return
    }
    
    // 获取全局水印配置
    await fetchWatermarkConfig()
    
    // 如果全局水印关闭，则不显示水印
    if (!watermarkEnabled.value) {
      return
    }
    
    // 尝试从 sessionStorage 获取用户信息
    let userInfo = null
    
    try {
      const response = await getUserInfo()
      if (response && response.code === 200 && response.data) {
        userInfo = response.data
      }
    } catch (error) {
      console.warn('获取用户信息失败，水印将使用默认文本')
    }
    
    // 构建水印文本
    if (userInfo) {
      const username = userInfo.username || userInfo.name || userInfo.phone || '用户'
      const orgName = userInfo.orgName || ''
      const name = userInfo.name || ''
      watermarkText.value = orgName ? `${username}\n${name}` : username
    } else {
      watermarkText.value = '金析研习社'
    }
    
    showWatermark.value = true
  } catch (error) {
    console.error('设置水印失败:', error)
    showWatermark.value = false
  }
}

// 监听路由变化，更新水印显示状态
watch(() => route.name, () => {
  setupWatermark()
})

// 页面加载时初始化水印
onMounted(() => {
  setupWatermark()
})
</script>

<style>

/* Global styles for the entire application */
body {
  margin: 0;
  padding: 0;
  /* 使用本地安装的思源黑体（Noto Sans SC）- Google/Adobe 联合开发，专业清晰 */
  font-family: "Noto Sans SC", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI", sans-serif;
  
  background-color: #f4f6f8;
  /* 字体渲染优化 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern" 1;
  font-kerning: normal;
  /* 响应式字体大小 - 使用 clamp 确保在不同屏幕下的可读性 */
  font-size: clamp(13px, 0.875vw, 14px);
  line-height: 1.65;
  letter-spacing: 0.015em;
  overflow-x: hidden; /* 防止水平滚动条 */
  /* 确保 box-sizing 一致性 */
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow-x: hidden; /* 确保没有水平滚动条 */
  width: 100%;
  min-width: 320px; /* 最小宽度保护，防止在极小屏幕上崩溃 */
}

*,
*::before,
*::after {
  box-sizing: border-box; /* 全局统一盒模型 */
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 使用视窗高度而不是最小高度 */
  overflow: hidden; /* 防止整体页面出现滚动条 */
  width: 100%;
  max-width: 100vw; /* 防止超出视口 */
}

.app-main-content {
  flex: 1; /* 占据剩余空间 */
  overflow: auto; /* 允许滚动 */
  padding: 0;
  /* 统一的浅色背景，与紫色导航栏搭配 */
  background: linear-gradient(180deg, #f8f9fe 0%, #ffffff 50%, #f5f7fa 100%);
  position: relative; /* 为子元素提供定位上下文 */
}

.app-main-content.login-page {
  padding: 0;
}

/* 确保大屏容器能填满整个视口 */
.full-screen-main {
  height: 100vh !important;
  width: 100vw !important;
  padding: 0 !important;
  overflow: hidden !important;
}

/* 全屏固定页面容器 - 用于设置、阅卷等页面，防止双重滚动条 */
.app-main-content:has(.batch-add-page),
.app-main-content:has(.practice-settings-page),
.app-main-content:has(.class-settings),
.app-main-content:has(.member-management-page),
.app-main-content:has(.curriculum-provision-page) {
  overflow: hidden !important;
}

/* 全局字体优化 */
* {
  font-family: inherit;
}

/* 标题字体优化 */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

/* 按钮和输入框字体优化 */
button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* Element Plus 组件字体优化 */
.el-button, .el-input, .el-select, .el-table, .el-dialog, .el-form {
  font-family: inherit;
}

/* 优化数字显示 */
.el-input-number, .el-table__body td {
  font-variant-numeric: tabular-nums;
}

/* ========== 全局响应式字体适配 ========== */
/* 针对笔记本不同分辨率和缩放比例的统一适配 */

/* 超大标题（通常用于证书、横幅等） */
h1, 
.main-title,
.hero-title,
.certificate-title {
  font-size: clamp(28px, 3.5vw, 52px) !important;
}

/* 大标题（通常用于页面标题） */
h2,
.section-title,
.page-title {
  font-size: clamp(24px, 2.5vw, 40px) !important;
}

/* 中标题（通常用于模块标题） */
h3,
.module-title {
  font-size: clamp(18px, 1.8vw, 28px) !important;
}

/* 小标题 */
h4 {
  font-size: clamp(16px, 1.5vw, 22px) !important;
}

/* 统计数字（大号显示） */
.stat-number,
.big-number {
  font-size: clamp(24px, 2.2vw, 36px) !important;
}

/* 图标（大号） */
.play-icon,
.large-icon {
  font-size: clamp(48px, 5vw, 80px) !important;
}

/* Edge 浏览器 125% 缩放特别优化 */
@media (max-width: 1550px) {
  h1, .main-title, .certificate-title {
    font-size: clamp(24px, 3vw, 44px) !important;
  }
  
  h2, .section-title {
    font-size: clamp(20px, 2.2vw, 36px) !important;
  }
  
  .stat-number {
    font-size: clamp(20px, 2vw, 30px) !important;
  }
}

/* ========== 台式机显示器字体适配 ========== */

/* 2K 台式机显示器 (2560×1440) */
@media (min-width: 2000px) and (max-width: 2600px) {
  body {
    font-size: clamp(14px, 0.9vw, 16px);
  }
  
  h1, .main-title, .hero-title, .certificate-title {
    font-size: clamp(48px, 3.2vw, 60px) !important;
  }
  
  h2, .section-title, .page-title {
    font-size: clamp(36px, 2.4vw, 48px) !important;
  }
  
  h3, .module-title {
    font-size: clamp(26px, 1.6vw, 32px) !important;
  }
  
  h4 {
    font-size: clamp(20px, 1.3vw, 26px) !important;
  }
  
  .stat-number, .big-number {
    font-size: clamp(32px, 2vw, 42px) !important;
  }
  
  .play-icon, .large-icon {
    font-size: clamp(64px, 5vw, 96px) !important;
  }
}

/* 4K 台式机显示器 (3840×2160) */
@media (min-width: 2601px) and (max-width: 4000px) {
  body {
    font-size: clamp(16px, 0.9vw, 18px);
  }
  
  h1, .main-title, .hero-title, .certificate-title {
    font-size: clamp(60px, 3vw, 80px) !important;
  }
  
  h2, .section-title, .page-title {
    font-size: clamp(48px, 2.4vw, 64px) !important;
  }
  
  h3, .module-title {
    font-size: clamp(32px, 1.6vw, 42px) !important;
  }
  
  h4 {
    font-size: clamp(24px, 1.2vw, 32px) !important;
  }
  
  .stat-number, .big-number {
    font-size: clamp(48px, 2.2vw, 64px) !important;
  }
  
  .play-icon, .large-icon {
    font-size: clamp(80px, 4vw, 120px) !important;
  }
}

/* 5K 及以上显示器 (5120×2880+) */
@media (min-width: 4001px) {
  body {
    font-size: clamp(18px, 1vw, 20px);
  }
  
  h1, .main-title, .hero-title, .certificate-title {
    font-size: clamp(80px, 3.5vw, 100px) !important;
  }
  
  h2, .section-title, .page-title {
    font-size: clamp(64px, 2.8vw, 80px) !important;
  }
  
  h3, .module-title {
    font-size: clamp(42px, 2vw, 52px) !important;
  }
  
  h4 {
    font-size: clamp(32px, 1.5vw, 40px) !important;
  }
  
  .stat-number, .big-number {
    font-size: clamp(64px, 2.5vw, 80px) !important;
  }
  
  .play-icon, .large-icon {
    font-size: clamp(100px, 5vw, 150px) !important;
  }
}

</style>
