<template>
  <el-container class="page-container">
    <el-aside width="220px" class="left-panel">
      <el-menu :default-active="activeGroupId" class="group-menu" @select="handleGroupSelect">
        <!-- <el-menu-item index="all">
          <span>全部</span>
        </el-menu-item> -->
        <el-menu-item v-for="group in groupList" :key="group.id" :index="group.id.toString()">
          <span class="group-name">{{ group.name }}</span>
          <el-dropdown 
            v-if="group.name !== '全部' && group.name !== '未分组'" 
            @command="(command) => handleGroupDropdownCommand(command, group)" 
            @click.stop
          >
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
      <div v-if="selectedRows.length > 0" style="margin: 10px 0;">
        <el-button type="warning" @click="handleBatchAbandon">
          批量废弃 ({{ selectedRows.length }})
        </el-button>
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
          :disabled="deletableCount === 0"
        >
          批量删除 ({{ deletableCount }})
          <span v-if="abandonedCount > 0" style="color: #909399; font-size: 12px;">
            / 跳过{{ abandonedCount }}条废弃
          </span>
        </el-button>
      </div>
      <el-table v-loading="tableLoading" :data="tableData" style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        :row-class-name="({ row }) => row.abandoned === 1 ? 'abandoned-row' : ''"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="序号" width="100" />
        <el-table-column prop="title" label="题目">
          <template #default="scope">
            <div :class="{ 'abandoned-question': scope.row.abandoned === 1 }">
              <el-link 
                :type="scope.row.abandoned === 1 ? 'info' : 'primary'" 
                :underline="false" 
                @click="scope.row.abandoned === 1 ? handleAbandonedClick() : handleEditQuestion(scope.row)"
                :class="{ 'abandoned-link': scope.row.abandoned === 1, 'disabled-link': scope.row.abandoned === 1 }"
                :style="{ cursor: scope.row.abandoned === 1 ? 'not-allowed' : 'pointer' }"
              >
                {{ scope.row.title }}
              </el-link>
              <el-tag v-if="scope.row.abandoned === 1" type="warning" size="small" style="margin-left: 8px;">
                已废弃
              </el-tag>
            </div>
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
        <el-table-column prop="creatorName" label="创建人" width="100" />
        <el-table-column prop="creationTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              link 
              :type="scope.row.abandoned === 1 ? 'info' : 'primary'" 
              size="small" 
              :disabled="scope.row.abandoned === 1"
              @click="scope.row.abandoned === 1 ? handleAbandonedClick() : handleEditQuestion(scope.row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleDropdownCommand(command, scope.row)">
              <el-button link size="small" class="more-btn">
                <el-icon>
                  <More />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="scope.row.abandoned !== 1" command="abandon">废弃</el-dropdown-item>
                  <el-dropdown-item v-if="scope.row.abandoned === 1" command="restore">恢复</el-dropdown-item>
                  <el-dropdown-item v-if="scope.row.abandoned !== 1" command="delete">删除</el-dropdown-item>
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
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount, shallowRef, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Delete, More } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { uploadFiles } from '@/api/common/UploadFiles.js';
import { previewFile } from '@/api/common/PreviewFile.js';

import {
  getQuestionGroupList,
  addQuestionGroup,
  deleteQuestionGroup,
  updateQuestionGroup,
  getQuestionList,
  updateQuestion,
  getQuestionDetail,
  deleteQuestion,
  abandonQuestion,
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
const selectedRows = ref([]); // 选中的行

// 计算可删除的题目数量
const deletableCount = computed(() => {
  return selectedRows.value.filter(row => row.abandoned !== 1).length;
});

// 计算废弃题目数量
const abandonedCount = computed(() => {
  return selectedRows.value.filter(row => row.abandoned === 1).length;
});

// 富文本编辑器相关
const analysisEditorRef = shallowRef();
const analysisToolbarRef = ref();
const analysisEditor = shallowRef();

// --- 筛选栏选项配置 ---

// 【修改点】分类选项保持从字典API动态获取
const categoryOptions = ref([]);

// 【修改点】题型选项 - 修改为静态数据
const typeOptions = ref([
  { label: '单选题', value: '单选' },
  { label: '多选题', value: '多选' },
  { label: '填空题', value: '填空' },
  { label: '判断题', value: '判断' },
  { label: '论述题', value: '论述' }
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
  { type: 'input', model: 'creatorName', placeholder: '创建人' },
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
      // 将 API 返回的 questionCategory 映射为可读标签
      const getCategoryLabel = (categoryValue) => {
        if (categoryValue === null || categoryValue === undefined || categoryValue === '') return '未分类';
        // categoryOptions 存储为 { label, value }
        const found = categoryOptions.value.find(opt => String(opt.value) === String(categoryValue));
        return found ? found.label : String(categoryValue);
      };
      const getGroupNameById = (groupId) => {
        if (!groupId && groupId !== 0) return '未分组';
        const group = groupList.value.find(g => g.id == groupId);
        return group ? group.name : `分组${groupId}`;
      };
      tableData.value = res.data.records.map(item => ({
        id: item.id,
        title: item.title,
        type: item.questionType,
        category: getCategoryLabel(item.questionCategory),
        group: getGroupNameById(item.groupId),
        difficulty: item.difficulty,
        creatorName: item.creatorName,
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

// 处理废弃题目的点击
const handleAbandonedClick = () => {
  ElMessage.warning('已废弃的题目无法编辑，请先恢复题目');
};

const handleEditQuestion = async (row) => {
  // 检查题目是否已废弃
  if (row.abandoned === 1) {
    ElMessage.warning('已废弃的题目无法编辑，请先恢复题目');
    return;
  }
  
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
          { value: '0', text: '正确' },
          { value: '1', text: '错误' }
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

        if (questionForm.questionType === '单选' || questionForm.questionType === '填空') {
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
  let detailsForBackend = '';
  
  if (questionForm.questionType === '多选') {
    const correctAnswers = [];
    questionForm.options.forEach(opt => { if (opt.isCorrect) correctAnswers.push(opt.value); });
    finalAnswer = correctAnswers.join('#@#');
    detailsForBackend = JSON.stringify(questionForm.options.map(uiOpt => ({
      option: uiOpt.value,
      value: uiOpt.text
    })));
  } else if (questionForm.questionType === '单选') {
    finalAnswer = questionForm.answer;
    detailsForBackend = JSON.stringify(questionForm.options.map(uiOpt => ({
      option: uiOpt.value,
      value: uiOpt.text
    })));
  } else if (questionForm.questionType === '判断') {
    finalAnswer = questionForm.answer;
    detailsForBackend = ''; // 判断题不需要details
  } else {
    finalAnswer = questionForm.answer;
    detailsForBackend = '';
  }

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
  } else if (command === 'abandon') {
    handleAbandonQuestion(row);
  } else if (command === 'restore') {
    handleRestoreQuestion(row);
  }
};

const handleDeleteQuestion = (row) => {
  // 检查题目是否已废弃
  if (row.abandoned === 1) {
    ElMessage.warning('已废弃的题目无法删除，请先恢复题目');
    return;
  }
  
  ElMessageBox.confirm('确定要删除该试题吗？', '删除提示', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    .then(async () => {
      try { await deleteQuestion(row.id); ElMessage.success('删除成功！'); fetchQuestions(); }
      catch (error) { ElMessage.error('删除失败'); }
    }).catch(() => { });
};

const handleAbandonQuestion = (row) => {
  ElMessageBox.confirm('确定要废弃该试题吗？废弃后题目将以灰色显示。', '废弃提示', { 
    type: 'warning', 
    confirmButtonText: '废弃', 
    cancelButtonText: '取消' 
  })
    .then(async () => {
      try { 
        await abandonQuestion(row.id, 1); 
        ElMessage.success('废弃成功！'); 
        // 更新本地数据状态而不是重新获取
        row.abandoned = 1;
      }
      catch (error) { 
        console.error('废弃失败:', error);
        ElMessage.error('废弃失败'); 
      }
    }).catch(() => { });
};

const handleRestoreQuestion = (row) => {
  ElMessageBox.confirm('确定要恢复该试题吗？', '恢复提示', { 
    type: 'info', 
    confirmButtonText: '恢复', 
    cancelButtonText: '取消' 
  })
    .then(async () => {
      try { 
        await abandonQuestion(row.id, 0); 
        ElMessage.success('恢复成功！'); 
        // 更新本地数据状态
        row.abandoned = 0;
      }
      catch (error) { 
        console.error('恢复失败:', error);
        ElMessage.error('恢复失败'); 
      }
    }).catch(() => { });
};

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 批量废弃
const handleBatchAbandon = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要废弃的试题');
    return;
  }

  ElMessageBox.confirm(
    `确定要废弃选中的 ${selectedRows.value.length} 条试题吗？废弃后题目将以灰色显示。`, 
    '批量废弃确认', 
    { 
      type: 'warning', 
      confirmButtonText: '确定废弃', 
      cancelButtonText: '取消' 
    }
  ).then(async () => {
    try {
      // 收集所有要废弃的试题ID
      const abandonPromises = selectedRows.value.map(row => abandonQuestion(row.id, 1));
      
      // 并发执行所有废弃操作
      await Promise.all(abandonPromises);
      
      // 更新本地数据状态
      selectedRows.value.forEach(row => {
        row.abandoned = 1;
      });
      
      ElMessage.success(`成功废弃 ${selectedRows.value.length} 条试题！`);
      selectedRows.value = [];
    } catch (error) {
      console.error('批量废弃失败:', error);
      ElMessage.error('批量废弃失败，请重试');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的试题');
    return;
  }

  // 过滤出可以删除的题目（非废弃状态）
  const deletableRows = selectedRows.value.filter(row => row.abandoned !== 1);
  const abandonedRows = selectedRows.value.filter(row => row.abandoned === 1);

  if (deletableRows.length === 0) {
    ElMessage.warning('所选题目均为已废弃状态，无法删除');
    return;
  }

  let confirmMessage = `确定要删除选中的 ${deletableRows.length} 条试题吗？此操作不可恢复！`;
  if (abandonedRows.length > 0) {
    confirmMessage += `\n注意：已跳过 ${abandonedRows.length} 条废弃题目`;
  }

  ElMessageBox.confirm(
    confirmMessage, 
    '批量删除确认', 
    { 
      type: 'warning', 
      confirmButtonText: '确定删除', 
      cancelButtonText: '取消' 
    }
  ).then(async () => {
    try {
      // 收集所有要删除的试题ID（仅非废弃题目）
      const deletePromises = deletableRows.map(row => deleteQuestion(row.id));
      
      // 并发执行所有删除操作
      await Promise.all(deletePromises);
      
      ElMessage.success(`成功删除 ${deletableRows.length} 条试题！${abandonedRows.length > 0 ? `已跳过 ${abandonedRows.length} 条废弃题目。` : ''}`);
      selectedRows.value = [];
      fetchQuestions();
    } catch (error) {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败，请重试');
    }
  }).catch(() => {
    // 用户取消操作
  });
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

/* 废弃题目样式 */
.abandoned-question {
  opacity: 0.6;
}

.abandoned-link {
  text-decoration: line-through !important;
  color: #909399 !important;
}

.abandoned-link:hover {
  color: #606266 !important;
}

.disabled-link {
  pointer-events: none !important;
  cursor: not-allowed !important;
}

/* 废弃行样式 */
:deep(.abandoned-row) {
  background-color: #fafafa !important;
  opacity: 0.7;
}

:deep(.abandoned-row td) {
  color: #909399 !important;
}

/* 默认插入图片的显示比例（无内联样式时生效），用户通过编辑器工具栏更改样式会覆盖 */
:deep(.w-e-text-container img) {
  width: 50%;
  height: auto;
  max-width: none;
}
</style>2