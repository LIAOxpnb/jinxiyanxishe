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
                :class="{ 'answered': isAnswered(q.question.id) }"
                @click="scrollToQuestion('question-' + q.question.id)"
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
            v-model="answers[item.question.id]"
            :id="'question-' + item.question.id"
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
import { getStudentExamDetail, submitStudentExamPaper } from '@/api/exams.js';
import TakeExamQuestionCard from '@/components/TakeExamQuestionCard.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const examId = ref(null);
const examDetails = ref(null);
const questionList = ref([]);
const answers = reactive({});
// [修正] 移除 questionCardRefs，因为它在您的代码中未被使用
// const questionCardRefs = reactive({}); 

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
  if (durationMinutes <= 0 || durationMinutes === -1) { // [修正] 增加 -1 的判断
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

// --- 新增点 1: 阻止复制的事件处理函数 ---
const preventCopy = (e) => {
  e.preventDefault();
  ElMessage.warning('本次考试禁止复制题目内容！');
};


onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);

  // --- 新增点 2: 在组件卸载时，移除事件监听以防内存泄漏 ---
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
  if (Array.isArray(ans)) return ans.length > 0;
  return !!ans;
};

const scrollToQuestion = (questionId) => {
  // [修正] 将滚动目标从 questionId 改为 elementId，与模板中的 id 匹配
  const elementId = 'question-' + questionId;
  const targetElement = document.getElementById(elementId);
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
      let userAnswer = answers[q.question.id]; // [修正] 使用 q.question.id
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
        if(q.question.questionType === '多选' || q.question.questionType === '填空') {
          answers[q.question.id] = [];
        } else {
          answers[q.question.id] = '';
        }
      });
      startTimer(examDetails.value.duration);

      // --- 新增点 3: 在获取到考试详情后，根据设置添加事件监听 ---
      if (examDetails.value.disableCopy === 1) {
        const examContainer = document.querySelector('.take-exam-container');
        if (examContainer) {
          examContainer.addEventListener('copy', preventCopy);      // 监听复制事件 (Ctrl+C)
          examContainer.addEventListener('cut', preventCopy);       // 监听剪切事件 (Ctrl+X)
          examContainer.addEventListener('contextmenu', preventCopy); // 监听右键菜单
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
/* 样式部分与上一版完全相同 */
.take-exam-container { display: flex; flex-direction: column; height: 100vh; background-color: #f5f7fa; }
.exam-header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; height: 60px; background-color: #fff; border-bottom: 1px solid #dcdfe6; flex-shrink: 0; }
.exam-title { font-size: 18px; font-weight: bold; }
.exam-actions { display: flex; align-items: center; gap: 20px; }
.countdown { font-size: 16px; color: #f56c6c; font-weight: 500; }
.exam-body { display: flex; flex-grow: 1; overflow: hidden; padding: 20px; gap: 20px; }
.left-panel { width: 240px; flex-shrink: 0; overflow-y: auto; } /* [修正] 增加 overflow-y */
.right-panel { flex-grow: 1; overflow-y: auto; background-color: #fff; padding: 20px; border-radius: 4px; } /* [修正] 增加样式 */
.question-nav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 10px; } /* [修正] 调整列数 */
.nav-item { border: 1px solid #dcdfe6; border-radius: 4px; text-align: center; padding: 8px 0; cursor: pointer; transition: all 0.2s; }
.nav-item:hover { border-color: #409eff; color: #409eff; }
.nav-item.answered { background-color: #409eff; color: #fff; border-color: #409eff; }
.box-card { border-radius: 4px; } /* [新增] 为 el-card 增加圆角 */
</style>