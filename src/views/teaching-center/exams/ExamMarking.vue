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
        <el-form-item>
          <el-button type="success" @click="handleExportExamQuestionDetail">导出考题详情</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" @click="handleExportStudentExamQuestionDetail">导出考生考题详情</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="handleExportStudentWrongQuestionDetail">导出考生错题详情</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="info" @click="handleViewExamProgress">查看考试情况</el-button>
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
        <el-table-column prop="createTime" label="提交时间" sortable min-width="160" />
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
  
  <!-- 题目选择弹窗 -->
  <el-dialog
    v-model="showQuestionSelectDialog"
    title="选择要导出的题目"
    width="60%"
    :before-close="() => showQuestionSelectDialog = false"
  >
    <div class="question-select-content">
      <div class="select-all-bar">
        <el-checkbox 
          :model-value="isAllSelected" 
          @change="toggleSelectAll"
        >
          全选
        </el-checkbox>
        <span class="selected-count">
          已选择 {{ questionList.filter(q => q.selected).length }} / {{ questionList.length }} 道题目
        </span>
      </div>
      
      <div class="question-list">
        <el-empty v-if="questionList.length === 0" description="暂无题目" />
        <div v-else class="question-items">
          <div 
            v-for="(question, index) in questionList" 
            :key="question.questionId"
            class="question-item"
          >
            <el-checkbox v-model="question.selected">
              <div class="question-info">
                <span class="question-index">第{{ index + 1 }}题</span>
                <span class="question-type">【{{ question.questionType || '未知类型' }}】</span>
                <span class="question-score">({{ question.score || 0 }}分)</span>
                <el-tooltip 
                  v-if="question.title && question.title.length > 50"
                  :content="question.title" 
                  placement="top" 
                  :show-after="500"
                >
                  <div class="question-title truncated" v-html="question.title || '无标题'"></div>
                </el-tooltip>
                <div v-else class="question-title" v-html="question.title || '无标题'"></div>
              </div>
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showQuestionSelectDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmExportQuestions"
          :disabled="questionList.filter(q => q.selected).length === 0"
        >
          确认导出
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 考试情况弹窗 -->
  <el-dialog
    v-model="showExamProgressDialog"
    title="考试情况"
    width="80%"
    :before-close="() => showExamProgressDialog = false"
  >
    <div v-loading="progressLoading">
      <el-row :gutter="20">
        <!-- 参加考试的用户 -->
        <el-col :span="12">
          <el-card class="exam-status-card">
            <template #header>
              <div class="card-header">
                <span>参加考试 ({{ examProgressData.hasRecordUsers?.length || 0 }}人)</span>
                <el-tag type="success">已参加</el-tag>
              </div>
            </template>
            <el-table 
              :data="examProgressData.hasRecordUsers || []" 
              style="width: 100%"
              :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
              empty-text="暂无数据"
              max-height="400"
            >
              <el-table-column prop="name" label="姓名" min-width="80" />
              <el-table-column prop="policeNumber" label="警号" min-width="80" />
              <el-table-column prop="orgName" label="组织" min-width="80" />
              <!-- <el-table-column prop="status" label="状态" min-width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 0 ? 'success' : 'info'" size="small">
                    {{ row.status === 0 ? '正常' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column> -->
            </el-table>
          </el-card>
        </el-col>
        
        <!-- 未参加考试的用户 -->
        <el-col :span="12">
          <el-card class="exam-status-card">
            <template #header>
              <div class="card-header">
                <span>未参加考试 ({{ examProgressData.noRecordUsers?.length || 0 }}人)</span>
                <el-tag type="danger">未参加</el-tag>
              </div>
            </template>
            <el-table 
              :data="examProgressData.noRecordUsers || []" 
              style="width: 100%"
              :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
              empty-text="暂无数据"
              max-height="400"
            >
              <el-table-column prop="name" label="姓名" min-width="80" />
              <el-table-column prop="policeNumber" label="警号" min-width="80" />
              <el-table-column prop="orgName" label="组织" min-width="80" />
              <!-- <el-table-column prop="status" label="状态" min-width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 0 ? 'success' : 'info'" size="small">
                    {{ row.status === 0 ? '正常' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column> -->
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showExamProgressDialog = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- ... -->
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
// 1. 导入API函数
import { getMarkingList, getExamDetail, exportExamQuestionDetail, exportStudentExamQuestionDetail, exportStudentWrongQuestionDetail, getExamProgressInfo } from '../../../api/teaching-center/Exams.js'; 

const router = useRouter();
const route = useRoute();

// 2. 响应式状态管理
const loading = ref(true);
const examId = ref(null); // 用于存储从路由获取的考试ID
const tableData = ref([]);

// 题目选择弹窗相关
const showQuestionSelectDialog = ref(false);
const questionList = ref([]);
const isAllSelected = computed(() => {
  return questionList.value.length > 0 && questionList.value.every(q => q.selected);
});

// 考试情况弹窗相关
const showExamProgressDialog = ref(false);
const progressLoading = ref(false);
const examProgressData = ref([]);

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

// 导出考题详情
const handleExportExamQuestionDetail = async () => {
  try {
    // 获取考试详情和题目列表
    const res = await getExamDetail(examId.value);
    if (res.code === 200 && res.data.examQuestionList) {
      // 设置题目列表和显示弹窗，需要从嵌套的question对象中提取数据
      questionList.value = res.data.examQuestionList.map((q, index) => ({
        ...q,
        questionId: q.questionId, // 使用questionId作为导出参数
        questionType: q.question?.questionType || '未知类型',
        title: q.question?.title || '无标题',
        score: q.score || 0,
        selected: false
      }));
      showQuestionSelectDialog.value = true;
    } else {
      ElMessage.error(res.msg || '获取题目列表失败');
    }
  } catch (error) {
    console.error('获取题目列表失败:', error);
    ElMessage.error('获取题目列表失败');
  }
};

// 确认导出选中的题目
const confirmExportQuestions = async () => {
  const selectedQuestions = questionList.value.filter(q => q.selected);
  
  if (selectedQuestions.length === 0) {
    ElMessage.warning('请至少选择一道题目');
    return;
  }
  
  try {
    const data = {
      examId: examId.value,
      questionIds: selectedQuestions.map(q => q.questionId)
    };
    
    const response = await exportExamQuestionDetail(data);
    
    // 创建blob对象
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '考题详情.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('导出考题详情成功');
    showQuestionSelectDialog.value = false;
  } catch (error) {
    console.error('导出考题详情失败:', error);
    ElMessage.error('导出考题详情失败');
  }
};

// 全选/取消全选
const toggleSelectAll = () => {
  const newValue = !isAllSelected.value;
  questionList.value.forEach(q => {
    q.selected = newValue;
  });
};

// 导出考生考题详情
const handleExportStudentExamQuestionDetail = async () => {
  try {
    const params = {
      examId: examId.value
    };
    
    const response = await exportStudentExamQuestionDetail(params);
    
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '考生考题详情.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('导出考生考题详情成功');
  } catch (error) {
    console.error('导出考生考题详情失败:', error);
    ElMessage.error('导出考生考题详情失败');
  }
};

// 导出考生错题详情
const handleExportStudentWrongQuestionDetail = async () => {
  try {
    const params = {
      examId: examId.value
    };
    
    const response = await exportStudentWrongQuestionDetail(params);
    
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '考生错题详情.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('导出考生错题详情成功');
  } catch (error) {
    console.error('导出考生错题详情失败:', error);
    ElMessage.error('导出考生错题详情失败');
  }
};

// 查看考试情况
const handleViewExamProgress = async () => {
  progressLoading.value = true;
  try {
    const params = {
      examId: examId.value
    };
    
    const res = await getExamProgressInfo(params);
    if (res.code === 200) {
      examProgressData.value = res.data || {};
      showExamProgressDialog.value = true;
    } else {
      ElMessage.error(res.msg || '获取考试情况失败');
    }
  } catch (error) {
    console.error('获取考试情况失败:', error);
    ElMessage.error('获取考试情况失败');
  } finally {
    progressLoading.value = false;
  }
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

/* 题目选择弹窗样式 */
.question-select-content {
  max-height: 60vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.select-all-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.selected-count {
  color: #909399;
  font-size: 14px;
}

.question-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.question-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.question-item:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.question-info {
  margin-left: 8px;
}

.question-index {
  font-weight: 600;
  color: #409eff;
  margin-right: 8px;
}

.question-type {
  color: #67c23a;
  margin-right: 8px;
  font-weight: 500;
}

.question-score {
  color: #e6a23c;
  font-weight: 500;
}

.question-title {
  margin-top: 8px;
  color: #303133;
  line-height: 1.6;
}

.question-title.truncated {
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 考试情况弹窗样式 */
.exam-status-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.card-header span {
  font-size: 16px;
  color: #303133;
}
</style>