<template>
  <el-card class="question-card" :id="'question-' + questionData.question.id" v-image-preview>
    <div class="question-header">
      <span>{{ index + 1 }}.</span>
      <el-tag>{{ questionData.question.questionType }}</el-tag>
    </div>
    <div class="question-title" v-html="processedTitle"></div>

    <!-- 论述题详情 -->

    <div class="answer-area">
      <el-radio-group 
        v-if="questionData.question.questionType === '单选'" 
        v-model="answerModel"
        :disabled="isSubmitted"
        @change="handleSingleChoiceChange"
      >
        <el-radio 
          v-for="opt in displayOptions" 
          :key="opt.displayOption" 
          :label="opt.originalOption" 
          size="large"
          :class="{
            'correct-option': isSubmitted && isCorrectOption(opt.originalOption),
            'wrong-option': isSubmitted && isWrongOption(opt.originalOption)
          }"
        >
          {{ opt.displayOption }}. {{ opt.value }}
        </el-radio>
      </el-radio-group>

      <el-checkbox-group 
        v-else-if="questionData.question.questionType === '多选'" 
        v-model="answerModel"
        :disabled="isSubmitted"
      >
        <el-checkbox 
          v-for="opt in displayOptions" 
          :key="opt.displayOption" 
          :label="opt.originalOption" 
          size="large"
          :class="{
            'correct-option': isSubmitted && isCorrectOption(opt.originalOption),
            'wrong-option': isSubmitted && isWrongOption(opt.originalOption)
          }"
        >
          {{ opt.displayOption }}. {{ opt.value }}
        </el-checkbox>
      </el-checkbox-group>

      <el-radio-group 
        v-else-if="questionData.question.questionType === '判断'" 
        v-model="answerModel"
        :disabled="isSubmitted"
        @change="handleJudgeChange"
      >
        <el-radio 
          label="0" 
          size="large"
          :class="{
            'correct-option': isSubmitted && isCorrectOption('0'),
            'wrong-option': isSubmitted && isWrongOption('0')
          }"
        >
          正确
        </el-radio>
        <el-radio 
          label="1" 
          size="large"
          :class="{
            'correct-option': isSubmitted && isCorrectOption('1'),
            'wrong-option': isSubmitted && isWrongOption('1')
          }"
        >
          错误
        </el-radio>
      </el-radio-group>

      <div v-else-if="questionData.question.questionType === '填空'">
        <div v-for="(n, i) in blankCount" :key="i" class="blank-fill-item">
          <span>空 {{ i + 1 }}: </span>
          <el-input 
            v-model="blankAnswers[i]"
            placeholder="请输入答案"
            :disabled="isSubmitted"
          />
        </div>
      </div>

      <el-input
        v-else-if="['论述', '简答'].includes(questionData.question.questionType)"
        v-model="answerModel"
        type="textarea"
        :rows="5"
        placeholder="请输入您的答案"
        :disabled="isSubmitted"
      />
    </div>

    <!-- 答案和解析显示区域 -->
    <div v-if="isSubmitted" class="answer-result-section">
      <el-divider></el-divider>
      
      <div class="correct-answer-section">
        <div class="section-title">
          <el-icon :color="isAnswerCorrect ? '#67c23a' : '#f56c6c'">
            <component :is="isAnswerCorrect ? 'CircleCheck' : 'CircleClose'" />
          </el-icon>
          <span :style="{ color: isAnswerCorrect ? '#67c23a' : '#f56c6c' }">
            {{ isAnswerCorrect ? '回答正确' : '回答错误' }}
          </span>
        </div>
        <div class="correct-answer-content">
          <span class="label">正确答案：</span>
          <span class="answer-text">{{ formatCorrectAnswer }}</span>
        </div>
      </div>

      <div v-if="questionData.question.analysis" class="analysis-section">
        <div class="section-title">题目解析：</div>
        <div class="analysis-content" v-html="processedAnalysis"></div>
      </div>

      <!-- 附件显示 -->
      <div v-if="questionData.question.filepath" class="attachment-section">
        <a :href="questionData.question.filepath" target="_blank" class="attachment-link">
          <el-icon><Document /></el-icon>
          查看附件
        </a>
      </div>
    </div>

    <!-- 按钮区域 -->
    <div class="action-buttons">
      <el-button 
        v-if="!isSubmitted && needSubmitButton"
        type="primary" 
        @click="handleViewAnswer"
        :disabled="!canSubmit"
      >
        查看答案
      </el-button>

      <div v-if="isSubmitted" class="navigation-buttons">
        <el-button 
          @click="handlePreviousQuestion" 
          :disabled="index === 0"
          size="large"
        >
          上一题
        </el-button>
        
        <el-button 
          v-if="!isLastQuestion"
          @click="handleNextQuestion" 
          type="primary"
          size="large"
        >
          下一题
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import { CircleCheck, CircleClose, Document } from '@element-plus/icons-vue';
import { previewFile } from '@/api/common/PreviewFile';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { useImagePreview } from '@/composables/useImagePreview';

const props = defineProps({
  questionData: { type: Object, required: true },
  index: { type: Number, required: true },
  modelValue: { type: [String, Array] },
  isLastQuestion: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'submit-answer', 'next-question']);

// 填空题使用本地状态管理
const blankAnswers = ref([]);
let isInitializing = false;

// 是否已提交
const isSubmitted = ref(false);
// 答案是否正确
const isAnswerCorrect = ref(false);

// 处理后的题目标题和解析
const processedTitle = ref('');
const processedDetails = ref('');
const processedAnalysis = ref('');

// 转换HTML中的图片URL为预览URL
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

const answerModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 【核心修正】移除 JSON.parse，直接使用父组件传递过来的、已经解析好的数组
const displayOptions = computed(() => {
  const originalOptions = props.questionData.question?.details;
  if (Array.isArray(originalOptions)) {
    // 确保前端无论后端选项顺序如何，都统一显示为 A, B, C, D...
    return originalOptions.map((opt, index) => {
      return {
        originalOption: opt.option,
        displayOption: String.fromCharCode(65 + index),
        value: opt.value
      };
    });
  }
  return [];
});

// 计算填空题数量
const blankCount = computed(() => {
  if (props.questionData.question.questionType === '填空') {
    const title = props.questionData.question.title || '';
    const matches = title.match(/___/g);
    return matches ? matches.length : 0;
  }
  return 0;
});

// 初始化填空题答案
const initBlankAnswers = () => {
  isInitializing = true;
  const count = blankCount.value;
  const currentValue = props.modelValue;
  
  if (Array.isArray(currentValue) && currentValue.length === count) {
    blankAnswers.value = [...currentValue];
  } else {
    blankAnswers.value = Array(count).fill('');
  }
  
  setTimeout(() => {
    isInitializing = false;
  }, 0);
};

// 监听 modelValue 变化,同步到本地状态(用于 API 返回数据)
watch(() => props.modelValue, (newValue) => {
  if (props.questionData.question.questionType === '填空' && Array.isArray(newValue)) {
    isInitializing = true;
    blankAnswers.value = [...newValue];
    setTimeout(() => {
      isInitializing = false;
    }, 0);
  }
}, { immediate: true });

// 监听填空题数量变化
watch(blankCount, (newCount) => {
  if (props.questionData.question.questionType === '填空' && newCount > 0) {
    initBlankAnswers();
  }
}, { immediate: true });

// 监听本地填空答案变化,同步到父组件
watch(blankAnswers, (newValue) => {
  if (!isInitializing && props.questionData.question.questionType === '填空') {
    emit('update:modelValue', [...newValue]);
  }
}, { deep: true });

// 判断是否需要"查看答案"按钮（多选、填空、简答、论述）
const needSubmitButton = computed(() => {
  const type = props.questionData.question.questionType;
  return ['多选', '填空', '简答', '论述'].includes(type);
});

// 是否可以提交（用户已作答）
const canSubmit = computed(() => {
  const ans = props.modelValue;
  if (Array.isArray(ans)) {
    return ans.some(item => item !== null && item !== '');
  }
  return !!ans;
});

// 格式化正确答案显示
const formatCorrectAnswer = computed(() => {
  const answer = props.questionData.question.answer;
  const type = props.questionData.question.questionType;
  
  if (!answer) return '无';
  
  if (type === '单选' || type === '多选') {
    // 将答案选项转换为显示格式 (A, B, C, D)
    const answerArray = answer.split('#@#').filter(a => a);
    return answerArray.map(opt => {
      const index = displayOptions.value.findIndex(o => o.originalOption === opt);
      return index >= 0 ? String.fromCharCode(65 + index) : opt;
    }).join('、');
  } else if (type === '判断') {
    return answer === '0' ? '正确' : '错误';
  } else if (type === '填空') {
    return answer.split('#@#').filter(a => a).join('；');
  } else {
    return answer;
  }
});

// 检查答案是否正确
const checkAnswer = () => {
  const correctAnswer = props.questionData.question.answer;
  const userAnswer = props.modelValue;
  const type = props.questionData.question.questionType;
  
  // 简答题、论述题都算正确
  if (['简答', '论述'].includes(type)) {
    return true;
  }
  
  if (!userAnswer || !correctAnswer) return false;
  
  if (type === '单选' || type === '判断') {
    return userAnswer === correctAnswer;
  } else if (type === '多选' || type === '填空') {
    // 对数组答案进行排序比较
    const userArr = Array.isArray(userAnswer) ? [...userAnswer].filter(a => a).sort() : [];
    const correctArr = correctAnswer.split('#@#').filter(a => a).sort();
    return JSON.stringify(userArr) === JSON.stringify(correctArr);
  }
  
  return false;
};

// 判断某个选项是否是正确选项
const isCorrectOption = (option) => {
  const correctAnswer = props.questionData.question.answer;
  if (!correctAnswer) return false;
  
  const correctOptions = correctAnswer.split('#@#').filter(a => a);
  return correctOptions.includes(option);
};

// 判断某个选项是否是用户选错的选项
const isWrongOption = (option) => {
  const userAnswer = props.modelValue;
  if (!userAnswer) return false;
  
  const type = props.questionData.question.questionType;
  
  if (type === '单选' || type === '判断') {
    // 用户选了这个选项，但不是正确答案
    return userAnswer === option && !isCorrectOption(option);
  } else if (type === '多选') {
    // 用户选了这个选项，但不是正确答案
    return Array.isArray(userAnswer) && userAnswer.includes(option) && !isCorrectOption(option);
  }
  
  return false;
};

// 单选题选择后立即提交
const handleSingleChoiceChange = () => {
  if (!isSubmitted.value) {
    submitAnswer();
  }
};

// 判断题选择后立即提交
const handleJudgeChange = () => {
  if (!isSubmitted.value) {
    submitAnswer();
  }
};

// 查看答案按钮点击
const handleViewAnswer = () => {
  submitAnswer();
};

// 提交答案
const submitAnswer = () => {
  isAnswerCorrect.value = checkAnswer();
  isSubmitted.value = true;
  
  // 通知父组件
  emit('submit-answer', props.questionData.id, isAnswerCorrect.value);
};

// 上一题
const handlePreviousQuestion = () => {
  // 触发父组件的上一题方法
  const event = new CustomEvent('previous-question');
  window.dispatchEvent(event);
};

// 下一题
const handleNextQuestion = () => {
  emit('next-question');
};

// 监听题目切换，重置提交状态
watch(() => props.questionData.id, () => {
  isSubmitted.value = false;
  isAnswerCorrect.value = false;
});

// 监听 questionData 变化，处理图片
watch(() => props.questionData, async (newData) => {
  if (newData && newData.question) {
    processedTitle.value = await convertImagesToPreviewUrls(newData.question.title);
    processedDetails.value = await convertImagesToPreviewUrls(newData.question.details);
    processedAnalysis.value = await convertImagesToPreviewUrls(newData.question.analysis);
  }
}, { immediate: true });

// 图片预览相关
const cardRef = ref(null);
const imagePreviewRef = ref(null);

// 处理图片点击事件
const handleImageClick = (imageUrl, allImages) => {
  if (imagePreviewRef.value) {
    imagePreviewRef.value.open(imageUrl, allImages);
  }
};

// 使用图片预览 composable
useImagePreview(cardRef, handleImageClick);
</script>

<style scoped>
.question-card { 
  margin-bottom: 20px;
  height: auto;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; font-size: 16px; }
.question-title { 
  font-size: 15px; 
  line-height: 1.7; 
  color: #303133; 
  margin-bottom: 20px;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}
.question-title :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
.details-wrapper {
  margin-top: 12px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #fff9e6;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;
}
.details-title {
  margin: 0 0 5px 0;
  font-weight: bold;
  color: #e6a23c;
  font-size: 13px;
}
.details-content, .details-content p {
  font-size: 13px;
  margin: 0;
  color: #606266;
}
.details-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
.answer-area {
  margin-bottom: 20px;
}
.el-radio-group, .el-checkbox-group { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; }
.blank-fill-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.blank-fill-item span {
  width: 60px;
  flex-shrink: 0;
}

/* 答案结果区域 */
.answer-result-section {
  margin-top: 20px;
}

.correct-answer-section,
.analysis-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 15px !important;
  margin-bottom: 10px;
  color: #303133;
}

.correct-answer-content {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.correct-answer-content .label {
  font-weight: 500;
  color: #606266;
}

.correct-answer-content .answer-text {
  color: #303133;
}

.analysis-content {
  padding: 12px;
  background-color: #ecf5ff;
  border-radius: 4px;
  line-height: 1.7;
  color: #303133;
  font-size: 14px;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}
.analysis-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}

.attachment-section {
  margin-top: 15px;
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.attachment-link:hover {
  color: #66b1ff;
}

/* 选项样式 */
:deep(.correct-option .el-radio__label),
:deep(.correct-option .el-checkbox__label) {
  color: #67c23a !important;
  font-weight: bold;
}

:deep(.wrong-option .el-radio__label),
:deep(.wrong-option .el-checkbox__label) {
  color: #f56c6c !important;
  font-weight: bold;
}

:deep(.correct-option .el-radio__input.is-checked .el-radio__inner) {
  background-color: #67c23a;
  border-color: #67c23a;
}

:deep(.wrong-option .el-radio__input.is-checked .el-radio__inner) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

:deep(.correct-option .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #67c23a;
  border-color: #67c23a;
}

:deep(.wrong-option .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

/* 按钮区域 */
.action-buttons {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>