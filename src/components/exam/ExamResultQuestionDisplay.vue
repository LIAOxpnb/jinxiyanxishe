<template>
  <el-card class="question-card" :id="'question-' + record.questionId">
    <div class="card-content">
      <div v-if="record.isCorrect === 2" class="stamp correct">回答正确</div>
      <div v-else-if="record.isCorrect === 1" class="stamp incorrect">回答错误</div>

      <div class="question-header">
        <span>{{ index + 1 }}.</span>
        <el-tag>{{ record.question.questionType }}</el-tag>
      </div>
      <div class="question-title" v-html="record.question.title"></div>

      <div class="answer-area">
        <el-radio-group v-if="record.question.questionType === '单选'" :model-value="record.userAnswer" disabled>
          <el-radio v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" size="large">
            <span :class="{ 'correct-option-text': isCorrectAnswer(opt.option) }">{{ opt.option }}. {{ opt.value }}</span>
          </el-radio>
        </el-radio-group>

        <el-checkbox-group v-else-if="record.question.questionType === '多选'" :model-value="userAnswersForMultiChoice" disabled>
          <el-checkbox v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" size="large">
            <span :class="{ 'correct-option-text': isCorrectAnswer(opt.option) }">{{ opt.option }}. {{ opt.value }}</span>
          </el-checkbox>
        </el-checkbox-group>

        <el-radio-group v-else-if="record.question.questionType === '判断'" :model-value="record.userAnswer" disabled>
          <el-radio label="0" size="large">
            <span :class="{ 'correct-option-text': record.question.answer === '0' }">正确</span>
          </el-radio>
          <el-radio label="1" size="large">
            <span :class="{ 'correct-option-text': record.question.answer === '1' }">错误</span>
          </el-radio>
        </el-radio-group>

        <div v-else-if="record.question.questionType === '填空'" class="fill-blank-answer">
          <p><strong>你的答案：</strong> <span :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">{{ formatFillBlankAnswer(record.userAnswer) || '未作答' }}</span></p>
        </div>

        <div v-else-if="['论述', '简答'].includes(record.question.questionType)" class="essay-answer">
          <p><strong>你的答案：</strong></p>
          <div class="essay-content" :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">
            {{ record.userAnswer || '未作答' }}
          </div>
        </div>
        
        </div>

      <div class="feedback-section">
        <p v-if="!['填空', '论述', '简答'].includes(record.question.questionType)"><strong>你的答案：</strong> <span :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">{{ formatUserAnswer(record.userAnswer) || '未作答' }}</span></p>
        <p><strong>正确答案：</strong> {{ formatCorrectAnswer(record.question.answer) }}</p>
        <p v-if="record.question.analysis"><strong>题目解析：</strong></p>
        <div v-if="record.question.analysis" v-html="record.question.analysis"></div>
      </div>
       <div class="attachment-wrapper" v-if="record.question.filePath">
        <el-link :icon="Link" type="primary">{{ record.question.fileName || '附件' }}</el-link>
      </div>

      <!-- <div class="nav-buttons">
          <el-button @click="$emit('prev')">上一题</el-button>
          <el-button @click="$emit('next')">下一题</el-button>
      </div> -->
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';
import { Link } from '@element-plus/icons-vue';

const props = defineProps({
  record: { type: Object, required: true },
  index: { type: Number, required: true }
});

defineEmits(['prev', 'next']);

const parsedOptions = computed(() => {
  if (props.record.question.details) {
    try { return JSON.parse(props.record.question.details); } catch (e) { return []; }
  }
  return [];
});

const correctAnswersForMultiChoice = computed(() => {
  if (props.record.question.questionType === '多选' && props.record.question.answer) {
    return props.record.question.answer.split('#@#');
  }
  return [];
});

const userAnswersForMultiChoice = computed(() => {
  if (props.record.question.questionType === '多选' && props.record.userAnswer) {
    return props.record.userAnswer.split('#@#');
  }
  return [];
});

// 判断某个选项是否是正确答案的一部分
const isCorrectAnswer = (option) => {
    if (props.record.question.questionType === '单选') {
        return props.record.question.answer === option;
    }
    if (props.record.question.questionType === '多选') {
        return correctAnswersForMultiChoice.value.includes(option);
    }
    return false;
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
/* 样式与上一个阅卷卡片类似，但有微调 */
.question-card { margin-bottom: 20px; position: relative; overflow: hidden; }
.card-content { position: relative; }
.stamp { position: absolute; top: 15px; right: -35px; transform: rotate(45deg); padding: 5px 40px; font-size: 14px; color: white; font-weight: bold; z-index: 1; }
.stamp.correct { background-color: #67c23a; }
.stamp.incorrect { background-color: #f56c6c; }
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; font-size: 16px; }
.question-title { font-size: 15px; line-height: 1.7; color: #303133; margin-bottom: 20px; }
.answer-area { margin-bottom: 15px; }
.el-radio-group, .el-checkbox-group { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; }
.el-radio, .el-checkbox { cursor: default; }
.correct-option-text { color: #67c23a; font-weight: bold; }
.correct-text { color: #67c23a; font-weight: bold; }
.incorrect-text { color: #f56c6c; font-weight: bold; }
.fill-blank-answer, .essay-answer { margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
.essay-content { margin-top: 8px; padding: 8px; background-color: white; border: 1px solid #dcdfe6; border-radius: 4px; min-height: 60px; white-space: pre-wrap; }
.feedback-section { margin-top: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #f0f2f5; border-radius: 4px; font-size: 14px; line-height: 1.6; }
.attachment-wrapper { margin-top: 8px; }
.nav-buttons { margin-top: 20px; text-align: center; }
</style>