<template>
  <el-card class="question-card" :id="'question-' + questionData.question.id" v-image-preview>
    <div class="question-header">
      <span>{{ index + 1 }}.</span>
      <el-tag>{{ questionData.question.questionType }}</el-tag>
    </div>
    <div class="question-title" v-html="questionData.question.title"></div>

    <!-- 论述题详情 -->
    <div class="details-wrapper" v-if="['论述', '简答'].includes(questionData.question.questionType) && questionData.question.details">
      <p class="details-title">详情：</p>
      <div class="details-content" v-html="questionData.question.details"></div>
    </div>

    <!-- 题目附件（老师提供的参考附件） -->
    <div class="question-attachment-wrapper" v-if="questionData.question.filePath">
      <el-link 
        :icon="Document" 
        type="primary"
        @click="handleDownloadQuestionAttachment"
        :underline="false"
      >
        {{ questionData.question.fileName || '附件' }}
      </el-link>
    </div>

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

      <div v-else-if="['论述', '简答'].includes(questionData.question.questionType)" style="border: 1px solid #ccc; z-index: 100; position: relative;">
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
    <div v-if="['论述', '简答'].includes(questionData.question.questionType) && questionData.question.fileUpload === 1" class="attachment-upload-section">
      <el-upload
        class="upload-demo"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        :limit="1"
        :on-exceed="handleExceed"
      >
        <el-button size="small" type="primary">
          <el-icon><Upload /></el-icon>
          上传附件
        </el-button>
        <template #tip>
          <div class="el-upload__tip">
            单个文件小于100M，文档类只支持Word格式（.doc、.docx），不支持txt
          </div>
        </template>
      </el-upload>
    </div>
  </el-card>
</template>

<script setup>
import { computed, watch, ref, onBeforeUnmount, shallowRef } from 'vue';
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
  attachment: { type: Object, default: () => ({}) } // 从父组件接收附件信息
});

const emit = defineEmits(['update:modelValue', 'update:attachment']);

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

// 填空题使用本地状态管理
const blankAnswers = ref([]);
let isInitializing = false;

// 附件列表和上传状态
const fileList = ref([]);
let isRestoringAttachment = false; // 标志：是否正在恢复附件（避免循环更新）

// 从父组件恢复学生已上传的附件信息到 fileList
const restoreAttachment = () => {
  // 优先从父组件传入的 attachment prop 读取附件信息
  const fileName = props.attachment?.fileName;
  const filePath = props.attachment?.filePath;
  
  isRestoringAttachment = true; // 设置标志，避免触发其他副作用
  
  if (fileName && filePath) {
    // 恢复学生已上传的附件
    fileList.value = [{
      name: fileName,
      url: filePath,
      uid: Date.now(),
      status: 'success'
    }];
    console.log('恢复附件:', { fileName, filePath });
  } else {
    // 初始为空，等待学生上传
    fileList.value = [];
    console.log('无附件需要恢复');
  }
  
  // 使用 nextTick 确保在下一个 tick 后重置标志
  setTimeout(() => {
    isRestoringAttachment = false;
  }, 100);
};

// 监听 questionData.question.id 变化（切换题目时）
watch(() => props.questionData?.question?.id, (newId, oldId) => {
  if (newId !== oldId) {
    console.log('切换题目，恢复附件');
    restoreAttachment();
  }
}, { immediate: true });

// 监听 attachment prop 变化（父组件更新附件时）
watch(() => props.attachment, (newAttachment, oldAttachment) => {
  // 只在附件内容真正变化时才恢复
  const newFileName = newAttachment?.fileName;
  const oldFileName = oldAttachment?.fileName;
  const newFilePath = newAttachment?.filePath;
  const oldFilePath = oldAttachment?.filePath;
  
  if (newFileName !== oldFileName || newFilePath !== oldFilePath) {
    console.log('attachment prop 变化，恢复附件');
    restoreAttachment();
  }
}, { deep: true });

// 文件改变时的处理
const handleFileChange = async (file, fileListParam) => {
  console.log('handleFileChange 被调用:', { 
    file: file.name, 
    fileListParam: fileListParam.map(f => f.name),
    currentFileList: fileList.value.map(f => f.name)
  });
  
  // 验证文件类型 - 不允许上传txt文件
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.txt')) {
    ElMessage.warning('不支持上传txt文件，文档类只支持上传Word格式（.doc、.docx）');
    fileList.value = fileListParam.filter(f => f.uid !== file.uid);
    return;
  }
  
  // 验证文件大小
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过100MB');
    fileList.value = fileListParam.filter(f => f.uid !== file.uid);
    return;
  }

  // 立即上传文件到服务器
  try {
    ElMessage.info('正在上传文件...');
    
    // 调用上传接口
    const res = await uploadFiles([file.raw], null, null);
    
    if (res && res.code === 200 && res.data) {
      // 从返回数据中获取文件路径
      const filePath = Array.isArray(res.data) ? res.data[0] : res.data;
      
      console.log('文件上传成功:', { fileName: file.name, filePath });
      
      ElMessage.success('文件上传成功');
      
      // 通知父组件附件信息已更新
      emit('update:attachment', {
        questionId: props.questionData.question.id,
        fileName: file.name,        // 从原始文件获取文件名
        filePath: filePath          // 从接口返回获取文件路径
      });
      
      // 不再手动更新 fileList，让 watch 通过 attachment prop 自动恢复
      // 父组件会更新 attachment prop，触发 restoreAttachment
      
      console.log('已通知父组件更新附件');
    } else {
      throw new Error(res.msg || '上传失败');
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    ElMessage.error(error.message || '文件上传失败，请重试');
    // 从列表中移除失败的文件
    fileList.value = fileListParam.filter(f => f.uid !== file.uid);
  }
};

// 移除文件
const handleFileRemove = (file) => {
  console.log('handleFileRemove 被调用:', { 
    file: file.name,
    currentFileList: fileList.value.map(f => f.name)
  });
  
  // 通知父组件附件已清空
  emit('update:attachment', {
    questionId: props.questionData.question.id,
    fileName: '',
    filePath: ''
  });
  
  // 清空文件列表
  fileList.value = [];
  
  ElMessage.info('文件已移除');
  
  console.log('fileList 已清空');
};

// 超出文件数量限制（只允许1个文件）
const handleExceed = () => {
  ElMessage.warning('只能上传1个附件，如需更换请先删除已上传的文件');
};

// 使用 v-model 实现答案的双向绑定
const answerModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 解析并重新映射选项以进行显示
const displayOptions = computed(() => {
  // 只有单选、多选题才解析 details 为选项
  if (['单选', '多选'].includes(props.questionData.question.questionType) && props.questionData.question.details) {
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

// 下载题目附件（老师提供的参考附件）
const handleDownloadQuestionAttachment = async () => {
  try {
    if (!props.questionData.question.filePath) {
      ElMessage.warning('附件路径不存在');
      return;
    }
    
    ElMessage.info('正在获取下载链接...');
    // 使用 previewFile 获取下载链接
    const downloadUrl = await previewFile(props.questionData.question.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = props.questionData.question.fileName || '附件';
    link.target = '_blank';
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
.question-card {
  margin-bottom: 20px;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
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