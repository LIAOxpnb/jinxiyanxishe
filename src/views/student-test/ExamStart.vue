<template>
  <div class="exam-start-page" v-loading="loading">
    <!-- 左上角logo和文字 -->
    <div class="top-header">
      <div class="logo-container">
        <!-- <img src="/src/assets/img/u71.png" alt="logo" class="logo-img">
        <span class="logo-text">金析研习社</span> -->
      </div>
    </div>
    
    <!-- 移除 .top-header, 背景将由 CSS 控制 -->
    <div class="card-wrapper">
      <div class="exam-card">
        <h2 class="exam-title">{{ examDetail.name || '考试名称加载中...' }}</h2>

        <div class="info-grid">
          <div class="info-item">
            <span>考生姓名:</span>
            <span class="info-value">{{ userName || '-' }}</span>
          </div>
          <div class="info-item">
            <span>归属组织:</span>
            <span class="info-value">{{examDetail.orgName }}</span>
          </div>
          <div class="info-item">
            <span>考试时长:</span>
            <span class="info-value">{{ examDetail.duration === -1 || examDetail.duration === 0 ? '不限制' :
              `${examDetail.duration}分钟` }}</span>
          </div>
          <div class="info-item">
            <span>试卷总分:</span>
            <span class="info-value">{{ examDetail.score || '-' }}分</span>
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
            <span class="info-value">{{ examDetail.attempts === -1 ? '不限制' :
              `${examDetail.attemptedTimes || 0}/${examDetail.attempts}次` }}</span>
          </div>
          <div class="info-item">
            <span>考试时间:</span>
            <span class="info-value" style="white-space: nowrap;">
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { getStudentExamDetail } from '@/api/exams.js'; // 确保路径正确
import { getInfo } from '@/api/common/info.js';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const examId = ref(null);
const examDetail = ref({});
const userName = ref(''); // 存储考生姓名

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getInfo();
    if (res.code === 200 && res.data) {
      userName.value = res.data.name || '';
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 获取考试详情
const fetchExamDetail = async () => {
  loading.value = true;
  try {
    const res = await getStudentExamDetail(examId.value);
    
    if (res.code === 200 && res.data) {
      examDetail.value = res.data;
      // 后端返回的examStatus可能是数字，这里统一转为字符串方便比较
      examDetail.value.examStatus = String(examDetail.value.examStatus); 
      
      // 检查是否有暂存的答题记录
      if (res.data.examRecord && res.data.examRecord.id) {
        checkContinueExam(res.data.examRecord.id);
      }
    } else {
      ElMessage.error(res.msg || '获取考试详情失败');
    }
  } catch (error) {
    ElMessage.error('获取考试详情失败');
  } finally {
    loading.value = false;
  }
};

// 检查是否继续答题
const checkContinueExam = (recordId) => {
  ElMessageBox.confirm(
    '检测到您有未完成的答题记录，是否继续答题？',
    '提示',
    {
      confirmButtonText: '继续答题',
      cancelButtonText: '重新考试',
      type: 'warning',
      distinguishCancelAndClose: true,
    }
  )
    .then(() => {
      // 继续答题，带上recordId
      router.push({
        name: 'Student-TakeExam',
        params: { id: examId.value },
        query: { recordId: recordId }
      });
    })
    .catch((action) => {
      if (action === 'cancel') {
        // 重新考试，带上recordId用于重置
        router.push({
          name: 'Student-TakeExam',
          params: { id: examId.value },
          query: { recordId: recordId, restart: 'true' }
        });
      }
    });
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
    fetchUserInfo(); // 获取用户信息
    fetchExamDetail();
  } else {
    ElMessage.error('无效的考试ID');
    loading.value = false;
  }
});
</script>

<style scoped>
.exam-start-page {
  /* 1. 使用 flex 布局将内容垂直居中 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 主要内容垂直居中 */
  align-items: center;
  /* 2. 确保页面占满整个视口高度，但不超出 */
  height: 100vh;
  width: 100vw;
  background-color: #EEEFF1;
  /* 3. 添加一个伪元素作为背景层 */
  position: absolute; /* 改为absolute定位 */
  top: 0;
  left: 0;
  overflow: hidden; /* 防止滚动条出现 */
  box-sizing: border-box; /* 确保padding包含在高度内 */
}

/* 隐藏滚动条的全局样式 */
:global(html), :global(body) {
  overflow: hidden !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}

:global(#app) {
  overflow: hidden !important;
  height: 100vh !important;
}

/* 顶部logo容器 */
.top-header {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10; /* 确保在背景层之上 */
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px; /* logo和文字之间的间距 */
}

.logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #ffffff; /* 白色文字，在蓝色背景上显示清楚 */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* 添加文字阴影增强可读性 */
}

.exam-start-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px; /* 背景层高度 */
  background: url('/src/assets/img/123444.png') no-repeat center center;
  background-size: cover;
  z-index: 0; /* 确保在内容之下 */
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: black;
}

.card-wrapper {
  /* 4. 移除负边距，让 flex 布局处理居中 */
  width: 90%; /* 使用百分比宽度，并设置最大宽度 */
  max-width: 1000px; /* 增加最大宽度到1000px */
  max-height: 90vh; /* 限制最大高度，确保不超出视口 */
  z-index: 1; /* 确保卡片在背景层之上 */
  margin: 0; /* 移除所有外边距 */
  overflow: visible; /* 允许内容正常显示 */
}

.exam-card {
  height: 570px;
  background-color: #fff;
  border-radius: 8px;
  padding: 30px; /* 减少内边距以节省空间 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-height: 100%; /* 确保卡片不超出容器 */
  box-sizing: border-box; /* 确保padding包含在高度内 */
}

.exam-title {
  font-size: 24px; /* 减小字体大小以节省空间 */
  font-weight: bold;
  color: #303133;
  margin-top: 0;
  margin-bottom: 30px; /* 减小底部边距 */
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* 增加最小宽度，确保考试时间不换行 */
  gap: 15px 30px; /* 减小间距以节省空间 */
  text-align: left;
  margin-bottom: 30px; /* 减小底部边距 */
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #606266;
}

.info-item span:first-child {
  flex-shrink: 0;
  width: 90px;
  color: #909399;
  text-align: right;
  margin-right: 10px;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.action-buttons {
  margin-top: 20px; /* 减小顶部边距 */
}

.action-buttons .el-button {
  width: 200px;
  height: 44px; /* 稍微减小高度 */
  font-size: 16px; /* 减小字体大小 */
}
</style>