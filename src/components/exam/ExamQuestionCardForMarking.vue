<template>
  <div class="marking-card" v-image-preview>
    <div class="question-header">
      <span class="question-index">{{ index + 1 }}.</span>
      <el-tag size="small">{{ record.question.questionType }}</el-tag>
      <el-tag type="info" size="small">{{ record.question.questionCategoryName || '默认分类' }}</el-tag>
      <el-tag type="warning" size="small">{{ difficultyText }}</el-tag>
      <el-tag type="success" size="small">{{ record.totalScore || 0 }} 分</el-tag>
    </div>

    <div class="question-title" v-html="processedTitle"></div>
    
    <!-- 论述题详情 -->
    <div class="details-wrapper" v-if="record.question.questionType === '论述' && processedDetails">
      <p class="details-title">详情：</p>
      <div class="details-content" v-html="processedDetails"></div>
    </div>
    
    <div class="analysis-wrapper" v-if="processedAnalysis">
      <p class="analysis-title">解析：</p>
      <div class="analysis-content" v-html="processedAnalysis"></div>
    </div>
    <div class="attachment-wrapper" v-if="record.question.filePath">
      <el-link 
        :icon="Link" 
        type="primary"
        @click="handleDownloadQuestionAttachment"
        :underline="false"
      >
        {{ record.question.fileName || '附件' }}
      </el-link>
    </div>

    <div class="answer-summary" :class="{
      'correct': record.question.questionType !== '论述' && record.isCorrect === 2,
      'incorrect': record.question.questionType !== '论述' && record.isCorrect !== 2,
      'essay': record.question.questionType === '论述'
    }">
      <el-icon class="status-icon" v-if="record.question.questionType !== '论述'">
        <component :is="record.isCorrect === 2 ? SuccessFilled : CircleCloseFilled" />
      </el-icon>

      <div class="answer-text" :class="{ 'is-essay': record.question.questionType === '论述' }">
        
        <template v-if="record.question.questionType !== '论述'">
          <span>正确答案：{{ formatAnswer(record.question.answer, record.question.questionType) }}</span>
          <el-divider direction="vertical" />
        </template>
        
        <div class="student-answer-wrapper">
          <span>学生答案：</span>
          <div class="student-answer-content" v-if="record.question.questionType === '论述' || record.question.questionType === '简答'" v-html="processedUserAnswer || '未作答'"></div>
          <div class="student-answer-content" v-else>
            {{ formatAnswer(record.userAnswer, record.question.questionType) || '未作答' }}
          </div>
          <!-- 【新增】学生上传的附件 -->
          <div v-if="record.fileName && record.filePath" class="student-attachment">
            <el-link 
              :icon="Document" 
              type="primary" 
              @click="handleDownloadAttachment"
              :underline="false"
            >
              {{ record.fileName }}
            </el-link>
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
import { computed, ref, watch } from 'vue';
import { ElTag, ElIcon, ElLink, ElDivider, ElInputNumber, ElTooltip, ElMessage } from 'element-plus';
import { SuccessFilled, CircleCloseFilled, Link, Document } from '@element-plus/icons-vue';
import { previewFile } from '@/api/common/PreviewFile';
import { downloadFile } from '@/api/common/FileDownload';

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

// 转换HTML中的图片URL为预览URL
const convertImagesToPreviewUrls = async (htmlContent) => {
  if (!htmlContent) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  
  const imagePromises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    
    try {
      let relativePath = src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        const url = new URL(src);
        let pathname = decodeURIComponent(url.pathname);
        const pathParts = pathname.split('/').filter(p => p);
        if (pathParts.length > 1) {
          relativePath = '/' + pathParts.slice(1).join('/');
        } else {
          relativePath = pathname;
        }
      }
      const previewUrl = await previewFile(relativePath);
      img.setAttribute('src', previewUrl);
    } catch (error) {
      console.error('预览图片失败:', src, error);
    }
  });
  
  await Promise.all(imagePromises);
  return doc.body.innerHTML;
};

// 处理后的题目标题
const processedTitle = ref('');
// 处理后的详情
const processedDetails = ref('');
// 处理后的解析
const processedAnalysis = ref('');
// 处理后的学生答案（富文本）
const processedUserAnswer = ref('');

// 监听 record 变化，处理图片
watch(() => props.record, async (newRecord) => {
  if (newRecord && newRecord.question) {
    processedTitle.value = await convertImagesToPreviewUrls(newRecord.question.title);
    processedDetails.value = await convertImagesToPreviewUrls(newRecord.question.details);
    processedAnalysis.value = await convertImagesToPreviewUrls(newRecord.question.analysis);
    // 处理学生答案（论述题/简答题可能包含富文本）
    if (newRecord.question.questionType === '论述' || newRecord.question.questionType === '简答') {
      processedUserAnswer.value = await convertImagesToPreviewUrls(newRecord.userAnswer);
    }
  }
}, { immediate: true });

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

// 【新增】下载学生上传的附件
const handleDownloadAttachment = async () => {
  try {
    if (!props.record.filePath) {
      ElMessage.warning('附件路径不存在');
      return;
    }
    
    ElMessage.info('正在获取下载链接...');
    // 使用 previewFile 获取下载链接（和 ClassRoomDetails.vue 一致）
    const downloadUrl = await previewFile(props.record.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = props.record.fileName;
    // 移除 target='_blank' 避免浏览器打开文件
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载附件失败:', error);
    ElMessage.error('获取下载链接失败，请重试');
  }
};

// 下载题目附件
const handleDownloadQuestionAttachment = async () => {
  try {
    if (!props.record.question.filePath) {
      ElMessage.warning('附件路径不存在');
      return;
    }
    
    ElMessage.info('正在获取下载链接...');
    // 使用 previewFile 获取下载链接
    const downloadUrl = await previewFile(props.record.question.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = props.record.question.fileName || '附件';
    // 移除 target='_blank' 避免浏览器打开文件
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载题目附件失败:', error);
    ElMessage.error('获取下载链接失败，请重试');
  }
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
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}

.question-title :deep(img),
.details-content :deep(img),
.analysis-content :deep(img),
.student-answer-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
.details-wrapper {
  margin-top: 12px;
  padding: 10px;
  background-color: #fff9e6;
  border-radius: 4px;
  font-size: 13px;
  border-left: 3px solid #e6a23c;
}
.details-title {
  margin: 0 0 5px 0;
  font-weight: bold;
  color: #e6a23c;
}
.details-content, .details-content p {
  margin: 0;
  color: #606266;
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
.answer-summary.essay {
  background-color: #f4f4f5;
  color: #303133;
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
  flex-wrap: wrap; /* 【新增】允许附件换行 */
  gap: 8px; /* 【新增】答案和附件之间的间距 */
}

.student-answer-content {
  margin-left: 5px; /* 标签和内容间加点间距 */
  white-space: pre-wrap; /* 保留换行符，并自动换行 */
  word-break: break-all; /* 强制长单词换行 */
  line-height: 1.5;
}

/* 【新增】学生上传的附件样式 */
.student-attachment {
  display: inline-flex;
  align-items: center;
  margin-left: 10px;
  padding: 4px 8px;
  background-color: #f0f2f5;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.student-attachment:hover {
  background-color: #e4e7ed;
}

.student-attachment .el-link {
  font-size: 13px;
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