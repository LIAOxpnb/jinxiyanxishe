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
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getStudentExamDetail, submitStudentExamPaper, submitStudentExamRecord, saveRecordUseTime, getRecordUseTime } from '@/api/exams.js';
import TakeExamQuestionCard from '@/components/exam/TakeExamQuestionCard.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const examId = ref(null);
const examDetails = ref(null);
const questionList = ref([]);
const answers = reactive({});
const currentQuestionIndex = ref(0);
const examRecordId = ref(null);
const isExamSubmitted = ref(false);
const isRestoringAnswers = ref(false);
let saveTimeout = null;
let lastSavedState = ''; // 【新增】跟踪上次保存的状态

// --- 倒计时逻辑 ---
let timerInterval = null;
let saveTimeInterval = null; // 保存时间的定时器
const remainingSeconds = ref(0);
const usedSeconds = ref(0); // 已使用的秒数
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
      usedSeconds.value++; // 增加已使用时间
    } else {
      clearInterval(timerInterval);
      ElMessage.warning('考试时间到,系统将自动交卷!');
      submitExam();
    }
  }, 1000);
  
  // 每10秒保存一次已使用时间
  saveTimeInterval = setInterval(() => {
    saveUsedTime();
  }, 10000);
};

// 保存已使用时间
const saveUsedTime = async () => {
  if (!examRecordId.value || examRecordId.value <= 0) {
    return;
  }
  
  try {
    console.log('💾 保存已使用时间:', {
      type: 0,
      recordId: examRecordId.value,
      useTime: usedSeconds.value
    });
    
    await saveRecordUseTime({
      type: 0, // 0-考试，8-靶场
      recordId: examRecordId.value,
      useTime: usedSeconds.value // 已使用的秒数
    });
    
    console.log('✅ 保存已使用时间成功');
  } catch (error) {
    // 静默处理错误
    console.error('❌ 保存已使用时间失败:', error);
  }
};

// 获取已使用时间
const getUsedTime = async () => {
  console.log('🔍 getUsedTime 被调用, examRecordId:', examRecordId.value);
  
  if (!examRecordId.value || examRecordId.value <= 0) {
    console.log('⚠️ examRecordId 无效，返回 0');
    return 0;
  }
  
  try {
    console.log('📤 发送 getRecordUseTime 请求:', { type: 0, recordId: examRecordId.value });
    const res = await getRecordUseTime({
      type: 0, // 0-考试，8-靶场
      recordId: examRecordId.value
    });
    
    console.log('📥 getRecordUseTime 响应:', res);
    
    if (res.code === 200 && res.data !== undefined && res.data !== null) {
      // 如果返回的是数字，直接返回
      if (typeof res.data === 'number') {
        console.log('✅ 返回已使用时间(秒):', res.data);
        return res.data;
      }
      // 如果返回的是对象，尝试获取时间字段
      if (typeof res.data === 'object') {
        const useTime = res.data.useTime || res.data.time || 0;
        console.log('✅ 从对象中提取已使用时间(秒):', useTime);
        return useTime;
      }
    }
  } catch (error) {
    console.error('❌ 获取已使用时间失败:', error);
  }
  
  return 0;
};

// --- 阻止复制的事件处理函数 ---
const preventCopy = (e) => {
  e.preventDefault();
  ElMessage.warning('本次考试禁止复制题目内容!');
};

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (saveTimeInterval) clearInterval(saveTimeInterval);
  if (saveTimeout) clearTimeout(saveTimeout);
  
  // 组件销毁前保存一次时间
  saveUsedTime();

  if (examDetails.value && examDetails.value.disableCopy === 1) {
    const examContainer = document.querySelector('.take-exam-container');
    if (examContainer) {
      examContainer.removeEventListener('copy', preventCopy);
      examContainer.removeEventListener('cut', preventCopy);
      examContainer.removeEventListener('contextmenu', preventCopy);
    }
  }
  
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// --- 页面逻辑 ---
const answeredCount = computed(() => {
  return Object.values(answers).filter(ans => {
    if (Array.isArray(ans)) return ans.some(item => item !== null && item !== '');
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
  if (currentQuestionIndex.value < questionList.value.length - 1) {
    currentQuestionIndex.value++;
  }
};

const confirmSubmit = () => {
  const unansweredCount = questionList.value.length - answeredCount.value;
  ElMessageBox.confirm(`已答 ${answeredCount.value} 题,未答 ${unansweredCount} 题。确定要交卷吗?`, '交卷确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    submitExam();
  }).catch(() => { });
};

const submitExam = async () => {
  if (submitting.value) return;

  if (!examRecordId.value) {
    ElMessage.error('未找到答题记录,无法交卷');
    return;
  }

  submitting.value = true;
  isExamSubmitted.value = true;

  try {
    // 交卷前先保存一次时间
    await saveUsedTime();
    
    const res = await submitStudentExamPaper(examRecordId.value);
    if (res.code === 200) {
      ElMessage.success('交卷成功!');
      router.push({ name: 'Student-Exams' });
    } else {
      ElMessage.error(res.msg || '交卷失败');
      isExamSubmitted.value = false;
    }
  } catch (error) {
    ElMessage.error('交卷失败,请检查网络连接');
    isExamSubmitted.value = false;
  } finally {
    submitting.value = false;
  }
};

// 暂存答题记录
const saveExamRecord = async () => {
  const examSubmitRecordList = questionList.value.map(q => {
    let userAnswer = answers[q.question.id];
    if (Array.isArray(userAnswer)) {
      userAnswer = userAnswer.filter(a => a !== null && a !== '').join('#@#');
    }
    return {
      questionId: q.question.id,
      userAnswer: userAnswer || '',
      details: q.question.details
    };
  });

  const payload = {};
  
  if (examRecordId.value) {
    payload.id = examRecordId.value;
  }
  
  payload.examId = examId.value;
  payload.examSubmitRecordList = examSubmitRecordList;

  try {
    const res = await submitStudentExamRecord(payload);
    
    if (res.code === 200 && res.data && res.data.id) {
      examRecordId.value = res.data.id;
      // 【新增】保存成功后更新 lastSavedState
      lastSavedState = JSON.stringify(answers);
    }
  } catch (error) {
    // 静默处理错误
  }
};

// 防抖暂存
const debounceSaveExamRecord = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveExamRecord();
  }, 1000);
};

// 【修改】监听答案变化,自动暂存 - 添加序列化比较
watch(answers, (newVal) => {
  if (!isRestoringAnswers.value) {
    // 序列化当前状态
    const currentState = JSON.stringify(newVal);
    // 只有当序列化后的值真的变化时才保存
    if (currentState !== lastSavedState) {
      lastSavedState = currentState;
      debounceSaveExamRecord();
    }
  }
}, { deep: true });

// 处理页面关闭前的警告和暂存
const handleBeforeUnload = (e) => {
  if (!isExamSubmitted.value && examRecordId.value) {
    try {
      const examSubmitRecordList = questionList.value.map(q => {
        let userAnswer = answers[q.question.id];
        if (Array.isArray(userAnswer)) {
          userAnswer = userAnswer.filter(a => a !== null && a !== '').join('#@#');
        }
        return {
          questionId: q.question.id,
          userAnswer: userAnswer || '',
          details: q.question.details
        };
      });

      const payload = {};
      if (examRecordId.value) {
        payload.id = examRecordId.value;
      }
      payload.examId = examId.value;
      payload.examSubmitRecordList = examSubmitRecordList;

      const url = '/api/student/exam/submitRecord';
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } catch (error) {
      // 静默处理错误
    }

    e.preventDefault();
    e.returnValue = '您还未交卷,系统已自动保存您的答案。';
    return e.returnValue;
  }
};

onMounted(async () => {
  examId.value = route.params.id;
  
  if (!examId.value) {
    ElMessage.error('无效的考试ID');
    loading.value = false;
    return;
  }
  
  const recordId = route.query.recordId;
  const isRestart = route.query.restart === 'true';
  
  if (recordId && !isRestart) {
    examRecordId.value = Number(recordId);
  }
  
  try {
    const res = await getStudentExamDetail(examId.value);
    
    if (res.code === 200) {
      examDetails.value = res.data;
      questionList.value = res.data.examQuestionList || [];
      
      if (res.data.examRecord && res.data.examRecord.id) {
        if (!isRestart) {
          examRecordId.value = res.data.examRecord.id;
        }
      }

      // 【修改】初始化答案对象并恢复已保存的答案
      isRestoringAnswers.value = true;
      let hasRestoredAnswers = false;
      
      questionList.value.forEach(q => {
        const questionId = q.question.id;
        const questionType = q.question.questionType;
        const userAnswer = q.question.userAnswer;
        
        // 1. 先初始化答案结构
        if (questionType === '填空') {
          // 填空题:计算填空数量并初始化空数组
          const title = q.question.title || '';
          const matches = title.match(/___/g);
          const blankCount = matches ? matches.length : 0;
          answers[questionId] = Array(blankCount).fill('');
        } else if (questionType === '多选') {
          answers[questionId] = [];
        } else {
          answers[questionId] = '';
        }
        
        // 2. 如果是继续答题且有保存的答案,恢复答案
        if (recordId && !isRestart && userAnswer) {
          hasRestoredAnswers = true;
          
          if (questionType === '填空') {
            // 填空题:特殊处理,确保数组长度匹配
            const savedAnswers = userAnswer.split('#@#');
            const title = q.question.title || '';
            const matches = title.match(/___/g);
            const blankCount = matches ? matches.length : 0;
            
            // 创建正确长度的数组并填充已保存的答案
            const restoredAnswers = Array(blankCount).fill('');
            for (let i = 0; i < Math.min(savedAnswers.length, blankCount); i++) {
              restoredAnswers[i] = savedAnswers[i] || '';
            }
            answers[questionId] = restoredAnswers;
            
          } else if (questionType === '多选') {
            // 多选题:拆分为数组并过滤空值
            answers[questionId] = userAnswer.split('#@#').filter(a => a);
            
          } else {
            // 单选、判断等:直接保存字符串
            answers[questionId] = userAnswer;
          }
        }
      });
      
      // 【新增】初始化 lastSavedState,避免恢复后立即触发保存
      lastSavedState = JSON.stringify(answers);
      
      if (hasRestoredAnswers) {
        ElMessage.success('已恢复之前的答题记录');
      }
      
      setTimeout(() => {
        isRestoringAnswers.value = false;
      }, 500);

      currentQuestionIndex.value = 0;
      
      // 获取已使用时间并启动计时器
      console.log('📋 检查是否需要恢复时间:', {
        recordId,
        isRestart,
        examRecordId: examRecordId.value,
        condition: recordId && !isRestart && examRecordId.value && examRecordId.value > 0
      });
      
      if (recordId && !isRestart && examRecordId.value && examRecordId.value > 0) {
        console.log('✅ 满足条件，开始获取已使用时间');
        // 继续答题：获取已使用时间
        const usedTime = await getUsedTime();
        usedSeconds.value = usedTime;
        console.log('⏱️ 已使用时间(秒):', usedTime);
        
        // 根据已使用时间调整剩余时间
        if (examDetails.value.duration > 0) {
          const totalSeconds = examDetails.value.duration * 60;
          const remainingTime = totalSeconds - usedTime;
          
          if (remainingTime > 0) {
            // 使用调整后的时长启动计时器（分钟）
            startTimer(remainingTime / 60);
            
            if (usedTime > 0) {
              ElMessage.info(`已恢复考试进度，已用时 ${Math.floor(usedTime / 60)} 分钟`);
            }
          } else {
            // 时间已用完，自动交卷
            ElMessage.warning('考试时间已用完,系统将自动交卷!');
            submitExam();
            return;
          }
        } else {
          startTimer(examDetails.value.duration);
        }
      } else {
        // 首次答题或重新答题
        usedSeconds.value = 0;
        startTimer(examDetails.value.duration);
      }

      if (examDetails.value.disableCopy === 1) {
        const examContainer = document.querySelector('.take-exam-container');
        if (examContainer) {
          examContainer.addEventListener('copy', preventCopy);
          examContainer.addEventListener('cut', preventCopy);
          examContainer.addEventListener('contextmenu', preventCopy);
        }
      }
      
      window.addEventListener('beforeunload', handleBeforeUnload);

    } else {
      ElMessage.error(res.msg || '获取考试详情失败');
    }
  } catch (error) {
    ElMessage.error('获取考试详情失败');
  } finally {
    loading.value = false;
  }
});

onBeforeRouteLeave((to, from, next) => {
  if (isExamSubmitted.value || !examRecordId.value) {
    next();
    return;
  }
  
  saveExamRecord().then(() => {
    ElMessageBox.confirm(
      '您还未交卷,确定要离开吗?',
      '提示',
      {
        confirmButtonText: '确定离开',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        next();
      })
      .catch(() => {
        next(false);
      });
  }).catch(() => {
    ElMessageBox.confirm(
      '您还未交卷,确定要离开吗?',
      '提示',
      {
        confirmButtonText: '确定离开',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        next();
      })
      .catch(() => {
        next(false);
      });
  });
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