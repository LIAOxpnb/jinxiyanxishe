<template>
  <div class="take-exam-container" v-loading="loading && !examDetails">
    <template v-if="examDetails">
      <div class="exam-header">
        <div class="exam-title">{{ examDetails.name }}</div>
        <div class="exam-actions">
          <div class="exam-time-info">
            <span v-if="examDetails && examDetails.examDate === 1" class="time-item">结束时间: {{ examDetails.endTime }}</span>
          </div>
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
            <div class="answer-sheet-content">
              <div v-for="group in groupedQuestions" :key="group.type" class="question-group">
                <div class="group-title">{{ group.type }}</div>
                <div class="question-nav-grid">
                  <div v-for="q in group.questions" :key="q.questionId" class="nav-item" :class="{
                    'answered': isAnswered(q.question.id, q.question.questionType),
                    'current': currentQuestionIndex === q.originalIndex
                  }" @click="goToQuestion(q.originalIndex)">
                    {{ q.originalIndex + 1 }}
                  </div>
                </div>
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
            :model-value="answers[questionList[currentQuestionIndex].question.id]"
            @update:model-value="(val) => handleAnswerUpdate(questionList[currentQuestionIndex].question.id, val)"
            :attachment="attachments[questionList[currentQuestionIndex].question.id] || {}"
            @update:attachment="handleAttachmentUpdate"
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
import { previewFile } from '@/api/common/PreviewFile';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const examId = ref(null);
const examDetails = ref(null);
const questionList = ref([]);
const answers = reactive({});
const attachments = reactive({}); // 【新增】存储每个题目的附件信息 { questionId: { fileName, filePath } }
const currentQuestionIndex = ref(0);
const examRecordId = ref(null);
const isExamSubmitted = ref(false);
const isRestoringAnswers = ref(false);
let saveTimeout = null;
const changedQuestionIds = new Set(); // 【新增】跟踪有变更的题目ID
const visitedEssayQuestionIds = reactive(new Set()); // 跟踪已查看的论述题ID

watch([currentQuestionIndex, questionList], () => {
  const list = questionList.value;
  const index = currentQuestionIndex.value;
  if (list && list.length > 0 && index >= 0 && index < list.length) {
    const q = list[index];
    if (q.question.questionType === '论述') {
      visitedEssayQuestionIds.add(q.question.id);
    }
  }
}, { immediate: true });

const groupedQuestions = computed(() => {
  const groups = {};
  
  questionList.value.forEach((q, index) => {
    // 确保 questionType 存在，如果不存在归类为"其他"
    const type = q.question.questionType || '其他';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push({
      ...q,
      originalIndex: index
    });
  });
  
  const result = [];
  // 定义排序顺序
  const typeOrder = ['单选', '多选', '判断', '填空', '简答', '论述', '其他'];
  
  // 按预定顺序添加存在的组
  typeOrder.forEach(type => {
    // 尝试精确匹配
    let matchedType = type;
    if (!groups[matchedType]) {
      // 尝试模糊匹配（例如 "单选" 匹配 "单选题"）
      const foundKey = Object.keys(groups).find(key => key.includes(type));
      if (foundKey) {
        matchedType = foundKey;
      }
    }

    if (groups[matchedType]) {
      result.push({
        type: matchedType,
        questions: groups[matchedType]
      });
      delete groups[matchedType];
    }
  });
  
  // 添加未在预定顺序中的其他组
  Object.keys(groups).forEach(type => {
    result.push({
      type: type,
      questions: groups[type]
    });
  });
  
  return result;
});

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

// 将HTML内容中的图片路径转换为预览URL
const convertImagesToPreviewUrls = async (htmlContent) => {
  if (!htmlContent) return '';
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  
  const imagePromises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    
    try {
      let relativePath = src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        const url = new URL(src);
        let pathname = decodeURIComponent(url.pathname);
        const pathParts = pathname.split('/').filter(p => p);
        if (pathParts.length > 1) {
          relativePath = '/' + pathParts.slice(1).join('/');
        } else {
          relativePath = pathname;
        }
      }
      
      const previewUrl = await previewFile(relativePath);
      img.setAttribute('src', previewUrl);
    } catch (error) {
      console.error('预览图片失败:', src, error);
    }
  });
  
  await Promise.all(imagePromises);
  return doc.body.innerHTML;
};

const startTimer = (durationMinutes) => {
  if (durationMinutes <= 0 || durationMinutes === -1) {
    remainingSeconds.value = Infinity;
    return;
  }
  
  // 计算提醒阈值
  const totalSeconds = (examDetails.value?.duration || 0) * 60;
  const halfTime = Math.floor(totalSeconds * 0.5);
  const quarterTime = Math.floor(totalSeconds * 0.25);

  remainingSeconds.value = Math.floor(durationMinutes * 60);
  
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      usedSeconds.value++; // 增加已使用时间
      
      // 时间提醒
      if (remainingSeconds.value === halfTime) {
        ElMessageBox.alert('考试时间已经过半，请注意答题进度', '时间提醒', {
          confirmButtonText: '我知道了',
          type: 'warning',
        });
      }
      if (remainingSeconds.value === quarterTime) {
        ElMessageBox.alert('考试时间仅剩1/4，请抓紧时间', '时间提醒', {
          confirmButtonText: '我知道了',
          type: 'warning',
        });
      }
    } else {
      clearInterval(timerInterval);
      ElMessage.warning('考试时间到,系统将自动交卷!');
      submitExam(true);
    }
  }, 1000);
  
  // 每10秒保存一次已使用时间
  saveTimeInterval = setInterval(() => {
    saveUsedTime();
  }, 30000);
};

// 
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

    // 保存成功后，立即获取服务器最新时间并更新展示
    const serverUsedTime = await getUsedTime();
    // 只有获取到有效数值才更新
    if (typeof serverUsedTime === 'number') {
      usedSeconds.value = serverUsedTime;
      
      // 如果是限时考试，同步更新剩余时间
      if (examDetails.value && examDetails.value.duration > 0) {
        const totalSeconds = examDetails.value.duration * 60;
        const newRemaining = Math.max(0, totalSeconds - serverUsedTime);
        remainingSeconds.value = newRemaining;
      }
      console.log('🔄 已同步服务器时间:', { used: usedSeconds.value, remaining: remainingSeconds.value });
    }
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
// 【新增】处理附件更新
const handleAttachmentUpdate = (attachmentInfo) => {
  if (isRestoringAnswers.value) return;

  const { questionId, fileName, filePath } = attachmentInfo;
  // 只更新 attachments 对象，不要修改 questionList 中的 question 对象
  attachments[questionId] = { fileName, filePath };
  
  console.log('📎 附件更新:', { questionId, fileName, filePath });
  console.log('📋 当前所有附件:', attachments);
  
  // 标记题目为已变更
  changedQuestionIds.add(questionId);
  
  // 附件更新后触发暂存
  debounceSaveExamRecord();
};

// 【新增】处理答案更新
const handleAnswerUpdate = (questionId, val) => {
  if (isRestoringAnswers.value) return;
  
  answers[questionId] = val;
  changedQuestionIds.add(questionId);
  debounceSaveExamRecord();
};

const answeredCount = computed(() => {
  return questionList.value.filter(q => isAnswered(q.question.id, q.question.questionType)).length;
});

const isAnswered = (questionId, questionType) => {
  // 如果是论述题且已查看，视为已答
  if (!questionType) {
    const q = questionList.value.find(item => item.question.id === questionId);
    if (q) questionType = q.question.questionType;
  }
  if (questionType === '论述' && visitedEssayQuestionIds.has(questionId)) {
    return true;
  }

  const ans = answers[questionId];
  if (Array.isArray(ans)) {
    return ans.some(item => item !== null && item !== '');
  }
  // 对于字符串类型的答案，检查是否不为空且不全是空格或HTML标签
  if (ans === null || ans === undefined) return false;
  const strAns = ans.toString().trim();
  if (strAns === '') return false;
  
  // 检查富文本编辑器的空内容（如 <p><br></p> 等HTML标签）
  // 移除HTML标签后检查是否还有实际内容
  const textContent = strAns.replace(/<[^>]*>/g, '').trim();
  return textContent !== '';
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
  const unansweredQuestions = questionList.value.filter(q => !isAnswered(q.question.id, q.question.questionType));
  const unansweredCount = unansweredQuestions.length;
  
  // 如果设置为完整交卷且还有未答题目，提示用户
  if (examDetails.value.complete === 1 && unansweredCount > 0) {
    // 检查未答题目中是否有非论述题
    // 如果所有未答题目都是论述题，则允许提交
    const hasUnansweredRequired = unansweredQuestions.some(q => q.question.questionType !== '论述');
    
    if (hasUnansweredRequired) {
      ElMessage.warning('请做完全部题目再提交');
      return;
    }
  }
  
  ElMessageBox.confirm(`已答 ${answeredCount.value} 题,未答 ${unansweredCount} 题。确定要交卷吗?`, '交卷确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    submitExam();
  }).catch(() => { });
};

const submitExam = async (isForced = false) => {
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
    
    const res = await submitStudentExamPaper(examRecordId.value, isForced ? 1 : undefined);
    if (res.code === 200) {
      ElMessage.success('交卷成功!');
      router.push({ name: 'Student-Exams' });
    } else {
      ElMessage.error(res.msg || '交卷失败');
      // 如果是强制交卷且后端返回了成功，也要跳转
      if (isForced) {
        router.push({ name: 'Student-Exams' });
      } else {
        isExamSubmitted.value = false;
      }
    }
  } catch (error) {
    ElMessage.error('交卷失败,请检查网络连接');
    // 如果是强制交卷，发生异常也要跳转
    if (isForced) {
      router.push({ name: 'Student-Exams' });
    } else {
      isExamSubmitted.value = false;
    }
  } finally {
    submitting.value = false;
  }
};

// 暂存答题记录
const saveExamRecord = async () => {
  // 如果没有变更的题目，不需要保存
  // ...
  if (changedQuestionIds.size === 0) return;

  // 获取当前需要保存的题目ID快照
  const idsToSave = Array.from(changedQuestionIds);
  
  // 筛选出需要保存的题目
  const questionsToSave = questionList.value.filter(q => idsToSave.includes(q.question.id));
  
  if (questionsToSave.length === 0) return;

  const examSubmitRecordList = questionsToSave.map(q => {
    let userAnswer = answers[q.question.id];
    if (Array.isArray(userAnswer)) {
      userAnswer = userAnswer.filter(a => a !== null && a !== '').join('#@#');
    }
    
    // 【修改】添加附件信息
    const attachment = attachments[q.question.id] || {};
    
    return {
      questionId: q.question.id,
      userAnswer: userAnswer || '',
      details: q.question.details,
      fileName: attachment.fileName || '',
      filePath: attachment.filePath || ''
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
      
      // 保存成功后，从变更集合中移除已保存的ID
      idsToSave.forEach(id => changedQuestionIds.delete(id));
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

// 处理页面关闭前的警告和暂存
const handleBeforeUnload = (e) => {
  if (!isExamSubmitted.value && examRecordId.value && changedQuestionIds.size > 0) {
    try {
      // 仅保存有变更的题目
      const idsToSave = Array.from(changedQuestionIds);
      const questionsToSave = questionList.value.filter(q => idsToSave.includes(q.question.id));

      if (questionsToSave.length > 0) {
        const examSubmitRecordList = questionsToSave.map(q => {
          let userAnswer = answers[q.question.id];
          if (Array.isArray(userAnswer)) {
            userAnswer = userAnswer.filter(a => a !== null && a !== '').join('#@#');
          }
          
          // 【修改】添加附件信息
          const attachment = attachments[q.question.id] || {};
          
          return {
            questionId: q.question.id,
            userAnswer: userAnswer || '',
            details: q.question.details,
            fileName: attachment.fileName || '',
            filePath: attachment.filePath || ''
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
      }
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
      
      // 处理题目列表并转换图片URL
      const processedQuestions = await Promise.all(
        (res.data.examQuestionList || []).map(async (q) => {
          // 转换题目详情中的图片
          if (q.question && q.question.details) {
            q.question.details = await convertImagesToPreviewUrls(q.question.details);
          }
          // 转换题目标题中的图片
          if (q.question && q.question.title) {
            q.question.title = await convertImagesToPreviewUrls(q.question.title);
          }
          return q;
        })
      );
      
      questionList.value = processedQuestions;
      
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
        // 【修复】不再依赖 URL 中的 recordId，而是根据接口返回的 examRecordId 判断
        if (examRecordId.value && !isRestart && userAnswer) {
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
        
        // 【修复】3. 恢复学生答题附件信息（从 examSubmitRecord 中读取，而不是 question）
        // question.fileName/filePath 是题目本身的附件，不能混淆
        if (examRecordId.value && !isRestart) {
          // 假设后端在 question 的某个字段返回学生的附件信息
          // 需要根据实际后端返回的数据结构调整
          // 如果是在 examSubmitRecord 中，则需要从那里读取
          const studentFileName = q.studentFileName || q.userFileName || '';
          const studentFilePath = q.studentFilePath || q.userFilePath || '';
          
          if (studentFileName || studentFilePath) {
            attachments[questionId] = { 
              fileName: studentFileName, 
              filePath: studentFilePath 
            };
            console.log('恢复学生答题附件:', { questionId, studentFileName, studentFilePath });
          }
        }
      });
      
      // 【新增】初始化 lastSavedState,避免恢复后立即触发保存
      // lastSavedState = JSON.stringify({ answers, attachments }); // 已移除
      
      
      if (hasRestoredAnswers) {
        ElMessage.success('已恢复之前的答题记录');
      }
      
      setTimeout(() => {
        isRestoringAnswers.value = false;
      }, 500);

      currentQuestionIndex.value = 0;
      
      // 获取已使用时间并启动计时器
      console.log('检查是否需要恢复时间:', {
        recordId,
        isRestart,
        examRecordId: examRecordId.value,
        condition: !isRestart && examRecordId.value && examRecordId.value > 0
      });
      
      if (!isRestart && examRecordId.value && examRecordId.value > 0) {
        console.log('满足条件，开始获取已使用时间');
        // 继续答题：获取已使用时间
        const usedTime = await getUsedTime();
        usedSeconds.value = usedTime;
        console.log('已使用时间(秒):', usedTime);
        
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
            submitExam(true);
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

.exam-time-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time-item {
  font-size: 18px;
  color: red  ;
  font-weight: 500;
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

.group-title {
  font-size: 14px;
  font-weight: bold;
  margin: 15px 0 10px;
  color: #303133;
  padding-left: 4px;
  border-left: 3px solid #409eff;
  line-height: 1.2;
}

.question-group:first-child .group-title {
  margin-top: 0;
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