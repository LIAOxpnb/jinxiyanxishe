<template>
  <div id="app">
    <Header v-if="!isLoginPage" />
    <main class="app-main-content" :class="{ 'login-page': isLoginPage }">
      <router-view />
    </main>
    <PageFooter v-if="!isLoginPage" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/common/Header.vue';
import PageFooter from './components/common/PageFooter.vue';

const route = useRoute()

// 检查当前是否为登录页面
const isLoginPage = computed(() => route.name === 'Login')
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
  overflow: hidden; /* 防止主内容区域出现滚动条 */
  padding: 0;
  background-color: #ffffff; /* 确保主内容区域背景为白色 */
}

.app-main-content.login-page {
  padding: 0;
}
</style>
