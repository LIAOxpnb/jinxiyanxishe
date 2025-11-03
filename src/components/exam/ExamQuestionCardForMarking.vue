<template>
  <div class="marking-card">
    <div class="question-header">
      <span class="question-index">{{ index + 1 }}.</span>
      <el-tag size="small">{{ record.question.questionType }}</el-tag>
      <el-tag type="info" size="small">{{ record.question.questionCategoryName || '默认分类' }}</el-tag>
      <el-tag type="warning" size="small">{{ difficultyText }}</el-tag>
      <el-tag type="success" size="small">{{ record.totalScore || 0 }} 分</el-tag>
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

      <div class="answer-text" :class="{ 'is-essay': record.question.questionType === '论述' }">
        
        <template v-if="record.question.questionType !== '论述'">
          <span>正确答案：{{ formatAnswer(record.question.answer, record.question.questionType) }}</span>
          <el-divider direction="vertical" />
        </template>
        
        <div class="student-answer-wrapper">
          <span>学生答案：</span>
          <div class="student-answer-content">
            {{ formatAnswer(record.userAnswer, record.question.questionType) || '未作答' }}
          </div>
        </div>
        
        <el-divider v-if="record.question.questionType !== '论述'" direction="vertical" />
        
        <div class="score-wrapper">
          <span>得分：</span>
          <el-tooltip 
            :content="`最高分数：${record.totalScore || 0}分`" 
            placement="top"
          >
            <el-input-number 
              v-model="record.score" 
              :min="0" 
              :max="record.totalScore || 0" 
              size="small" 
              controls-position="right"
              style="width: 80px;"
            />
          </el-tooltip>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ElTag, ElIcon, ElLink, ElDivider, ElInputNumber, ElTooltip } from 'element-plus';
import { SuccessFilled, CircleCloseFilled, Link } from '@element-plus/icons-vue';

const props = defineProps({
  record: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

const difficultyMap = { 0: '困难', 1: '中等', 2: '简单' };
const difficultyText = computed(() => difficultyMap[props.record.question.difficulty] || '未知');

// 格式化答案显示
const formatAnswer = (answer, questionType) => {
  if (!answer) return '';
  
  if (questionType === '判断') {
    return answer === '0' ? '正确' : answer === '1' ? '错误' : answer;
  }
  
  if (questionType === '填空') {
    return answer.replace(/#@#/g, ' ');
  }
  
  if (questionType === '多选') {
    return answer.replace(/#@#/g, '、');
  }
  
  // 论述题或其他类型，直接返回原文本
  return answer;
};
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
  align-items: flex-start; /* 改为 flex-start 以便论述题布局 */
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
  /* 【修改点 3】: 微调图标位置，使其与顶部对齐 */
  margin-top: 2px;
}

/* 【修改点 4】: 核心样式修改 */
.answer-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 允许换行，解决非论述题的长答案溢出 */
  gap: 10px;
  color: #303133; /* 文字颜色保持正常 */
  width: 100%; /* 占满剩余空间 */
}

/* 学生答案（非论述题） */
.student-answer-wrapper {
  display: inline-flex; /* 保持 "学生答案：" 和内容在同一行 */
  align-items: center;
}

.student-answer-content {
  margin-left: 5px; /* 标签和内容间加点间距 */
  white-space: pre-wrap; /* 保留换行符，并自动换行 */
  word-break: break-all; /* 强制长单词换行 */
  line-height: 1.5;
}

/* 得分 */
.score-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}


/* 【修改点 5】: 论述题的特殊布局 */
.answer-text.is-essay {
  flex-direction: column; /* 垂直堆叠 */
  align-items: flex-start; /* 左对齐 */
}

.answer-text.is-essay .student-answer-wrapper {
  flex-direction: column; /* 标签和内容也垂直堆叠 */
  align-items: flex-start;
  width: 100%; /* 占满宽度 */
}

.answer-text.is-essay .student-answer-content {
  margin-left: 0;
  margin-top: 8px;
  padding: 8px;
  background-color: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  width: 100%; /* 占满父容器 */
  min-height: 60px; /* 给个最小高度 */
  box-sizing: border-box; /* 保证 padding 不会撑开宽度 */
}

.answer-text.is-essay .score-wrapper {
  margin-top: 8px; /* 答案和得分框拉开距离 */
}

.el-divider--vertical {
  height: 1.2em;
}

</style>