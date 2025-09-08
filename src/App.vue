<template>
  <div id="app">
    <Header />
    <main class="app-main-content">
      <router-view />
    </main>
    <PageFooter />
  </div>
</template>

<script setup>
import Header from './components/Header.vue';
import PageFooter from './components/PageFooter.vue';
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
</style>
