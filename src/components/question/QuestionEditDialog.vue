<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="编辑试题" 
    width="800px" 
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="questionForm" :rules="rules" label-width="80px">
      <el-form-item label="题型" prop="questionType">
        <el-tag type="primary" disable-transitions>{{ questionForm.questionType }}</el-tag>
      </el-form-item>
      <el-form-item label="分类" prop="questionCategory">
        <el-select v-model="questionForm.questionCategory" placeholder="请选择分类">
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="试题分组" prop="groupId">
        <el-select v-model="questionForm.groupId" placeholder="请选择分组">
          <el-option v-for="group in groupList" :key="group.id" :label="group.name" :value="group.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="题目" prop="title">
        <el-input 
          v-model="questionForm.title" 
          type="textarea" 
          :rows="3" 
          placeholder="请输入题目" 
          show-word-limit
          maxlength="500" 
        />
      </el-form-item>

      <el-form-item v-if="questionForm.questionType !== '填空'" label="选项" prop="options">
        <div v-for="(option, index) in questionForm.options" :key="index" class="option-item">
          <el-input v-model="option.text" placeholder="请输入选项内容">
            <template #prepend>
              <el-radio 
                v-if="questionForm.questionType === '单选' || questionForm.questionType === '判断'"
                :label="option.value" 
                v-model="questionForm.answer"
              >
                设为答案
              </el-radio>
              <el-checkbox 
                v-else-if="questionForm.questionType === '多选'" 
                v-model="option.isCorrect"
              >
                设为答案
              </el-checkbox>
            </template>
          </el-input>
          <el-button 
            @click="removeOption(index)" 
            :icon="Delete" 
            circle 
            plain 
            type="danger"
            class="delete-option-btn" 
          />
        </div>
        <el-button @click="addOption" type="primary" link>+ 新增选项</el-button>
      </el-form-item>

      <el-form-item v-if="questionForm.questionType === '填空'" label="答案" prop="answer">
        <el-input 
          v-model="questionForm.answer" 
          type="textarea" 
          :rows="5" 
          placeholder="请输入答案，多个答案请用 #@# 分隔" 
        />
      </el-form-item>

      <el-form-item label="难度" prop="difficulty">
        <el-radio-group v-model="questionForm.difficulty">
          <el-radio :label="0">高</el-radio>
          <el-radio :label="1">中</el-radio>
          <el-radio :label="2">低</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="解析" prop="analysis">
        <el-radio-group v-model="showAnalysis">
          <el-radio :label="false">无解析</el-radio>
          <el-radio :label="true">设置解析</el-radio>
        </el-radio-group>
        <div v-if="showAnalysis" style="margin-top: 10px;">
          <div style="border: 1px solid #ccc; width: 450px;">
            <Toolbar
              ref="analysisToolbarRef"
              style="border-bottom: 1px solid #ccc"
              :editor="analysisEditor"
              :defaultConfig="{}"
              mode="default"
            />
            <Editor
              ref="analysisEditorRef"
              v-model="questionForm.analysis"
              style="height: 200px; overflow-y: hidden;"
              :defaultConfig="analysisEditorConfig"
              mode="default"
              @onCreated="handleAnalysisCreated"
            />
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick, shallowRef, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import { updateQuestion, getQuestionDetail } from '@/api/teaching-center/QuestionBank';
import { getDictByType } from '@/api/system-management/dictionary';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { uploadFiles } from '@/api/common/UploadFiles.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import { removeOuterPTag } from '@/utils/richTextHelper.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  questionId: {
    type: [String, Number],
    default: null
  },
  groupList: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:visible', 'success']);

const formRef = ref(null);
const showAnalysis = ref(false);
const categoryOptions = ref([]);
const dialogVisible = ref(false);

// 富文本编辑器相关
const analysisEditorRef = shallowRef();
const analysisToolbarRef = ref();
const analysisEditor = shallowRef();

const questionForm = reactive({
  id: null,
  questionType: '单选',
  questionCategory: '',
  groupId: null,
  title: '',
  options: [],
  difficulty: 1,
  analysis: '',
  details: '',
  answer: '',
});

const rules = reactive({
  title: [{ required: true, message: '请输入题目', trigger: 'blur' }],
  questionCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
});

// 富文本编辑器配置
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

// 获取分类选项
const fetchCategoryOptions = async () => {
  try {
    const res = await getDictByType('question_category');
    if (res.code === 200 && res.data) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue
      }));
    }
  } catch (error) {
    console.error('获取分类选项失败:', error);
  }
};

// 加载题目详情
const loadQuestionDetail = async () => {
  if (!props.questionId) return;
  
  console.log('加载题目详情，questionId:', props.questionId);
  
  try {
    const res = await getQuestionDetail(props.questionId);
    console.log('题目详情响应:', res);
    if (res.code === 200 && res.data) {
      const data = res.data;
      questionForm.id = data.id;
      questionForm.title = data.title;
      questionForm.questionType = data.questionType;
      questionForm.questionCategory = data.questionCategory;
      questionForm.groupId = data.groupId;
      questionForm.difficulty = data.difficulty;
      questionForm.analysis = data.analysis;

      if (data.questionType === '判断') {
        questionForm.options = [
          { value: '1', text: '正确' },
          { value: '0', text: '错误' }
        ];
        questionForm.answer = data.answer;
      } else if (data.questionType === '填空') {
        // 填空题直接设置答案
        questionForm.answer = data.answer;
        questionForm.options = [];
      } else {
        let parsedOptions = [];
        try {
          parsedOptions = JSON.parse(data.details || '[]');
        } catch (e) { 
          console.error("解析options失败", e); 
        }

        const correctAnswers = data.answer ? data.answer.split('#@#') : [];

        questionForm.options = parsedOptions.map(apiOpt => ({
          value: apiOpt.option,
          text: apiOpt.value,
          isCorrect: correctAnswers.includes(apiOpt.option)
        }));

        if (questionForm.questionType === '单选') {
          questionForm.answer = data.answer;
        }
      }

      showAnalysis.value = !!data.analysis;
    } else {
      ElMessage.error(res.msg || '获取题目详情失败');
    }
  } catch (error) { 
    ElMessage.error('获取题目详情失败'); 
  }
};

// 添加选项
const addOption = () => {
  const nextChar = String.fromCharCode(65 + questionForm.options.length);
  questionForm.options.push({ value: nextChar, text: '', isCorrect: false });
};

// 删除选项
const removeOption = (index) => {
  questionForm.options.splice(index, 1);
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    let finalAnswer = '';
    if (questionForm.questionType === '多选') {
      const correctAnswers = [];
      questionForm.options.forEach(opt => { 
        if (opt.isCorrect) correctAnswers.push(opt.value); 
      });
      finalAnswer = correctAnswers.join('#@#');
    } else {
      finalAnswer = questionForm.answer;
    }

    const detailsForBackend = JSON.stringify(questionForm.options.map(uiOpt => ({
      option: uiOpt.value,
      value: uiOpt.text
    })));

    const dataToSubmit = {
      id: questionForm.id,
      title: questionForm.title,
      questionType: questionForm.questionType,
      questionCategory: questionForm.questionCategory,
      groupId: questionForm.groupId,
      difficulty: questionForm.difficulty,
      analysis: showAnalysis.value ? removeOuterPTag(questionForm.analysis) : '', // 去除外层 <p> 标签
      details: detailsForBackend,
      answer: finalAnswer,
    };

    await updateQuestion(dataToSubmit);
    ElMessage.success('修改成功！');
    dialogVisible.value = false;
    emit('update:visible', false);
    emit('success');
  } catch (error) {
    ElMessage.error('修改失败');
  }
};

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false;
  emit('update:visible', false);
};

// 处理富文本编辑器创建
const handleAnalysisCreated = (editor) => {
  analysisEditor.value = editor;
};

// 组件销毁前清理编辑器
onBeforeUnmount(() => {
  const editor = analysisEditor.value;
  if (editor == null) return;
  editor.destroy();
});

// 监听弹窗显示状态
watch(() => props.visible, async (newVisible) => {
  dialogVisible.value = newVisible;
  if (newVisible && props.questionId) {
    await fetchCategoryOptions();
    await loadQuestionDetail();
  }
});

// 监听内部状态变化
watch(dialogVisible, (newValue) => {
  if (!newValue) {
    emit('update:visible', false);
  }
});

// 初始化时获取分类选项
fetchCategoryOptions();
</script>

<style scoped>
.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.delete-option-btn {
  margin-left: 10px;
}
</style>
