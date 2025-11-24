<template>
  <div class="exam-question-card" v-image-preview>
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
        <el-tooltip content="上移"><el-icon class="action-icon" @click="$emit('moveUp', index)"><Top /></el-icon></el-tooltip>
        <el-tooltip content="下移"><el-icon class="action-icon" @click="$emit('moveDown', index)"><Bottom /></el-icon></el-tooltip>
        <el-tooltip content="试题编辑"><el-icon class="action-icon" @click="$emit('edit', question)"><Edit /></el-icon></el-tooltip>
        <el-tooltip content="删除"><el-icon class="action-icon delete-icon" @click="$emit('delete', index)"><Delete /></el-icon></el-tooltip>
      </div>
    </div>
    
    <!-- 图片预览组件 -->
    <ImagePreview ref="imagePreviewRef" />
    
    <div class="body">
      <div class="title" v-html="question.title"></div>

      <div class="options-wrapper" v-if="parsedOptions.length > 0">
        <el-radio-group v-if="question.questionType === '单选'" :model-value="question.answer">
          <el-radio v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" disabled>
            {{ opt.option }}. {{ opt.value }}
          </el-radio>
        </el-radio-group>
        <div v-else-if="question.questionType === '多选'" class="multiple-choice-options">
          <div 
            v-for="opt in parsedOptions" 
            :key="opt.option" 
            class="multiple-choice-item"
            :class="{ 'is-correct': correctAnswers.includes(opt.option) }"
          >
            <span class="choice-mark">{{ correctAnswers.includes(opt.option) ? '☑' : '☐' }}</span>
            <span class="choice-text">{{ opt.option }}. {{ opt.value }}</span>
          </div>
        </div>
      </div>
       <div class="options-wrapper" v-else-if="question.questionType === '判断'">
        <el-radio-group :model-value="question.answer">
          <el-radio label="0" disabled>正确</el-radio>
          <el-radio label="1" disabled>错误</el-radio>
        </el-radio-group>
      </div>

      <div class="answer-wrapper" v-else-if="question.questionType === '填空'">
        <div class="answer-display">
          <span class="answer-label">正确答案：</span>
          <span class="answer-content">{{ formatFillBlankAnswer(question.answer) }}</span>
        </div>
      </div>

      <div class="answer-wrapper" v-else-if="['论述', '简答'].includes(question.questionType)">
        <div class="answer-display">
          <span class="answer-label">参考答案：</span>
          <div class="essay-answer-content">{{ question.answer || '无参考答案' }}</div>
        </div>
      </div>
      
      <!-- 论述题详情 -->
      <div class="details-wrapper" v-if="['论述', '简答'].includes(question.questionType) && question.details">
        <p class="details-title">详情：</p>
        <div class="details-content" v-html="question.details"></div>
      </div>
      
      <div class="analysis-wrapper" v-if="question.analysis">
        <p class="analysis-title">解析：</p>
        <div class="analysis-content" v-html="question.analysis"></div>
      </div>
      
      <div class="attachment-wrapper" v-if="question.filePath">
        <el-link 
          :icon="Link" 
          type="primary"
          @click="handleDownloadAttachment"
          :underline="false"
        >
          {{ question.fileName || '附件' }}
        </el-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Top, Bottom, Edit, Delete, Link } from '@element-plus/icons-vue';
import { previewFile } from '@/api/common/PreviewFile';

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

const emit = defineEmits(['scoreChange', 'moveUp', 'moveDown', 'edit', 'delete']);

const question = computed(() => props.itemData.question || {});
const editableScore = ref(props.itemData.score || 0);

// 监听props中的分数变化，同步到本地editableScore
watch(() => props.itemData.score, (newScore) => {
  editableScore.value = newScore || 0;
}, { immediate: true });

const difficultyMap = { 0: '困难', 1: '中等', 2: '简单' };
const difficultyText = computed(() => difficultyMap[question.value.difficulty] || '未知');

// 解析后端返回的 JSON 字符串格式的 details 字段
// 注意：只有单选、多选题的 details 才是 JSON 格式的选项数据
// 论述题、简答题的 details 是富文本内容，不需要解析
const parsedOptions = computed(() => {
  // 只有单选、多选题才解析 details 为选项
  if (['单选', '多选'].includes(question.value.questionType) && question.value.details) {
    try {
      const options = JSON.parse(question.value.details);
      return options;
    } catch (e) {
      console.error("解析题目选项失败:", e);
      return [];
    }
  }
  return [];
});

// 为多选题的答案格式做适配
const correctAnswers = computed(() => {
  if (question.value.questionType === '多选' && typeof question.value.answer === 'string' && question.value.answer) {
    return question.value.answer.split('#@#').filter(item => item);
  }
  return [];
});

// 格式化填空题答案
const formatFillBlankAnswer = (answer) => {
  if (!answer) return '';
  return answer.replace(/#@#/g, ' ');
};

const onScoreChange = (newScore) => {
  // 发送分数修改事件
  emit('scoreChange', { 
    questionId: question.value.id, 
    newScore
  });
};

// 下载题目附件
const handleDownloadAttachment = async () => {
  try {
    if (!question.value.filePath) {
      ElMessage.warning('附件路径不存在');
      return;
    }
    
    ElMessage.info('正在获取下载链接...');
    // 使用 previewFile 获取下载链接
    const downloadUrl = await previewFile(question.value.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = question.value.fileName || '附件';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载附件失败:', error);
    ElMessage.error('获取下载链接失败，请重试');
  }
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
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}

.title :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}

.multiple-choice-options {
  display: flex;
  flex-direction: column;
}

.multiple-choice-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.choice-mark {
  margin-right: 8px;
  font-size: 16px;
  color: #606266;
}

.multiple-choice-item.is-correct .choice-mark {
  color: #409eff;
}

.choice-text {
  line-height: 1.5;
}
.options-wrapper {
  font-size: 14px;
}
.el-radio, .el-checkbox {
  display: block;
  margin-bottom: 8px;
}
.details-wrapper {
  margin-top: 12px;
  padding: 10px;
  background-color: #fff9e6;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;
}
.details-title {
  margin: 0 0 5px 0;
  font-weight: bold;
  color: #e6a23c;
  font-size: 13px;
}
.details-content, .details-content p {
  font-size: 13px;
  margin: 0;
  color: #606266;
}
.details-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
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
.answer-wrapper {
  margin-top: 12px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}
.answer-display {
  font-size: 14px;
}
.answer-label {
  font-weight: bold;
  color: #606266;
}
.answer-content {
  color: #303133;
  margin-left: 8px;
}
.essay-answer-content {
  margin-top: 8px;
  padding: 8px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #303133;
  line-height: 1.5;
  min-height: 60px;
  white-space: pre-wrap;
}
</style>