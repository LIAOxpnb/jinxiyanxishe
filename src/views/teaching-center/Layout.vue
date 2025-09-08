<template>
  <el-container class="main-layout">
    <el-aside width="200px" class="aside">
      <h3>教学中心</h3>
      <el-menu
        :default-active="$route.path"
        router
        class="aside-menu"
      >
        <el-menu-item index="/teaching-center/classes">
          <template #title>班级管理</template>
        </el-menu-item>

        <el-menu-item-group title="---课程---">
          <el-menu-item index="/teaching-center/courses">
            <template #title>课程管理</template>
          </el-menu-item>
          <el-menu-item index="/teaching-center/handouts">
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
          <el-menu-item index="/teaching-center/shooting-range">
            <template #title>靶场管理</template>
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
  --header-height: 60px; /* 根据您实际的顶部导航栏高度调整 */
}

.main-layout {
  /* 容器高度 = 视窗高度 - 顶部导航栏高度 */
  height: calc(100vh - var(--header-height));
  background-color: #fff;
}

.aside {
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* 取消负偏移，使用固定宽度以避免被父容器裁切 */
  position: relative;
  left: 0;
  width: 200px;
}

.aside h3 {
  padding: 18px 20px 18px 24px; /* 调整内边距以适应视觉对齐 */
  text-align: left;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0; /* 防止标题在内容过多时被压缩 */
}

.aside-menu {
  flex-grow: 1;
  border-right: none;
  overflow-y: auto; /* 如果菜单项过多，允许内部滚动 */
}

/* menu group title */
.el-menu-item-group__title {
  padding: 12px 20px !important;
  color: #909399;
  font-size: 12px;
}

/* menu items */
.el-menu-item {
  padding: 0 20px !important; /* 调整内边距 */
  height: 40px !important;  /* 给予一个固定的高度，让菜单项更整齐 */
  line-height: 40px !important;
  color: #606266;
}

/* subtle separators between logical blocks */
.el-menu-item-group + .el-menu-item-group {
  border-top: 1px solid #f5f7fa;
}

/* active item style: blue left indicator and blue text/background like product */
.el-menu-item.is-active {
  background-color: #f5fbff !important;
  color: #409EFF !important;
  position: relative;
}
.el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 4px;
  background: #409EFF;
  border-radius: 2px;
}

/* remove default menu background and right border */
.el-menu,
.el-menu--inline {
  background: transparent;
  border-right: none;
}

.main-content {
  padding: 24px;
}
</style>