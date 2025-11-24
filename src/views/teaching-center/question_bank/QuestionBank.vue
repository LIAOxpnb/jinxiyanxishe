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
        @create="handleCreateQuestion" @filter="handleFilterQuestions" @field-change="handleFieldChange" />
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
        <el-table-column prop="id" label="序号" width="110" align="center" show-overflow-tooltip />
        <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip>
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
        <el-table-column prop="type" label="题型" min-width="80" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" min-width="100" show-overflow-tooltip />
        <el-table-column prop="group" label="试题分组" min-width="100" show-overflow-tooltip />
        <el-table-column prop="difficulty" label="难度" width="80" align="center">
          <template #default="scope">
            <span>{{ formatDifficulty(scope.row.difficulty) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建人" min-width="100" align="center" show-overflow-tooltip />
        <el-table-column prop="creationTime" label="创建时间" width="160" show-overflow-tooltip />
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
                
                :defaultConfig="analysisEditorConfig"
                mode="default"
                @onCreated="handleAnalysisCreated"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="题目详情" prop="details">
          <el-radio-group v-model="showDetails">
            <el-radio :label="false">无详情</el-radio>
            <el-radio :label="true">设置详情</el-radio>
          </el-radio-group>
          <div v-if="showDetails" style="margin-top: 10px;">
            <div style="border: 1px solid #ccc; width: 450px;">
              <Toolbar
                ref="detailsToolbarRef"
                style="border-bottom: 1px solid #ccc"
                :editor="detailsEditor"
                :defaultConfig="{}"
                mode="default"
              />
              <Editor
                ref="detailsEditorRef"
                v-model="questionForm.details"
                
                :defaultConfig="detailsEditorConfig"
                mode="default"
                @onCreated="handleDetailsCreated"
              />
              <!-- style="min-height: 330px; max-height: 300px; overflow-y: auto;" -->
            </div>
          </div>
        </el-form-item>
        <el-form-item label="附件上传" v-if="['论述', '简答'].includes(questionForm.questionType)">
          <el-upload
            ref="attachmentUploadRef"
            :file-list="attachmentFileList"
            :before-upload="beforeAttachmentUpload"
            :on-change="handleAttachmentChange"
            :on-remove="handleAttachmentRemove"
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          >
            <el-button type="primary" size="small">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 pdf、doc、docx、xls、xlsx 格式，文件大小不超过100MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="batchImportDialogVisible" title="批量导入" width="800px" :before-close="handleBatchImportDialogClose">
      <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 20px;">
          第一步：上传前请先下载模板，按照模板标准要求内容填入到模板中
        </div>
        
        <div style="margin-bottom: 20px;">
          <el-button type="primary" @click="downloadTemplate">下载模板</el-button>
        </div>

        <div style="margin-bottom: 10px;">
          第二步：上传文件
        </div>

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :limit="1"
          accept=".xlsx,.xls"
          drag
          style="width: 100%;"
        >
          <div class="upload-content">
            <el-icon class="upload-icon" style="font-size: 67px; color: #c0c4cc; margin: 40px 0 16px;">
              <Upload />
            </el-icon>
            <div class="upload-text" style="color: #606266; font-size: 14px;">点击或拖拽文件到此处上传</div>
          </div>
        </el-upload>

        <div v-if="importResult" style="margin-top: 10px; color: #f56c6c; font-size: 14px;">
          正确数 {{ importResult.successCount }}，错误数 {{ importResult.errorCount }}，
          <a 
            v-if="importResult.errorCount > 0 && importResult.errorFileUrl" 
            href="#" 
            @click.prevent="downloadErrorResult" 
            style="color: #409eff; text-decoration: underline;"
          >
            下载结果
          </a>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleBatchImportDialogClose">取消</el-button>
        <el-button type="primary" @click="handleBatchImportSubmit" :loading="batchImportLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount, shallowRef, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Delete, More, Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { uploadFiles } from '@/api/common/UploadFiles.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import { removeOuterPTag } from '@/utils/richTextHelper.js';

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
  downloadQuestionTemplate,
  uploadQuestionTemplate,
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

// 批量导入相关
const batchImportDialogVisible = ref(false);
const uploadRef = ref();
const batchImportLoading = ref(false);
const importFile = ref(null);
const importResult = ref(null); // 导入结果

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

const detailsEditorRef = shallowRef();
const detailsToolbarRef = ref();
const detailsEditor = shallowRef();

// 附件上传相关
const attachmentUploadRef = ref();
const attachmentFileList = ref([]);

// --- 筛选栏选项配置 ---

// 【修改点】分类选项保持从字典API动态获取
const categoryOptions = ref([]);

// 试题分组选项
const groupOptions = ref([]);

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
  { type: 'select', model: 'groupId', placeholder: '试题分组', options: groupOptions },
  { type: 'select', model: 'difficulty', placeholder: '难度', options: difficultyOptions },
]);

const createOptions = ref([
  { label: '手动新增', value: 'manual' },
  { label: '批量导入', value: 'batch-import' },
  { label: 'AI新增', value: 'ai' }
]);

// --- 编辑弹窗的状态 ---
const dialogVisible = ref(false);
const formRef = ref(null);
const showAnalysis = ref(false);
const showDetails = ref(false);
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
  fileName: '',
  filePath: '',
});
const rules = reactive({});

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

// 富文本编辑器配置
const analysisEditorConfig = {
  placeholder: '请输入解析内容...',
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

// details 富文本编辑器配置
const detailsEditorConfig = {
  placeholder: '请输入题目详情...',
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
      // 同时更新筛选条件的分组选项
      groupOptions.value = res.data.map(item => ({ label: item.name, value: item.id }));
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
  // 找到对应的分组，检查是否是"全部"或"未分组"
  const selectedGroup = groupList.value.find(g => g.id == index);
  let groupIdValue = '';
  if (selectedGroup) {
    if (selectedGroup.name === '全部') {
      groupIdValue = '';
    } else {
      groupIdValue = selectedGroup.id;
    }
  }
  
  // 同步更新筛选条件中的 groupId
  filters.value.groupId = groupIdValue;
  
  // 同步更新筛选字段的 defaultValue，让 FilterBar 组件自动更新
  const groupIdField = questionFilterFields.value.find(f => f.model === 'groupId');
  if (groupIdField) {
    groupIdField.defaultValue = groupIdValue;
  }
  
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

// 同步左侧菜单和筛选栏的分组选择
const syncGroupSelection = (groupId) => {
  if (groupId !== null && groupId !== undefined && groupId !== '') {
    // 筛选条件中有 groupId，找到对应的分组
    const selectedGroup = groupList.value.find(g => g.id == groupId);
    if (selectedGroup) {
      // 更新左侧菜单的选中状态
      activeGroupId.value = selectedGroup.id.toString();
    }
  } else {
    // 筛选条件中没有 groupId，设置为 'all'（全部）
    activeGroupId.value = 'all';
  }
};

const handleFieldChange = (fieldModel, value, filterData) => {
  // 当 groupId 字段变化时，立即同步左侧菜单和筛选字段的 defaultValue
  if (fieldModel === 'groupId') {
    syncGroupSelection(value);
    // 更新筛选字段的 defaultValue，保持一致性
    const groupIdField = questionFilterFields.value.find(f => f.model === 'groupId');
    if (groupIdField) {
      groupIdField.defaultValue = value || '';
    }
  }
};

const handleFilterQuestions = (filterData) => {
  filters.value = filterData;
  pagination.page = 1;
  // 同步更新左侧菜单的选中状态
  syncGroupSelection(filterData.groupId);
  fetchQuestions();
};

const handleCreateQuestion = (command) => {
  if (command === 'manual') {
    const query = {};
    if (activeGroupId.value && activeGroupId.value !== 'all') {
      query.groupId = activeGroupId.value;
    }
    router.push({ path: '/teaching-center/question/manual-add', query });
  } else if (command === 'batch-import') {
    // 批量导入
    batchImportDialogVisible.value = true;
  } else if (command === 'ai') {
    // AI生成 - 跳转到AI生成页面
    const query = {};
    if (activeGroupId.value && activeGroupId.value !== 'all') {
      query.groupId = activeGroupId.value;
    }
    router.push({ path: '/teaching-center/question/ai-generate', query });
  } else {
    ElMessage.info(`'${command}' 功能待开发`);
  }
};

// 处理废弃题目的点击
const handleAbandonedClick = () => {
  ElMessage.warning('已废弃的题目无法编辑，请先恢复题目');
};

// 将HTML内容中的图片路径转换为预览URL
const convertImagesToPreviewUrls = async (htmlContent) => {
  if (!htmlContent) return '';
  
  // 使用DOMParser解析HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  
  // 收集所有需要转换的图片
  const imagePromises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src) return;
    
    // 跳过base64图片
    if (src.startsWith('data:')) return;
    
    try {
      // 如果是完整的URL（MinIO临时URL），需要提取相对路径
      let relativePath = src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        // 从完整URL中提取路径部分
        // 例如: http://183.230.195.24:7028/joyas/20251104/u4436%282%29.png?X-Amr-... 
        // 需要提取出: /20251104/u4436(2).png (去掉bucket名称 joyas)
        const url = new URL(src);
        let pathname = decodeURIComponent(url.pathname); // 得到 /joyas/20251104/u4436(2).png
        
        // 去掉第一个路径段（bucket名称）
        // /joyas/20251104/u4436(2).png => /20251104/u4436(2).png
        const pathParts = pathname.split('/').filter(p => p); // ['joyas', '20251104', 'u4436(2).png']
        if (pathParts.length > 1) {
          relativePath = '/' + pathParts.slice(1).join('/'); // /20251104/u4436(2).png
        } else {
          relativePath = pathname;
        }
      }
      
      console.log('调用预览接口，fileName:', relativePath);
      // 调用预览接口获取新的临时URL
      const previewUrl = await previewFile(relativePath);
      img.setAttribute('src', previewUrl);
    } catch (error) {
      console.error('预览图片失败:', src, error);
    }
  });
  
  // 等待所有图片路径转换完成
  await Promise.all(imagePromises);
  
  // 返回转换后的HTML
  return doc.body.innerHTML;
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
      
      // 处理解析内容中的图片预览
      if (data.analysis) {
        questionForm.analysis = await convertImagesToPreviewUrls(data.analysis);
      } else {
        questionForm.analysis = '';
      }

      if (data.questionType === '判断') {
        questionForm.options = [
          { value: '0', text: '正确' },
          { value: '1', text: '错误' }
        ];
        questionForm.answer = data.answer;
        questionForm.details = ''; // 判断题不使用 details 作为富文本
      } else if (data.questionType === '填空') {
        // 填空题直接设置答案
        questionForm.answer = data.answer;
        questionForm.options = [];
        // 转换填空题详情中的图片URL
        if (data.details) {
          questionForm.details = await convertImagesToPreviewUrls(data.details);
        } else {
          questionForm.details = '';
        }
      } else if (data.questionType === '论述' || data.questionType === '简答') {
        // 论述题和简答题的 details 是富文本内容，需要转换图片URL
        if (data.details) {
          questionForm.details = await convertImagesToPreviewUrls(data.details);
        } else {
          questionForm.details = '';
        }
        questionForm.options = [];
        questionForm.answer = data.answer || '';
        // 加载附件信息
        questionForm.fileName = data.fileName || '';
        questionForm.filePath = data.filePath || '';
        if (data.fileName && data.filePath) {
          attachmentFileList.value = [{
            name: data.fileName,
            url: data.filePath,
            uid: Date.now()
          }];
        } else {
          attachmentFileList.value = [];
        }
      } else {
        // 单选、多选题的 details 是选项的 JSON 数据
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
        questionForm.details = ''; // 单选、多选题不使用 details 作为富文本
      }

      showAnalysis.value = !!data.analysis;
      showDetails.value = !!(data.questionType === '论述' || data.questionType === '简答') && !!data.details;
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
    // 多选题的 details 存储选项 JSON
    detailsForBackend = JSON.stringify(questionForm.options.map(uiOpt => ({
      option: uiOpt.value,
      value: uiOpt.text
    })));
  } else if (questionForm.questionType === '单选') {
    finalAnswer = questionForm.answer;
    // 单选题的 details 存储选项 JSON
    detailsForBackend = JSON.stringify(questionForm.options.map(uiOpt => ({
      option: uiOpt.value,
      value: uiOpt.text
    })));
  } else if (questionForm.questionType === '论述' || questionForm.questionType === '简答') {
    // 论述题和简答题的 details 存储富文本内容
    finalAnswer = questionForm.answer;
    detailsForBackend = showDetails.value ? removeOuterPTag(questionForm.details) : '';
  } else if (questionForm.questionType === '判断') {
    finalAnswer = questionForm.answer;
    detailsForBackend = ''; // 判断题不需要details
  } else {
    // 其他题型（填空）
    finalAnswer = questionForm.answer;
    detailsForBackend = questionForm.questionType === '填空' && showDetails.value 
      ? removeOuterPTag(questionForm.details) 
      : '';
  }

  try {
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
    
    // 如果是论述题或简答题，添加附件信息
    if (questionForm.questionType === '论述' || questionForm.questionType === '简答') {
      dataToSubmit.fileName = questionForm.fileName || '';
      dataToSubmit.filePath = questionForm.filePath || '';
    }
    
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

const handleDetailsCreated = (editor) => {
  detailsEditor.value = editor;
};

// 附件上传相关函数
const beforeAttachmentUpload = (file) => {
  const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const isValidType = validExtensions.includes(fileExtension);
  const isValidSize = file.size / 1024 / 1024 < 100; // 100MB

  if (!isValidType) {
    ElMessage.error('只能上传 pdf、doc、docx、xls、xlsx 格式的文件!');
    return false;
  }
  if (!isValidSize) {
    ElMessage.error('文件大小不能超过 100MB!');
    return false;
  }
  return true;
};

const handleAttachmentChange = async (uploadFile) => {
  if (!uploadFile.raw) return;
  
  try {
    const response = await uploadFiles([uploadFile.raw]);
    if (response.code === 200) {
      questionForm.fileName = uploadFile.name;
      questionForm.filePath = response.data;
      attachmentFileList.value = [{
        name: uploadFile.name,
        url: response.data,
        uid: uploadFile.uid
      }];
      ElMessage.success('附件上传成功');
    } else {
      ElMessage.error(response.msg || '附件上传失败');
      attachmentFileList.value = [];
    }
  } catch (error) {
    console.error('附件上传错误:', error);
    ElMessage.error('附件上传失败');
    attachmentFileList.value = [];
  }
};

const handleAttachmentRemove = () => {
  questionForm.fileName = '';
  questionForm.filePath = '';
  attachmentFileList.value = [];
  ElMessage.success('附件已移除');
};

// 组件销毁前清理编辑器
onBeforeUnmount(() => {
  const editor = analysisEditor.value;
  if (editor == null) return;
  editor.destroy();
  
  const detailsEditorInstance = detailsEditor.value;
  if (detailsEditorInstance == null) return;
  detailsEditorInstance.destroy();
});

watch(() => [pagination.page, pagination.size], () => {
  fetchQuestions();
});

// 文件变化处理
const handleFileChange = (uploadFile) => {
  importFile.value = uploadFile.raw;
  ElMessage.success('文件上传成功！');
};

// 文件移除处理
const handleFileRemove = () => {
  importFile.value = null;
};

// 提交批量导入
const handleBatchImportSubmit = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件');
    return;
  }

  batchImportLoading.value = true;
  try {
    // 创建表单数据
    const formData = new FormData();
    formData.append('file', importFile.value);
    // 根据API文档，参数名称是examId
    if (activeGroupId.value && activeGroupId.value !== 'all') {
      formData.append('examId', activeGroupId.value);
    }
    
    // 调用批量导入API
    const response = await uploadQuestionTemplate(formData);

    if (response.code === 200) {
      // 保存导入结果
      importResult.value = {
        successCount: response.data?.successCount || 0,
        errorCount: response.data?.errorCount || 0,
        errorFileUrl: response.data?.errorFileUrl || null
      };
      
      ElMessage.success(`批量导入成功！`);
      
      // 如果全部成功，延迟关闭对话框并刷新列表
      if (importResult.value.errorCount === 0) {
        setTimeout(() => {
          handleBatchImportDialogClose();
          fetchQuestions();
        }, 1500);
      } else {
        // 有错误时刷新列表但不关闭对话框，让用户可以下载错误结果
        fetchQuestions();
      }
    } else {
      ElMessage.error(response.msg || '导入失败');
    }
  } catch (error) {
    console.error('批量导入错误:', error);
    ElMessage.error('批量导入失败');
  } finally {
    batchImportLoading.value = false;
  }
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await downloadQuestionTemplate();
    
    // 创建blob对象
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '试题导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('模板下载成功');
  } catch (error) {
    console.error('下载模板失败:', error);
    ElMessage.error('下载模板失败');
  }
};

// 关闭批量导入对话框
const handleBatchImportDialogClose = () => {
  batchImportDialogVisible.value = false;
  importFile.value = null;
  importResult.value = null;
  uploadRef.value?.clearFiles();
};

// 下载错误结果
const downloadErrorResult = () => {
  if (importResult.value?.errorFileUrl) {
    window.open(importResult.value.errorFileUrl, '_blank');
  } else {
    ElMessage.warning('暂无错误结果可下载');
  }
};

</script>

<style scoped>
.page-container {
  height: calc(100vh - 64px);
  background-color: #ffffff;
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
}

.left-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e6e6e6;
  padding-top: 20px;
  flex-shrink: 0;
  width: 220px !important;
  min-width: 220px;
  max-width: 220px;
  overflow-y: auto;
  overflow-x: hidden;
}

.group-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
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
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px !important;
  font-weight: 600;
  color: #303133;
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

/* 富文本编辑器全屏样式 - 解决全屏时被弹窗遮挡的问题 */
:deep(.w-e-full-screen-container) {
  z-index: 3000 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: #fff;
}

/* 全屏模式下，移除外层div的宽度限制和边框 */
:deep(.w-e-full-screen-container) > div {
  width: 100% !important;
  border: none !important;
}

/* 全屏模式下，富文本编辑区域有滚动条，图片不限制宽度 */
:deep(.w-e-full-screen-container .w-e-text-container) {
  overflow-y: auto !important;
  overflow-x: auto !important;
}

:deep(.w-e-full-screen-container img) {
  max-width: none !important;
}
</style>