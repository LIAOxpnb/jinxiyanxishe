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
        <el-radio label="0" size="large">正确</el-radio>
        <el-radio label="1" size="large">错误</el-radio>
      </el-radio-group>

      <div v-else-if="questionData.question.questionType === '填空'">
        <div v-for="(n, i) in blankCount" :key="i" class="blank-fill-item">
          <span>空 {{ i + 1 }}: </span>
          <el-input 
            v-model="blankAnswers[i]"
            placeholder="请输入答案" 
          />
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
import { computed, watch, ref } from 'vue';

const props = defineProps({
  questionData: { type: Object, required: true },
  index: { type: Number, required: true },
  modelValue: { type: [String, Array] }
});

const emit = defineEmits(['update:modelValue']);

// 填空题使用本地状态管理
const blankAnswers = ref([]);
let isInitializing = false;

// 使用 v-model 实现答案的双向绑定
const answerModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 解析并重新映射选项以进行显示
const displayOptions = computed(() => {
  if (props.questionData.question.details) {
    try {
      const originalOptions = JSON.parse(props.questionData.question.details);
      return originalOptions.map((opt, index) => {
        return {
          originalOption: opt.option,
          displayOption: String.fromCharCode(65 + index),
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