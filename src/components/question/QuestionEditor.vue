<template>
  <el-card class="question-editor-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">【{{ questionTypeName }}】第 {{ index + 1 }} 题</span>
        <div class="card-actions">
          <div v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.questionType)" class="mode-switcher">
            <el-radio-group v-model="question.editMode" size="small">
              <el-radio-button label="simple">简洁</el-radio-button>
              <el-radio-button label="complex">复杂</el-radio-button>
            </el-radio-group>
          </div>
          <el-button type="primary" link @click="$emit('copy')">复制</el-button>
          <el-button type="danger" link @click="$emit('delete')">删除</el-button>
        </div>
      </div>
    </template>

    <el-form :model="question" label-width="100px">
      <div v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.questionType)">
        <el-form-item label="题目" prop="title" required>
          <el-input
            v-if="!question.editMode || question.editMode === 'simple'"
            type="textarea"
            v-model="question.title"
            :rows="4"
            placeholder="请输入题目题干"
          />
          <div v-else class="rich-text-wrapper">
            <Toolbar :editor="editorRefs.title" :defaultConfig="fullToolbarConfig" style="border-bottom: 1px solid #ccc" />
            <Editor v-model="question.title" style="height: 150px" :defaultConfig="fullEditorConfig" @onCreated="editor => handleCreated(editor, 'title')" />
          </div>
        </el-form-item>

        <div v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(question.questionType)">
          <el-form-item
            v-for="(option, optIndex) in question.options"
            :key="optIndex"
            :label="'选项' + String.fromCharCode(65 + optIndex)"
            required
          >
            <el-input v-if="!question.editMode || question.editMode === 'simple'" v-model="option.content" style="width: 80%; margin-right: 10px;" />
            <div v-else class="rich-text-wrapper" style="width: 80%; margin-right: 10px;">
              <Toolbar :editor="editorRefs['option_' + optIndex]" :defaultConfig="limitedToolbarConfig" style="border-bottom: 1px solid #ccc" />
              <Editor v-model="option.content" style="height: 100px" :defaultConfig="limitedEditorConfig" @onCreated="editor => handleCreated(editor, 'option_' + optIndex)" />
            </div>
            <el-button type="danger" @click="removeOption(optIndex)" :disabled="question.options.length <= 1">删除</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" link @click="addOption">新增选项</el-button>
          </el-form-item>
        </div>

        <el-form-item label="正确答案" v-if="question.questionType === 'SINGLE_CHOICE'">
          <el-radio-group v-model="question.answer">
            <el-radio v-for="(option, optIndex) in question.options" :key="optIndex" :label="optIndex">
              {{ String.fromCharCode(65 + optIndex) }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="正确答案" v-if="question.questionType === 'MULTIPLE_CHOICE'">
          <el-checkbox-group v-model="question.answer">
            <el-checkbox v-for="(option, optIndex) in question.options" :key="optIndex" :label="optIndex">
              {{ String.fromCharCode(65 + optIndex) }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="正确答案" v-if="question.questionType === 'TRUE_FALSE'">
          <el-radio-group v-model="question.answer">
            <el-radio label="1">正确</el-radio>
            <el-radio label="0">错误</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <div v-if="question.questionType === 'FILL_IN_BLANK'">
        <el-form-item label="详情">
          <div class="form-item-content">
            <div class="form-item-hint" style="margin-bottom: 8px;">
              <el-button type="primary" link @click="insertBlank">插入填空项</el-button>
              <span>提示：填空用连续三个下划线“___”表示</span>
            </div>
            <div class="rich-text-wrapper">
              <Toolbar :editor="editorRefs.details" :defaultConfig="fullToolbarConfig" style="border-bottom: 1px solid #ccc" />
              <Editor v-model="question.details" style="height: 150px" :defaultConfig="fullEditorConfig" @onCreated="editor => handleCreated(editor, 'details')" />
            </div>
            </div>
        </el-form-item>
        <el-form-item
          v-for="(blank, blankIndex) in question.answer"
          :key="blankIndex"
          :label="'答案' + (blankIndex + 1)"
          required
        >
          <el-input v-model="question.answer[blankIndex]" placeholder="请输入答案" />
          <div class="form-item-hint" v-if="blankIndex === 0">
            【备注】答案根据详情中连续出现的“___”自动识别，如需调整答案数量，则答案自动增删
          </div>
        </el-form-item>
      </div>

      <div v-if="question.questionType === 'ESSAY'">
        <el-form-item label="题目" required>
            <el-input v-model="question.title" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="详情">
          <div class="form-item-content">
            <div class="rich-text-wrapper">
              <Toolbar :editor="editorRefs.details" :defaultConfig="fullToolbarConfig" style="border-bottom: 1px solid #ccc" />
              <Editor v-model="question.details" style="height: 150px" :defaultConfig="fullEditorConfig" @onCreated="editor => handleCreated(editor, 'details')" />
            </div>
             </div>
        </el-form-item>
      </div>

      <el-form-item label="难度">
          <el-radio-group v-model="question.difficulty">
              <el-radio :label="2">高</el-radio>
              <el-radio :label="1">中</el-radio>
              <el-radio :label="0">低</el-radio>
          </el-radio-group>
      </el-form-item>

      <div v-if="['FILL_IN_BLANK', 'ESSAY'].includes(question.questionType)">
        <el-form-item label="答题">
          <el-radio-group v-model="question.answerLimit">
            <el-radio label="unlimited">不限制</el-radio>
            <el-radio label="limited">限制</el-radio>
          </el-radio-group>
        </el-form-item>
        <div v-if="question.answerLimit === 'limited'">
            <el-form-item label="字数不少于">
                <el-input v-model="question.wordCountRange" placeholder="可输入50-1000之间" style="width: 200px;" />
            </el-form-item>
            <el-form-item label="附件上传">
                <el-radio-group v-model="question.attachmentRequired">
                    <el-radio label="no">无需上传</el-radio>
                    <el-radio label="yes">需上传 (仅支持doc、docx、xls、xlsx)</el-radio>
                </el-radio-group>
            </el-form-item>
        </div>
      </div>

      <el-form-item label="解析">
        <el-radio-group v-model="question.analysisType">
          <el-radio label="NO_ANALYSIS">无解析</el-radio>
          <el-radio label="HAS_ANALYSIS">有解析</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="question.analysisType === 'HAS_ANALYSIS'">
          <div class="rich-text-wrapper">
              <Toolbar :editor="editorRefs.analysis" :defaultConfig="fullToolbarConfig" style="border-bottom: 1px solid #ccc" />
              <Editor v-model="question.analysisContent" style="height: 250px" :defaultConfig="fullEditorConfig" @onCreated="editor => handleCreated(editor, 'analysis')" />
          </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';

const props = defineProps({
  modelValue: { type: Object, required: true },
  index: { type: Number, required: true },
});
const emit = defineEmits(['update:modelValue', 'delete', 'copy']);
const question = computed({
  get() { return props.modelValue; },
  set(value) { emit('update:modelValue', value); },
});
const questionTypeMap = {
  SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', TRUE_FALSE: '判断题',
  FILL_IN_BLANK: '填空题', ESSAY: '论述题',
};
const questionTypeName = computed(() => questionTypeMap[question.value.questionType] || '未知题型');
const addOption = () => { question.value.options.push({ content: '' }); };
const removeOption = (index) => { question.value.options.splice(index, 1); };

// ---- 富文本编辑器管理 ----
const editorRefs = shallowRef({});
const fullEditorConfig = { 
  placeholder: '请输入内容...',
  MENU_CONF: { /* 在此配置您的上传接口 */ }
};
const limitedEditorConfig = { placeholder: '请输入选项内容...' };
const fullToolbarConfig = {};
const limitedToolbarConfig = {
  excludeKeys: ['group-image', 'group-video']
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

// ---- 模式切换与数据清理 ----
const cleanHtml = (html) => {
  if (html === '<p><br></p>') return '';
  return html;
};
watch(() => question.value.editMode, (newMode, oldMode) => {
    if (newMode === 'simple' && oldMode === 'complex') {
      question.value.title = cleanHtml(question.value.title);
      if (question.value.options && question.value.options.length > 0) {
        question.value.options.forEach(option => {
          option.content = cleanHtml(option.content);
        });
      }
    }
  }
);

// ---- 填空题动态答案 ----
const insertBlank = () => {
    const editor = editorRefs.value.details;
    if (editor == null) return;
    editor.dangerouslyInsertHTML('___');
};
watch(() => question.value.details, (newDetails) => {
    if (question.value.questionType !== 'FILL_IN_BLANK' || !newDetails) {
      return;
    }
    const blankCount = (newDetails.match(/___/g) || []).length;
    const answerCount = question.value.answer.length;
    if (blankCount > answerCount) {
      for (let i = 0; i < blankCount - answerCount; i++) {
        question.value.answer.push('');
      }
    } else if (blankCount < answerCount) {
      question.value.answer.splice(blankCount);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.question-editor-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: bold; }
.card-actions { display: flex; align-items: center; gap: 16px; }
.mode-switcher { margin-right: 16px; }
.rich-text-wrapper { border: 1px solid #ccc; border-radius: 4px; width: 100%; z-index: 100; }
.form-item-content { width: 100%; }
.form-item-hint { color: #909399; font-size: 12px; line-height: 1.5; }
.el-form-item .form-item-hint { margin-left: 8px; margin-top: 0; }
</style>