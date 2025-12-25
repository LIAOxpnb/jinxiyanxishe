<template>
  <el-card class="question-card" :id="'question-' + questionData.id" v-image-preview>
    <div class="question-header">
      <span>{{ index + 1 }}.</span>
      <el-tag>{{ questionData.questionType }}</el-tag>
    </div>
    <div class="question-title" v-html="questionData.title"></div>

    <!-- 论述题详情 -->
    <div class="details-wrapper" v-if="['论述', '简答'].includes(questionData.questionType) && questionData.details">
      <p class="details-title">详情：</p>
      <div class="details-content" v-html="questionData.details"></div>
    </div>

    <!-- 题目附件（老师提供的参考附件） -->
    <div class="question-attachment-wrapper" v-if="questionData.filePath">
      <el-link 
        :icon="Document" 
        type="primary"
        @click="handleDownloadQuestionAttachment"
        :underline="false"
      >
        {{ questionData.fileName || '附件' }}
      </el-link>
    </div>

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
          <el-input 
            :model-value="answerModel[i]" 
            @input="(val) => handleBlankInput(i, val)" 
            placeholder="请输入答案" 
            :disabled="disabled" 
          />
        </div>
      </div>
      
      <div v-else-if="['论述', '简答'].includes(questionData.questionType)" style="border: 1px solid #ccc; z-index: 100; position: relative;">
        <Toolbar
          style="border-bottom: 1px solid #ccc"
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          :mode="mode"
        />
        <Editor
          style="height: 300px; overflow-y: hidden;"
          v-model="answerModel"
          :defaultConfig="editorConfig"
          :mode="mode"
          @onCreated="handleCreated"
        />
      </div>
    </div>

    <!-- 论述题附件上传 -->
    <div v-if="['论述', '简答'].includes(questionData.questionType) && questionData.fileUpload === 1" class="attachment-upload-section">
      <el-upload
        class="upload-demo"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        :limit="1"
        :on-exceed="handleExceed"
        :disabled="disabled"
      >
        <el-button size="small" type="primary" :disabled="disabled">
          <el-icon><Upload /></el-icon>
          上传附件
        </el-button>
        <template #tip>
          <div class="el-upload__tip">
            单个文件小于100M，文档类不支持txt，多文件请上传压缩包 
          </div>
        </template>
      </el-upload>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref, watch, shallowRef, onBeforeUnmount } from 'vue';
import { Upload, Document } from '@element-plus/icons-vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import { ElMessage } from 'element-plus';
import { uploadFiles } from '@/api/common/UploadFiles';
import { previewFile } from '@/api/common/PreviewFile';

const props = defineProps({
  questionData: { type: Object, required: true },
  index: { type: Number, required: true },
  modelValue: { type: [String, Array] },
  disabled: { type: Boolean, default: false },
  attachment: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue', 'update:attachment']);

const answerModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 富文本编辑器配置
const editorRef = shallowRef();
const mode = 'default';

const toolbarConfig = {
  excludeKeys: ['fullScreen', 'group-video'] // 排除全屏和视频
};

// 统一的图片上传处理函数
const handleImageUpload = (file, insertFn) => {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }
  
  uploadFiles([file]).then(async (uploadRes) => {
    if (uploadRes && uploadRes.code === 200 && uploadRes.data) {
      const relativePath = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;
      const previewUrl = await previewFile(relativePath);
      insertFn(previewUrl, file.name, previewUrl);
      ElMessage.success('图片上传成功');
    } else {
      ElMessage.error(uploadRes.msg || '图片上传失败');
    }
  }).catch((error) => {
    console.error('上传或预览过程中出错:', error);
    ElMessage.error(error.message || '图片上传失败');
  });
};

const editorConfig = {
  placeholder: '请输入您的答案...',
  MENU_CONF: {
    uploadImage: {
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      allowedFileTypes: ['image/*'],
      // 自定义上传（处理粘贴、拖拽上传）
      customUpload(file, insertFn) {
        handleImageUpload(file, insertFn);
      },
      // 自定义浏览（处理按钮点击上传）
      customBrowseAndUpload(insertFn) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(event) {
          const file = event.target.files[0];
          if (!file) return;
          handleImageUpload(file, insertFn);
        };
        input.click();
      }
    }
  }
};

const handleCreated = (editor) => {
  editorRef.value = editor;
};

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const fileList = ref([]);

// 恢复附件信息
const restoreAttachment = () => {
  const fileName = props.attachment?.fileName;
  const filePath = props.attachment?.filePath;
  
  if (fileName && filePath) {
    fileList.value = [{
      name: fileName,
      url: filePath,
      uid: Date.now(),
      status: 'success'
    }];
  } else {
    fileList.value = [];
  }
};

// 监听 attachment 变化
watch(() => props.attachment, (newAttachment, oldAttachment) => {
  const newFileName = newAttachment?.fileName;
  const oldFileName = oldAttachment?.fileName;
  const newFilePath = newAttachment?.filePath;
  const oldFilePath = oldAttachment?.filePath;
  
  if (newFileName !== oldFileName || newFilePath !== oldFilePath) {
    restoreAttachment();
  }
}, { deep: true, immediate: true });

// 文件改变处理
const handleFileChange = async (file, fileListParam) => {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.txt')) {
    ElMessage.warning('不支持上传txt文件，文档类只支持上传Word格式（.doc、.docx）');
    fileList.value = fileListParam.filter(f => f.uid !== file.uid);
    return;
  }
  
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过100MB');
    fileList.value = fileListParam.filter(f => f.uid !== file.uid);
    return;
  }

  try {
    ElMessage.info('正在上传文件...');
    const res = await uploadFiles([file.raw], null, null);
    
    if (res && res.code === 200 && res.data) {
      const filePath = Array.isArray(res.data) ? res.data[0] : res.data;
      ElMessage.success('文件上传成功');
      
      emit('update:attachment', {
        questionId: props.questionData.id,
        fileName: file.name,
        filePath: filePath
      });
    } else {
      throw new Error(res.msg || '上传失败');
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    ElMessage.error(error.message || '文件上传失败，请重试');
    fileList.value = fileListParam.filter(f => f.uid !== file.uid);
  }
};

// 移除文件
const handleFileRemove = (file) => {
  emit('update:attachment', {
    questionId: props.questionData.id,
    fileName: '',
    filePath: ''
  });
  fileList.value = [];
  ElMessage.info('文件已移除');
};

// 超出文件数量限制
const handleExceed = () => {
  ElMessage.warning('只能上传1个附件，如需更换请先删除已上传的文件');
};

// 下载题目附件
const handleDownloadQuestionAttachment = async () => {
  try {
    if (!props.questionData.filePath) {
      ElMessage.warning('附件路径不存在');
      return;
    }
    
    ElMessage.info('正在获取下载链接...');
    const downloadUrl = await previewFile(props.questionData.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = props.questionData.fileName || '附件';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载题目附件失败:', error);
    ElMessage.error('获取下载链接失败，请重试');
  }
};

const displayOptions = computed(() => {
  if (['单选', '多选'].includes(props.questionData.questionType) && props.questionData.details) {
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

const blankCount = computed(() => {
  if (props.questionData.questionType === '填空') {
    const title = props.questionData.title || '';
    const matches = title.match(/___/g);
    return matches ? matches.length : 1;
  }
  return 0;
});

// 处理填空题输入变化
const handleBlankInput = (index, value) => {
  const newAnswer = Array.isArray(answerModel.value) ? [...answerModel.value] : [];
  newAnswer[index] = value;
  emit('update:modelValue', newAnswer);
};
</script>

<style scoped>
.question-card { 
  border: none; 
  box-shadow: none; 
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
}
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; font-size: 16px; }
.question-title { font-size: 15px; line-height: 1.7; color: #303133; margin-bottom: 20px; }
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
.details-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
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
.answer-area { margin: 20px 0; }
.el-radio-group, .el-checkbox-group { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; }
.blank-fill-item { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
.blank-fill-item span { font-size: 14px; font-weight: 500; min-width: 60px; }
.attachment-upload-section {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.upload-demo {
  width: 100%;
}
.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 富文本编辑器图片样式 */
:deep(.w-e-text-container img) {
  width: 50%;
  height: auto;
  max-width: none;
}
</style>