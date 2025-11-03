<template>
  <el-card class="question-editor-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">【{{ questionTypeName }}】第 {{ index + 1 }} 题</span>
        <div class="card-actions">
          <div v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(localQuestion.questionType)"
            class="mode-switcher">
            <el-radio-group v-model="localQuestion.editMode" size="small">
              <el-radio-button label="simple">简洁</el-radio-button>
              <el-radio-button label="complex">复杂</el-radio-button>
            </el-radio-group>
          </div>
          <el-button type="primary" link @click="$emit('copy')">复制</el-button>
          <el-button type="danger" link @click="$emit('delete')">删除</el-button>
        </div>
      </div>
    </template>

    <el-form :model="localQuestion" label-width="100px">
      <div v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(localQuestion.questionType)">
        <el-form-item label="题目" prop="title" required>
          <el-input v-if="localQuestion.editMode === 'simple'" type="textarea" v-model="localQuestion.title" :rows="4"
            placeholder="请输入题目题干" />
          <div v-else class="rich-text-wrapper">
            <Toolbar :editor="editorRefs.title" :defaultConfig="fullToolbarConfig"
              style="border-bottom: 1px solid #ccc" />
            <Editor v-model="localQuestion.title" style="height: 150px" :defaultConfig="fullEditorConfig"
              @onCreated="editor => handleCreated(editor, 'title')" />
          </div>
        </el-form-item>
        <div v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(localQuestion.questionType)">
          <el-form-item v-for="(option, optIndex) in localQuestion.options" :key="optIndex"
            :label="'选项' + String.fromCharCode(65 + optIndex)" required>
            <el-input v-if="localQuestion.editMode === 'simple'" v-model="option.content"
              style="width: 80%; margin-right: 10px;" />
            <div v-else class="rich-text-wrapper" style="width: 80%; margin-right: 10px;">
              <Toolbar :editor="editorRefs['option_' + optIndex]" :defaultConfig="limitedToolbarConfig"
                style="border-bottom: 1px solid #ccc" />
              <Editor v-model="option.content" style="height: 100px" :defaultConfig="limitedEditorConfig"
                @onCreated="editor => handleCreated(editor, 'option_' + optIndex)" />
            </div>
            <el-button type="danger" @click="removeOption(optIndex)"
              :disabled="localQuestion.options.length <= 1">删除</el-button>
          </el-form-item>
          <el-form-item><el-button type="primary" link @click="addOption">新增选项</el-button></el-form-item>
        </div>
        <el-form-item label="正确答案" v-if="localQuestion.questionType === 'SINGLE_CHOICE'">
          <el-radio-group v-model="localQuestion.answer"><el-radio v-for="(option, optIndex) in localQuestion.options"
              :key="optIndex" :label="optIndex">{{ String.fromCharCode(65 + optIndex) }}</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="正确答案" v-if="localQuestion.questionType === 'MULTIPLE_CHOICE'">
          <el-checkbox-group v-model="localQuestion.answer"><el-checkbox
              v-for="(option, optIndex) in localQuestion.options" :key="optIndex" :label="optIndex">{{
                String.fromCharCode(65 + optIndex) }}</el-checkbox></el-checkbox-group>
        </el-form-item>
        <el-form-item label="正确答案" v-if="localQuestion.questionType === 'TRUE_FALSE'">
          <el-radio-group v-model="localQuestion.answer"><el-radio label="0">正确</el-radio><el-radio
              label="1">错误</el-radio></el-radio-group>
        </el-form-item>
      </div>

      <div v-if="localQuestion.questionType === 'FILL_IN_BLANK'">
        <el-form-item label="题目" required>
          <div class="form-item-content">
            <div class="form-item-hint" style="margin-bottom: 8px;">
              <el-button type="primary" link @click="insertBlank">插入填空项</el-button><span>提示：填空用连续三个下划线“_”表示</span>
            </div>
            <div class="rich-text-wrapper">
              <Toolbar :editor="editorRefs.title" :defaultConfig="fullToolbarConfig"
                style="border-bottom: 1px solid #ccc" />
              <Editor v-model="localQuestion.title" style="height: 150px" :defaultConfig="fullEditorConfig"
                @onCreated="editor => handleCreated(editor, 'title')" />
            </div>
          </div>
        </el-form-item>
        <el-form-item v-for="(blank, blankIndex) in localQuestion.answer" :key="blankIndex"
          :label="'答案' + (blankIndex + 1)" required>
          <el-input v-model="localQuestion.answer[blankIndex]" placeholder="请输入答案" />
          <div class="form-item-hint" v-if="blankIndex === 0">【备注】答案根据题目中连续出现的“___”自动识别，如需调整答案数量，则答案自动增删</div>
        </el-form-item>
      </div>

      <div v-if="localQuestion.questionType === 'ESSAY'">
        <el-form-item label="题目" required><el-input v-model="localQuestion.title" placeholder="请输入" /></el-form-item>
        <el-form-item label="详情">
          <div class="form-item-content">
            <div class="rich-text-wrapper">
              <Toolbar :editor="editorRefs.details" :defaultConfig="fullToolbarConfig"
                style="border-bottom: 1px solid #ccc" />
              <Editor v-model="localQuestion.details" style="height: 150px" :defaultConfig="fullEditorConfig"
                @onCreated="editor => handleCreated(editor, 'details')" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="答题"><el-radio-group v-model="localQuestion.answerLimit"><el-radio
              label="unlimited">不限制</el-radio><el-radio label="limited">限制</el-radio></el-radio-group></el-form-item>
        <div v-if="localQuestion.answerLimit === 'limited'">
          <el-form-item label="字数不少于"><el-input v-model="localQuestion.wordCountRange" placeholder="可输入50-1000之间"
              style="width: 200px;" /></el-form-item>
          <el-form-item label="附件上传">
            <el-radio-group v-model="localQuestion.attachmentRequired">
              <el-radio label="no">无需上传</el-radio>
              <el-radio label="yes">需上传 (仅支持doc、docx、xls、xlsx)</el-radio>
            </el-radio-group>
            <div v-if="localQuestion.attachmentRequired === 'yes'" style="margin-top: 10px;">
              <el-upload
                :auto-upload="false"
                :on-change="handleFileChange"
                :file-list="fileList"
                :limit="1"
                accept=".doc,.docx,.xls,.xlsx"
                :before-upload="beforeFileUpload"
              >
                <el-button type="primary">选择文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传doc、docx、xls、xlsx文件，且不超过10MB
                  </div>
                </template>
              </el-upload>
            </div>
          </el-form-item>
        </div>
      </div>

      <el-form-item label="难度"><el-radio-group v-model="localQuestion.difficulty"><el-radio
            :label="0">高</el-radio><el-radio :label="1">中</el-radio><el-radio
            :label="2">低</el-radio></el-radio-group></el-form-item>
      <el-form-item label="解析"><el-radio-group v-model="localQuestion.analysisType"><el-radio
            label="NO_ANALYSIS">无解析</el-radio><el-radio
            label="HAS_ANALYSIS">有解析</el-radio></el-radio-group></el-form-item>
      <el-form-item v-if="localQuestion.analysisType === 'HAS_ANALYSIS'">
        <div class="rich-text-wrapper">
          <Toolbar :editor="editorRefs.analysis" :defaultConfig="analysisToolbarConfig"
            style="border-bottom: 1px solid #ccc" />
          <Editor v-model="localQuestion.analysisContent" style="height: 250px" :defaultConfig="analysisEditorConfig"
            @onCreated="editor => handleCreated(editor, 'analysis')" />
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, shallowRef, watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { ElMessage } from 'element-plus';
import { uploadFiles } from '@/api/common/UploadFiles.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import '@wangeditor/editor/dist/css/style.css';

// 文件上传相关
const uploadAction = '/api/upload/files';
const fileList = ref([]);

const props = defineProps({
  modelValue: { type: Object, required: true },
  index: { type: Number, required: true },
});
const emit = defineEmits(['update:modelValue', 'delete', 'copy']);

// [核心修正] 采用本地深度副本模式，彻底解决响应式问题和无限循环隐患
const localQuestion = ref(JSON.parse(JSON.stringify(props.modelValue)));

// (父 -> 子 同步)
watch(() => props.modelValue, (newPropValue) => {
  // 增加判断，只有在数据确实不一致时才更新，打破无限循环
  if (JSON.stringify(newPropValue) !== JSON.stringify(localQuestion.value)) {
    localQuestion.value = JSON.parse(JSON.stringify(newPropValue));
  }
}, { deep: true });

// (子 -> 父 同步)
watch(localQuestion, (newValue) => {
  emit('update:modelValue', newValue);
}, { deep: true });


// ---- 以下所有逻辑都操作 localQuestion ----
const questionTypeMap = {
  SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', TRUE_FALSE: '判断题',
  FILL_IN_BLANK: '填空题', ESSAY: '论述题',
};
const questionTypeName = computed(() => questionTypeMap[localQuestion.value.questionType] || '未知题型');
const addOption = () => { localQuestion.value.options.push({ content: '' }); };
const removeOption = (index) => { localQuestion.value.options.splice(index, 1); };

const editorRefs = shallowRef({});
const fullEditorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload/image', // 图片上传接口
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      allowedFileTypes: ['image/*'],
      customBrowseAndUpload(insertFn) {
        // 自定义图片上传
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(event) {
          const file = event.target.files[0];
          if (!file) return;
          
          // 检查文件大小
          if (file.size > 5 * 1024 * 1024) {
            ElMessage.error('图片大小不能超过5MB');
            return;
          }
          
          // 调用正确的上传API
          uploadFiles([file]).then(async (uploadRes) => {
            if (uploadRes.code === 200 && typeof uploadRes.data === 'string') {
              const relativePath = uploadRes.data;
              
              // 获取预览URL
              const previewUrl = await previewFile(relativePath);
              
              // 插入图片到编辑器
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
        input.click();
      }
    }
  }
};
const limitedEditorConfig = { placeholder: '请输入选项内容...' };
const fullToolbarConfig = {
  toolbarKeys: [
    'headerSelect',
    'blockquote',
    '|',
    'bold',
    'underline',
    'italic',
    {
      key: 'group-more-style',
      title: '更多样式',
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>',
      menuKeys: ['through', 'code', 'sup', 'sub', 'clearStyle']
    },
    'color',
    'bgColor',
    '|',
    'fontSize',
    'fontFamily',
    'lineHeight',
    '|',
    'bulletedList',
    'numberedList',
    'todo',
    {
      key: 'group-justify',
      title: '对齐',
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z"></path></svg>',
      menuKeys: ['justifyLeft', 'justifyRight', 'justifyCenter', 'justifyJustify']
    },
    {
      key: 'group-indent',
      title: '缩进',
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>',
      menuKeys: ['indent', 'delIndent']
    },
    '|',
    'emotion',
    'insertLink',
    {
      key: 'group-image',
      title: '图片',
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-192 96.01 84.01L640 448l256 224v160z"></path></svg>',
      menuKeys: ['insertImage', 'uploadImage']
    },
    'insertTable',
    'codeBlock',
    'divider',
    '|',
    'undo',
    'redo',
    '|',
    'fullScreen'
  ]
};
const limitedToolbarConfig = {
  excludeKeys: ['group-image', 'group-video']
};

// 专门为解析创建的编辑器配置，包含图片上传和预览
const analysisEditorConfig = {
  placeholder: '请输入解析内容...',
  MENU_CONF: {
    uploadImage: {
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      allowedFileTypes: ['image/*'],
      customBrowseAndUpload(insertFn) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(event) {
          const file = event.target.files[0];
          if (!file) return;
          
          if (file.size > 5 * 1024 * 1024) {
            ElMessage.error('图片大小不能超过5MB');
            return;
          }
          
          uploadFiles([file]).then(async (uploadRes) => {
            if (uploadRes.code === 200 && typeof uploadRes.data === 'string') {
              const relativePath = uploadRes.data;
              
              // 获取预览URL
              const previewUrl = await previewFile(relativePath);
              
              // 插入图片到编辑器
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
        input.click();
      }
    }
  }
};

// 解析编辑器的工具栏配置
const analysisToolbarConfig = {
  toolbarKeys: [
    'bold', 'underline', 'italic',
    '|',
    'color', 'bgColor',
    '|', 
    'fontSize',
    '|',
    'bulletedList', 'numberedList',
    '|',
    'justifyLeft', 'justifyCenter', 'justifyRight',
    '|',
    'insertLink',
    {
      key: 'group-image',
      title: '图片',
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-192 96.01 84.01L640 448l256 224v160z"></path></svg>',
      menuKeys: ['insertImage', 'uploadImage']
    },
    '|',
    'undo', 'redo'
  ]
};
const handleCreated = (editor, key) => {
  editorRefs.value[key] = editor;
};
onBeforeUnmount(() => {
  Object.values(editorRefs.value).forEach(editor => {
    if (editor == null) return;
    editor.destroy();
  });
});

const cleanHtml = (html) => {
  if (html === '<p><br></p>') return '';
  return html;
};
watch(() => localQuestion.value.editMode, (newMode, oldMode) => {
  if (newMode === 'simple' && oldMode === 'complex') {
    localQuestion.value.title = cleanHtml(localQuestion.value.title);
    if (localQuestion.value.options && localQuestion.value.options.length > 0) {
      localQuestion.value.options.forEach(option => {
        option.content = cleanHtml(option.content);
      });
    }
  }
}
);

// ---- 填空题动态答案 ----
const insertBlank = () => {
  const editor = editorRefs.value.title;
  if (editor == null) return;
  // [核心修正] 修正函数名拼写错误
  editor.dangerouslyInsertHtml('___');
};

watch(() => localQuestion.value.title, (newTitle) => {
  if (localQuestion.value.questionType !== 'FILL_IN_BLANK') {
    return;
  }
  const blankCount = (newTitle && typeof newTitle === 'string') ? (newTitle.match(/___/g) || []).length : 0;
  const answerCount = localQuestion.value.answer.length;
  if (blankCount > answerCount) {
    for (let i = 0; i < blankCount - answerCount; i++) {
      localQuestion.value.answer.push('');
    }
  } else if (blankCount < answerCount) {
    localQuestion.value.answer.splice(blankCount);
  }
},
  { deep: true }
);

// 文件上传处理函数
const beforeFileUpload = (file) => {
  const isValidType = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type);
  const isValidSize = file.size / 1024 / 1024 < 10; // 10MB

  if (!isValidType) {
    ElMessage.error('只能上传 doc、docx、xls、xlsx 格式的文件!');
    return false;
  }
  if (!isValidSize) {
    ElMessage.error('文件大小不能超过 10MB!');
    return false;
  }
  return true;
};

const handleFileChange = async (uploadFile) => {
  if (!uploadFile.raw) return;
  
  try {
    const response = await uploadFiles([uploadFile.raw]);
    if (response.code === 200) {
      localQuestion.value.fileName = uploadFile.name;
      localQuestion.value.filePath = response.data;
      fileList.value = [{
        name: uploadFile.name,
        url: response.data,
        uid: uploadFile.uid
      }];
      ElMessage.success('文件上传成功');
    } else {
      ElMessage.error(response.msg || '文件上传失败');
    }
  } catch (error) {
    console.error('文件上传错误:', error);
    ElMessage.error('文件上传失败');
  }
};

// 监听本地问题对象的文件信息变化，同步到文件列表
watch(() => [localQuestion.value.fileName, localQuestion.value.filePath], ([fileName, filePath]) => {
  if (fileName && filePath) {
    fileList.value = [{
      name: fileName,
      url: filePath,
      uid: Date.now()
    }];
  } else {
    fileList.value = [];
  }
}, { immediate: true });
</script>

<style scoped>
.question-editor-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: bold;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-switcher {
  margin-right: 16px;
}

.rich-text-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  z-index: 100;
}

/* 默认插入图片的显示比例（无内联样式时生效），用户通过编辑器工具栏更改样式会覆盖 */
:deep(.w-e-text-container img) {
  width: 50%;
  height: auto;
  max-width: none;
}

.form-item-content {
  width: 100%;
}

.form-item-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.el-form-item .form-item-hint {
  margin-left: 8px;
  margin-top: 0;
}
</style>