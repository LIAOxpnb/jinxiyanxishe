<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="aside">
      <h3>教学中心</h3>
      <el-menu
        :default-active="activeMenu"
        class="aside-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/teaching-center/classes">
          <template #title>班级管理</template>
        </el-menu-item>

        <el-menu-item-group title="---课程---">
          <el-menu-item index="/teaching-center/courses">
            <template #title>课程管理</template>
          </el-menu-item>
          <el-menu-item index="/teaching-center/courseware">
            <template #title>课件管理</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---考试---">
          <el-menu-item index="/teaching-center/question-bank">
            <template #title>题库管理</template>
          </el-menu-item>
          <el-menu-item index="/teaching-center/practice">
            <template #title>练习管理</template>
          </el-menu-item>
          <el-menu-item index="/teaching-center/exams">
            <template #title>考试管理</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---靶场---">
          <el-menu-item index="/teaching-center/range">
            <template #title>靶场管理</template>
          </el-menu-item>
          <el-menu-item index="/teaching-center/adjustment-data">
            <template #title>调证数据</template>
          </el-menu-item>
         
        </el-menu-item-group>

        <el-menu-item-group title="---实时监控---">
          <el-menu-item index="/visual/exam-monitor">
            <template #title>考试实时大屏</template>
          </el-menu-item>
          <el-menu-item index="/visual/range-monitor">
            <template #title>靶场实战大屏</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---帮助---">
          <el-menu-item index="/teaching-center/help">
            <template #title>帮助文档</template>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>

    <el-main class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive :max="10">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 当前激活的菜单项
const activeMenu = ref(route.path);

// 监听路由变化，更新激活菜单
watch(() => route.path, (newPath) => {
  activeMenu.value = newPath;
});

// 处理菜单选择，立即更新菜单状态并跳转路由
const handleMenuSelect = (index) => {
  // 立即更新菜单激活状态（同步执行）
  activeMenu.value = index;
  
  // 使用 nextTick 确保 DOM 更新后再跳转
  nextTick(() => {
    // 如果当前路径不是目标路径，才跳转
    if (route.path !== index) {
      router.push(index);
    }
  });
};
</script>

<style scoped>
/* 教学中心布局 - 与系统管理统一风格 */

.main-layout {
  height: calc(100vh - 140px);
  display: flex;
  overflow: hidden;
  /* 统一的浅紫灰渐变背景 */
  background: linear-gradient(180deg, #f8f9fe 0%, #f5f7fa 100%);
}

.aside {
  /* 左侧菜单：浅色渐变背景，与导航栏紫色呼应 */
  background: linear-gradient(180deg, #f0f3ff 0%, #e8eaf6 100%);
  border-right: 1px solid rgba(102, 126, 234, 0.15);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  box-shadow: 2px 0 12px rgba(102, 126, 234, 0.08);
}

.aside h3 {
  padding: 20px 20px 20px 24px;
  text-align: left;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  /* 蓝紫色文字 */
  color: #5B6FD8;
  border-bottom: 1px solid rgba(91, 111, 216, 0.15);
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.aside-menu {
  flex-grow: 1;
  border-right: none;
  overflow-y: auto;
  background: transparent !important;
}

/* 美化滚动条 */
.aside-menu::-webkit-scrollbar {
  width: 6px;
}

.aside-menu::-webkit-scrollbar-track {
  background: rgba(102, 126, 234, 0.05);
}

.aside-menu::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.2);
  border-radius: 3px;
}

.aside-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.3);
}

/* menu group title */
.el-menu-item-group__title {
  padding: 16px 20px 12px 24px !important;
  color: #9ca3af !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
}

/* menu items - 深灰色文字 */
.el-menu-item {
  padding: 0 20px 0 24px !important;
  height: 44px !important;
  line-height: 44px !important;
  color: #4b5563 !important;
  margin: 4px 8px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
  font-weight: 500;
}

.el-menu-item:hover {
  background-color: rgba(91, 111, 216, 0.1) !important;
  color: #5B6FD8 !important;
}

/* subtle separators between logical blocks */
.el-menu-item-group + .el-menu-item-group {
  border-top: 1px solid rgba(91, 111, 216, 0.1);
  margin-top: 8px;
  padding-top: 8px;
}

/* active item style - 蓝紫渐变背景，白色文字 */
.el-menu-item.is-active {
  background: linear-gradient(135deg, #5B6FD8 0%, #7CB3E8 100%) !important;
  color: #ffffff !important;
  position: relative;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(91, 111, 216, 0.3);
}

.el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 4px;
  background: #ffffff;
  border-radius: 0 2px 2px 0;
}

/* remove default menu background and right border */
.el-menu,
.el-menu--inline {
  background: transparent !important;
  border-right: none !important;
}

.main-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  min-width: 0;
}


/* [核心修改]
  让 router-view 及其渲染的组件 (如 QuestionBank.vue) 
  能够正确地充满 main-content 的空间 
*/
.main-content :deep(.page-container) {
    height: 100%;
    overflow: hidden;
}
.main-content :deep(.page-wrapper),
.main-content :deep(.organization-management) {
    min-height: 100%;
    height: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
}
.main-content :deep(.exam-settings-page) {
    height: 100%;
    overflow: auto; /* 允许考试设置页面滚动 */
}
</style>