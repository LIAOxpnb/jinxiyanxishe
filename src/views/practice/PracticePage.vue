<template>
  <div class="page-container">
    <div class="page-header">
      <el-icon :size="32" color="#fff" class="header-icon"><Collection /></el-icon>
      <h1 style="color: #3370FF;">随堂练习</h1>
    </div>

    <div class="main-content">
      <FilterBar
        :fields="filterFields"
        :show-create-button="false"
        @filter="handleFilter"
      />

      <!-- <div class="remark-bar">
        <span>【备注】练习需批阅，已批阅的显示分数，未批阅的显示待批阅</span>
      </div> -->

      <el-table :data="tableData" v-loading="loading" style="width: 100%" class="practice-table">
        <el-table-column prop="name" label="标题" min-width="250">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="startPractice(scope.row)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="practiceCategoryName" label="分类" width="150" />
        <el-table-column prop="attempts" label="练习次数" width="120">
          <template #default="scope">
            {{ scope.row.attempts === -1 ? '不限制' : `${scope.row.attemptedTimes || 0}/${scope.row.attempts || '不限'}` }}
          </template>
        </el-table-column>
        <el-table-column prop="questionCount" label="试题数" width="120" />
        <!-- <el-table-column prop="score" label="最高分/总分" width="150">
          <template #default="scope">
            {{ `${scope.row.highestScore || '-'}/${scope.row.totalScore || 100}` }}
          </template>
        </el-table-column> -->
        <el-table-column prop="relatedCourseName" label="关联课程" width="200" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="openHistoryDialog(scope.row)">
              练习历史
            </el-link>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-if="pagination.total > 0"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          background
          @size-change="fetchPracticeList"
          @current-change="fetchPracticeList"
        />
      </div>
    </div>
    
 <PracticeHistoryDialog
  v-model:visible="historyDialogVisible"
  :practice-data="activePractice"
/>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Collection } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';
import { getStudentPracticeList } from '@/api/practice.js';
import { getDictByType } from '@/api/system-management/dictionary.js';
// 【已添加】引入新组件
import PracticeHistoryDialog from './PracticeHistoryDialog.vue'; 

const router = useRouter();
const loading = ref(true);
const tableData = ref([]);
const categoryMap = ref({});

// 【已添加】控制历史弹窗的状态
const historyDialogVisible = ref(false);
const activePractice = ref(null);

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});
const filters = ref({});

const filterFields = ref([
  { type: 'input', model: 'name', placeholder: '搜索' },
  { type: 'select', model: 'practiceCategory', placeholder: '分类', options: [] }
]);

const fetchCategories = async () => {
  try {
    const res = await getDictByType('course_category');
    if (res.code === 200 && res.data) {
      const options = res.data.map(item => {
        categoryMap.value[item.dictValue] = item.dictLabel;
        return { label: item.dictLabel, value: item.dictValue };
      });
      if(filterFields.value.length > 1) {
        filterFields.value[1].options = options;
      }
    }
  } catch (error) {
    console.error("获取分类失败:", error);
  }
};

const fetchPracticeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filters.value,
    };
    
    const res = await getStudentPracticeList(params);
    
    if (res.code === 200) {
      const records = Array.isArray(res.data) ? res.data : (res.data?.records || []);
      
      tableData.value = records.map(item => {
        let courseName = '无';
        if (item.course && item.course.name) {
          courseName = item.course.name;
        } else if (item.courseName) {
          courseName = item.courseName;
        }
        
        let categoryName = '未分类';
        if (item.course && item.course.courseCategory) {
          categoryName = categoryMap.value[item.course.courseCategory] || `分类${item.course.courseCategory}`;
        } else if (item.practiceCategory) {
          categoryName = categoryMap.value[item.practiceCategory] || `分类${item.practiceCategory}`;
        }
        
        return {
          ...item,
          relatedCourseName: courseName,
          practiceCategoryName: categoryName,
          questionCount: item.questionCount || 0,
          highestScore: item.highestScore !== undefined ? item.highestScore : '-',
          totalScore: item.totalScore || 100,
          attemptedTimes: item.attemptedTimes || 0,
          attempts: item.attempts !== undefined ? item.attempts : -1,
        };
      });
      
      pagination.total = Array.isArray(res.data) ? res.data.length : (res.data?.total || 0);
    } else {
      tableData.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error("获取练习列表异常:", error);
    ElMessage.error('获取列表失败，请稍后重试');
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleFilter = (filterData) => {
  filters.value = filterData;
  pagination.page = 1;
  fetchPracticeList();
};

const startPractice = (row) => {
  
  router.push({ name: 'TakePractice', params: { id: row.id } });
};

// 【已修改】原 viewHistory 函数重命名为 openHistoryDialog
const openHistoryDialog = (row) => {
  console.log('查看历史:', row);
  activePractice.value = row;
  historyDialogVisible.value = true;
};

onMounted(async () => {
  console.log('页面加载开始');
  try {
    await fetchCategories();
    await fetchPracticeList();
  } catch (error) {
    console.error('页面初始化失败:', error);
  }
});
</script>

<style scoped>
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
  background-image: url('@/assets/img/u4247.png');
  background-size: cover;
  background-position: center;
}
.header-icon {
  background-color: #fff;
  color: #409eff !important;
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
.remark-bar {
  background-color: #fcfcfc;
  border: 1px solid #e6e6e6;
  border-top: none;
  padding: 12px 16px;
  font-size: 13px;
  color: #f56c6c;
  border-radius: 0 0 4px 4px;
  margin-top: -1px;
  margin-bottom: 20px;
}
.practice-table {
  --el-table-header-bg-color: #fafafa;
}
.table-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>