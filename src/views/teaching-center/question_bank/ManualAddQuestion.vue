<template>
  <el-container class="batch-add-page">
    <el-main>
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

    </el-main>
    <el-footer class="page-footer">
      <span>共 {{ questionList.length }} 道题</span>
      <div>
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onSubmit" :disabled="questionList.length === 0">确定</el-button>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, Refresh, Plus } from '@element-plus/icons-vue';
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

const categoryOptions = ref([]);
const groupOptions = ref([]);

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

onMounted(() => {
  fetchCategories();
  fetchGroups();
  if (route.query.groupId && route.query.groupId !== 'all') {
    batchInfo.value.groupId = parseInt(route.query.groupId, 10);
  }
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
});

const addQuestion = (type) => {
  const base = createBaseQuestion(type);
  switch (type) {
    case 'MULTIPLE_CHOICE':
      base.answer = [];
      break;
    case 'TRUE_FALSE':
      base.answer = '1';
      break;
    case 'FILL_IN_BLANK':
      base.answer = [];
      base.options = [];
      break;
    case 'ESSAY':
      base.answer = '';
      base.options = [];
      break;
  }
  questionList.value.push(base);
};

const deleteQuestion = (index) => {
  ElMessageBox.confirm('确定要删除这道题吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      questionList.value.splice(index, 1);
      ElMessage.success('删除成功');
    }).catch(() => {});
};

const copyQuestion = (index) => {
  const originalQuestion = questionList.value[index];
  const copiedQuestion = JSON.parse(JSON.stringify(originalQuestion));
  copiedQuestion.uid = uuidv4();
  questionList.value.splice(index + 1, 0, copiedQuestion);
  ElMessage.success('复制成功');
};

const onCancel = () => {
  router.back();
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
        fileUpload: 0,
        fileName: "",
        filePath: ""
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
          backendQuestion.details = JSON.stringify([
            { option: 'A', value: '正确' },
            { option: 'B', value: '错误' }
          ]);
          break;
        case 'FILL_IN_BLANK':
          backendQuestion.answer = q.answer.join('#@#');
          break;
        case 'ESSAY':
          backendQuestion.answer = q.answer;
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
.batch-add-page { display: flex; flex-direction: column; height: calc(100vh - 88px); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.batch-info-form { margin-bottom: 20px; padding: 20px 10px 0; background-color: #fcfcfc; border: 1px solid #ebeef5; border-radius: 4px; }
.question-list { flex-grow: 1; overflow-y: auto; padding-right: 10px; }
.page-footer { display: flex; justify-content: space-between; align-items: center; background-color: #fff; border-top: 1px solid #ebeef5; padding: 10px 20px; position: sticky; bottom: 0; }
</style>