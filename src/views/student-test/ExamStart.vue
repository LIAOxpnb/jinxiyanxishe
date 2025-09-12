<template>
  <div class="exam-start-page" v-loading="loading">
    <div class="top-header">
      <span class="logo">金析研习社</span>
    </div>

    <div class="card-wrapper">
      <div class="exam-card">
        <h2 class="exam-title">{{ examDetail.name || '考试名称加载中...' }}</h2>

        <div class="info-grid">
          <div class="info-item">
            <span>考生姓名:</span>
            <span class="info-value">考生姓名</span> </div>
          <div class="info-item">
            <span>归属组织:</span>
            <span class="info-value">组织名称</span> </div>
          <div class="info-item">
            <span>考试时长:</span>
            <span class="info-value">{{ examDetail.duration === -1 || examDetail.duration === 0 ? '不限制' : `${examDetail.duration}分钟` }}</span>
          </div>
          <div class="info-item">
            <span>试卷总分:</span>
            <span class="info-value">{{ examDetail.totalScore || '-' }}分</span>
          </div>
          <div class="info-item">
            <span>题目数量:</span>
            <span class="info-value">{{ examDetail.examQuestionList?.length || '-' }}题</span>
          </div>
          <div class="info-item">
            <span>合格分数:</span>
            <span class="info-value">{{ examDetail.qualified || '-' }}分</span>
          </div>
          <div class="info-item">
            <span>考试次数:</span>
            <span class="info-value">{{ examDetail.attempts === -1 ? '不限制' : `${examDetail.attemptedTimes || 0}/${examDetail.attempts}次` }}</span>
          </div>
          <div class="info-item">
            <span>考试时间:</span>
            <span class="info-value">
              <template v-if="examDetail.examDate === 0">不限时</template>
              <template v-else>
                {{ examDetail.startTime || 'YY-MM-DD HH:mm' }} 至 {{ examDetail.endTime || 'YY-MM-DD HH:mm' }}
              </template>
            </span>
          </div>
        </div>

        <div class="action-buttons">
          <el-button v-if="examDetail.examStatus === '0'" type="info" disabled>未开考</el-button>
          <el-button v-else type="primary" @click="startExam">开始考试</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getStudentExamDetail } from '@/api/exams.js'; // 确保路径正确

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const examId = ref(null);
const examDetail = ref({});

// 获取考试详情
const fetchExamDetail = async () => {
  loading.value = true;
  try {
    const res = await getStudentExamDetail(examId.value);
    if (res.code === 200 && res.data) {
      examDetail.value = res.data;
      // 后端返回的examStatus可能是数字，这里统一转为字符串方便比较
      examDetail.value.examStatus = String(examDetail.value.examStatus); 
    } else {
      ElMessage.error(res.msg || '获取考试详情失败');
    }
  } catch (error) {
    console.error('获取考试详情失败:', error);
    ElMessage.error('获取考试详情失败');
  } finally {
    loading.value = false;
  }
};

// 开始考试，跳转到答题页面
const startExam = () => {
  if (examDetail.value.examStatus !== '1') { // 确保考试状态是“进行中”
    ElMessage.warning('考试当前不可开始');
    return;
  }
  router.push({ name: 'Student-TakeExam', params: { id: examId.value } });
};

onMounted(() => {
  examId.value = route.params.id;
  if (examId.value) {
    fetchExamDetail();
  } else {
    ElMessage.error('无效的考试ID');
    loading.value = false;
  }
});
</script>

<style scoped>
.exam-start-page {
  min-height: 100vh;
  background-color: #f0f2f5; /* 页面背景色 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-header {
  width: 100%;
  height: 200px; /* 头部蓝色背景高度 */
  background: url('/src/assets/img/u4045.png') no-repeat center center; /* 确保路径正确 */
  background-size: cover;
  display: flex;
  align-items: flex-start;
  padding: 24px;
  position: relative;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.card-wrapper {
  margin-top: -120px; /* 使卡片向上覆盖蓝色背景 */
  width: 80%; /* 卡片宽度 */
  max-width: 800px; /* 最大宽度限制 */
  z-index: 1; /* 确保卡片在蓝色背景之上 */
}

.exam-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.exam-title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 40px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 40px; /* 行间距和列间距 */
  text-align: left;
  margin-bottom: 40px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #606266;
}

.info-item span:first-child {
  flex-shrink: 0;
  width: 90px; /* 标签固定宽度 */
  color: #909399;
  text-align: right;
  margin-right: 10px;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.action-buttons {
  margin-top: 30px;
}

.action-buttons .el-button {
  width: 200px;
  height: 48px;
  font-size: 18px;
}
</style>