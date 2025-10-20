<template>
  <div class="take-practice-container" v-loading="loading && !practiceDetails">
    <template v-if="practiceDetails">
      <div class="practice-header">
        <div class="practice-title">{{ practiceDetails.name }}</div>
        <div class="practice-actions">
          <el-button @click="handleRestart">重新练习</el-button>
          <el-button type="primary" @click="confirmSubmit" :loading="submitting">完成练习</el-button>
        </div>
      </div>

      <div class="practice-body">
        <div class="left-panel">
          <el-card class="box-card">
            <template #header>
              <div class="clearfix">
                <span>答题卡</span>
                <span style="float right;">{{ answeredCount }}/{{ questionList.length }}</span>
              </div>
            </template>
            <div class="question-nav-grid">
              <div
                v-for="(q, index) in questionList"
                :key="q.id"
                class="nav-item"
                :class="{
                  'answered': isAnswered(q.id),
                  'current': currentQuestionIndex === index
                }"
                @click="goToQuestion(index)"
              >
                {{ index + 1 }}
              </div>
            </div>
          </el-card>
        </div>

        <div class="right-panel" ref="rightPanelRef">
          <TakePracticeQuestionCard
            v-if="questionList.length > 0 && currentQuestionIndex < questionList.length"
            :key="questionList[currentQuestionIndex].id"
            :question-data="questionList[currentQuestionIndex]"
            :index="currentQuestionIndex"
            :practice-id="practiceId"
            v-model="answers[questionList[currentQuestionIndex].id]"
          />
          
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
    <el-empty v-else-if="!loading" description="无法加载练习信息"></el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getStudentPracticeDetail, submitPracticePaper } from '@/api/practice.js';
// 确保引入的子组件路径正确
import TakePracticeQuestionCard from '@/components/practice/TakePracticeQuestionCard.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const practiceId = ref(null);
const practiceDetails = ref(null);
const questionList = ref([]);
const answers = reactive({});
const currentQuestionIndex = ref(0);
const rightPanelRef = ref(null);

const answeredCount = computed(() => {
    // 【BUG修复 Part 3】answeredCount 逻辑也基于 q.id
    return questionList.value.filter(q => isAnswered(q.id)).length;
});

const isAnswered = (recordId) => {
  // 【BUG修复 Part 4】isAnswered 函数的入参改为 recordId
  const ans = answers[recordId];
  if (Array.isArray(ans)) return ans.some(item => item !== null && item !== '');
  return !!ans;
};

const goToQuestion = (index) => {
  if (index >= 0 && index < questionList.value.length) {
    currentQuestionIndex.value = index;
  }
};

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

const nextQuestion = () => {
  const listLength = questionList.value.length;
  if (currentQuestionIndex.value < listLength - 1) {
    currentQuestionIndex.value++;
  }
};

const confirmSubmit = () => {
  const unansweredCount = questionList.value.length - answeredCount.value;
  ElMessageBox.confirm(`已答 ${answeredCount.value} 题，未答 ${unansweredCount} 题。确定要交卷吗？`, '交卷确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    .then(() => {
      submitPractice();
    })
    .catch(() => {});
};

const submitPractice = async () => {
  if (submitting.value) return;

  submitting.value = true;
  const payload = {
    practiceId: practiceId.value,
    practiceSubmitRecordList: questionList.value.map(q => {
      // 【BUG修复 Part 5】从 answers 对象中根据唯一的 q.id 获取答案
      let userAnswer = answers[q.id];
      if (Array.isArray(userAnswer)) {
        const sortedAnswer = [...userAnswer].filter(item => item).sort().join('#@#');
        userAnswer = sortedAnswer;
      }
      return {
        // 提交给后端的依然是 question.id
        questionId: q.question.id,
        userAnswer: userAnswer || '',
        details: JSON.stringify(q.question.details)
      };
    })
  };

  try {
    const res = await submitPracticePaper(payload);
    if (res.code === 200) {
      ElMessage.success('提交成功！');
      router.push({ name: 'Practice' });
    } else {
      ElMessage.error(res.msg || '提交失败');
    }
  } catch (error) {
    console.error('提交失败:', error);
    ElMessage.error('提交失败，请检查网络连接');
  } finally {
    submitting.value = false;
  }
};

const handleRestart = () => {
  ElMessageBox.confirm('这将清除您当前的作答记录，并重新开始本次练习。', '重新练习', {
    confirmButtonText: '重新开始',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      window.location.reload();
    })
    .catch(() => {});
};

watch(currentQuestionIndex, () => {
  nextTick(() => {
    if (rightPanelRef.value) {
      rightPanelRef.value.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
});

onMounted(async () => {
  practiceId.value = parseInt(route.params.id);
  if (!practiceId.value) {
    ElMessage.error('无效的练习ID');
    loading.value = false;
    return;
  }

  try {
    const res = await getStudentPracticeDetail(practiceId.value);
    if (res.code === 200 && res.data) {
      practiceDetails.value = res.data;
      
      const rawQuestionList = res.data.practiceQuestionList || [];
      rawQuestionList.forEach(q => {
        if (q.question && q.question.details && typeof q.question.details === 'string') {
          try {
            q.question.details = JSON.parse(q.question.details);
          } catch (e) {
            console.error(`解析题目ID ${q.question.id} 的details字段失败:`, e);
            q.question.details = []; 
          }
        }
        
        // 【BUG修复 Part 6】初始化 answers 对象时，使用唯一的 q.id 作为 key
        if (q.question.questionType === '多选题' || q.question.questionType === '填空题') {
          answers[q.id] = [];
        } else {
          answers[q.id] = '';
        }
      });
      
      questionList.value = rawQuestionList;
      currentQuestionIndex.value = 0;

    } else {
      ElMessage.error(res.msg || '获取练习详情失败');
    }
  } catch (error) {
    console.error('获取练习详情失败:', error);
    ElMessage.error('获取练习详情失败');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* 样式部分无需修改 */
.take-practice-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.practice-title {
  font-size: 18px;
  font-weight: bold;
}

.practice-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.practice-body {
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

.box-card {
  border-radius: 4px;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.question-progress {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}
</style>