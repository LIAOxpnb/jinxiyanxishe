<template>
  <div class="page-container">
    <div class="page-header">
      <el-icon :size="32" color="#fff" class="header-icon"><Document /></el-icon>
      <h1>正式考试</h1>
    </div>

    <div class="main-content">
      <div class="filter-bar">
        <el-input v-model="filters.search" placeholder="搜索" class="search-input">
          <template #append>
            <el-button :icon="Search" />
          </template>
        </el-input>
        <el-select v-model="filters.category" placeholder="分类"></el-select>
        <el-select v-model="filters.status" placeholder="状态">
          <el-option label="未开始" value="not-started"></el-option>
          <el-option label="进行中" value="in-progress"></el-option>
          <el-option label="已结束" value="finished"></el-option>
        </el-select>
        <el-select v-model="filters.result" placeholder="考核结果">
           <el-option label="合格" value="passed"></el-option>
           <el-option label="不合格" value="failed"></el-option>
        </el-select>
        <span class="filter-note">【备注】勾选可查看考核相关操作</span>
      </div>

      <el-table :data="tableData" style="width: 100%" class="exam-table">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="标题" min-width="250">
          <template #default="scope">
            <el-link type="primary" :underline="false">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="考试状态" width="120">
          <template #default="scope">
            <span :class="['status-tag', getStatusClass(scope.row.status)]">
              {{ scope.row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="考试时间" width="180" />
        <el-table-column prop="duration" label="考试时长" width="120" />
        <el-table-column prop="attempts" label="考试次数" width="120" />
        <el-table-column prop="score" label="考试分数" width="120" />
        <el-table-column prop="result" label="考核结果" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-link type="primary" :underline="false">{{ scope.row.action }}</el-link>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, prev, pager, next, jumper, ->, sizes"
          :total="pagination.total"
        />
      </div>
    </div>

    <div class="page-footer">
      <span>重庆市公安局信通总队</span>&nbsp;&nbsp;|&nbsp;&nbsp;<span>产品研发部</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Search, Document } from '@element-plus/icons-vue';

// script 部分无任何改动
const filters = reactive({ search: '', category: '', status: '', result: '' });
const tableData = ref([
  { title: '考试名称考试名称考试名称考试名称考试名称', status: '未开始', time: '2025-9-28 14:00', duration: '120分钟', attempts: '0/3', score: '-', result: '-', action: '-' },
  { title: '考试名称考试名称考试名称考试名称考试名称', status: '进行中', time: '2025-9-28 14:00', duration: '120分钟', attempts: '1/3', score: '-', result: '-', action: '查看考卷' },
  { title: '考试名称考试名称考试名称考试名称考试名称', status: '已结束', time: '2025-9-28 14:00', duration: '120分钟', attempts: '3/3', score: '98分', result: '不合格', action: '查看考卷' },
]);
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 102 });
const getStatusClass = (status) => {
  switch (status) {
    case '未开始': return 'status-not-started';
    case '进行中': return 'status-in-progress';
    case '已结束': return 'status-finished';
    default: return '';
  }
};
</script>

<style scoped>
.page-container {
  background-color: #f0f2f5;
  min-height: 100vh;
  padding-top: 0; /* 覆盖全局容器的上内边距，确保 header 背景贴顶 */
}

.page-header {
  display: flex;
  align-items: center;
  margin: 0; /* 移除上下外边距，确保顶部无间隙 */
  padding: 24px;
    /* 可调整的横幅高度，方便在不同页面统一控制 */
  --banner-height: 110px; /* 修改此处数值以调节背景图高度 */
  min-height: var(--banner-height);
  /* 确保这里使用正确的 CSS 背景图路径 */
  background-image: url('/src/assets/img/u4045.png');
  background-size: cover;
  background-position: right top; /* 让背景图片与上边框对齐，去除垂直间隙 */
  background-repeat: no-repeat;
  border-radius: 8px 8px 0 0;
}

.header-icon {
  background-color: #1677ff;
  border-radius: 4px;
  padding: 4px;
  margin-right: 16px;
}
.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1677ff;
  margin: 0;
}
.main-content {
  background-color: #ffffff;
  padding: 24px;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.search-input {
  width: 240px;
}
.filter-bar .el-select {
  width: 150px;
}
.filter-note {
  margin-left: auto;
  font-size: 14px;
  color: #909399;
}
.exam-table {
  --el-table-header-bg-color: #fafafa;
  --el-table-border-color: #ebeef5;
}
.status-tag {
  display: inline-block;
  padding: 2px 12px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid;
}
.status-not-started {
  color: #1677ff;
  border-color: #a3c9ff;
  background-color: #e8f3ff;
}
.status-in-progress {
  color: #52c41a;
  border-color: #b7eb8f;
  background-color: #f6ffed;
}
.status-finished {
  color: #8c8c8c;
  border-color: #d9d9d9;
  background-color: #fafafa;
}
.table-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
.page-footer {
  text-align: center;
  margin-top: 32px;
  padding: 0 24px 24px;
  color: #8c8c8c;
  font-size: 14px;
}
</style>