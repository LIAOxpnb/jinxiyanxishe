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
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main-content {
  flex-grow: 1;
  /* 只保留左右内边距，去掉顶部间隙以使页面头部背景贴近页面顶部 */
  padding: 0 px;
}

.app-main-content.login-page {
  padding: 0;
}
</style>
