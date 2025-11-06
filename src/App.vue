<template>
  <div id="app">
    <Header v-if="!isLoginPage" />
    <main class="app-main-content" :class="{ 'login-page': isLoginPage }">
      <router-view />
    </main>
    <PageFooter v-if="!isLoginPage" />
    <!-- 水印组件 -->
    <Watermark v-if="showWatermark" :text="watermarkText" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/common/Header.vue';
import PageFooter from './components/common/PageFooter.vue';
import Watermark from './components/common/Watermark.vue';
import { getUserInfo } from '@/api/common/user.js';
import { getGlobalSettings } from '@/api/system-management/Global-Settings.js';

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
    const res = await getGlobalSettings()
    if (res.code === 200 && res.data) {
      // 1 表示开启，0 表示关闭
      watermarkEnabled.value = res.data.watermark === 1
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
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  background-color: #f4f6f8;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden; /* 防止水平滚动条 */
}

html, body {
  height: 100%;
  overflow-x: hidden; /* 确保没有水平滚动条 */
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 使用视窗高度而不是最小高度 */
  overflow: hidden; /* 防止整体页面出现滚动条 */
}

.app-main-content {
  flex: 1; /* 占据剩余空间 */
  /* overflow: hidden; 防止主内容区域出现滚动条 */
  overflow: auto;
  padding: 0;
  background-color: #ffffff; /* 确保主内容区域背景为白色 */
}

.app-main-content.login-page {
  padding: 0;
}


</style>
