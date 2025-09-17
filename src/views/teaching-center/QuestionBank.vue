<template>
  <el-container class="page-container">
    <el-aside width="220px" class="left-panel">
      <el-menu :default-active="activeGroupId" class="group-menu" @select="handleGroupSelect">
        <!-- <el-menu-item index="all">
          <span>全部</span>
        </el-menu-item> -->
        <el-menu-item v-for="group in groupList" :key="group.id" :index="group.id.toString()">
          <span class="group-name">{{ group.name }}</span>
          <el-dropdown @command="(command) => handleGroupDropdownCommand(command, group)" @click.stop>
            <el-button link size="small" class="group-more-btn" @click.stop>
              <el-icon>
                <More />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-menu-item>
      </el-menu>
      <div class="add-group-btn-wrapper">
        <el-button class="add-group-btn" plain @click="handleAddGroup">+ 新增试题分组</el-button>
      </div>
    </el-aside>

    <el-main class="right-panel">
      <h1 class="page-title">题库</h1>
      <FilterBar create-button-text="新增试题" :fields="questionFilterFields" :create-options="createOptions"
        @create="handleCreateQuestion" @filter="handleFilterQuestions" />
      <el-table v-loading="tableLoading" :data="tableData" style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="序号" width="100" />
        <el-table-column prop="title" label="题目">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleEditQuestion(scope.row)">{{ scope.row.title
              }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="题型" width="100" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="group" label="试题分组" width="120" />
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="scope">
            <span>{{ formatDifficulty(scope.row.difficulty) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="creationTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEditQuestion(scope.row)">编辑</el-button>
            <el-dropdown @command="(command) => handleDropdownCommand(command, scope.row)">
              <el-button link size="small" class="more-btn">
                <el-icon>
                  <More />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
          background />
      </div>
    </el-main>

    <el-dialog v-model="dialogVisible" title="编辑试题" width="800px" :close-on-click-modal="false">
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
          <el-input v-model="questionForm.title" type="textarea" :rows="3" placeholder="请输入题目" show-word-limit
            maxlength="500" />
        </el-form-item>

        <el-form-item v-if="questionForm.questionType !== '填空'" label="选项" prop="options">
          <div v-for="(option, index) in questionForm.options" :key="index" class="option-item">
            <el-input v-model="option.text" placeholder="请输入选项内容">
              <template #prepend>
                <el-radio v-if="questionForm.questionType === '单选' || questionForm.questionType === '判断'"
                  :label="option.value" v-model="questionForm.answer">
                  设为答案
                </el-radio>
                <el-checkbox v-else-if="questionForm.questionType === '多选'" v-model="option.isCorrect">
                  设为答案
                </el-checkbox>
              </template>
            </el-input>
            <el-button @click="removeOption(index)" :icon="Delete" circle plain type="danger"
              class="delete-option-btn" />
          </div>
          <el-button @click="addOption" type="primary" link>+ 新增选项</el-button>
        </el-form-item>

        <el-form-item v-if="questionForm.questionType === '填空'" label="答案" prop="answer">
          <el-input v-model="questionForm.answer" type="textarea" :rows="5" placeholder="请输入答案，多个答案请用 #@# 分隔" />
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
            <el-input v-model="questionForm.analysis" type="textarea" :rows="6" style="width: 450px;"
              placeholder="请输入答案解析" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Delete, More } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';

import {
  getQuestionGroupList,
  addQuestionGroup,
  deleteQuestionGroup,
  updateQuestionGroup,
  getQuestionList,
  updateQuestion,
  getQuestionDetail,
  deleteQuestion,
} from '@/api/teaching-center/QuestionBank';
import { getDictByType } from '@/api/system-management/dictionary';

const router = useRouter();

// --- 状态管理 ---
const groupList = ref([]);
const tableData = ref([]);
const tableLoading = ref(false);
const total = ref(0);
const activeGroupId = ref('all');
const pagination = reactive({ page: 1, size: 10 });
const filters = ref({});

// --- 筛选栏选项配置 ---

// 【修改点】分类选项保持从字典API动态获取
const categoryOptions = ref([]);

// 【修改点】题型选项 - 修改为静态数据
const typeOptions = ref([
  { label: '单选题', value: '单选' },
  { label: '多选题', value: '多选' },
  { label: '填空题', value: '填空' },
  { label: '判断题', value: '判断' },
  { label: '解答题', value: '解答' }
]);

// 【修改点】难度选项 - 修改为静态数据
const difficultyOptions = ref([
  { label: '高', value: 0 },
  { label: '中', value: 1 },
  { label: '低', value: 2 }
]);

const questionFilterFields = ref([
  { type: 'input', model: 'id', placeholder: '序号' },
  { type: 'input', model: 'title', placeholder: '题目' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { type: 'select', model: 'questionType', placeholder: '题型', options: typeOptions },
  { type: 'select', model: 'questionCategory', placeholder: '分类', options: categoryOptions },
  { type: 'select', model: 'difficulty', placeholder: '难度', options: difficultyOptions },
]);

const createOptions = ref([
  { label: '手动新增', value: 'manual' },
]);

// --- 编辑弹窗的状态 ---
const dialogVisible = ref(false);
const formRef = ref(null);
const showAnalysis = ref(false);
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
const rules = reactive({});

// --- API 调用与事件处理 ---
const fetchDictOptions = async (dictType, optionsRef) => {
  try {
    const res = await getDictByType(dictType);
    if (res.code === 200 && res.data) {
      optionsRef.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue
      }));
      console.log(`字典[${dictType}]加载成功:`, optionsRef.value);
    } else {
      console.warn(`字典[${dictType}]响应成功但无数据:`, res);
    }
  } catch (error) {
    ElMessage.error(`获取“${dictType}”字典失败`);
    console.error(`获取字典[${dictType}]失败:`, error);
  }
};

const fetchGroups = async () => {
  try {
    const res = await getQuestionGroupList();
    if (res.code === 200 && res.data) {
      groupList.value = res.data;
    }
  } catch (error) {
    ElMessage.error('获取分组列表失败');
  }
};

const formatDifficulty = (difficultyValue) => {
  if (difficultyValue === 0) return '高';
  if (difficultyValue === 1) return '中';
  if (difficultyValue === 2) return '低';
  return '未知';
};

// 【修改点】修复筛选功能的核心逻辑
const fetchQuestions = async () => {
  tableLoading.value = true;

  // 1. 创建一个干净的参数副本, 过滤掉所有空值 (null, undefined, '')
  const cleanFilters = {};
  for (const key in filters.value) {
    const value = filters.value[key];
    if (value !== null && value !== undefined && value !== '') {
      cleanFilters[key] = value;
    }
  }

  // 2. 对特定字段进行手动类型转换
  if (cleanFilters.difficulty) {
    cleanFilters.difficulty = Number(cleanFilters.difficulty);
  }
  if (cleanFilters.id) {
    cleanFilters.id = Number(cleanFilters.id);
  }

  try {
    const params = {
      groupId: activeGroupId.value === 'all' ? null : activeGroupId.value,
      page: pagination.page,
      size: pagination.size,
      ...cleanFilters // 3. 使用清洗和转换后的参数
    };
    console.log('向API发送的最终参数:', params);
    const res = await getQuestionList(params);
    if (res.code === 200 && res.data) {
      const getGroupNameById = (groupId) => {
        if (!groupId && groupId !== 0) return '未分组';
        const group = groupList.value.find(g => g.id == groupId);
        return group ? group.name : `分组${groupId}`;
      };
      tableData.value = res.data.records.map(item => ({
        id: item.id,
        title: item.title,
        type: item.questionType,
        category: item.questionCategory,
        group: getGroupNameById(item.groupId),
        difficulty: item.difficulty,
        creator: item.creator,
        creationTime: item.createTime,
      }));
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error('获取题目列表失败');
  } finally {
    tableLoading.value = false;
  }
};

const handleGroupSelect = (index) => {
  activeGroupId.value = index;
  pagination.page = 1;
  fetchQuestions();
};

const handleAddGroup = () => {
  ElMessageBox.prompt('请输入新分组的名称', '新增分组', { confirmButtonText: '确定', cancelButtonText: '取消' })
    .then(async ({ value }) => { await addQuestionGroup(value); ElMessage.success('新增分组成功！'); fetchGroups(); }).catch(() => { });
};

const handleDeleteGroup = (group) => {
  ElMessageBox.confirm(`确定要删除分组 "${group.name}" 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteQuestionGroup(group.id);
      ElMessage.success('删除成功！');
      if (activeGroupId.value === group.id.toString()) {
        activeGroupId.value = 'all';
      }
      fetchGroups();
      fetchQuestions();
    }).catch(() => { });
};

const handleGroupDropdownCommand = (command, group) => {
  if (command === 'edit') { handleEditGroup(group); }
  else if (command === 'delete') { handleDeleteGroup(group); }
};

const handleEditGroup = (group) => {
  ElMessageBox.prompt('请输入新的分组名称', '编辑分组', {
    confirmButtonText: '确定', cancelButtonText: '取消', inputValue: group.name,
    inputValidator: (value) => { if (!value || value.trim() === '') { return '分组名称不可为空'; } return true; }
  }).then(async ({ value }) => {
    try { await updateQuestionGroup({ id: group.id, name: value.trim() }); ElMessage.success('修改分组成功！'); fetchGroups(); }
    catch (error) { ElMessage.error('修改分组失败'); }
  }).catch(() => { });
};

const handleFilterQuestions = (filterData) => {
  filters.value = filterData;
  pagination.page = 1;
  fetchQuestions();
};

const handleCreateQuestion = (command) => {
  if (command === 'manual') {
    const query = {};
    if (activeGroupId.value && activeGroupId.value !== 'all') {
      query.groupId = activeGroupId.value;
    }
    router.push({ path: '/teaching-center/question/manual-add', query });
  } else {
    ElMessage.info(`'${command}' 功能待开发`);
  }
};

const handleEditQuestion = async (row) => {
  try {
    const res = await getQuestionDetail(row.id);
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
      } else {
        let parsedOptions = [];
        try {
          parsedOptions = JSON.parse(data.details || '[]');
        } catch (e) { console.error("解析options失败", e); }

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
      dialogVisible.value = true;
    } else {
      ElMessage.error(res.msg || '获取题目详情失败');
    }
  } catch (error) { ElMessage.error('获取题目详情失败'); }
};

const handleSubmit = async () => {
  let finalAnswer = '';
  if (questionForm.questionType === '多选') {
    const correctAnswers = [];
    questionForm.options.forEach(opt => { if (opt.isCorrect) correctAnswers.push(opt.value); });
    finalAnswer = correctAnswers.join('#@#');
  } else {
    finalAnswer = questionForm.answer;
  }

  const detailsForBackend = JSON.stringify(questionForm.options.map(uiOpt => ({
    option: uiOpt.value,
    value: uiOpt.text
  })));

  try {
    const dataToSubmit = {
      id: questionForm.id,
      title: questionForm.title,
      questionType: questionForm.questionType,
      questionCategory: questionForm.questionCategory,
      groupId: questionForm.groupId,
      difficulty: questionForm.difficulty,
      analysis: showAnalysis.value ? questionForm.analysis : '',
      details: detailsForBackend,
      answer: finalAnswer,
    };
    await updateQuestion(dataToSubmit);
    ElMessage.success('修改成功！');
    dialogVisible.value = false;
    fetchQuestions();
  } catch (error) {
    ElMessage.error('修改失败');
  }
};

const addOption = () => {
  const nextChar = String.fromCharCode(65 + questionForm.options.length);
  questionForm.options.push({ value: nextChar, text: '', isCorrect: false });
};

const removeOption = (index) => {
  questionForm.options.splice(index, 1);
};

const handleDropdownCommand = (command, row) => {
  if (command === 'delete') {
    handleDeleteQuestion(row);
  }
};

const handleDeleteQuestion = (row) => {
  ElMessageBox.confirm('确定要删除该试题吗？', '删除提示', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    .then(async () => {
      try { await deleteQuestion(row.id); ElMessage.success('删除成功！'); fetchQuestions(); }
      catch (error) { ElMessage.error('删除失败'); }
    }).catch(() => { });
};

// 【修改点】移除不再需要的API调用
onMounted(async () => {
  await fetchGroups();
  // 只保留获取“分类”的 API 请求
  await Promise.all([
    fetchDictOptions('question_category', categoryOptions),
  ]);
  fetchQuestions();
});

watch(() => [pagination.page, pagination.size], () => {
  fetchQuestions();
});
</script>

<style scoped>
.page-container {
  height: 100vh;
  background-color: #ffffff;
}

.left-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e6e6e6;
  padding-top: 20px;
}

.group-menu {
  border-right: none;
}

.group-menu .el-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  line-height: 40px;
}

.group-menu .el-menu-item .group-name {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-menu .el-menu-item .group-more-btn {
  visibility: hidden;
  cursor: pointer;
  margin-left: 10px;
  color: #909399 !important;
  padding: 2px 4px !important;
}

.group-menu .el-menu-item:hover .group-more-btn {
  visibility: visible;
}

.group-menu .el-menu-item .group-more-btn:hover {
  color: #409eff !important;
}

.el-menu-item.is-active {
  color: #409eff !important;
  background-color: #ecf5ff !important;
  font-weight: bold;
}

.add-group-btn-wrapper {
  margin-top: auto;
  padding: 20px 15px;
}

.add-group-btn {
  width: 100%;
}

.right-panel {
  padding: 20px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
}

.el-table {
  margin-top: 20px;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.more-btn {
  padding: 4px 8px !important;
  color: #909399 !important;
}

.more-btn:hover {
  color: #409eff !important;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.delete-option-btn {
  margin-left: 10px;
}
</style>2