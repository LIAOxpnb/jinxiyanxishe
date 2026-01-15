<template>
  <div class="take-range-layout" v-loading="loading">
    <div v-if="detail" class="range-header">
      <h2 class="range-name">{{ detail.name }}</h2>
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="线索分析" name="clues"></el-tab-pane>
        <el-tab-pane label="案情研判" name="questions"></el-tab-pane>
      </el-tabs>
      <div class="header-actions">
        <span v-if="activeTab === 'questions'" class="info-item">案情研判</span>
        <span v-if="activeTab === 'questions'" class="info-item">剩余时间 {{ formattedCountdown }}</span>
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
          <div v-for="clue in clues" :key="clue.id" class="clue-item" v-image-preview>
            <div v-if="clue.title" v-html="clue.title" class="clue-title"></div>
            <div v-if="clue.content" v-html="clue.content" class="clue-content"></div>
            <div v-if="clue.filePath" class="clue-attachment">
              <el-link :icon="Paperclip" type="primary" @click="previewClueFile(clue)">{{ clue.fileName }}</el-link>
            </div>
          </div>
          <el-button type="primary" @click="activeTab = 'questions'">进入研判</el-button>
        </div>
      </div>
      
      <div v-show="activeTab === 'questions'" class="question-panel">
        <div class="left-panel">
          <h4>研判内容</h4>
          <div class="progress-info">
            <span>已答进度</span>
            <span>{{ answeredCount }}/{{ totalQuestionCount }}</span>
          </div>
          
          <!-- 调证和核查按钮 -->
          <div class="action-buttons">
            <div class="action-btn" @click="openInvestigateDialog">
              <el-icon :size="24"><Search /></el-icon>
              <span>我要调证</span>
            </div>
            <div class="action-btn" @click="openOfflineCheckDialog">
              <el-icon :size="24"><ChatLineSquare /></el-icon>
              <span>线下核查</span>
            </div>
          </div>
          
          <div class="status-info">
            <div class="status-item">
              <span>已答</span>
              <span class="value">{{ answeredCount }}</span>
            </div>
            <div class="status-item">
              <span>未答</span>
              <span class="value">{{ totalQuestionCount - answeredCount }}</span>
            </div>
            <template v-if="detail?.challengeMode === 1">
              <div class="status-item">
                <span>总分数</span>
                <span class="value">{{ currentScore }}</span>
              </div>
              <div class="status-item">
                <span>已扣除分</span>
                <span class="value danger">{{ deductedScore }}</span>
              </div>
            </template>
          </div>
          <div v-if="detail?.challengeMode === 1" class="challenge-warning">
            【备注】 当前靶场为闯关模式，<br/>
           需要顺序答题，回答正确才能进入下一题，并且每次答错会扣分，当扣分不足以完成比武时，自动结束比武。
          </div>
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
            <!-- 答题反馈提示 -->
            <div v-if="showFeedback" class="answer-feedback" :class="feedbackType">
              <el-icon v-if="feedbackType === 'correct'"><CircleCheck /></el-icon>
              <el-icon v-else><CircleClose /></el-icon>
              <span>{{ feedbackMessage }}</span>
            </div>
            
            <TakeRangeQuestionCard 
              v-if="currentQuestionIndex < questions.length"
              :key="questions[currentQuestionIndex].id" 
              :question-data="questions[currentQuestionIndex]"
              :index="currentQuestionIndex" 
              :model-value="answers[questions[currentQuestionIndex].id]"
              @update:model-value="(val) => handleAnswerUpdate(questions[currentQuestionIndex].id, val)"
              :attachment="attachments[questions[currentQuestionIndex].id] || {}"
              @update:attachment="handleAttachmentUpdate"
            />
            
            <!-- 答题操作按钮 -->
            <div class="question-actions">
              <template v-if="detail?.challengeMode === 1">
                <!-- 闯关模式：上一题 + 下一题 -->
                <div class="pagination-controls">
                  <el-button 
                    @click="previousQuestion" 
                    :disabled="currentQuestionIndex === 0" 
                    size="large"
                  >
                    上一题
                  </el-button>
                  <span class="question-progress">第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 题</span>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="submitCurrentAnswer"
                    :disabled="!hasAnswer(currentQuestionIndex) || currentQuestionIndex >= questions.length - 1"
                  >
                    下一题
                  </el-button>
                </div>
              </template>
              <template v-else>
                <!-- 普通模式 -->
                <div class="pagination-controls">
                  <el-button @click="previousQuestion" :disabled="currentQuestionIndex === 0" size="large">上一题</el-button>
                  <span class="question-progress">第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 题</span>
                  <el-button @click="nextQuestion" :disabled="currentQuestionIndex === questions.length - 1" type="primary" size="large">下一题</el-button>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <!-- 调证弹窗 -->
    <el-dialog 
      v-model="investigateDialogVisible" 
      title="调证" 
      width="700px"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">调证</span>
          <!-- <span class="dialog-subtitle">【备注】抽屉组件</span> -->
        </div>
      </template>
      
      <div class="investigate-content">
        <div class="quota-info">
          您共有{{ investigateQuota.total }}次调证机会，还剩{{ investigateQuota.remaining }}次
        </div>
        
        <el-form label-width="80px">
          <el-form-item label="数据类型" required>
            <el-select v-model="investigateForm.dataType" placeholder="选择" style="width: 100%">
              <el-option v-for="item in dataTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="筛选项">
            <div class="filter-list">
              <div v-for="(filter, index) in investigateForm.filters" :key="index" class="filter-row">
                <el-select v-model="filter.field" placeholder="选择" style="width: 150px">
                  <el-option v-for="item in filterFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-input v-if="filter.inputType === 'input'" v-model="filter.value" placeholder="" style="width: 200px; margin-left: 10px" />
                <el-select v-else v-model="filter.value" placeholder="选择" style="width: 200px; margin-left: 10px">
                  <el-option v-for="item in filter.options || []" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-button :icon="Delete" circle @click="removeInvestigateFilter(index)" style="margin-left: 10px" />
              </div>
              <div class="add-filter" @click="addInvestigateFilter">
                <el-icon><Plus /></el-icon>
                <span class="add-note">【备注】支持重复添加选项，比如多个账户筛选</span>
              </div>
            </div>
          </el-form-item>
        </el-form>
        
        <el-button type="primary" @click="submitInvestigate">立即调证</el-button>
        
        <div class="history-section">
          <div class="history-title">历史调证</div>
          <div class="history-list">
            <div v-for="item in investigateHistory" :key="item.id" class="history-item">
              <el-link type="primary">{{ item.fileName }}</el-link>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="investigateDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 线下核查弹窗 -->
    <el-dialog 
      v-model="offlineCheckDialogVisible" 
      title="线下核查" 
      width="900px"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">线下核查</span>
          <span class="dialog-subtitle">【备注】抽屉组件</span>
        </div>
      </template>
      
      <el-tabs v-model="offlineCheckTab">
        <el-tab-pane label="核查" name="check">
          <div class="offline-check-content">
            <div class="quota-info">
              您共有{{ offlineCheckQuota.total }}次核查条数，还剩{{ offlineCheckQuota.remaining }}次
            </div>
            
            <!-- 第一步：选择数据类型和筛选条件 -->
            <div v-if="offlineCheckStep === 1">
              <el-form label-width="80px">
                <el-form-item label="数据类型" required>
                  <el-select v-model="offlineCheckForm.dataType" placeholder="选择" style="width: 100%">
                    <el-option v-for="item in dataTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="转出账户">
                  <div class="filter-list">
                    <div v-for="(filter, index) in offlineCheckForm.filters" :key="index" class="filter-row">
                      <el-select v-model="filter.field" placeholder="选择" style="width: 150px">
                        <el-option v-for="item in filterFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                      <el-input v-if="filter.inputType === 'input'" v-model="filter.value" placeholder="" style="width: 200px; margin-left: 10px" />
                      <el-select v-else v-model="filter.value" placeholder="选择" style="width: 200px; margin-left: 10px">
                        <el-option v-for="item in filter.options || []" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                      <el-button :icon="Delete" circle @click="removeOfflineCheckFilter(index)" style="margin-left: 10px" />
                    </div>
                    <div class="add-filter-btn" @click="addOfflineCheckFilter">
                      <el-icon><Plus /></el-icon>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
              
              <div class="step-actions">
                <el-button type="primary" @click="offlineCheckStep = 2">下一步</el-button>
              </div>
            </div>
            
            <!-- 第二步：选择核查数据 -->
            <div v-if="offlineCheckStep === 2">
              <el-table 
                :data="offlineCheckData" 
                style="width: 100%"
                @selection-change="handleOfflineCheckSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="fromAccount" label="转出账户" />
                <el-table-column prop="amount" label="金额" />
                <el-table-column prop="toAccount" label="转入账户" />
                <el-table-column prop="type" label="类型" />
                <el-table-column prop="transactionTime" label="交易时间" />
              </el-table>
              
              <div class="table-footer">
                <el-pagination 
                  v-model:current-page="offlineCheckPagination.page" 
                  v-model:page-size="offlineCheckPagination.size"
                  :page-sizes="[10, 20, 50, 100]" 
                  layout="total, prev, pager, next, sizes" 
                  :total="offlineCheckPagination.total"
                />
              </div>
              
              <div class="step-actions">
                <el-button @click="offlineCheckStep = 1">上一步</el-button>
                <el-button type="primary" @click="submitOfflineCheck">立即核查</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="历史记录" name="history">
          <div class="offline-check-history">
            <div class="quota-info">
              您共有{{ offlineCheckQuota.total }}次核查条数，还剩{{ offlineCheckQuota.remaining }}次
            </div>
            
            <el-table :data="offlineCheckHistoryData" style="width: 100%">
              <el-table-column prop="fromAccount" label="转出账户" />
              <el-table-column prop="amount" label="金额" />
              <el-table-column prop="toAccount" label="转入账户" />
              <el-table-column prop="type" label="类型" />
              <el-table-column prop="transactionTime" label="交易时间" />
              <el-table-column prop="checkResult" label="核查结果">
                <template #default="scope">
                  <el-link type="primary">{{ scope.row.checkResult || '核查结果' }}</el-link>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="table-footer">
              <el-pagination 
                v-model:current-page="offlineCheckHistoryPagination.page" 
                v-model:page-size="offlineCheckHistoryPagination.size"
                :page-sizes="[10, 20, 50, 100]" 
                layout="total, prev, pager, next, sizes" 
                :total="offlineCheckHistoryPagination.total"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <el-button @click="offlineCheckDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Paperclip, Document, CircleCheck, CircleClose, Search, ChatLineSquare, Delete, Plus } from '@element-plus/icons-vue';
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
const attachments = reactive({}); // 存储每个题目的附件信息
const activeTab = ref('clues');
const currentQuestionIndex = ref(0);

// 闯关模式相关状态
const currentScore = ref(100); // 当前分数
const deductedScore = ref(0); // 已扣除分数
const showFeedback = ref(false); // 是否显示答题反馈
const feedbackType = ref(''); // 反馈类型: 'correct' | 'incorrect'
const feedbackMessage = ref(''); // 反馈消息
const answeredQuestions = ref([]); // 已答题目列表
const answeredCountFromApi = ref(0); // 从接口获取的已答题数
const totalQuestionCount = ref(0); // 题目总数

// 暂存相关状态
const rangeRecordId = ref(null); // 答题记录ID
const isRangeSubmitted = ref(false); // 是否已交卷
const isRestoringAnswers = ref(false); // 是否正在恢复答案
const isInitializing = ref(true); // 添加初始化标志
const changedQuestionIds = new Set(); // 追踪已变更的题目ID

// 调证弹窗相关状态
const investigateDialogVisible = ref(false);
const investigateQuota = reactive({ total: 5, remaining: 4 });
const investigateForm = reactive({
  dataType: '',
  filters: [
    { field: '', value: '', inputType: 'input' },
    { field: '', value: '', inputType: 'select', options: [] }
  ]
});
const investigateHistory = ref([
  { id: 1, fileName: '类型+账户名+调证时间.CSV' }
]);

// 线下核查弹窗相关状态
const offlineCheckDialogVisible = ref(false);
const offlineCheckTab = ref('check');
const offlineCheckStep = ref(1);
const offlineCheckQuota = reactive({ total: 5, remaining: 4 });
const offlineCheckForm = reactive({
  dataType: '',
  filters: [
    { field: '', value: '', inputType: 'input' },
    { field: '', value: '', inputType: 'select', options: [] }
  ]
});
const offlineCheckData = ref([]);
const offlineCheckSelectedData = ref([]);
const offlineCheckPagination = reactive({ page: 1, size: 10, total: 102 });
const offlineCheckHistoryData = ref([]);
const offlineCheckHistoryPagination = reactive({ page: 1, size: 10, total: 102 });

// 数据类型选项
const dataTypeOptions = ref([
  { label: '银行流水', value: 'bank' },
  { label: '通讯记录', value: 'communication' },
  { label: '交易记录', value: 'transaction' }
]);

// 筛选字段选项
const filterFieldOptions = ref([
  { label: '转出账户', value: 'fromAccount' },
  { label: '转入账户', value: 'toAccount' },
  { label: '金额', value: 'amount' },
  { label: '类型', value: 'type' }
]);

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
  // 闯关模式：已答 = 已通过的题数 + 当前题目是否有答案
  if (detail.value?.challengeMode === 1) {
    // 统计已填写答案的题目数量（包括当前正在答的题）
    const filledCount = Object.keys(answers).filter(questionId => {
      const ans = answers[questionId];
      if (Array.isArray(ans)) return ans.length > 0 && ans.some(item => item);
      return !!ans;
    }).length;
    return filledCount;
  }
  // 普通模式使用前端判断
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
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    showFeedback.value = false; // 切换题目时隐藏反馈
  }
};

// 打开调证弹窗
const openInvestigateDialog = () => {
  investigateDialogVisible.value = true;
};

// 打开线下核查弹窗
const openOfflineCheckDialog = () => {
  offlineCheckDialogVisible.value = true;
  offlineCheckStep.value = 1;
  offlineCheckTab.value = 'check';
  // 加载模拟数据
  loadOfflineCheckData();
};

// 添加调证筛选条件
const addInvestigateFilter = () => {
  investigateForm.filters.push({ field: '', value: '', inputType: 'input' });
};

// 移除调证筛选条件
const removeInvestigateFilter = (index) => {
  if (investigateForm.filters.length > 1) {
    investigateForm.filters.splice(index, 1);
  }
};

// 提交调证
const submitInvestigate = () => {
  if (!investigateForm.dataType) {
    ElMessage.warning('请选择数据类型');
    return;
  }
  
  // 获取数据类型名称
  const dataTypeLabel = dataTypeOptions.value.find(item => item.value === investigateForm.dataType)?.label || '';
  
  // 获取筛选条件中的账户名
  const accountNames = investigateForm.filters
    .filter(f => f.field && f.value)
    .map(f => f.value)
    .join('_') || '全部';
  
  // 生成文件名：类型+账户名+调证时间
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `${dataTypeLabel}+${accountNames}+${timestamp}.CSV`;
  
  // TODO: 实际应该调用后端API获取数据，这里先用模拟数据生成CSV
  // 模拟CSV数据
  const csvData = generateMockCSVData(dataTypeLabel);
  
  // 下载CSV文件
  downloadCSV(csvData, fileName);
  
  // 更新剩余次数
  investigateQuota.remaining--;
  
  // 添加到历史记录
  investigateHistory.value.unshift({
    id: Date.now(),
    fileName: fileName
  });
  
  ElMessage.success('调证成功，文件已下载');
};

// 生成模拟CSV数据
const generateMockCSVData = (dataType) => {
  // CSV表头
  const headers = ['转出账户', '金额', '转入账户', '类型', '交易时间'];
  
  // 模拟数据行
  const rows = Array.from({ length: 10 }, (_, i) => [
    `账户${i + 1}`,
    (Math.random() * 1000).toFixed(2),
    `账户${i + 100}`,
    dataType,
    new Date().toLocaleString()
  ]);
  
  // 组合CSV内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

// 下载CSV文件
const downloadCSV = (csvContent, fileName) => {
  // 添加BOM以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// 添加线下核查筛选条件
const addOfflineCheckFilter = () => {
  offlineCheckForm.filters.push({ field: '', value: '', inputType: 'input' });
};

// 移除线下核查筛选条件
const removeOfflineCheckFilter = (index) => {
  if (offlineCheckForm.filters.length > 1) {
    offlineCheckForm.filters.splice(index, 1);
  }
};

// 加载线下核查数据
const loadOfflineCheckData = () => {
  // 模拟数据
  offlineCheckData.value = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    fromAccount: '转出账户',
    amount: '122.99',
    toAccount: '转出账户',
    type: '银行流水',
    transactionTime: 'YY-MM-DD HH:mm:ss'
  }));
  
  offlineCheckHistoryData.value = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    fromAccount: '转出账户',
    amount: '122.99',
    toAccount: '转出账户',
    type: '银行流水',
    transactionTime: 'YY-MM-DD HH:mm:ss',
    checkResult: '核查结果'
  }));
};

// 线下核查选择变化
const handleOfflineCheckSelectionChange = (selection) => {
  offlineCheckSelectedData.value = selection;
};

// 提交线下核查
const submitOfflineCheck = () => {
  if (offlineCheckSelectedData.value.length === 0) {
    ElMessage.warning('请选择要核查的数据');
    return;
  }
  // TODO: 调用实际的核查API
  ElMessage.success('核查请求已提交');
  offlineCheckQuota.remaining -= offlineCheckSelectedData.value.length;
  offlineCheckDialogVisible.value = false;
};

// 处理附件更新
const handleAttachmentUpdate = (attachmentInfo) => {
  if (isRestoringAnswers.value) return;
  
  const { questionId, fileName, filePath } = attachmentInfo;
  attachments[questionId] = { fileName, filePath };
  
  // 标记题目为已变更
  changedQuestionIds.add(questionId);
  
  console.log('📎 附件更新:', { questionId, fileName, filePath });
  
  // 闯关模式不自动保存，只有点击下一题时才保存
  if (detail.value?.challengeMode === 1) {
    return;
  }
  debounceSaveRangeRecord();
};

// 处理答案更新
const handleAnswerUpdate = (questionId, val) => {
  if (isRestoringAnswers.value) return;
  
  answers[questionId] = val;
  changedQuestionIds.add(questionId);
  
  // 闯关模式不自动保存，只有点击下一题时才保存
  if (detail.value?.challengeMode === 1) {
    return;
  }
  debounceSaveRangeRecord();
};

// 判断题目是否已答
const isQuestionAnswered = (index) => {
  const questionId = questions.value[index]?.id;
  return answeredQuestions.value.includes(questionId);
};

// 判断当前题目是否有答案
const hasAnswer = (index) => {
  const questionId = questions.value[index]?.id;
  const ans = answers[questionId];
  if (Array.isArray(ans)) return ans.length > 0 && ans.some(item => item);
  return !!ans;
};

// 提交当前题目答案（闯关模式 - 点击下一题时调用）
const submitCurrentAnswer = async () => {
  const question = questions.value[currentQuestionIndex.value];
  if (!question) return;
  
  const answer = answers[question.id];
  if (!answer || (Array.isArray(answer) && answer.length === 0)) {
    ElMessage.warning('请先作答再提交');
    return;
  }
  
  try {
    // 调用 submitRecord 接口进行保存和判题
    // 闯关模式下只传当前题目的答案
    let userAnswer = answer;
    if (Array.isArray(userAnswer)) {
      // 只对多选题排序，填空题不排序（顺序很重要）
      if (question.questionType === '多选') {
        userAnswer = userAnswer.sort().join('#@#');
      } else {
        // 填空题保持原始顺序
        userAnswer = userAnswer.join('#@#');
      }
    }
    
    const shootingRangeSubmitRecordList = [
      {
        questionId: question.id,
        userAnswer: userAnswer
      }
    ];

    const payload = {};
    if (rangeRecordId.value) {
      payload.id = rangeRecordId.value;
    }
    payload.shootingRangeId = detail.value.id;
    payload.shootingRangeSubmitRecordList = shootingRangeSubmitRecordList;

    const res = await submitShootingRangeRecord(payload);
    
    // 保存返回的记录ID
    if (res.data && typeof res.data === 'object' && res.data.id) {
      rangeRecordId.value = res.data.id;
    }
    
    // 判断答题是否正确
    // 规则：code === 200 且 data 是数字 → 答错（数字是扣分）
    //      code === 200 且 data 是对象 → 答对
    const isCorrect = res.code === 200 && typeof res.data === 'object';
    
    if (isCorrect) {
      // 回答正确
      showFeedback.value = true;
      feedbackType.value = 'correct';
      feedbackMessage.value = '回答正确！继续加油';
      
      // 标记题目已答
      if (!answeredQuestions.value.includes(question.id)) {
        answeredQuestions.value.push(question.id);
      }
      
      // 更新已答题数（闯关模式）
      if (detail.value?.challengeMode === 1) {
        answeredCountFromApi.value++;
      }
      
      setTimeout(() => {
        showFeedback.value = false;
        // 自动进入下一题
        if (currentQuestionIndex.value < questions.value.length - 1) {
          nextQuestion();
        } else {
          // 最后一题答对，提示提交
          ElMessageBox.confirm('恭喜完成所有题目！是否提交报告？', '提示', {
            confirmButtonText: '提交报告',
            cancelButtonText: '检查答案',
            type: 'success'
          }).then(() => {
            submitReport();
          });
        }
      }, 2000);
    } else {
      // 回答错误 - data 是扣除的分数
      // data 就是扣除的分数
      const deductPoints = typeof res.data === 'number' ? res.data : 0;
      
      // 更新总分数和扣分
      if (deductPoints > 0) {
        currentScore.value = Math.max(0, currentScore.value - deductPoints);
        deductedScore.value += deductPoints;
      }
      
      // 立即显示错误提示
      showFeedback.value = true;
      feedbackType.value = 'incorrect';
      feedbackMessage.value = `回答错误，本次扣分 ${deductPoints} 分`;
      
      // 判断是否可以继续（检查分数是否低于合格线）
      const qualified = detail.value?.qualified || 0;
      const shouldEndChallenge = currentScore.value < qualified;
      
      if (shouldEndChallenge) {
        // 分数不足，自动结束 - 3秒后
        setTimeout(() => {
          showFeedback.value = false;
          ElMessageBox.alert(
            `分数不足，比武自动结束！\n当前分数：${currentScore.value}，合格分数：${qualified}`,
            '比武结束',
            {
              confirmButtonText: '查看结果',
              type: 'warning',
              callback: () => {
                submitReport();
              }
            }
          );
        }, 3000);
      } else {
        // 还可以继续，3秒后隐藏提示并初始化答案让用户重新答题
        setTimeout(() => {
          showFeedback.value = false;
          
          // 初始化当前题目的答案
          const questionType = question.questionType;
          if (questionType === '多选' || questionType === '填空') {
            answers[question.id] = [];
          } else {
            answers[question.id] = '';
          }
          
          ElMessage.info('请重新作答');
        }, 3000);
      }
    }
  } catch (error) {
    console.error('提交答案失败:', error);
    ElMessage.error('提交失败，请重试');
  }
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
  
  // 如果没有变更的题目，不需要保存
  if (changedQuestionIds.size === 0) {
    console.log('没有变更的题目，无需保存');
    return;
  }

  // 获取当前需要保存的题目ID快照
  const idsToSave = Array.from(changedQuestionIds);
  
  // 筛选出需要保存的题目
  const questionsToSave = questions.value.filter(q => idsToSave.includes(q.id));
  
  if (questionsToSave.length === 0) {
    console.log('没有找到需要保存的题目');
    return;
  }
  
  // 构建答题记录列表
  const shootingRangeSubmitRecordList = questionsToSave.map(q => {
    let userAnswer = answers[q.id];
    if (Array.isArray(userAnswer)) {
      // 只对多选题排序，填空题不排序（顺序很重要）
      if (q.questionType === '多选') {
        userAnswer = userAnswer.sort().join('#@#');
      } else {
        // 填空题保持原始顺序
        userAnswer = userAnswer.join('#@#');
      }
    }
    
    // 添加附件信息
    const attachment = attachments[q.id] || {};
    
    return {
      questionId: q.id,
      userAnswer: userAnswer || '',
      fileName: attachment.fileName || '',
      filePath: attachment.filePath || ''
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
      
      // 保存成功后，从变更集合中移除已保存的ID
      const idsToSave = Array.from(changedQuestionIds);
      idsToSave.forEach(id => changedQuestionIds.delete(id));
      console.log('已清除保存的题目追踪，剩余未保存:', changedQuestionIds.size);
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
  // 初始化期间或正在恢复答案时，不触发自动暂存
  if (!isInitializing.value && !isRestoringAnswers.value) {
    // 如果是闯关模式(challengeMode === 1)，不自动暂存，只有点击下一题时才保存
    if (detail.value?.challengeMode === 1) {
      return;
    }
    // 普通模式才自动暂存
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
  
  // 提交前强制保存所有已答题目（确保所有答案都被保存）
  try {
    console.log('提交前保存所有答案...');
    
    // 找出所有有答案的题目
    const answeredQuestionIds = questions.value
      .filter(q => {
        const ans = answers[q.id];
        if (Array.isArray(ans)) {
          return ans.length > 0 && ans.some(item => item);
        }
        return !!ans;
      })
      .map(q => q.id);
    
    // 临时将所有已答题目添加到变更集合
    answeredQuestionIds.forEach(id => changedQuestionIds.add(id));
    
    console.log('需要保存的题目数:', changedQuestionIds.size);
    await saveRangeRecord();
    console.log('保存完成，rangeRecordId:', rangeRecordId.value);
  } catch (error) {
    console.error('保存失败:', error);
    // 保存失败也继续提交，因为可能之前已经保存过
    console.warn('保存失败但继续提交流程');
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

    // 处理线索 - 转换图片URL
    if (cluesRes.code === 200) {
      const processedClues = await Promise.all(
        (cluesRes.data || []).map(async (clue) => {
          // 转换线索标题中的图片（如果有）
          if (clue.title) {
            clue.title = await convertImagesToPreviewUrls(clue.title);
          }
          // 转换线索内容中的图片
          if (clue.content) {
            clue.content = await convertImagesToPreviewUrls(clue.content);
          }
          return clue;
        })
      );
      clues.value = processedClues;
      console.log('线索处理完成:', clues.value);
    }

    // 处理题目列表
    if (questionsRes.code === 200 && questionsRes.data) {
      // 从 questionList 接口获取 shootingRangeRecord.id（如果有）
      if (questionsRes.data.shootingRangeRecord && questionsRes.data.shootingRangeRecord.id) {
        // 只有在非重新答题时才保存ID
        if (!isRestart) {
          rangeRecordId.value = questionsRes.data.shootingRangeRecord.id;
          console.log('从questionList获取rangeRecordId:', rangeRecordId.value);
        }
      }
      
      // 初始化总分数（从 questionList 接口返回的 score 字段）
      if (questionsRes.data.score !== undefined) {
        currentScore.value = questionsRes.data.score;
        console.log('初始化总分数:', currentScore.value);
      }
      
      if (questionsRes.data.shootingRangeQuestionList && Array.isArray(questionsRes.data.shootingRangeQuestionList)) {
        // 处理题目列表并转换图片URL
        const processedQuestions = await Promise.all(
          questionsRes.data.shootingRangeQuestionList.map(async (q) => {
            // 转换题目详情中的图片
            if (q.details) {
              q.details = await convertImagesToPreviewUrls(q.details);
            }
            // 转换题目标题中的图片
            if (q.title) {
              q.title = await convertImagesToPreviewUrls(q.title);
            }
            return q;
          })
        );
        
        questions.value = processedQuestions;
        totalQuestionCount.value = questions.value.length; // 设置题目总数
        
        // 初始化答案对象并恢复已保存的答案
        let hasRestoredAnswers = false;
        let answeredCount = 0; // 统计已答题数
        
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
            answeredCount++; // 有答案的题目计数
            
            if (questionType === '多选' || questionType === '填空') {
              // 多选和填空题：将字符串拆分为数组
              answers[questionId] = userAnswer.split('#@#');
            } else {
              // 单选、判断等：直接保存字符串
              answers[questionId] = userAnswer;
            }
          }
          
          // 恢复附件信息（学生提交的附件，不是题目附件）
          if (!isRestart) {
            // 学生答题附件使用 studentFileName 和 studentFilePath 字段
            const studentFileName = q.studentFileName || q.userFileName || '';
            const studentFilePath = q.studentFilePath || q.userFilePath || '';
            
            if (studentFileName || studentFilePath) {
              attachments[questionId] = {
                fileName: studentFileName,
                filePath: studentFilePath
              };
            }
          }
        });
        
        // 设置已答题数
        answeredCountFromApi.value = answeredCount;
        console.log('初始化已答题数:', answeredCountFromApi.value, '总题数:', totalQuestionCount.value);
        
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
    // 在所有初始化完成后，标记初始化结束
    setTimeout(() => {
      isInitializing.value = false;
    }, 500);
  }
});
</script>

<style scoped>
.take-range-layout { height: 100%; display: flex; flex-direction: column; background-color: #f5f7fa; }
.range-header { display: flex; align-items: center; padding: 0 24px; background-color: #fff; border-bottom: 1px solid #e6e6e6; flex-shrink: 0;}
.range-name { font-size: 18px; margin-right: 30px; }
.main-tabs { flex-grow: 1; }
.header-actions { display: flex; align-items: center; gap: 20px; }
.info-item { color: #606266; font-size: 14px; }
.countdown { color: #f56c6c; font-weight: 500; }
.range-body { flex-grow: 1; overflow-y: auto; }
.clue-analysis-panel, .question-panel { display: flex; gap: 20px; padding: 20px; height: 100%; box-sizing: border-box; }
.left-panel { width: 280px; flex-shrink: 0; background-color: #fff; padding: 20px; border-radius: 4px; align-self: flex-start; }
.left-panel h4 { margin: 0 0 16px 0; font-size: 16px; color: #303133; border-bottom: 1px solid #e6e6e6; padding-bottom: 10px; }
.status-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.status-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background-color: #f5f7fa; border-radius: 4px; }
.status-item span:first-child { color: #606266; font-size: 14px; }
.status-item .value { font-weight: 600; color: #303133; font-size: 16px; }
.status-item .value.danger { color: #f56c6c; }
.challenge-warning { padding: 12px; background-color: #fef0f0; color: #f56c6c; border-radius: 4px; font-size: 13px; line-height: 1.6; }
.right-panel { flex: 1; background-color: #fff; padding: 20px; border-radius: 4px; display: flex; flex-direction: column; overflow-y: auto; }
.answer-feedback { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; animation: slideDown 0.3s ease; }
.answer-feedback.correct { background-color: #f0f9ff; color: #67c23a; border: 1px solid #c2e7b0; }
.answer-feedback.incorrect { background-color: #fef0f0; color: #f56c6c; border: 1px solid #fbc4c4; font-weight: 500; font-size: 15px; }
.answer-feedback .el-icon { font-size: 20px; }
@keyframes slideDown {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.question-actions { margin-top: auto; padding-top: 20px; border-top: 1px solid #dcdfe6; text-align: center; }
.info-bar { background-color: #ecf5ff; color: #409eff; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; }
.clue-item { border-bottom: 1px solid #f0f2f5; padding-bottom: 16px; margin-bottom: 16px; }
.clue-title { color: #303133; font-size: 15px; font-weight: 500; margin-bottom: 10px; line-height: 1.6; }
.clue-title :deep(img) { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 4px; }
.clue-content { color: #606266; font-size: 14px; line-height: 1.6; }
.clue-content :deep(img) { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 4px; }
.clue-attachment { margin-top: 10px; }
.clue-attachment .el-link { font-size: 14px; }
.clues-content { overflow-y: auto; }
.question-nav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 10px; }
.nav-item { border: 1px solid #dcdfe6; border-radius: 4px; text-align: center; padding: 8px 0; cursor: pointer; }
.nav-item.answered { background-color: #409eff; color: #fff; border-color: #409eff; }
.nav-item.current { border-color: #f56c6c; background-color: #f56c6c; color: #fff; }
.clue-content { color: #606266; font-size: 14px; line-height: 1.6; }
.clue-content :deep(img) { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 4px; }
.pagination-controls { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 20px; border-top: 1px solid #dcdfe6; }
.question-progress { font-size: 16px; font-weight: 500; color: #606266; }

/* 进度信息 */
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}

/* 调证和核查按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #409eff;
  font-size: 15px;
}
.action-btn:hover {
  background-color: #ecf5ff;
}
.action-btn .el-icon {
  color: #409eff;
}

/* 弹窗样式 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.dialog-subtitle {
  font-size: 14px;
  color: #e6a23c;
}

/* 调证弹窗内容 */
.investigate-content {
  padding: 10px 0;
}
.quota-info {
  background-color: #fdf6ec;
  color: #e6a23c;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.filter-row {
  display: flex;
  align-items: center;
}
.add-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}
.add-filter .el-icon {
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  padding: 4px;
}
.add-note {
  color: #e6a23c;
  font-size: 13px;
}
.add-filter-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.add-filter-btn .el-icon {
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  padding: 4px;
  color: #606266;
}
.history-section {
  margin-top: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.history-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  font-size: 14px;
}

/* 线下核查弹窗内容 */
.offline-check-content {
  padding: 10px 0;
}
.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.offline-check-history {
  padding: 10px 0;
}
</style>