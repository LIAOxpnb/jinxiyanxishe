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
              <div 
                v-for="(q, index) in questionList" 
                :key="q.questionId"
                class="nav-item"
                :class="{ 'answered': isAnswered(q.questionId) }"
                @click="scrollToQuestion(q.questionId)"
              >
                {{ index + 1 }}
              </div>
            </div>
          </el-card>
        </div>

        <div class="right-panel">
          <TakeExamQuestionCard
            v-for="(item, index) in questionList"
            :key="item.questionId"
            :question-data="item"
            :index="index"
            v-model="answers[item.questionId]"
            :ref="el => questionCardRefs[item.questionId] = el"
          />
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
import { getStudentExamDetail, submitStudentExamPaper } from '@/api/exams.js'; // 确保路径正确
import TakeExamQuestionCard from '@/components/TakeExamQuestionCard.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const examId = ref(null);
const examDetails = ref(null); // [修正] 初始值为 null
const questionList = ref([]);
const answers = reactive({});
const questionCardRefs = reactive({});

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
  if (durationMinutes <= 0) {
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

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
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
  if (Array.isArray(ans)) return ans.length > 0;
  return !!ans;
};

const scrollToQuestion = (questionId) => {
  const targetElement = document.getElementById('question-' + questionId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  }).catch(() => {});
};

const submitExam = async () => {
  const payload = {
    examId: examId.value,
    examSubmitRecordList: questionList.value.map(q => {
      let userAnswer = answers[q.questionId];
      if (Array.isArray(userAnswer)) {
        userAnswer = userAnswer.sort().join('#@#');
      }
      return {
        questionId: q.question.id, // [修正] 应该是 question.id
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
  } catch(error) {
    ElMessage.error('交卷失败');
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
        // [修正] 使用 question.id 作为答案对象的键
        if(q.question.questionType === '多选' || q.question.questionType === '填空') {
          answers[q.question.id] = [];
        } else {
          answers[q.question.id] = '';
        }
      });
      startTimer(examDetails.value.duration);
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
/* 样式部分与上一版完全相同 */
.take-exam-container { display: flex; flex-direction: column; height: 100vh; background-color: #f5f7fa; }
.exam-header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; height: 60px; background-color: #fff; border-bottom: 1px solid #dcdfe6; flex-shrink: 0; }
.exam-title { font-size: 18px; font-weight: bold; }
.exam-actions { display: flex; align-items: center; gap: 20px; }
.countdown { font-size: 16px; color: #f56c6c; font-weight: 500; }
.exam-body { display: flex; flex-grow: 1; overflow: hidden; padding: 20px; gap: 20px; }
.left-panel { width: 240px; flex-shrink: 0; }
.right-panel { flex-grow: 1; overflow-y: auto; }
.question-nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.nav-item { border: 1px solid #dcdfe6; border-radius: 4px; text-align: center; padding: 8px 0; cursor: pointer; transition: all 0.2s; }
.nav-item:hover { border-color: #409eff; color: #409eff; }
.nav-item.answered { background-color: #409eff; color: #fff; border-color: #409eff; }
</style>