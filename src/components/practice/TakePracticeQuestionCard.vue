<template>
  <el-card class="question-card" :id="'question-' + questionData.question.id">
    <div class="question-header">
      <span>{{ index + 1 }}.</span>
      <el-tag>{{ questionData.question.questionType }}</el-tag>
    </div>
    <div class="question-title" v-html="questionData.question.title"></div>

    <div class="answer-area">
      <el-radio-group v-if="questionData.question.questionType === '单选'" v-model="answerModel">
        <el-radio 
          v-for="opt in displayOptions" 
          :key="opt.displayOption" 
          :label="opt.originalOption" 
          size="large"
        >
          {{ opt.displayOption }}. {{ opt.value }}
        </el-radio>
      </el-radio-group>

      <el-checkbox-group v-else-if="questionData.question.questionType === '多选'" v-model="answerModel">
        <el-checkbox 
          v-for="opt in displayOptions" 
          :key="opt.displayOption" 
          :label="opt.originalOption" 
          size="large"
        >
          {{ opt.displayOption }}. {{ opt.value }}
        </el-checkbox>
      </el-checkbox-group>

      <el-radio-group v-else-if="questionData.question.questionType === '判断'" v-model="answerModel">
        <el-radio label="1" size="large">正确</el-radio>
        <el-radio label="0" size="large">错误</el-radio>
      </el-radio-group>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  questionData: { type: Object, required: true },
  index: { type: Number, required: true },
  modelValue: { type: [String, Array] }
});

const emit = defineEmits(['update:modelValue']);

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
</script>

<style scoped>
.question-card { margin-bottom: 20px; }
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; font-size: 16px; }
.question-title { font-size: 15px; line-height: 1.7; color: #303133; margin-bottom: 20px; }
.el-radio-group, .el-checkbox-group { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; }
</style>