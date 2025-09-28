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
          <el-radio-group v-model="localQuestion.answer"><el-radio label="1">正确</el-radio><el-radio
              label="0">错误</el-radio></el-radio-group>
        </el-form-item>
      </div>

      <div v-if="localQuestion.questionType === 'FILL_IN_BLANK'">
        <el-form-item label="题目" required>
          <div class="form-item-content">
            <div class="form-item-hint" style="margin-bottom: 8px;">
              <el-button type="primary" link @click="insertBlank">插入填空项</el-button><span>提示：填空用连续三个下划线“___”表示</span>
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
      </div>

      <el-form-item label="难度"><el-radio-group v-model="localQuestion.difficulty"><el-radio
            :label="2">高</el-radio><el-radio :label="1">中</el-radio><el-radio
            :label="0">低</el-radio></el-radio-group></el-form-item>
      <div v-if="['FILL_IN_BLANK'].includes(localQuestion.questionType)">
        <el-form-item label="答题"><el-radio-group v-model="localQuestion.answerLimit"><el-radio
              label="unlimited">不限制</el-radio><el-radio label="limited">限制</el-radio></el-radio-group></el-form-item>
        <div v-if="localQuestion.answerLimit === 'limited'">
          <el-form-item label="字数不少于"><el-input v-model="localQuestion.wordCountRange" placeholder="可输入50-1000之间"
              style="width: 200px;" /></el-form-item>
          <el-form-item label="附件上传"><el-radio-group v-model="localQuestion.attachmentRequired"><el-radio
                label="no">无需上传</el-radio><el-radio label="yes">需上传
                (仅支持doc、docx、xls、xlsx)</el-radio></el-radio-group></el-form-item>
        </div>
      </div>
      <el-form-item label="解析"><el-radio-group v-model="localQuestion.analysisType"><el-radio
            label="NO_ANALYSIS">无解析</el-radio><el-radio
            label="HAS_ANALYSIS">有解析</el-radio></el-radio-group></el-form-item>
      <el-form-item v-if="localQuestion.analysisType === 'HAS_ANALYSIS'">
        <div class="rich-text-wrapper">
          <Toolbar :editor="editorRefs.analysis" :defaultConfig="fullToolbarConfig"
            style="border-bottom: 1px solid #ccc" />
          <Editor v-model="localQuestion.analysisContent" style="height: 250px" :defaultConfig="fullEditorConfig"
            @onCreated="editor => handleCreated(editor, 'analysis')" />
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, shallowRef, watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';

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
  MENU_CONF: {}
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