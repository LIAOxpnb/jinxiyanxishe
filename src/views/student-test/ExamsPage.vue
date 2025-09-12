<template>
  <div class="page-container">
    <div class="page-header">
      <el-icon :size="32" color="#fff" class="header-icon"><Document /></el-icon>
      <h1>正式考试</h1>
    </div>

    <div class="main-content">
      <div class="filter-bar">
        <el-input v-model="filterParams.name" placeholder="搜索" class="search-input" clearable @keyup.enter="handleFilter" @clear="handleFilter">
          <template #append>
            <el-button :icon="Search" @click="handleFilter" />
          </template>
        </el-input>
        <el-select v-model="filterParams.examCategory" placeholder="分类" clearable @change="handleFilter"></el-select>
        <el-select v-model="filterParams.examStatus" placeholder="状态" clearable @change="handleFilter">
          <el-option label="未开始" value="0"></el-option>
          <el-option label="进行中" value="1"></el-option>
          <el-option label="已结束" value="2"></el-option>
        </el-select>
        <el-select v-model="filterParams.result" placeholder="考核结果" clearable @change="handleFilter">
           <el-option label="合格" value="1"></el-option>
           <el-option label="不合格" value="0"></el-option>
        </el-select>
        <span class="filter-note">【备注】设置了可查看考卷的显示相关操作</span>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%" class="exam-table">
        <el-table-column prop="name" label="标题" min-width="250">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleTitleClick(scope.row)">{{ scope.row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="examStatus" label="考试状态" width="120">
          <template #default="scope">
            <span :class="['status-tag', getStatusClass(scope.row.examStatus)]">
              {{ examStatusMap[scope.row.examStatus] || '未知状态' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="考试时间" width="180">
            <template #default="scope">
                {{ scope.row.examDate === 0 ? '不限时' : scope.row.startTime }}
            </template>
        </el-table-column>
        <el-table-column prop="duration" label="考试时长" width="120">
             <template #default="scope">
                {{ scope.row.duration === -1 || scope.row.duration === 0 ? '不限制' : `${scope.row.duration}分钟` }}
            </template>
        </el-table-column>
        <el-table-column prop="attempts" label="考试次数" width="120">
             <template #default="scope">
                {{ scope.row.attempts === -1 ? '不限制' : `${scope.row.attemptedTimes || 0}/${scope.row.attempts}次` }}
            </template>
        </el-table-column>
        <el-table-column label="考试分数" width="120">
             <template #default="scope">
                {{ scope.row.examRecord ? scope.row.examRecord.score : '-' }}
             </template>
        </el-table-column>
        <el-table-column label="考核结果" width="120">
            <template #default="scope">
                 <span v-if="scope.row.examRecord">
                    <span :style="{ color: scope.row.examRecord.qualified === 1 ? '' : '#f56c6c' }">
                        {{ scope.row.examRecord.qualified === 1 ? '合格' : '不合格' }}
                    </span>
                 </span>
                 <span v-else>-</span>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-link v-if="scope.row.examStatus === 1 || scope.row.examStatus === 2" type="primary" :underline="false" @click="viewResult(scope.row)">
              查看考卷
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-count">总共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, ->, page-sizes"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getStudentExamList } from '../../api/exams.js'; // 确保API路径正确

const router = useRouter();

const loading = ref(true);
const filterParams = reactive({
  name: '',
  examCategory: '',
  examStatus: '',
  result: '',
});
const tableData = ref([]);
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const examStatusMap = { 0: '未开始', 1: '进行中', 2: '已结束' };
const getStatusClass = (status) => {
  switch (status) {
    case 0: return 'status-not-started';
    case 1: return 'status-in-progress';
    case 2: return 'status-finished';
    default: return '';
  }
};

const fetchExamList = async () => {
  loading.value = true;
  try {
    const payload = {
      page: pagination.page,
      size: pagination.size,
      name: filterParams.name,
      examCategory: filterParams.examCategory,
      examStatus: filterParams.examStatus,
    };
    const res = await getStudentExamList(payload);
    if (res.code === 200) {
      tableData.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取列表失败');
    }
  } catch (error) {
    console.error("获取考试列表失败:", error);
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const handleFilter = () => {
  pagination.page = 1;
  fetchExamList();
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  fetchExamList();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchExamList();
};

// [核心修改] 点击标题是进入考试的主要入口
const handleTitleClick = (row) => {
  // 未开始和进行中的考试，点击标题都应该进入“考试开始确认页”
  if (row.examStatus === 0 || row.examStatus === 1) {
    router.push({ name: 'Student-ExamStart', params: { id: row.id } });
  } 
  // 已结束的考试，点击标题直接查看结果
  else if (row.examStatus === 2) {
    router.push({ name: 'Student-ExamResult', params: { id: row.id } });
  }
};

// [核心修改] “查看考卷”按钮统一跳转到结果页
const viewResult = (row) => {
  // 无论状态是“进行中”还是“已结束”，都跳转到结果页
  router.push({ name: 'Student-ExamResult', params: { id: row.id } });
};

onMounted(() => {
  fetchExamList();
});
</script>

<style scoped>
/* 样式部分无需修改 */
.page-container {
  background-color: #ffffff;
  min-height: 100vh;
}
.main-content {
  padding: 24px;
}
.page-header {
  display: flex;
  align-items: center;
  padding: 24px;
  min-height: 140px;
  background-image: url('/src/assets/img/u4045.png');
  background-size: cover;
  background-position: center;
  border-radius: 8px 8px 0 0;
}
.header-icon {
  background-color: #fff;
  color: #1677ff !important;
  border-radius: 4px;
  padding: 4px;
  margin-right: 16px;
}
.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
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
  font-size: 13px;
  color: #f56c6c;
}
.exam-table {
  --el-table-header-bg-color: #fafafa;
}
.status-tag {
  display: inline-block;
  padding: 2px 12px;
  font-size: 12px;
  border-radius: 12px;
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
  justify-content: space-between;
  align-items: center;
}
.total-count {
  font-size: 14px;
  color: #606266;
}
</style>