<template>
  <el-card class="question-card" :id="'question-' + record.question.id">
    <div class="card-content">
      <div v-if="record.isCorrect === 2" class="stamp correct">回答正确</div>
      <div v-else class="stamp incorrect">回答错误</div>

      <div class="question-header">
        <span>{{ index + 1 }}.</span>
        <el-tag>{{ record.question.questionType }}</el-tag>
      </div>
      <div class="question-title" v-html="record.question.title"></div>

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
        <p><strong>你的答案：</strong> <span :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">{{ record.userAnswer || '未作答' }}</span></p>
        <p><strong>正确答案：</strong> <span class="correct-text">{{ record.question.answer }}</span></p>
        <div v-if="record.question.analysis">
          <p><strong>题目解析：</strong></p>
          <div v-html="record.question.analysis"></div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  record: { type: Object, required: true },
  index: { type: Number, required: true }
});

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
</script>

<style scoped>
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
.incorrect-option-text { color: #f56c6c; text-decoration: line-through; }
.feedback-section { margin-top: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #f0f2f5; border-radius: 4px; font-size: 14px; line-height: 1.6; }
.feedback-section p { margin: 0 0 8px 0; }
.correct-text { color: #67c23a; font-weight: 500; }
.incorrect-text { color: #f56c6c; font-weight: 500; }
</style>