<template>
  <div class="take-range-layout" v-loading="loading">
    <div v-if="detail" class="range-header">
      <h2 class="range-name">{{ detail.name }}</h2>
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="线索分析" name="clues"></el-tab-pane>
        <el-tab-pane label="案情研判" name="questions"></el-tab-pane>
      </el-tabs>
      <div class="header-actions">
        <span class="countdown">剩余时间: {{ formattedCountdown }}</span>
        <el-button type="primary" @click="confirmSubmit">提交报告</el-button>
      </div>
    </div>
    
    <div v-if="!loading && !detail" class="range-body">
       <el-empty description="靶场加载失败"></el-empty>
    </div>

    <div v-else class="range-body">
      <div v-show="activeTab === 'clues'" class="clue-analysis-panel">
        <div class="left-panel">
          <h4>靶场须知</h4>
          <p>当前靶场为{{ detail?.challengeMode === 1 ? '闯关模式' : '普通模式' }}，{{ detail?.challengeMode === 1 ? '需顺序答题，回答正确才能进入下一题。并且每次答错会扣分，当分数不足以满足认定条件时，自动结束比武。' : '顺序答题，但暂不扣分。' }}</p>
        </div>
        <div class="right-panel clues-content">
          <div class="info-bar">请仔细阅读线索后，开始进行案情研判</div>
          <div v-for="clue in clues" :key="clue.id" class="clue-item">
            <h4>{{ clue.title }}</h4>
            <p v-if="clue.content">{{ clue.content }}</p>
            <div v-if="clue.filePath" class="clue-attachment">
              <el-link :icon="Paperclip" type="primary" @click="previewClueFile(clue)">{{ clue.fileName }}</el-link>
            </div>
          </div>
          <el-button type="primary" @click="activeTab = 'questions'">进入研判</el-button>
        </div>
      </div>
      
      <div v-show="activeTab === 'questions'" class="question-panel">
        <div class="left-panel">
          <el-card class="box-card">
            <template #header>
              <div class="clearfix">
                <span>答题卡</span>
                <span style="float: right;">{{ answeredCount }}/{{ questions.length }}</span>
              </div>
            </template>
            <div class="question-nav-grid">
              <div v-for="(q, index) in questions" :key="q.id" class="nav-item" :class="{
                'answered': isAnswered(q.id),
                'current': currentQuestionIndex === index
              }" @click="goToQuestion(index)">
                {{ index + 1 }}
              </div>
            </div>
          </el-card>
        </div>
        <div class="right-panel">
          <!-- 调试信息 -->
          <div v-if="questions.length === 0" style="padding: 20px; text-align: center;">
            <el-empty description="暂无题目">
              <template #image>
                <el-icon :size="60" color="#909399"><Document /></el-icon>
              </template>
            </el-empty>
            <p style="color: #909399; margin-top: 10px;">Questions数组长度: {{ questions.length }}</p>
            <p style="color: #909399;">Detail数据: {{ detail ? '已加载' : '未加载' }}</p>
          </div>
          
          <template v-else>
            <TakeRangeQuestionCard 
              v-if="currentQuestionIndex < questions.length"
              :key="questions[currentQuestionIndex].id" 
              :question-data="questions[currentQuestionIndex]"
              :index="currentQuestionIndex" 
              v-model="answers[questions[currentQuestionIndex].id]" 
            />
            <div class="pagination-controls">
              <el-button @click="previousQuestion" :disabled="currentQuestionIndex === 0" size="large">上一题</el-button>
              <span class="question-progress">第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 题</span>
              <el-button @click="nextQuestion" :disabled="currentQuestionIndex === questions.length - 1" type="primary" size="large">下一题</el-button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Paperclip, Document } from '@element-plus/icons-vue';
import { getShootingRangeDetail, getShootingRangeClues, getShootingRangeQuestions, submitShootingRangePaper, submitShootingRangeRecord, getShootingRangeResult } from '@/api/shooting-range.js';
import { saveRecordUseTime, getRecordUseTime } from '@/api/exams.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import TakeRangeQuestionCard from '@/components/range/TakeRangeQuestionCard.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const detail = ref(null);
const clues = ref([]);
const questions = ref([]);
const answers = reactive({});
const activeTab = ref('clues');
const currentQuestionIndex = ref(0);

// 暂存相关状态
const rangeRecordId = ref(null); // 答题记录ID
const isRangeSubmitted = ref(false); // 是否已交卷
const isRestoringAnswers = ref(false); // 是否正在恢复答案

let timerInterval = null;
let saveTimeInterval = null; // 保存时间的定时器
const remainingSeconds = ref(0);
const usedSeconds = ref(0); // 已使用的秒数
const formattedCountdown = computed(() => {
  // 无时间限制
  if (remainingSeconds.value === Infinity || remainingSeconds.value === -1) {
    return '无时间限制';
  }
  // 时间已用完
  if (remainingSeconds.value <= 0) return '00:00:00';
  // 正常倒计时
  const hours = Math.floor(remainingSeconds.value / 3600);
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60);
  const seconds = remainingSeconds.value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const startTimer = (durationMinutes) => {
  // 先清除旧的定时器
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (saveTimeInterval) {
    clearInterval(saveTimeInterval);
    saveTimeInterval = null;
  }
  
  if (durationMinutes <= 0 || durationMinutes === -1) {
    remainingSeconds.value = Infinity; // 不限时
    return;
  }
  
  remainingSeconds.value = Math.floor(durationMinutes * 60);
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0 && remainingSeconds.value !== Infinity) {
      remainingSeconds.value--;
      usedSeconds.value++; // 增加已使用时间
    } else if (remainingSeconds.value === 0) {
      clearInterval(timerInterval);
      clearInterval(saveTimeInterval);
      ElMessage.warning('时间到，系统将自动提交！');
      submitReport();
    }
  }, 1000);
  
  // 每10秒保存一次已使用时间
  saveTimeInterval = setInterval(() => {
    saveUsedTime();
  }, 10000);
};

// 保存已使用时间
const saveUsedTime = async () => {
  if (!rangeRecordId.value || rangeRecordId.value <= 0) {
    return;
  }
  
  try {
    await saveRecordUseTime({
      type: 1, // 0-考试，1-靶场
      recordId: rangeRecordId.value,
      useTime: usedSeconds.value // 已使用的秒数
    });
  } catch (error) {
    // 静默处理错误
    console.error('保存已使用时间失败:', error);
  }
};

// 获取已使用时间
const getUsedTime = async () => {
  if (!rangeRecordId.value || rangeRecordId.value <= 0) {
    return 0;
  }
  
  try {
    const res = await getRecordUseTime({
      type: 1, // 0-考试，1-靶场
      recordId: rangeRecordId.value
    });
    
    if (res.code === 200 && res.data !== undefined && res.data !== null) {
      // 如果返回的是数字，直接返回
      if (typeof res.data === 'number') {
        return res.data;
      }
      // 如果返回的是对象，尝试获取时间字段
      if (typeof res.data === 'object') {
        return res.data.useTime || res.data.time || 0;
      }
    }
  } catch (error) {
    console.error('获取已使用时间失败:', error);
  }
  
  return 0;
};
onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (saveTimeInterval) clearInterval(saveTimeInterval);
  
  // 组件销毁前保存一次时间
  saveUsedTime();
  
  // 移除页面关闭监听
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

const answeredCount = computed(() => {
  return Object.values(answers).filter(ans => Array.isArray(ans) ? ans.length > 0 : !!ans).length;
});
const isAnswered = (questionId) => {
  const ans = answers[questionId];
  if (Array.isArray(ans)) return ans.some(item => item);
  return !!ans; 
};
const goToQuestion = (index) => {
  if (index >= 0 && index < questions.value.length) {
    currentQuestionIndex.value = index;
  }
};
const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) currentQuestionIndex.value--;
};
const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) currentQuestionIndex.value++;
};

// 预览线索附件
const previewClueFile = async (clue) => {
  if (!clue.filePath) {
    ElMessage.warning('附件路径不存在');
    return;
  }
  
  try {
    // 调用预览文件API获取预览地址
    const url = await previewFile(clue.filePath);
    // 在新窗口中打开预览地址
    window.open(url, '_blank');
  } catch (error) {
    console.error('预览文件失败:', error);
    ElMessage.error('预览文件失败，请稍后重试');
  }
};

// 暂存答题记录
const saveRangeRecord = async () => {
  console.log('开始暂存答题记录...');
  
  // 构建答题记录列表
  const shootingRangeSubmitRecordList = questions.value.map(q => {
    let userAnswer = answers[q.id];
    if (Array.isArray(userAnswer)) {
      userAnswer = userAnswer.sort().join('#@#');
    }
    return {
      questionId: q.id,
      userAnswer: userAnswer || ''
    };
  });

  console.log('答题记录列表:', shootingRangeSubmitRecordList);

  // 按照后端要求的顺序构建载荷：id -> shootingRangeId -> shootingRangeSubmitRecordList
  const payload = {};
  
  // 继续答题时传id，重新答题时不传id
  if (rangeRecordId.value) {
    payload.id = rangeRecordId.value;
  }
  
  payload.shootingRangeId = detail.value.id;  // shootingRangeId必传
  payload.shootingRangeSubmitRecordList = shootingRangeSubmitRecordList;

  console.log('暂存请求参数:', payload);

  try {
    const res = await submitShootingRangeRecord(payload);
    console.log('暂存响应:', res);
    console.log('响应详情 - code:', res.code, 'msg:', res.msg, 'data:', res.data);
    
    if (res.code === 200) {
      // 检查是否有返回的记录ID
      if (res.data && res.data.id) {
        // 保存返回的暂存记录ID
        rangeRecordId.value = res.data.id;
        console.log('暂存成功，记录ID:', rangeRecordId.value);
      } else {
        console.warn('暂存接口返回成功但没有记录ID，响应data:', res.data);
        // 某些情况下后端可能返回200但没有data.id，这时不抛出错误
        // 因为数据可能已经保存成功
      }
    } else {
      console.error('暂存失败，响应:', res);
      const errorMsg = res.msg || '暂存失败';
      console.error('错误信息:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('暂存异常:', error);
    console.error('异常详情:', error.message, error.stack);
    throw error; // 重新抛出错误，让调用方处理
  }
};

// 防抖暂存，避免频繁请求
let saveTimeout = null;
const debounceSaveRangeRecord = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveRangeRecord();
  }, 1000); // 1秒防抖
};

// 监听答案变化，自动暂存
watch(answers, (newVal, oldVal) => {
  // 如果正在恢复答案，不触发自动暂存
  if (!isRestoringAnswers.value) {
    debounceSaveRangeRecord();
  }
}, { deep: true });

// 处理页面关闭前的警告和暂存
const handleBeforeUnload = (e) => {
  if (!isRangeSubmitted.value && rangeRecordId.value) {
    // 先同步暂存答案
    try {
      const shootingRangeSubmitRecordList = questions.value.map(q => {
        let userAnswer = answers[q.id];
        if (Array.isArray(userAnswer)) {
          userAnswer = userAnswer.sort().join('#@#');
        }
        return {
          questionId: q.id,
          userAnswer: userAnswer || ''
        };
      });

      const payload = {};
      if (rangeRecordId.value) {
        payload.id = rangeRecordId.value;
      }
      payload.shootingRangeId = detail.value.id;
      payload.shootingRangeSubmitRecordList = shootingRangeSubmitRecordList;

      // 使用 sendBeacon 进行异步发送
      const url = '/api/student/shootingRange/submitRecord';
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } catch (error) {
      // 静默处理错误
    }

    // 显示离开提示
    e.preventDefault();
    e.returnValue = '您还未交卷，系统已自动保存您的答案。';
    return e.returnValue;
  }
};

const confirmSubmit = () => {
  const unansweredCount = questions.value.length - answeredCount.value;
  ElMessageBox.confirm(`已答 ${answeredCount.value} 题，未答 ${unansweredCount} 题。现在提交报告?`, '提交报告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(() => {
    submitReport();
  });
};

const submitReport = async () => {
  console.log('开始提交报告，rangeRecordId:', rangeRecordId.value);
  
  // 提交前先尝试暂存一次（确保最新答案已保存）
  try {
    console.log('提交前暂存答案...');
    await saveRangeRecord();
    console.log('暂存完成，rangeRecordId:', rangeRecordId.value);
  } catch (error) {
    console.error('暂存失败:', error);
    // 暂存失败也继续提交，因为可能之前已经保存过
    console.warn('暂存失败但继续提交流程');
  }
  
  // 提交前保存一次已使用时间
  await saveUsedTime();

  isRangeSubmitted.value = true; // 标记为已交卷

  try {
    console.log('提交答卷，使用靶场ID:', detail.value.id);
    // 提交时传递靶场ID（不是答题记录ID）
    const res = await submitShootingRangePaper(detail.value.id);
    console.log('提交结果:', res);
    
    if (res.code === 200) {
      ElMessage.success('提交成功！');
      
      // 提交成功后直接返回靶场详情页,不显示得分弹窗
      router.push({ name: 'ShootingRangeDetail', params: { id: detail.value.id } });
    } else {
      ElMessage.error(res.msg || '提交失败');
      isRangeSubmitted.value = false;
    }
  } catch(e) {
    console.error('提交异常:', e);
    ElMessage.error('提交异常：' + (e.message || '请稍后重试'));
    isRangeSubmitted.value = false;
  }
};

// 显示结果弹窗
const showResultDialog = async (rangeId) => {
  try {
    const res = await getShootingRangeResult(rangeId);
    if (res.code === 200 && res.data) {
      const resultData = res.data;
      const isTraining = resultData.shootingRangeType === 0; // 0为训练，1为比武
      
      if (isTraining) {
        // 训练结果弹窗
        ElMessageBox.confirm(
          `
            <div style="padding: 20px 0;">
              <p style="margin-bottom: 10px;"><strong>名称：</strong>${resultData.name || detail.value.name}</p>
              <p style="margin-bottom: 10px;"><strong>分数：</strong>${resultData.score || 0}分</p>
            </div>
          `,
          '训练结果',
          {
            confirmButtonText: '查看结果',
            cancelButtonText: '关闭',
            type: 'success',
            dangerouslyUseHTMLString: true
          }
        )
          .then(() => {
            // 点击"查看结果"：跳转到结果详情页，使用靶场ID
            router.push({ name: 'ShootingRangeResult', params: { id: rangeId } });
          })
          .catch(() => {
            // 点击"关闭"：返回射击训练详情页
            router.push({ name: 'ShootingRangeDetail', params: { id: rangeId } });
          });
      } else {
        // 比武结果弹窗
        const isQualified = resultData.qualified === 1;
        const totalParticipants = resultData.totalCount || 0;
        const myRank = resultData.rank || '-';
        const備注 = isQualified 
          ? '1、比武模式下，如果有证书显示证书；' 
          : '1、比武模式下，如果有证书显示证书；\n2、不合格无法查看证书。';
        
        ElMessageBox.confirm(
          `
            <div style="padding: 20px 0;">
              <p style="margin-bottom: 10px;"><strong>名称：</strong>${resultData.name || detail.value.name}</p>
              <p style="margin-bottom: 10px;"><strong>人员：</strong>${resultData.userName || 'Name'}</p>
              <p style="margin-bottom: 10px;"><strong>分数：</strong>${resultData.score || 0}分</p>
              <p style="margin-bottom: 10px;"><strong>结果：</strong>${isQualified ? '合格' : '不合格'}</p>
              <p style="margin-bottom: 10px;"><strong>排名：</strong>${totalParticipants}人参加，我排第${myRank}</p>
              <p style="color: red; margin-top: 15px;"><strong>【备注】</strong></p>
              <p style="color: red; white-space: pre-line;">${備注}</p>
            </div>
          `,
          '比武结果',
          {
            confirmButtonText: isQualified ? '查看证书' : '确定',
            cancelButtonText: '关闭',
            type: 'success',
            dangerouslyUseHTMLString: true,
            showCancelButton: true
          }
        )
          .then(() => {
            // 点击"查看证书"或"确定"：跳转到结果详情页，使用靶场ID
            if (isQualified) {
              router.push({ name: 'ShootingRangeResult', params: { id: rangeId } });
            } else {
              router.push({ name: 'ShootingRangeDetail', params: { id: rangeId } });
            }
          })
          .catch(() => {
            // 点击"关闭"：返回射击训练详情页
            router.push({ name: 'ShootingRangeDetail', params: { id: rangeId } });
          });
      }
    }
  } catch (error) {
    ElMessage.error('获取结果失败');
    // 如果获取结果失败，返回射击训练详情页
    router.push({ name: 'ShootingRangeDetail', params: { id: rangeId } });
  }
};

// 路由离开守卫：提醒用户未交卷
onBeforeRouteLeave((to, from, next) => {
  // 如果已经提交或没有答题记录，直接放行
  if (isRangeSubmitted.value || !rangeRecordId.value) {
    next();
    return;
  }
  
  // 未提交的情况下，先暂存答案，然后弹出确认框
  saveRangeRecord().then(() => {
    ElMessageBox.confirm(
      '您还未交卷，确定要离开吗？',
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
    // 即使暂存失败，也显示确认框
    ElMessageBox.confirm(
      '您还未交卷，确定要离开吗？',
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

onMounted(async () => {
  const id = route.params.id;
  console.log('页面加载，靶场ID:', id);
  
  // 获取路由参数，检查是继续答题还是重新答题
  const recordId = route.query.recordId;
  const isRestart = route.query.restart === 'true';
  
  console.log('路由参数 - recordId:', recordId, 'isRestart:', isRestart);
  
  // 如果是继续答题，保存记录ID
  if (recordId && !isRestart) {
    rangeRecordId.value = Number(recordId);
    console.log('设置初始rangeRecordId:', rangeRecordId.value);
  }
  
  try {
    // 调用三个接口：detail、clues、questions
    const [detailRes, cluesRes, questionsRes] = await Promise.all([
      getShootingRangeDetail(id),
      getShootingRangeClues(id),
      getShootingRangeQuestions(id),
    ]);
    
    console.log('API响应 - detail:', detailRes, 'clues:', cluesRes, 'questions:', questionsRes);
    
    // 处理详情
    if (detailRes.code === 200 && detailRes.data) {
      detail.value = detailRes.data;
      
      // 如果后端返回了shootingRangeRecord，保存其ID
      if (detailRes.data.shootingRangeRecord && detailRes.data.shootingRangeRecord.id) {
        // 只有在继续答题时才保存ID，重新答题时不保存旧的ID
        if (!isRestart) {
          rangeRecordId.value = detailRes.data.shootingRangeRecord.id;
          console.log('从detail更新rangeRecordId:', rangeRecordId.value);
        }
      }
      
      // 获取已使用时间并启动计时器
      console.log('📋 靶场-检查是否需要恢复时间:', {
        recordId,
        isRestart,
        rangeRecordId: rangeRecordId.value,
        duration: detail.value.duration,
        condition: recordId && !isRestart && rangeRecordId.value && rangeRecordId.value > 0
      });
      
      if (recordId && !isRestart && rangeRecordId.value && rangeRecordId.value > 0) {
        console.log('✅ 满足条件，开始获取已使用时间');
        // 继续答题：获取已使用时间
        const usedTime = await getUsedTime();
        usedSeconds.value = usedTime;
        console.log('⏱️ 已使用时间(秒):', usedTime);
        
        // 根据已使用时间调整剩余时间
        if (detail.value.duration > 0) {
          const totalSeconds = detail.value.duration * 60;
          const remainingTime = totalSeconds - usedTime;
          
          console.log('⏰ 时间计算:', {
            总时长秒: totalSeconds,
            已使用秒: usedTime,
            剩余秒: remainingTime,
            剩余分钟: remainingTime / 60
          });
          
          if (remainingTime > 0) {
            // 使用调整后的时长启动计时器（分钟）
            startTimer(remainingTime / 60);
            
            if (usedTime > 0) {
              ElMessage.info(`已恢复靶场进度，已用时 ${Math.floor(usedTime / 60)} 分钟`);
            }
          } else {
            // 时间已用完，自动提交
            ElMessage.warning('靶场时间已用完,系统将自动提交!');
            await submitReport();
            loading.value = false;
            return;
          }
        } else {
          startTimer(detail.value.duration);
        }
      } else {
        // 首次答题或重新答题
        console.log('🆕 首次答题，从完整时长开始');
        usedSeconds.value = 0;
        startTimer(detail.value.duration);
      }
    }

    // 处理线索
    if (cluesRes.code === 200) {
      clues.value = cluesRes.data || [];
    }

    // 处理题目列表
    if (questionsRes.code === 200 && questionsRes.data) {
      if (questionsRes.data.shootingRangeQuestionList && Array.isArray(questionsRes.data.shootingRangeQuestionList)) {
        questions.value = questionsRes.data.shootingRangeQuestionList;
        
        // 初始化答案对象并恢复已保存的答案
        let hasRestoredAnswers = false;
        
        questions.value.forEach(q => {
          const questionId = q.id;
          const questionType = q.questionType;
          const userAnswer = q.userAnswer; // 从 question.userAnswer 获取已保存的答案
          
          // 初始化答案
          if (questionType === '多选' || questionType === '填空') {
            answers[questionId] = [];
          } else {
            answers[questionId] = '';
          }
          
          // 如果是继续答题且有保存的答案，恢复答案
          if (recordId && !isRestart && userAnswer) {
            hasRestoredAnswers = true;
            
            if (questionType === '多选' || questionType === '填空') {
              // 多选和填空题：将字符串拆分为数组
              answers[questionId] = userAnswer.split('#@#');
            } else {
              // 单选、判断等：直接保存字符串
              answers[questionId] = userAnswer;
            }
          }
        });
        
        // 如果恢复了答案，显示提示
        if (hasRestoredAnswers) {
          isRestoringAnswers.value = true;
          ElMessage.success('已恢复之前的答题记录');
          setTimeout(() => {
            isRestoringAnswers.value = false;
          }, 500);
        }
      }
    }

    // 添加页面关闭监听
    window.addEventListener('beforeunload', handleBeforeUnload);

  } catch (e) {
    ElMessage.error('加载靶场数据失败');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.take-range-layout { height: 100%; display: flex; flex-direction: column; background-color: #f5f7fa; }
.range-header { display: flex; align-items: center; padding: 0 24px; background-color: #fff; border-bottom: 1px solid #e6e6e6; flex-shrink: 0;}
.range-name { font-size: 18px; margin-right: 30px; }
.main-tabs { flex-grow: 1; }
.header-actions { display: flex; align-items: center; gap: 20px; }
.countdown { color: #f56c6c; font-weight: 500; }
.range-body { flex-grow: 1; overflow-y: auto; }
.clue-analysis-panel, .question-panel { display: flex; gap: 20px; padding: 20px; height: 100%; box-sizing: border-box; }
.left-panel { width: 280px; flex-shrink: 0; background-color: #fff; padding: 20px; border-radius: 4px; align-self: flex-start; }
.right-panel { flex: 1; background-color: #fff; padding: 20px; border-radius: 4px; display: flex; flex-direction: column; overflow-y: auto; }
.info-bar { background-color: #ecf5ff; color: #409eff; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; }
.clue-item { border-bottom: 1px solid #f0f2f5; padding-bottom: 16px; margin-bottom: 16px; }
.clue-attachment { margin-top: 10px; }
.clue-attachment .el-link { font-size: 14px; }
.clues-content { overflow-y: auto; }
.question-nav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 10px; }
.nav-item { border: 1px solid #dcdfe6; border-radius: 4px; text-align: center; padding: 8px 0; cursor: pointer; }
.nav-item.answered { background-color: #409eff; color: #fff; border-color: #409eff; }
.nav-item.current { border-color: #f56c6c; background-color: #f56c6c; color: #fff; }
.pagination-controls { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 20px; border-top: 1px solid #dcdfe6; }
.question-progress { font-size: 16px; font-weight: 500; color: #606266; }
</style>