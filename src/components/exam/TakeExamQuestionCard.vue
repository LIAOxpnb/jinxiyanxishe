
<template>
  <el-card class="question-card" :id="'question-' + questionData.question.id">
    <div class="question-header">
      <span>{{ index + 1 }}.</span>
      <el-tag>{{ questionData.question.questionType }}</el-tag>
    </div>
    <div class="question-title" v-html="questionData.question.title"></div>

    <div class="answer-area">
      <el-radio-group v-if="questionData.question.questionType === '单选'" v-model="answerModel">
        <el-radio v-for="opt in displayOptions" :key="opt.displayOption" :label="opt.originalOption" size="large">
          {{ opt.displayOption }}. {{ opt.value }}
        </el-radio>
      </el-radio-group>

      <el-checkbox-group v-else-if="questionData.question.questionType === '多选'" v-model="answerModel">
        <el-checkbox v-for="opt in displayOptions" :key="opt.displayOption" :label="opt.originalOption" size="large">
          {{ opt.displayOption }}. {{ opt.value }}
        </el-checkbox>
      </el-checkbox-group>

      <el-radio-group v-else-if="questionData.question.questionType === '判断'" v-model="answerModel">
        <el-radio label="1" size="large">正确</el-radio>
        <el-radio label="0" size="large">错误</el-radio>
      </el-radio-group>

      <div v-else-if="questionData.question.questionType === '填空'">
        <div v-for="(n, i) in blankCount" :key="i" class="blank-fill-item">
          <span>空 {{ i + 1 }}: </span>
          <el-input v-model="answerModel[i]" placeholder="请输入答案" />
        </div>
      </div>

      <el-input
        v-else-if="['论述', '简答'].includes(questionData.question.questionType)"
        v-model="answerModel"
        type="textarea"
        :rows="5"
        placeholder="请输入您的答案"
      />
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  questionData: { type: Object, required: true },
  index: { type: Number, required: true },
  modelValue: { type: [String, Array] } // 接收父组件传来的答案
});

const emit = defineEmits(['update:modelValue']);

// 使用 v-model 实现答案的双向绑定
const answerModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 解析并重新映射选项以进行显示
const displayOptions = computed(() => {
  if (props.questionData.question.details) {
    try {
      // 1. 直接解析后端的JSON，保持其原始顺序
      const originalOptions = JSON.parse(props.questionData.question.details);

      // 2. 遍历原始数组，创建用于显示的新数组
      return originalOptions.map((opt, index) => {
        return {
          // 后端真实的选项标识 (e.g., "B", "A", "C", "D")，用于提交答案
          originalOption: opt.option,
          // 前端显示的选项标识 (e.g., "A", "B", "C", "D")
          displayOption: String.fromCharCode(65 + index),
          // 选项的文本内容
          value: opt.value
        };
      });
    } catch (e) {
      console.error("解析选项JSON失败:", e);
      return [];
    }
  }
  return [];
});

// 计算填空题数量
// [核心修正] 重写填空题数量的计算逻辑
const blankCount = computed(() => {
  if (props.questionData.question.questionType === '填空') {
    const title = props.questionData.question.title || '';
    // 使用带有 'g' 标志的正则表达式进行全局匹配，来计算___的数量
    const matches = title.match(/___/g);
    const count = matches ? matches.length : 0;
    
    // [健壮性] 确保答案数组的长度与填空数量一致
    // 父组件在创建时应初始化 modelValue 为 []
    if (Array.isArray(answerModel.value)) {
      while (answerModel.value.length < count) {
        answerModel.value.push('');
      }
      if (answerModel.value.length > count) {
        answerModel.value.splice(count);
      }
    }
    
    return count;
  }
  return 0;
});
</script>

<style scoped>
.question-card {
  margin-bottom: 20px;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 16px;
}
.question-title {
  font-size: 15px;
  line-height: 1.7;
  color: #303133;
  margin-bottom: 20px;
}
.el-radio-group, .el-checkbox-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
}
.blank-fill-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.blank-fill-item span {
  width: 60px;
  flex-shrink: 0;
}
</style>