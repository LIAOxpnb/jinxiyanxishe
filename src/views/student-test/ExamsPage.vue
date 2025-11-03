<template>
  <div class="page-container">
    <div class="page-header">
      <el-icon :size="32" color="#fff" class="header-icon"><Document /></el-icon>
      <h1 style="color: #3370FF">正式考试</h1>
    </div>

    <div class="main-content">
      <div class="filter-bar">
        <el-input v-model="filterParams.name" placeholder="搜索" class="search-input" clearable @keyup.enter="handleFilter" @clear="handleFilter">
          <template #append>
            <el-button :icon="Search" @click="handleFilter" />
          </template>
        </el-input>
        <el-select v-model="filterParams.examCategory" placeholder="分类" clearable @change="handleFilter">
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="filterParams.examStatus" placeholder="状态" clearable @change="handleFilter">
          <el-option label="未开始" value="0"></el-option>
          <el-option label="进行中" value="1"></el-option>
          <el-option label="已结束" value="2"></el-option>
        </el-select>
        <el-select v-model="filterParams.result" placeholder="考核结果" clearable @change="handleFilter">
           <el-option label="合格" value="1"></el-option>
           <el-option label="不合格" value="0"></el-option>
        </el-select>
        <!-- <span class="filter-note">【备注】设置了可查看考卷的显示相关操作</span> -->
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
                <span v-if="scope.row.examRecord">
                  <span v-if="scope.row.examRecord.status === 4">
                    {{ scope.row.examRecord.score }}
                  </span>
                  <span v-else-if="scope.row.examRecord.status === 0" style="color: #909399;">未完成</span>
                  <span v-else-if="scope.row.examRecord.status === 1" style="color: #e6a23c;">待修改</span>
                  <span v-else-if="scope.row.examRecord.status === 2" style="color: #409eff;">阅卷中</span>
                  <span v-else-if="scope.row.examRecord.status === 3" style="color: #f56c6c;">修改异常</span>
                  <span v-else style="color: #909399;">-</span>
                </span>
                <span v-else>-</span>
             </template>
        </el-table-column>
        <el-table-column label="考核结果" width="120">
            <template #default="scope">
                <span v-if="scope.row.examRecord">
                  <span v-if="scope.row.examRecord.status === 4">
                    <span :style="{ color: scope.row.examRecord.qualified === 1 ? '' : '#f56c6c' }">
                        {{ scope.row.examRecord.qualified === 1 ? '合格' : '不合格' }}
                    </span>
                  </span>
                  <span v-else-if="scope.row.examRecord.status === 0" style="color: #909399;">未完成</span>
                  <span v-else-if="scope.row.examRecord.status === 1" style="color: #e6a23c;">待修改</span>
                  <span v-else-if="scope.row.examRecord.status === 2" style="color: #409eff;">阅卷中</span>
                  <span v-else-if="scope.row.examRecord.status === 3" style="color: #f56c6c;">修改异常</span>
                  <span v-else style="color: #909399;">-</span>
                </span>
                <span v-else>-</span>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-link v-if="(scope.row.examStatus === 1 || scope.row.examStatus === 2)&& scope.row.viewPaper === 1" type="primary" :underline="false" @click="viewResult(scope.row)">
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
          :page-sizes="[5, 10, 15, 20]"
          :small="false"
          :background="true"
          layout="sizes, prev, pager, next"
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
import { getDictData } from '@/api/system-management/dictionary';

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
  size: 5,
  total: 0,
});
const categoryOptions = ref([]);

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
      // result 参数后端不支持，前端自己筛选
    };
    const res = await getStudentExamList(payload);
    if (res.code === 200) {
      const records = res.data.records || [];
      
      // 【前端筛选】根据考核结果筛选
      let filteredData = records;
      if (filterParams.result !== '') {
        filteredData = records.filter(item => {
          // 只有有考试记录的才能筛选
          if (!item.examRecord) return false;
          
          // result: "1" 表示合格，"0" 表示不合格
          if (filterParams.result === '1') {
            return item.examRecord.qualified === 1;
          } else if (filterParams.result === '0') {
            return item.examRecord.qualified === 0;
          }
          return true;
        });
      }
      
      tableData.value = filteredData;
      pagination.total = res.data.total || 0; // 保持后端的总数
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

// 【新增】获取考试分类选项
const fetchCategories = async () => {
  try {
    const res = await getDictData('exam_category');
    if (res.code === 200) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue,
      }));
    }
  } catch (error) {
    console.error("获取考试分类失败", error);
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
  // 场景1：未开始(0)和进行中(1)的考试
  if (row.examStatus === 0 || row.examStatus === 1) {
    
    // 【第1道关卡：检查考试次数是否用完】
    // (row.attempts !== -1) 意味着 "次数有限制"
    // (row.attemptedTimes || 0) >= row.attempts 意味着 "已用次数 >= 总次数"
    // (|| 0 是为了防止 attemptedTimes 为 null 或 undefined 时出错)
    if (row.attempts !== -1 && (row.attemptedTimes || 0) >= row.attempts) {
      ElMessage.warning('您的考试次数已用完，无法继续考试');
      return; // 阻止跳转
    }

    // 【第2道关卡：检查上一份考卷是否正在处理中】
    // (修复了括号BUG：所有 status 检查都必须在 row.examRecord 存在的前提下)
    // 状态 1:待修改, 2:阅卷中, 3:修改异常
    // (我们不再需要检查 status 4，因为次数限制已在上面处理)
    if (row.examRecord && (row.examRecord.status === 1 || row.examRecord.status === 2 || row.examRecord.status === 3)) {
      
      let msg = '您的考卷正在处理中，请稍后';
      if (row.examRecord.status === 2) {
        msg = '您的考卷正在批阅中，请稍后';
      } else if (row.examRecord.status === 1) {
        msg = '您的考卷正等待修改，请稍后';
      } else if (row.examRecord.status === 3) {
        msg = '您的考卷修改异常，请联系管理员';
      }
      
      ElMessage.warning(msg);
      return; // 阻止跳转
    }

    // --- 允许跳转 ---
    // 能运行到这里，说明：
    // 1. 考试次数未用完 (或不限制)
    // 2. 并且，没有“正在处理中”的考卷
    //
    // 允许跳转的场景:
    // 1. !row.examRecord (首次尝试)
    // 2. row.examRecord.status === 0 (未完成，可以继续)
    // 3. row.examRecord.status === 4 (已评分，可以开始新尝试)
    router.push({ name: 'Student-ExamStart', params: { id: row.id } });
    
  } 
  // 场景2：已结束的考试(2)，点击标题直接查看结果
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
  fetchCategories(); // 【新增】加载分类选项
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
  min-height: 150px;
  background-image: url('/src/assets/img/u4045.png');
  background-size: cover;
  background-position: center;
  /* border-radius: 8px 8px 0 0; */
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