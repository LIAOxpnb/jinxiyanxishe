<template>
  <div class="take-exam-container" v-loading="loading && !examDetails">
    <template v-if="examDetails">
      <div class="exam-header">
        <div class="exam-title">{{ examDetails.name }}</div>
        <div class="exam-actions">
          <span class="countdown">剩余时间: {{ formattedCountdown }}</span>
          <el-button type="primary" @click="confirmSubmit">交卷</el-button>
        </div>
      </div>

      <div class="exam-body">
        <div class="left-panel">
          <el-card class="box-card">
            <template #header>
              <div class="clearfix">
                <span>答题卡</span>
                <span style="float: right;">{{ answeredCount }}/{{ questionList.length }}</span>
              </div>
            </template>
            <div class="question-nav-grid">
              <div v-for="(q, index) in questionList" :key="q.questionId" class="nav-item" :class="{
                'answered': isAnswered(q.question.id),
                'current': currentQuestionIndex === index
              }" @click="goToQuestion(index)">
                {{ index + 1 }}
              </div>
            </div>
          </el-card>
        </div>

        <div class="right-panel">
          <!-- 只显示当前题目 -->
          <TakeExamQuestionCard 
            v-if="questionList.length > 0 && currentQuestionIndex < questionList.length"
            :key="questionList[currentQuestionIndex].questionId" 
            :question-data="questionList[currentQuestionIndex]"
            :index="currentQuestionIndex" 
            v-model="answers[questionList[currentQuestionIndex].question.id]" 
          />

          <!-- 翻页按钮 -->
          <div class="pagination-controls">
            <el-button 
              @click="previousQuestion" 
              :disabled="currentQuestionIndex === 0"
              size="large"
            >
              上一题
            </el-button>
            
            <span class="question-progress">
              第 {{ currentQuestionIndex + 1 }} / {{ questionList.length }} 题
            </span>
            
            <el-button 
              @click="nextQuestion" 
              :disabled="currentQuestionIndex === questionList.length - 1"
              type="primary"
              size="large"
            >
              下一题
            </el-button>
          </div>
        </div>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="无法加载考试信息"></el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getStudentExamDetail, submitStudentExamPaper } from '@/api/exams.js';
import TakeExamQuestionCard from '@/components/exam/TakeExamQuestionCard.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const examId = ref(null);
const examDetails = ref(null);
const questionList = ref([]);
const answers = reactive({});
const currentQuestionIndex = ref(0); // 当前题目索引

// --- 倒计时逻辑 ---
let timerInterval = null;
const remainingSeconds = ref(0);
const formattedCountdown = computed(() => {
  if (remainingSeconds.value === Infinity) return '不限时';
  const hours = Math.floor(remainingSeconds.value / 3600);
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60);
  const seconds = remainingSeconds.value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const startTimer = (durationMinutes) => {
  if (durationMinutes <= 0 || durationMinutes === -1) {
    remainingSeconds.value = Infinity;
    return;
  }
  remainingSeconds.value = durationMinutes * 60;
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      clearInterval(timerInterval);
      ElMessage.warning('考试时间到，系统将自动交卷！');
      submitExam();
    }
  }, 1000);
};

// --- 阻止复制的事件处理函数 ---
const preventCopy = (e) => {
  e.preventDefault();
  ElMessage.warning('本次考试禁止复制题目内容！');
};

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);

  if (examDetails.value && examDetails.value.disableCopy === 1) {
    const examContainer = document.querySelector('.take-exam-container');
    if (examContainer) {
      examContainer.removeEventListener('copy', preventCopy);
      examContainer.removeEventListener('cut', preventCopy);
      examContainer.removeEventListener('contextmenu', preventCopy);
    }
  }
});

// --- 页面逻辑 ---
const answeredCount = computed(() => {
  return Object.values(answers).filter(ans => {
    if (Array.isArray(ans)) return ans.length > 0;
    return !!ans;
  }).length;
});

const isAnswered = (questionId) => {
  const ans = answers[questionId];
  if (Array.isArray(ans)) {
    return ans.some(item => item !== null && item !== '');
  }
  return !!ans; 
};

// 跳转到指定题目
const goToQuestion = (index) => {
  if (index >= 0 && index < questionList.value.length) {
    currentQuestionIndex.value = index;
  }
};

// 上一题
const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < questionList.value.length - 1) {
    currentQuestionIndex.value++;
  }
};

const confirmSubmit = () => {
  const unansweredCount = questionList.value.length - answeredCount.value;
  ElMessageBox.confirm(`已答 ${answeredCount.value} 题，未答 ${unansweredCount} 题。确定要交卷吗？`, '交卷确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    submitExam();
  }).catch(() => { });
};

const submitExam = async () => {
  if (submitting.value) return;

  submitting.value = true;
  const payload = {
    examId: examId.value,
    examSubmitRecordList: questionList.value.map(q => {
      let userAnswer = answers[q.question.id];
      if (Array.isArray(userAnswer)) {
        userAnswer = userAnswer.sort().join('#@#');
      }
      return {
        questionId: q.question.id,
        userAnswer: userAnswer || '',
        details: q.question.details
      };
    })
  };

  try {
    const res = await submitStudentExamPaper(payload);
    if (res.code === 200) {
      ElMessage.success('交卷成功！');
      router.push({ name: 'Student-Exams' });
    } else {
      ElMessage.error(res.msg || '交卷失败');
    }
  } catch (error) {
    console.error('交卷失败:', error);
    ElMessage.error('交卷失败，请检查网络连接');
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  examId.value = route.params.id;
  if (!examId.value) {
    ElMessage.error('无效的考试ID');
    loading.value = false;
    return;
  }
  try {
    const res = await getStudentExamDetail(examId.value);
    if (res.code === 200) {
      examDetails.value = res.data;
      questionList.value = res.data.examQuestionList || [];

      questionList.value.forEach(q => {
        if (q.question.questionType === '多选' || q.question.questionType === '填空') {
          answers[q.question.id] = [];
        } else {
          answers[q.question.id] = '';
        }
      });

      // 初始化为第一题
      currentQuestionIndex.value = 0;

      startTimer(examDetails.value.duration);

      if (examDetails.value.disableCopy === 1) {
        const examContainer = document.querySelector('.take-exam-container');
        if (examContainer) {
          examContainer.addEventListener('copy', preventCopy);
          examContainer.addEventListener('cut', preventCopy);
          examContainer.addEventListener('contextmenu', preventCopy);
        }
      }

    } else {
      ElMessage.error(res.msg || '获取考试详情失败');
    }
  } catch (error) {
    ElMessage.error('获取考试详情失败');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.take-exam-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.exam-title {
  font-size: 18px;
  font-weight: bold;
}

.exam-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.countdown {
  font-size: 16px;
  color: #f56c6c;
  font-weight: 500;
}

.exam-body {
  display: flex;
  flex-grow: 1;
  padding: 20px;
  gap: 20px;
  min-height: 0;
}

.left-panel {
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
}

.right-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  overflow-y: auto;
}

.question-nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 10px;
}

.nav-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.nav-item.answered {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.nav-item.current {
  border-color: #f56c6c;
  background-color: #f56c6c;
  color: #fff;
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.3);
}

.nav-item.current.answered {
  background-color: #67c23a;
  border-color: #67c23a;
}

.box-card {
  border-radius: 4px;
}

/* 翻页控制按钮样式 */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
}

.question-progress {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}
</style>