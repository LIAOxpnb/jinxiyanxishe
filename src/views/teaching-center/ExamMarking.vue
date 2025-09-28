<template>
  <div class="page-wrapper">
    <div class="main-content">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">阅卷</span>
        </template>
      </el-page-header>
      
      <el-form :model="filterParams" inline class="filter-bar">
        <el-form-item>
          <el-input v-model="filterParams.studentName" placeholder="学员姓名" :prefix-icon="Search" clearable />
        </el-form-item>
        <el-form-item>
          <el-select v-model="filterParams.qualified" placeholder="合格结果" clearable style="width: 120px;">
            <el-option label="合格" :value="1" />
            <el-option label="不合格" :value="0" />
          </el-select>
        </el-form-item>
         <el-form-item>
          <el-select v-model="filterParams.status" placeholder="评卷状态" clearable style="width: 120px;">
            <el-option label="已评卷" :value="1" />
            <el-option label="未评卷" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
        </el-form-item>
      </el-form>

      <div class="info-bar">
        <span class="info-text">【备注】未批或所有评分的，不展示已得分</span>
        <el-link type="danger" class="action-link">【可查】可重置阅卷</el-link>
      </div>

      <el-table 
        v-loading="loading"
        :data="tableData" 
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column type="index" label="排序" width="80" />
        <el-table-column prop="studentName" label="学员名称" min-width="120" />
        <el-table-column prop="status" label="评卷状态" min-width="100">
          <template #default="scope">
             <el-tag :type="scope.row.status === 4 ? '' : 'info'" size="small">
              {{ scope.row.status === 4 ? '已评卷' : '未评卷' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" sortable min-width="160" />
        <el-table-column prop="score" label="考试得分" sortable min-width="110">
          <template #default="scope">
            {{ scope.row.status !== 4 ? '-' : scope.row.score }}
          </template>
        </el-table-column>
        <el-table-column prop="qualified" label="合格结果" min-width="100">
          <template #default="scope">
             <span :style="{ color: scope.row.qualified === 0 ? '#f56c6c' : '' }">
               {{ scope.row.status !== 4 ? '-' : (scope.row.qualified === 1 ? '合格' : '不合格') }}
             </span>
          </template>
        </el-table-column>
        <el-table-column prop="markerName" label="阅卷人" min-width="110" />
        <el-table-column prop="gradeTime" label="阅卷时间" min-width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="startMarking(scope.row)">评分</el-button>
          </template>
        </el-table-column>
      </el-table>

       <div class="table-footer">
        <span class="total-count">总共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
// 1. 导入API函数
import { getMarkingList } from '../../api/teaching-center/Exams.js'; 

const router = useRouter();
const route = useRoute();

// 2. 响应式状态管理
const loading = ref(true);
const examId = ref(null); // 用于存储从路由获取的考试ID
const tableData = ref([]);

// 筛选参数
const filterParams = reactive({
  // 注意：接口文档中没有学员姓名筛选，此处为UI保留，实际请求时可能需忽略
  studentName: '', 
  qualified: '', // 对应接口的 qualified
  status: '',      // 对应接口的 status
});

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

// 3. API数据获取
const fetchSubmissions = async () => {
  loading.value = true;
  try {
    // 准备发送给后端的参数
    const payload = {
      examId: examId.value,
      qualified: filterParams.qualified,
      status: filterParams.status,
      page: pagination.page,
      size: pagination.size,
    };
    // 调用获取阅卷列表的API
    const res = await getMarkingList(payload);
    if (res.code === 200) {
      // 假设后端返回的数据结构是 { records: [], total: 0 }
      // 使用后端接口返回的字段：userName -> studentName, graderName -> markerName
      const records = (res.data.records || []).map(r => ({
        ...r,
        studentName: r.userName || r.studentName || '',
        markerName: r.graderName || r.markerName || ''
      }));
      tableData.value = records;
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取阅卷列表失败');
    }
  } catch (error) {
    console.error("获取阅卷列表失败:", error);
    ElMessage.error('获取阅卷列表失败');
  } finally {
    loading.value = false;
  }
};

// 4. 事件处理
const goBack = () => {
  router.back();
};

const handleFilter = () => {
  pagination.page = 1;
  fetchSubmissions();
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  fetchSubmissions();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchSubmissions();
};

const startMarking = (row) => {
  // 跳转到单个试卷的评分页面
  router.push({
    name: 'TeachingCenter-GradePaper',
    params: { id: row.id } // 假设row.id是学生提交记录的ID
  });
};

// 5. 页面加载时执行
onMounted(() => {
  const id = route.params.id;
  if (id) {
    examId.value = id;
    fetchSubmissions(); // 加载初始数据
  } else {
    ElMessage.error('无效的考试ID');
    loading.value = false;
  }
});
</script>

<style scoped>
.page-wrapper {
  padding: 20px;
}
.main-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
}
.page-header-title {
  font-size: 20px;
  font-weight: 600;
}
.filter-bar {
  margin-top: 20px;
}
.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fcfcfc;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 20px;
  font-size: 13px;
}
.info-text {
  color: #f56c6c;
}
.action-link {
  font-size: 13px;
}
.el-table {
  margin-top: 16px;
}
.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-count {
  font-size: 14px;
  color: #606266;
}
</style>