<template>
  <div class="exam-question-card">
    <div class="header">
      <div class="header-left">
        <el-checkbox />
        <span class="index">{{ index + 1 }}</span>
        <el-tag size="small">{{ question.questionType }}</el-tag>
        <el-tag type="info" size="small">{{ question.questionCategoryName || '默认分类' }}</el-tag>
        <el-tag type="warning" size="small">{{ difficultyText }}</el-tag>
      </div>
      <div class="header-right">
        <el-input-number
          v-model="editableScore"
          :min="0"
          :step="1"
          controls-position="right"
          size="small"
          style="width: 80px;"
          @change="onScoreChange"
        />
        <span class="score-unit">分</span>
        <el-tooltip content="上移"><el-icon class="action-icon"><Top /></el-icon></el-tooltip>
        <el-tooltip content="下移"><el-icon class="action-icon"><Bottom /></el-icon></el-tooltip>
        <el-tooltip content="预览"><el-icon class="action-icon"><View /></el-icon></el-tooltip>
        <el-tooltip content="删除"><el-icon class="action-icon delete-icon"><Delete /></el-icon></el-tooltip>
      </div>
    </div>
    
    <div class="body">
      <div class="title" v-html="question.title"></div>

      <div class="options-wrapper" v-if="parsedOptions.length > 0">
        <el-radio-group v-if="question.questionType === '单选'" :model-value="question.answer">
          <el-radio v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" disabled>
            {{ opt.option }}. {{ opt.value }}
          </el-radio>
        </el-radio-group>
        <el-checkbox-group v-else-if="question.questionType === '多选'" :model-value="correctAnswers">
          <el-checkbox v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" disabled>
            {{ opt.option }}. {{ opt.value }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
       <div class="options-wrapper" v-else-if="question.questionType === '判断'">
        <el-radio-group :model-value="question.answer">
          <el-radio label="1" disabled>正确</el-radio>
          <el-radio label="0" disabled>错误</el-radio>
        </el-radio-group>
      </div>
      
      <div class="analysis-wrapper" v-if="question.analysis">
        <p class="analysis-title">解析：</p>
        <div class="analysis-content" v-html="question.analysis"></div>
      </div>
      
      <div class="attachment-wrapper" v-if="question.filePath">
        <el-link :icon="Link" type="primary">{{ question.fileName || '附件' }}</el-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Top, Bottom, View, Delete, Link } from '@element-plus/icons-vue';

const props = defineProps({
  // 接收的 `item` 是 examQuestionList 数组中的一个元素
  itemData: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['scoreChange']);

const question = computed(() => props.itemData.question || {});
const editableScore = ref(props.itemData.score || 0);

const difficultyMap = { 0: '简单', 1: '中等', 2: '困难' };
const difficultyText = computed(() => difficultyMap[question.value.difficulty] || '未知');

// 解析后端返回的 JSON 字符串格式的 details 字段
const parsedOptions = computed(() => {
  if (question.value.details) {
    try {
      return JSON.parse(question.value.details);
    } catch (e) {
      console.error("解析题目选项失败:", e);
      return [];
    }
  }
  return [];
});

// 为多选题的答案格式做适配
const correctAnswers = computed(() => {
  if (question.value.questionType === '多选' && question.value.answer) {
    return question.value.answer.split('#@#');
  }
  return [];
});

const onScoreChange = (newScore) => {
  emit('scoreChange', { questionId: question.value.id, newScore });
  ElMessage.info(`分数修改为 ${newScore}`);
};
</script>

<style scoped>
.exam-question-card {
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  margin-bottom: 16px;
  padding: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.index {
  font-weight: bold;
}
.score-unit {
  margin-left: -8px;
  margin-right: 8px;
}
.action-icon {
  cursor: pointer;
  font-size: 16px;
  color: #606266;
}
.action-icon:hover {
  color: #409eff;
}
.delete-icon:hover {
  color: #f56c6c;
}
.body {
  padding-left: 36px; /* 与复选框和序号对齐 */
}
.title {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}
.options-wrapper {
  font-size: 14px;
}
.el-radio, .el-checkbox {
  display: block;
  margin-bottom: 8px;
}
.analysis-wrapper {
  margin-top: 12px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.analysis-title {
  margin: 0 0 5px 0;
  font-weight: bold;
}
.analysis-content, .analysis-content p {
  font-size: 13px;
  margin: 0;
}
.attachment-wrapper {
  margin-top: 8px;
}
</style>