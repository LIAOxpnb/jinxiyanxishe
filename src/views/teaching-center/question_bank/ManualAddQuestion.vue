<template>
  <div class="batch-add-page">
    <!-- 固定顶部区域 -->
    <div class="fixed-header">
      <div class="page-header">
        <h2>批量新增试题</h2>
        <el-dropdown @command="addQuestion">
          <el-button type="primary">
            新增试题<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="SINGLE_CHOICE">单选题</el-dropdown-item>
              <el-dropdown-item command="MULTIPLE_CHOICE">多选题</el-dropdown-item>
              <el-dropdown-item command="TRUE_FALSE">判断题</el-dropdown-item>
              <el-dropdown-item command="FILL_IN_BLANK">填空题</el-dropdown-item>
              <el-dropdown-item command="ESSAY">论述题</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-form :model="batchInfo" label-width="100px" class="batch-info-form">
        <el-row>
          <el-col :span="8">
            <el-form-item label="归属分类" prop="questionCategory" required>
              <el-select v-model="batchInfo.questionCategory" placeholder="请选择">
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="试题分组" prop="groupId">
              <el-select v-model="batchInfo.groupId"  style="width: 150px; margin-right: 8px;">
                <!-- <el-option label="未分组" :value="null" /> -->
                <el-option
                  v-for="item in groupOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              <el-button :icon="Refresh" circle @click="fetchGroups" />
              <el-button :icon="Plus" circle @click="addGroup" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="content-area">
      <div class="question-list">
        <QuestionEditor
          v-for="(question, index) in questionList"
          :key="question.uid"
          :index="index"
          v-model="questionList[index]"
          @delete="deleteQuestion(index)"
          @copy="copyQuestion(index)"
        />
        <el-empty v-if="questionList.length === 0" description="请点击右上角按钮新增试题" />
      </div>
    </div>

    <!-- 固定底部区域 -->
    <div class="fixed-footer">
      <div class="footer-left">
        <span>共 {{ questionList.length }} 道题</span>
        <span v-if="lastSaveTime" class="save-status">
          <el-icon class="save-icon"><Check /></el-icon>
          已自动保存 {{ formatSaveTime(lastSaveTime) }}
        </span>
        <span v-else-if="hasUnsavedChanges" class="unsaved-status">
          <el-icon class="unsaved-icon"><Loading /></el-icon>
          保存中...
        </span>
      </div>
      <div>
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onSubmit" :disabled="questionList.length === 0">确定</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, Refresh, Plus, Check, Loading } from '@element-plus/icons-vue';
import { saveQuestionList, getQuestionGroupList, addQuestionGroup } from '@/api/teaching-center/QuestionBank';
import { getDictData } from '@/api/system-management/dictionary';
import QuestionEditor from '@/components/question/QuestionEditor.vue';
import { v4 as uuidv4 } from 'uuid';

const router = useRouter();
const route = useRoute();
const questionList = ref([]);

const batchInfo = ref({
  questionCategory: '',
  groupId: null,
});

// 暂存相关状态
const STORAGE_KEY = 'manual_add_question_draft';
const lastSaveTime = ref(null);
const hasUnsavedChanges = ref(false);

const categoryOptions = ref([]);
const groupOptions = ref([]);

// 暂存功能相关方法
const saveDraft = () => {
  try {
    // 只有当有题目或者有分类信息时才保存
    if (questionList.value.length === 0 && !batchInfo.value.questionCategory) {
      return;
    }
    
    const draftData = {
      questionList: questionList.value,
      batchInfo: batchInfo.value,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    lastSaveTime.value = new Date();
    hasUnsavedChanges.value = false;
    console.log('数据已自动保存到本地');
  } catch (error) {
    console.error('保存草稿失败:', error);
    ElMessage.warning('暂存数据失败，请检查浏览器存储空间');
  }
};

const loadDraft = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const draftData = JSON.parse(savedData);
      if (draftData.questionList && draftData.questionList.length > 0) {
        // 询问用户是否恢复暂存数据
        ElMessageBox.confirm(
          `检测到未完成的题目编辑，共 ${draftData.questionList.length} 道题，是否恢复？`,
          '发现暂存数据',
          {
            confirmButtonText: '恢复数据',
            cancelButtonText: '放弃暂存',
            type: 'info',
          }
        ).then(() => {
          questionList.value = draftData.questionList;
          batchInfo.value = { ...batchInfo.value, ...draftData.batchInfo };
          lastSaveTime.value = new Date(draftData.timestamp);
          hasUnsavedChanges.value = false;
          ElMessage.success('已恢复暂存数据');
        }).catch(() => {
          clearDraft();
        });
      }
    }
  } catch (error) {
    console.error('加载草稿失败:', error);
    clearDraft();
  }
};

const clearDraft = () => {
  localStorage.removeItem(STORAGE_KEY);
  lastSaveTime.value = null;
  hasUnsavedChanges.value = false;
};

// 防抖保存
let saveTimer = null;
const debouncedSave = () => {
  hasUnsavedChanges.value = true;
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveDraft();
  }, 1000); // 1秒后自动保存
};

// 格式化保存时间
const formatSaveTime = (time) => {
  if (!time) return '';
  const now = new Date();
  const diff = now - time;
  
  if (diff < 60000) { // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else {
    return time.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

const fetchCategories = async () => {
  try {
    const res = await getDictData('question_category');
    if (res.code === 200) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue,
      }));
    } else { ElMessage.error('获取分类失败'); }
  } catch (error) { ElMessage.error('获取分类失败'); }
};

const fetchGroups = async () => {
  try {
    const res = await getQuestionGroupList();
    if (res.code === 200) {
      groupOptions.value = res.data;
    } else { ElMessage.error('获取分组列表失败'); }
  } catch (error) { ElMessage.error('获取分组列表失败'); }
};

const addGroup = () => {
  ElMessageBox.prompt('请输入新分组的名称', '新增分组', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValidator: (value) => {
      if (!value || value.trim() === '') return '分组名称不能为空';
      return true;
    },
  }).then(async ({ value }) => {
    try {
      const res = await addQuestionGroup(value);
      if (res.code === 200) {
        ElMessage.success('新增分组成功');
        await fetchGroups();
      } else { ElMessage.error(res.msg || '新增分组失败'); }
    } catch (error) { ElMessage.error('新增分组失败'); }
  }).catch(() => {});
};

// 监听数据变化，自动保存
watch(
  [questionList, batchInfo],
  () => {
    if (questionList.value.length > 0 || batchInfo.value.questionCategory) {
      debouncedSave();
    }
  },
  { deep: true }
);

// 浏览器刷新或关闭时的提醒
const handleBeforeUnload = (event) => {
  if (hasUnsavedChanges.value || questionList.value.length > 0) {
    const message = '您有未保存的数据，确定要离开吗？';
    event.preventDefault();
    event.returnValue = message;
    // 在用户真的要离开前保存数据
    saveDraft();
    return message;
  }
};

// 页面卸载前的处理
onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

onMounted(() => {
  fetchCategories();
  fetchGroups();
  if (route.query.groupId && route.query.groupId !== 'all') {
    batchInfo.value.groupId = parseInt(route.query.groupId, 10);
  }
  // 监听浏览器刷新或关闭事件
  window.addEventListener('beforeunload', handleBeforeUnload);
  // 延迟加载暂存数据，确保组件完全加载
  setTimeout(() => {
    loadDraft();
  }, 100);
});

const questionTypeMap = {
  SINGLE_CHOICE: '单选',
  MULTIPLE_CHOICE: '多选',
  TRUE_FALSE: '判断',
  FILL_IN_BLANK: '填空',
  ESSAY: '论述',
};

const createBaseQuestion = (type) => ({
  uid: uuidv4(),
  title: '',
  details: '',
  questionType: type,
  difficulty: 1,
  analysisType: 'NO_ANALYSIS',
  analysisContent: '',
  options: [{ content: '' }],
  answer: null,
  editMode: 'simple',
  answerLimit: 'unlimited',
  wordCountRange: '',
  attachmentRequired: 'no',
  fileName: '',
  filePath: '',
  fileUpload: 0,
});

const addQuestion = (type) => {
  const base = createBaseQuestion(type);
  switch (type) {
    case 'MULTIPLE_CHOICE':
      base.answer = [];
      break;
    case 'TRUE_FALSE':
      base.answer = '0'; // 默认设置为正确
      break;
    case 'FILL_IN_BLANK':
      base.answer = [];
      base.options = [];
      break;
    case 'ESSAY':
      base.answer = '';
      base.options = [];
      base.answerLimit = 'unlimited';
      base.wordCountRange = '';
      base.attachmentRequired = 'no';
      break;
  }
  questionList.value.push(base);
  // 添加题目后立即触发保存
  debouncedSave();
};

const deleteQuestion = (index) => {
  ElMessageBox.confirm('确定要删除这道题吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      questionList.value.splice(index, 1);
      ElMessage.success('删除成功');
      // 删除后立即保存
      debouncedSave();
    }).catch(() => {});
};

const copyQuestion = (index) => {
  const originalQuestion = questionList.value[index];
  const copiedQuestion = JSON.parse(JSON.stringify(originalQuestion));
  copiedQuestion.uid = uuidv4();
  questionList.value.splice(index + 1, 0, copiedQuestion);
  ElMessage.success('复制成功');
  // 复制后立即保存
  debouncedSave();
};

const onCancel = () => {
  if (hasUnsavedChanges.value || questionList.value.length > 0) {
    ElMessageBox.confirm(
      '您有未保存的数据，确定要离开吗？数据将会暂存到本地。',
      '确认离开',
      {
        confirmButtonText: '确定离开',
        cancelButtonText: '继续编辑',
        type: 'warning',
      }
    ).then(() => {
      saveDraft(); // 离开前保存一次
      router.back();
    }).catch(() => {
      // 用户选择继续编辑
    });
  } else {
    router.back();
  }
};

const cleanHtml = (html) => {
  if (!html) return '';
  // 使用 DOMParser 来解析 HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // 返回 body 的 textContent，这会移除所有 HTML 标签
  return doc.body.textContent || "";
};

const onSubmit = async () => {
  if (questionList.value.length === 0) {
    ElMessage.warning('请至少添加一道试题');
    return;
  }
  if (!batchInfo.value.questionCategory) {
    ElMessage.warning('请选择归属分类');
    return;
  }

  // 添加详细的表单校验
  for (let i = 0; i < questionList.value.length; i++) {
    const question = questionList.value[i];
    const questionIndex = i + 1;
    
    // 校验题目标题
    if (!question.title || question.title.trim() === '') {
      ElMessage.error(`第 ${questionIndex} 题：题目内容不能为空`);
      return;
    }
    
    // 校验选择题的选项和答案
    if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') {
      // 校验选项
      if (!question.options || question.options.length === 0) {
        ElMessage.error(`第 ${questionIndex} 题：请至少添加一个选项`);
        return;
      }
      
      // 校验选项内容
      const validOptions = question.options.filter(opt => opt.content && opt.content.trim() !== '');
      if (validOptions.length < 2) {
        ElMessage.error(`第 ${questionIndex} 题：请至少添加两个有效选项`);
        return;
      }
      
      // 校验答案
      if (question.questionType === 'SINGLE_CHOICE') {
        if (question.answer === null || question.answer === undefined) {
          ElMessage.error(`第 ${questionIndex} 题：请设置正确答案`);
          return;
        }
      } else if (question.questionType === 'MULTIPLE_CHOICE') {
        if (!question.answer || question.answer.length === 0) {
          ElMessage.error(`第 ${questionIndex} 题：请至少选择一个正确答案`);
          return;
        }
      }
    }
    
    // 校验判断题的答案
    if (question.questionType === 'TRUE_FALSE') {
      if (!question.answer || (question.answer !== '1' && question.answer !== '0')) {
        ElMessage.error(`第 ${questionIndex} 题：请设置正确答案（正确或错误）`);
        return;
      }
    }
    
    // 校验填空题的答案
    if (question.questionType === 'FILL_IN_BLANK') {
      if (!question.answer || question.answer.length === 0 || 
          question.answer.every(ans => !ans || ans.trim() === '')) {
        ElMessage.error(`第 ${questionIndex} 题：请设置填空答案`);
        return;
      }
    }
    
    // 论述题不需要参考答案，移除相关校验
  }

  // --- 诊断日志一：检查从 QuestionEditor 组件接收到的原始前端数据 ---
  console.log('--- 诊断日志 1: 准备提交的原始前端试题列表 (questionList) ---', JSON.parse(JSON.stringify(questionList.value)));

  try {
    const payload = questionList.value.map((q, index) => {
      const backendQuestion = {
        questionType: questionTypeMap[q.questionType] || '',
        title: (q.questionType === 'FILL_IN_BLANK' || q.editMode === 'complex') ? cleanHtml(q.title) : q.title,
        groupId: batchInfo.value.groupId || 0,
        questionCategory: batchInfo.value.questionCategory,
        details: '',
        answer: '',
        difficulty: q.difficulty,
        analysis: q.analysisType === 'HAS_ANALYSIS' ? q.analysisContent : '',
        wordLimit: 0,
        fileUpload: q.fileUpload || 0,
        fileName: q.fileName || '',
        filePath: q.filePath || ''
      };
      
      switch (q.questionType) {
        case 'SINGLE_CHOICE':
        case 'MULTIPLE_CHOICE': {
          const detailsArray = q.options.map((opt, i) => ({
            option: String.fromCharCode(65 + i),
            value: opt.content,
          }));
          backendQuestion.details = JSON.stringify(detailsArray);
          
          if (q.questionType === 'SINGLE_CHOICE' && q.answer !== null) {
            backendQuestion.answer = String.fromCharCode(65 + q.answer);
          } else if (q.questionType === 'MULTIPLE_CHOICE' && q.answer && q.answer.length > 0) {
            backendQuestion.answer = [...q.answer].sort((a,b) => a - b)
              .map(i => String.fromCharCode(65 + i))
              .join('#@#');
          }
          break;
        }
        case 'TRUE_FALSE':
          backendQuestion.answer = q.answer;
          backendQuestion.details = ''; // 判断题不需要details
          break;
        case 'FILL_IN_BLANK':
          backendQuestion.answer = q.answer.join('#@#');
          break;
        case 'ESSAY':
          backendQuestion.answer = q.answer;
          // 论述题的详情字段
          backendQuestion.details = q.details || '';
          // 处理论述题的答题限制
          if (q.answerLimit === 'limited') {
            backendQuestion.wordLimit = parseInt(q.wordCountRange) || 0;
          }
          // 处理论述题的附件上传（无论是否有答题限制，都要检查附件）
          if (q.attachmentRequired === 'yes') {
            backendQuestion.fileUpload = 1;
            backendQuestion.fileName = q.fileName || '';
            backendQuestion.filePath = q.filePath || '';
          } else {
            backendQuestion.fileUpload = 0;
            backendQuestion.fileName = '';
            backendQuestion.filePath = '';
          }
          break;
      }

      // --- 诊断日志二：逐个检查每道题从前端格式转换到后端格式后的结果 ---
      console.log(`--- 诊断日志 2: 第 ${index + 1} 题转换结果 ---`, {
        '前端原始数据(q)': JSON.parse(JSON.stringify(q)),
        '转换后后端格式(backendQuestion)': backendQuestion
      });

      return backendQuestion;
    });
    
    // --- 诊断日志三：检查最终准备发送给后端的完整数据包 ---
    console.log('--- 诊断日志 3: 最终发送到后端的数据 (Payload) ---', JSON.stringify(payload, null, 2));

    const res = await saveQuestionList(payload);
    if (res && res.code === 200) {
      ElMessage.success('批量新增试题成功');
      // 提交成功后清空暂存数据
      clearDraft();
      router.push({ path: '/teaching-center/question-bank' });
    } else {
      ElMessage.error(res?.msg || '保存失败');
    }
  } catch (e) {
    // --- 诊断日志四：检查后端返回的错误信息 ---
    console.error('--- 诊断日志 4: 提交失败，后端返回的错误 ---', e);
    ElMessage.error('提交失败，请检查控制台中的“诊断日志4”获取详细错误');
  }
};
</script>

<style scoped>
.batch-add-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px - 64px); /* 减去Header(64px)和Footer(约64px) */
  overflow: hidden;
  margin: 0; /* 移除外边距 */
}

.fixed-header {
  flex-shrink: 0;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 5px;
  z-index: 100;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.batch-info-form {
  margin-bottom: 0;
  padding: 20px 10px 20px;
  background-color: #fcfcfc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
}

.question-list {
  max-width: 100%;
}

.fixed-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  padding: 15px 20px;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.save-status {
  display: flex;
  align-items: center;
  color: #67c23a;
  font-size: 12px;
}

.save-icon {
  margin-right: 4px;
}

.unsaved-status {
  display: flex;
  align-items: center;
  color: #e6a23c;
  font-size: 12px;
}

.unsaved-icon {
  margin-right: 4px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>