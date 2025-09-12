<template>
  <div class="student-layout-container">
    <router-view />

  
  </div>
</template>

<script setup>
// 这个布局文件通常不需要复杂的JS逻辑，主要负责结构和样式。
</script>

<style scoped>
.student-layout-container {
  background-color: #f0f2f5;
  min-height: 100vh;
}

.page-footer {
  text-align: center;
  padding: 24px;
  color: #8c8c8c;
  font-size: 14px;
}
</style>