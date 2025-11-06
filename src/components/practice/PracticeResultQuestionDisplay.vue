<template>
  <el-card class="question-card" :id="'question-' + record.question.id">
    <div class="card-content">
      <div v-if="record.isCorrect === 2" class="stamp correct">回答正确</div>
      <div v-else class="stamp incorrect">回答错误</div>

      <div class="question-header">
        <span>{{ index + 1 }}.</span>
        <el-tag>{{ record.question.questionType }}</el-tag>
      </div>
      <div class="question-title" v-html="processedTitle"></div>

      <div class="answer-area">
        <el-radio-group v-if="record.question.questionType === '单选'" :model-value="record.userAnswer" disabled>
          <el-radio v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" size="large">
            <span :class="{ 'correct-option-text': isCorrectAnswer(opt.option), 'incorrect-option-text': isIncorrectUserAnswer(opt.option) }">
              {{ opt.option }}. {{ opt.value }}
            </span>
          </el-radio>
        </el-radio-group>

        <el-checkbox-group v-else-if="record.question.questionType === '多选'" :model-value="userAnswersForMultiChoice" disabled>
          <el-checkbox v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" size="large">
            <span :class="{ 'correct-option-text': isCorrectAnswer(opt.option), 'incorrect-option-text': isIncorrectUserAnswer(opt.option) }">
              {{ opt.option }}. {{ opt.value }}
            </span>
          </el-checkbox>
        </el-checkbox-group>
        
        </div>

      <div class="feedback-section">
        <p><strong>你的答案：</strong> <span :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">{{ formatUserAnswer(record.userAnswer) || '未作答' }}</span></p>
        <p><strong>正确答案：</strong> <span class="correct-text">{{ formatCorrectAnswer(record.question.answer) }}</span></p>
        <div v-if="processedAnalysis">
          <p><strong>题目解析：</strong></p>
          <div v-html="processedAnalysis"></div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { previewFile } from '@/api/common/PreviewFile';

const props = defineProps({
  record: { type: Object, required: true },
  index: { type: Number, required: true }
});

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

// 处理后的题目标题
const processedTitle = ref('');
// 处理后的解析
const processedAnalysis = ref('');

// 监听 record 变化，处理图片
watch(() => props.record, async (newRecord) => {
  if (newRecord && newRecord.question) {
    processedTitle.value = await convertImagesToPreviewUrls(newRecord.question.title);
    processedAnalysis.value = await convertImagesToPreviewUrls(newRecord.question.analysis);
  }
}, { immediate: true });

const parsedOptions = computed(() => {
  const details = props.record.question?.details;
  if (details) {
    try { 
      return JSON.parse(details);
    } catch (e) { 
      console.error("解析题目选项失败:", e);
      return []; 
    }
  }
  return [];
});

const correctAnswers = computed(() => {
  const answer = props.record.question.answer;
  if (props.record.question.questionType === '多选' && answer) {
    return answer.split('#@#');
  }
  return answer ? [answer] : [];
});

const userAnswersForMultiChoice = computed(() => {
  if (props.record.question.questionType === '多选' && props.record.userAnswer) {
    return props.record.userAnswer.split('#@#');
  }
  return [];
});

const isCorrectAnswer = (option) => {
  return correctAnswers.value.includes(option);
};

const isIncorrectUserAnswer = (option) => {
  // 完全参考 ExamResult.vue 的逻辑：判断 isCorrect 是否严格等于 2
  if (props.record.isCorrect === 2) return false;
  const userAnswers = props.record.question.questionType === '多选' 
    ? userAnswersForMultiChoice.value 
    : [props.record.userAnswer];
  return userAnswers.includes(option) && !isCorrectAnswer(option);
};

// 格式化填空题答案
const formatFillBlankAnswer = (answer) => {
  if (!answer) return '';
  // 使用逗号加空格作为分隔符
  return answer.replace(/#@#/g, ', ');
};

// 格式化用户答案显示
const formatUserAnswer = (answer) => {
  if (!answer) return '';
  if (props.record.question.questionType === '判断') {
    return answer === '0' ? '正确' : answer === '1' ? '错误' : answer;
  }
  if (props.record.question.questionType === '填空') {
    return formatFillBlankAnswer(answer);
  }
  if (props.record.question.questionType === '多选') {
    return answer.replace(/#@#/g, '、');
  }
  return answer;
};

// 格式化正确答案显示
const formatCorrectAnswer = (answer) => {
  if (!answer) return '';
  if (props.record.question.questionType === '判断') {
    return answer === '0' ? '正确' : answer === '1' ? '错误' : answer;
  }
  if (props.record.question.questionType === '填空') {
    return formatFillBlankAnswer(answer);
  }
  if (props.record.question.questionType === '多选') {
    return answer.replace(/#@#/g, '、');
  }
  return answer;
};
</script>

<style scoped>
.question-card { margin-bottom: 20px; position: relative; overflow: hidden; }
.card-content { position: relative; }
.stamp { position: absolute; top: 15px; right: -35px; transform: rotate(45deg); padding: 5px 40px; font-size: 14px; color: white; font-weight: bold; z-index: 1; }
.stamp.correct { background-color: #67c23a; }
.stamp.incorrect { background-color: #f56c6c; }
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
.question-title :deep(img),
.feedback-section :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
.answer-area { margin-bottom: 15px; }
.el-radio-group, .el-checkbox-group { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; }
.el-radio, .el-checkbox { cursor: default; }
.correct-option-text { color: #67c23a; font-weight: bold; }
.incorrect-option-text { color: #f56c6c; text-decoration: line-through; }
.feedback-section { margin-top: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #f0f2f5; border-radius: 4px; font-size: 14px; line-height: 1.6; }
.feedback-section p { margin: 0 0 8px 0; }
.correct-text { color: #67c23a; font-weight: 500; }
.incorrect-text { color: #f56c6c; font-weight: 500; }
</style>