<template>
  <div class="marking-card">
    <div class="question-header">
      <span class="question-index">{{ index + 1 }}.</span>
      <el-tag size="small">{{ record.question.questionType }}</el-tag>
      <el-tag type="info" size="small">{{ record.question.questionCategoryName || '默认分类' }}</el-tag>
      <el-tag type="warning" size="small">{{ difficultyText }}</el-tag>
    </div>

    <div class="question-title" v-html="record.question.title"></div>

    <div class="analysis-wrapper" v-if="record.question.analysis">
      <p class="analysis-title">解析：</p>
      <div class="analysis-content" v-html="record.question.analysis"></div>
    </div>
    <div class="attachment-wrapper" v-if="record.question.filePath">
      <el-link :icon="Link" type="primary">{{ record.question.fileName || '附件' }}</el-link>
    </div>

    <div class="answer-summary" :class="record.isCorrect === 2 ? 'correct' : 'incorrect'">
      <el-icon class="status-icon">
        <component :is="record.isCorrect === 2 ? SuccessFilled : CircleCloseFilled" />
      </el-icon>
      <div class="answer-text">
        <span>正确答案：{{ record.question.answer }}</span>
        <el-divider direction="vertical" />
        <span>学生答案：{{ record.userAnswer || '未作答' }}</span>
        <el-divider direction="vertical" />
        <span>得分：</span>
        
        <template v-if="['论述', '简答'].includes(record.question.questionType)">
          <el-input-number 
            v-model="record.score" 
            :min="0" 
            :max="record.question.score || 100" 
            size="small" 
            controls-position="right"
            style="width: 80px;"
          />
        </template>
        <template v-else>
          <span class="score-text">{{ record.score }}</span>
        </template>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { SuccessFilled, CircleCloseFilled, Link } from '@element-plus/icons-vue';

const props = defineProps({
  // record 是 examSubmitRecordList 数组中的一个元素
  record: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

const difficultyMap = { 0: '简单', 1: '中等', 2: '困难' };
const difficultyText = computed(() => difficultyMap[props.record.question.difficulty] || '未知');
</script>

<style scoped>
.marking-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #fff;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.question-index {
  font-weight: bold;
}
.question-title {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}
.analysis-wrapper {
  margin-top: 12px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}
.analysis-title {
  margin: 0 0 5px 0;
  font-weight: bold;
}
.analysis-content, .analysis-content p {
  margin: 0;
}
.attachment-wrapper {
  margin-top: 8px;
}
.answer-summary {
  margin-top: 16px;
  padding: 10px 15px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-size: 14px;
}
.answer-summary.correct {
  background-color: #f0f9eb;
  color: #67c23a;
}
.answer-summary.incorrect {
  background-color: #fef0f0;
  color: #f56c6c;
}
.status-icon {
  font-size: 18px;
  margin-right: 10px;
}
.answer-text {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #303133; /* 文字颜色保持正常 */
}
.el-divider--vertical {
  height: 1.2em;
}
.score-text {
  font-weight: bold;
  min-width: 20px;
}
</style>