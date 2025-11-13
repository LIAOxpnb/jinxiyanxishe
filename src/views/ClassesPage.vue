<template>
  <div class="classes-page student-page-wrapper">
    <div class="page-header">
      <el-icon :size="32" color="#fff" class="header-icon"><School /></el-icon>
      <h1 style="color: #3370FF;">我的班级</h1>
    </div>

    <div class="main-content">
      <p>班级列表内容待开发...</p>
    </div>
  </div>
</template>

<script setup>
import { School } from '@element-plus/icons-vue';
</script>

<style scoped>
.classes-page {
  background-color: #f5f7fa;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

/* 使用全局 page-header 样式，仅定义背景图 */
.page-header {
  background-image: url('@/assets/img/u71.png');
}

.main-content {
  padding: 24px;
  background-color: #f5f7fa;
}
</style>
