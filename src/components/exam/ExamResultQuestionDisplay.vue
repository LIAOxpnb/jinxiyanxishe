<template>
  <el-card class="question-card" :id="'question-' + record.questionId" v-image-preview>
    <div class="card-content">
      <div v-if="record.isCorrect === 2" class="stamp correct">回答正确</div>
      <div v-else-if="record.isCorrect === 1" class="stamp incorrect">回答错误</div>

      <div class="question-header">
        <span>{{ index + 1 }}.</span>
        <el-tag>{{ record.question.questionType }}</el-tag>
        <el-tag>满分：{{ record.totalScore }}</el-tag>
        <el-tag>得分：{{ record.score }}</el-tag>
      </div>
      <div class="question-title" v-html="processedTitle"></div>

      <!-- 论述题详情 -->
      <div class="details-wrapper" v-if="['论述', '简答'].includes(record.question.questionType) && processedDetails">
        <p class="details-title">详情：</p>
        <div class="details-content" v-html="processedDetails"></div>
      </div>

      <!-- 题目附件（老师提供的参考附件） -->
      <div class="question-attachment-wrapper" v-if="record.question.filePath">
        <el-link 
          :icon="Link" 
          type="primary"
          @click="handleDownloadAttachment"
          :underline="false"
        >
          {{ record.question.fileName || '附件' }}
        </el-link>
      </div>

      <div class="answer-area">
        <el-radio-group v-if="record.question.questionType === '单选'" :model-value="record.userAnswer" disabled>
          <el-radio v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" size="large">
            <span :class="{ 'correct-option-text': isCorrectAnswer(opt.option) }">{{ opt.option }}. {{ opt.value }}</span>
          </el-radio>
        </el-radio-group>

        <el-checkbox-group v-else-if="record.question.questionType === '多选'" :model-value="userAnswersForMultiChoice" disabled>
          <el-checkbox v-for="opt in parsedOptions" :key="opt.option" :label="opt.option" size="large">
            <span :class="{ 'correct-option-text': isCorrectAnswer(opt.option) }">{{ opt.option }}. {{ opt.value }}</span>
          </el-checkbox>
        </el-checkbox-group>

        <el-radio-group v-else-if="record.question.questionType === '判断'" :model-value="record.userAnswer" disabled>
          <el-radio label="0" size="large">
            <span :class="{ 'correct-option-text': record.question.answer === '0' }">正确</span>
          </el-radio>
          <el-radio label="1" size="large">
            <span :class="{ 'correct-option-text': record.question.answer === '1' }">错误</span>
          </el-radio>
        </el-radio-group>

        <div v-else-if="record.question.questionType === '填空'" class="fill-blank-answer">
          <p><strong>你的答案：</strong> <span :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">{{ formatFillBlankAnswer(record.userAnswer) || '未作答' }}</span></p>
        </div>

        <div v-else-if="['论述', '简答'].includes(record.question.questionType)" class="essay-answer">
          <p><strong>你的答案：</strong></p>
          <div class="essay-content" :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'" v-html="processedUserAnswer || '未作答'">
          </div>
          <!-- 【新增】学生上传的答题附件 -->
          <div v-if="record.fileName && record.filePath" class="student-attachment">
            <el-link 
              :icon="Document" 
              type="primary" 
              @click="handleDownloadStudentAttachment"
              :underline="false"
            >
              {{ record.fileName }}
            </el-link>
          </div>
        </div>
        
        </div>

      <div class="feedback-section">
        <p v-if="!['填空', '论述', '简答'].includes(record.question.questionType)"><strong>你的答案：</strong> <span :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">{{ formatUserAnswer(record.userAnswer) || '未作答' }}</span></p>
        <p><strong>正确答案：</strong> {{ formatCorrectAnswer(record.question.answer) }}</p>
        <p v-if="processedAnalysis"><strong>题目解析：</strong></p>
        <div v-if="processedAnalysis" v-html="processedAnalysis"></div>
      </div>

      <!-- <div class="nav-buttons">
          <el-button @click="$emit('prev')">上一题</el-button>
          <el-button @click="$emit('next')">下一题</el-button>
      </div> -->
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Link, Document } from '@element-plus/icons-vue';
import { previewFile } from '@/api/common/PreviewFile';
import { ElMessage } from 'element-plus';

const props = defineProps({
  record: { type: Object, required: true },
  index: { type: Number, required: true }
});

defineEmits(['prev', 'next']);

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
    if (['论述', '简答'].includes(newRecord.question.questionType)) {
      processedUserAnswer.value = await convertImagesToPreviewUrls(newRecord.userAnswer);
    }
  }
}, { immediate: true });

const parsedOptions = computed(() => {
  const questionType = props.record.question?.questionType;
  // 只有单选、多选题才解析 details 为选项
  if (['单选', '多选'].includes(questionType) && props.record.question.details) {
    try { return JSON.parse(props.record.question.details); } catch (e) { return []; }
  }
  return [];
});

const correctAnswersForMultiChoice = computed(() => {
  if (props.record.question.questionType === '多选' && props.record.question.answer) {
    return props.record.question.answer.split('#@#');
  }
  return [];
});

const userAnswersForMultiChoice = computed(() => {
  if (props.record.question.questionType === '多选' && props.record.userAnswer) {
    return props.record.userAnswer.split('#@#');
  }
  return [];
});

// 判断某个选项是否是正确答案的一部分
const isCorrectAnswer = (option) => {
    if (props.record.question.questionType === '单选') {
        return props.record.question.answer === option;
    }
    if (props.record.question.questionType === '多选') {
        return correctAnswersForMultiChoice.value.includes(option);
    }
    return false;
};

// 格式化填空题答案
const formatFillBlankAnswer = (answer) => {
  if (!answer) return '';
  // 使用逗号加空格作为分隔符
  return answer.replace(/#@#/g, ', ');
};

// 格式化用户答案显示
const formatUserAnswer = (answer) => {
  if (!answer) return '';
  if (props.record.question.questionType === '判断') {
    return answer === '0' ? '正确' : answer === '1' ? '错误' : answer;
  }
  if (props.record.question.questionType === '填空') {
    return formatFillBlankAnswer(answer);
  }
  if (props.record.question.questionType === '多选') {
    return answer.replace(/#@#/g, '、');
  }
  return answer;
};

// 格式化正确答案显示
const formatCorrectAnswer = (answer) => {
  if (!answer) return '';
  if (props.record.question.questionType === '判断') {
    return answer === '0' ? '正确' : answer === '1' ? '错误' : answer;
  }
  if (props.record.question.questionType === '填空') {
    return formatFillBlankAnswer(answer);
  }
  if (props.record.question.questionType === '多选') {
    return answer.replace(/#@#/g, '、');
  }
  return answer;
};

// 下载题目附件
const handleDownloadAttachment = async () => {
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
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载题目附件失败:', error);
    ElMessage.error('获取下载链接失败，请重试');
  }
};

// 【新增】下载学生上传的答题附件
const handleDownloadStudentAttachment = async () => {
  try {
    if (!props.record.filePath) {
      ElMessage.warning('附件路径不存在');
      return;
    }
    
    ElMessage.info('正在获取下载链接...');
    // 使用 previewFile 获取下载链接
    const downloadUrl = await previewFile(props.record.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = props.record.fileName || '学生附件';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载学生附件失败:', error);
    ElMessage.error('获取下载链接失败，请重试');
  }
};

</script>

<style scoped>
/* 样式与上一个阅卷卡片类似，但有微调 */
.question-card { margin-bottom: 20px; position: relative; overflow: hidden; }
.card-content { position: relative; }
.stamp { position: absolute; top: 15px; right: -35px; transform: rotate(45deg); padding: 5px 40px; font-size: 14px; color: white; font-weight: bold; z-index: 1; }
.stamp.correct { background-color: #67c23a; }
.stamp.incorrect { background-color: #f56c6c; }
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; font-size: 16px; }
.question-title { 
  font-size: 15px; 
  line-height: 1.7; 
  color: #303133; 
  margin-bottom: 20px;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}
.question-title :deep(img),
.details-content :deep(img),
.feedback-section :deep(img),
.essay-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
.details-wrapper {
  margin-top: 12px;
  margin-bottom: 15px;
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
.answer-area { margin-bottom: 15px; }
.el-radio-group, .el-checkbox-group { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; }
.el-radio, .el-checkbox { cursor: default; }
.correct-option-text { color: #67c23a; font-weight: bold; }
.correct-text { color: #67c23a; font-weight: bold; }
.incorrect-text { color: #f56c6c; font-weight: bold; }
.fill-blank-answer, .essay-answer { margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
.essay-content { margin-top: 8px; padding: 8px; background-color: white; border: 1px solid #dcdfe6; border-radius: 4px; min-height: 60px; white-space: pre-wrap; }
.student-attachment {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
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
.question-attachment-wrapper {
  margin-top: 12px;
  margin-bottom: 15px;
  padding: 8px 12px;
  background-color: #f0f2f5;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.3s;
}
.question-attachment-wrapper:hover {
  background-color: #e4e7ed;
}
.question-attachment-wrapper .el-link {
  font-size: 14px;
}
.feedback-section { margin-top: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #f0f2f5; border-radius: 4px; font-size: 14px; line-height: 1.6; }
.attachment-wrapper { margin-top: 8px; }
.nav-buttons { margin-top: 20px; text-align: center; }
</style>