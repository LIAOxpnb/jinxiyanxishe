<template>
  <div class="page-wrapper">
    <div class="main-content">
      <h1 class="page-title">考试管理</h1>
      
      <el-alert
        title="【备注】默认展示我预约的考试"
        type="error"
        :closable="false"
        class="custom-alert"
      ></el-alert>

      <FilterBar
        create-button-text="创建考试"
        :fields="examFilterFields"
        @create="handleCreateExam"
        @filter="handleFilterExams"
      />

      <el-table 
        :data="tableData" 
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="examName" label="考试名称" min-width="120" />
        <el-table-column prop="publishStatus" label="发布" width="90">
          <template #default="scope">
            <el-tag
              :type="scope.row.publishStatus === '已发布' ? 'success' : 'danger'"
              disable-transitions
            >{{ scope.row.publishStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="examTime" label="考试时间" width="210">
           <template #default="scope">
            <div v-html="scope.row.examTime"></div>
           </template>
        </el-table-column>
        <el-table-column prop="duration" label="考试时长" width="90" />
        <el-table-column prop="category" label="分类" min-width="100" />
        <el-table-column prop="questionCount" label="试题数" width="80" />
        <el-table-column prop="totalScore" label="总分数" width="80" />
        <el-table-column prop="passCount" label="交卷数" width="80" />
        <el-table-column prop="passRate" label="合格数" width="80" />
        <el-table-column prop="grade" label="班级" width="80" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="creationTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default>
            <el-button link type="primary" size="small">考试设置</el-button>
            <el-button link type="primary" size="small">阅卷</el-button>
            <el-button link type="primary" size="small">问卷</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-dropdown>
          <el-button>
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>批量删除</el-dropdown-item>
              <el-dropdown-item>批量发布</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          layout="total, prev, pager, next, jumper"
          :total="102"
          background
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
// 引入 FilterBar 组件
import FilterBar from '@/components/FilterBar.vue';

// FilterBar 的配置 (无改动)
const examFilterFields = ref([
  { type: 'input', model: 'examName', placeholder: '考试名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { type: 'select', model: 'category', placeholder: '分类', options: [] },
  { 
    type: 'select', 
    model: 'status', 
    placeholder: '发布状态', 
    options: [
        { label: '已发布', value: 'published' },
        { label: '未发布', value: 'unpublished' },
    ]
  },
  { type: 'select', model: 'myExam', placeholder: '我的考试', options: [] },
]);

// 事件处理函数 (无改动)
const handleCreateExam = () => {
  console.log('触发了“创建考试”事件');
};

const handleFilterExams = (filterData) => {
  console.log('触发了“筛选”事件，数据为:', filterData);
};

// 表格模拟数据 (无改动)
const tableData = ref([
  { examName: '考试名称', publishStatus: '未发布', examTime: '不限时', duration: '100分钟', category: '分类名称', questionCount: 100, totalScore: 100, passCount: 0, passRate: 0, grade: 1, creator: '用户名', creationTime: 'YY-MM-DD HH:mm:ss' },
  { examName: '考试名称', publishStatus: '已发布', examTime: '开始 YY-MM-DD HH:mm<br>结束 YY-MM-DD HH:mm', duration: '100分钟', category: '分类名称', questionCount: 100, totalScore: 100, passCount: 100, passRate: 80, grade: 0, creator: '用户名', creationTime: 'YY-MM-DD HH:mm:ss' },
  { examName: '考试名称', publishStatus: '已发布', examTime: '开始 YY-MM-DD HH:mm<br>结束 YY-MM-DD HH:mm', duration: '100分钟', category: '分类名称', questionCount: 100, totalScore: 100, passCount: 100, passRate: 80, grade: 2, creator: '用户名', creationTime: 'YY-MM-DD HH:mm:ss' },
  { examName: '考试名称', publishStatus: '已发布', examTime: '开始 YY-MM-DD HH:mm<br>结束 YY-MM-DD HH:mm', duration: '100分钟', category: '分类名称', questionCount: 100, totalScore: 100, passCount: 100, passRate: 80, grade: 2, creator: '用户名', creationTime: 'YY-MM-DD HH:mm:ss' },
  { examName: '考试名称', publishStatus: '已发布', examTime: '开始 YY-MM-DD HH:mm<br>结束 YY-MM-DD HH:mm', duration: '100分钟', category: '分类名称', questionCount: 100, totalScore: 100, passCount: 100, passRate: 80, grade: 1, creator: '用户名', creationTime: 'YY-MM-DD HH:mm:ss' },
  { examName: '考试名称', publishStatus: '已发布', examTime: '开始 YY-MM-DD HH:mm<br>结束 YY-MM-DD HH:mm', duration: '100分钟', category: '分类名称', questionCount: 100, totalScore: 100, passCount: 100, passRate: 80, grade: 1, creator: '用户名', creationTime: 'YY-MM-DD HH:mm:ss' },
  { examName: '考试名称', publishStatus: '已发布', examTime: '开始 YY-MM-DD HH:mm<br>结束 YY-MM-DD HH:mm', duration: '100分钟', category: '分类名称', questionCount: 100, totalScore: 100, passCount: 100, passRate: 80, grade: 1, creator: '用户名', creationTime: 'YY-MM-DD HH:mm:ss' },
]);

// 分页数据 (pageSize 现在是固定的)
const currentPage = ref(1);
const pageSize = ref(10); // 您可以根据需要设置默认的每页条数
</script>

<style scoped>
/* 样式 (无改动) */
.page-wrapper {
  background-color: #f0f2f5;
  padding: 20px;
  min-height: 100vh;
}
.main-content {
  background-color: #ffffff;
  padding: 24px;
  border-radius: 4px;
}
.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}
.custom-alert {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
  margin-bottom: 20px;
}
.el-table {
  margin-top: 20px;
}
.el-tag {
  border-radius: 4px;
}
.el-tag--danger {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}
.el-tag--success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}
.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>