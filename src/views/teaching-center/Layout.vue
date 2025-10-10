<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="aside">
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
/* [核心修改] 使用 Flexbox 实现完美的内部滚动布局 */

.main-layout {
  /* 计算布局的总高度：100%容器高度 减去 顶部导航栏和页脚的高度
    Header大约60px，Footer大约80px，总共140px
  */
  /* height: calc(100vh - 140px);
  display: flex;
  overflow: hidden; 防止layout自身出现滚动条
  background-color: #ffffff; 确保布局容器背景为白色 */
    height: 100%;
  display: flex;
  background-color: #ffffff;
}

.aside {
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column; /* 让侧边栏内部也成为 flex 容器 */
  height: 100%; /* 高度充满父容器 */
  overflow: hidden; /* 防止侧边栏出现滚动条 */
}

.aside h3 {
  padding: 20px;
  text-align: left;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0; /* 防止标题被压缩 */
}

.aside-menu {
  flex-grow: 1; /* 让菜单占据所有剩余空间 */
  border-right: none;
  overflow-y: auto; /* 如果菜单项过多，允许内部滚动 */
}

.el-menu-item-group__title {
  padding-left: 20px !important;
}

.el-menu-item {
  height: 44px !important;
  line-height: 44px !important;
}

.el-menu-item.is-active {
  background-color: #ecf5ff !important;
  color: #409eff !important;
}

.main-content {
  padding: 0; /* [核心修改] 移除内边距，让子页面自己控制 */
  display: flex; /* 让 el-main 也成为 flex 容器 */
  flex-direction: column;
  flex: 1; /* 占据剩余的所有宽度 */
  
  background-color: #ffffff; /* 确保主内容区背景为白色 */
}


/* [核心修改]
  让 router-view 及其渲染的组件 (如 QuestionBank.vue) 
  能够正确地充满 main-content 的空间 
*/
:deep(.el-main > .page-container) {
    height: 100%;
    overflow: hidden;
}
:deep(> .page-wrapper),
:deep(> .organization-management) {
    height: 100%;
    overflow: hidden;
}
:deep(> .exam-settings-page) {
    height: 100%;
    overflow: auto; /* 允许考试设置页面滚动 */
}
</style>