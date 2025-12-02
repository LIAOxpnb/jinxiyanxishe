<template>
  <el-container class="main-layout">
    <el-aside width="200px" class="aside">
      <h3>系统管理</h3>
      <el-menu
        :default-active="$route.path"
        router
        class="aside-menu"
      >
        <el-menu-item index="/system-management/dashboard">
          <template #title>系统首页</template>
        </el-menu-item>

        <el-menu-item-group title="---AI管理---">
          <el-menu-item index="/system-management/knowledge-base">
            <template #title>知识库</template>
          </el-menu-item>
          <el-menu-item index="/system-management/model-management">
            <template #title>模型管理</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---用户中心---">
          <el-menu-item index="/system-management/organization">
            <template #title>组织管理</template>
          </el-menu-item>
          <el-menu-item index="/system-management/user-management">
            <template #title>用户管理</template>
          </el-menu-item>
          <el-menu-item index="/system-management/lecturer-management">
            <template #title>讲师管理</template>
          </el-menu-item>
          <el-menu-item index="/system-management/back-end-permissions">
            <template #title>后管权限</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---证书中心---">
          <el-menu-item index="/system-management/certificate-management">
            <template #title>证书管理</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---消息中心---">
          <el-menu-item index="/system-management/message-management">
            <template #title>消息管理</template>
          </el-menu-item>
          <el-menu-item index="/system-management/message-templates">
            <template #title>消息模板</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---工具管理---">
          <el-menu-item index="/system-management/tool-management">
            <template #title>工具管理</template>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group title="---配置中心---">
          <el-menu-item index="/system-management/global-settings">
            <template #title>全局配置</template>
          </el-menu-item>
          <el-menu-item index="/system-management/dictionary-management">
            <template #title>字典管理</template>
          </el-menu-item>
          <el-menu-item index="/system-management/operation-logs">
            <template #title>操作日志</template>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>

    <el-main class="main-content">
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup>
// 布局组件不需要复杂逻辑
</script>

<style scoped>
/* 定义一个变量来管理头部的高度，方便后续修改 */
:root {
  --header-height: 64px; /* 根据您实际的顶部导航栏高度调整 */
}

.main-layout {
  /* 容器高度 = 视窗高度 - 顶部导航栏高度 - 页脚高度 */
  height: calc(100vh - 140px);
  /* 统一的浅紫灰渐变背景 */
  background: linear-gradient(180deg, #f8f9fe 0%, #f5f7fa 100%);
  overflow: hidden; /* 防止layout自身出现滚动条 */
}

.aside {
  /* 左侧菜单：浅色渐变背景，与导航栏蓝紫色呼应 */
  background: linear-gradient(180deg, #f0f3ff 0%, #e8eaf6 100%);
  border-right: 1px solid rgba(91, 111, 216, 0.15);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  left: 0;
  width: 200px;
  box-shadow: 2px 0 12px rgba(91, 111, 216, 0.08);
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
  background: rgba(91, 111, 216, 0.05);
}

.aside-menu::-webkit-scrollbar-thumb {
  background: rgba(91, 111, 216, 0.2);
  border-radius: 3px;
}

.aside-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(91, 111, 216, 0.3);
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
  padding: 24px;
  background: transparent;
  overflow-y: auto;
}
</style>
