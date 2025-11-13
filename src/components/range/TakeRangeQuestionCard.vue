<template>
  <el-card class="question-card" :id="'question-' + questionData.id">
    <div class="question-header">
      <span>{{ index + 1 }}.</span>
      <el-tag>{{ questionData.questionType }}</el-tag>
    </div>
    <div class="question-title" v-html="questionData.title"></div>

    <div class="answer-area">
      <el-radio-group v-if="questionData.questionType === '单选'" v-model="answerModel" :disabled="disabled">
        <el-radio v-for="opt in displayOptions" :key="opt.displayOption" :label="opt.originalOption" size="large">
          {{ opt.displayOption }}. {{ opt.value }}
        </el-radio>
      </el-radio-group>

      <el-checkbox-group v-else-if="questionData.questionType === '多选'" v-model="answerModel" :disabled="disabled">
        <el-checkbox v-for="opt in displayOptions" :key="opt.displayOption" :label="opt.originalOption" size="large">
          {{ opt.displayOption }}. {{ opt.value }}
        </el-checkbox>
      </el-checkbox-group>

      <el-radio-group v-else-if="questionData.questionType === '判断'" v-model="answerModel" :disabled="disabled">
        <el-radio label="0" size="large">正确</el-radio>
        <el-radio label="1" size="large">错误</el-radio>
      </el-radio-group>

      <div v-else-if="questionData.questionType === '填空'">
        <div v-for="(n, i) in blankCount" :key="i" class="blank-fill-item">
          <span>空 {{ i + 1 }}: </span>
          <el-input v-model="answerModel[i]" placeholder="请输入答案" :disabled="disabled" />
        </div>
      </div>
      
      <el-input
        v-else-if="['论述', '简答'].includes(questionData.questionType)"
        v-model="answerModel"
        type="textarea"
        :rows="8"
        placeholder="请输入您的答案"
        :disabled="disabled"
      />
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  questionData: { type: Object, required: true },
  index: { type: Number, required: true },
  modelValue: { type: [String, Array] },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const answerModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const displayOptions = computed(() => {
  if (props.questionData.details) {
    try {
      const originalOptions = JSON.parse(props.questionData.details);
      return originalOptions.map((opt, index) => ({
        originalOption: opt.option,
        displayOption: String.fromCharCode(65 + index),
        value: opt.value
      }));
    } catch (e) {
      return [];
    }
  }
  return [];
});

// 计算填空题数量
const blankCount = computed(() => {
  if (props.questionData.questionType === '填空') {
    const title = props.questionData.title || '';
    // 使用带有 'g' 标志的正则表达式进行全局匹配，来计算___的数量
    const matches = title.match(/___/g);
    return matches ? matches.length : 1; // 至少返回1个空
  }
  return 0;
});
</script>

<style scoped>
/* 样式与 TakeExamQuestionCard.vue 保持一致 */
.question-card { border: none; box-shadow: none; }
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; font-size: 16px; }
.question-title { font-size: 15px; line-height: 1.7; color: #303133; margin-bottom: 20px; }
.el-radio-group, .el-checkbox-group { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; }
.blank-fill-item { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
.blank-fill-item span { font-size: 14px; font-weight: 500; min-width: 60px; }
</style>