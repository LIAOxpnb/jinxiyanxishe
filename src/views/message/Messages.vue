<template>
  <div class="message-center-container">
    <div class="left-menu">
      <div class="menu-title">消息中心</div>
      <el-menu
        :default-active="activeMenu"
        class="message-menu"
        router
      >
        <el-menu-item index="/messages/announcements">
          <el-icon><Bell /></el-icon>
          <span>系统通知</span>
        </el-menu-item>
        <el-menu-item index="/messages/private">
          <el-icon><ChatDotRound /></el-icon>
          <span>私信</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="right-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Bell, ChatDotRound } from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.message-center-container {
  display: flex;
  height: 100%;
  background-color: #f5f7fa;
}
.left-menu {
  width: 200px;
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 20px 0;
  flex-shrink: 0;
}
.menu-title {
  font-size: 18px;
  font-weight: 600;
  padding: 0 20px 10px 20px;
  border-bottom: 1px solid #e6e6e6;
}
.message-menu {
  border-right: none;
}
.el-menu-item {
  height: 50px;
}
.right-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>