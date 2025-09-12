<template>
  <el-container class="page-container">
    <el-aside width="220px" class="left-panel">
      <el-menu :default-active="activeGroupId" class="group-menu" @select="handleGroupSelect">
        <el-menu-item index="all">
          <span>全部</span>
        </el-menu-item>
        <el-menu-item v-for="group in groupList" :key="group.id" :index="group.id.toString()">
          <span class="group-name">{{ group.name }}</span>
          <el-dropdown @command="(command) => handleGroupDropdownCommand(command, group)" @click.stop>
            <el-button link size="small" class="group-more-btn" @click.stop>
              <el-icon><More /></el-icon>
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
      <div class="sidebar-info-box">
        <div class="info-box-title">【试题分组说明】</div>
        <p>规则：将分组数据删除，需到此板块恢复；</p>
        <p>1、分组、试题均支持数据恢复；</p>
        <p>2、如果这里没有自己恢复的数据，不是自己创建的分组不可见，即使里面有曾经自己出的试题。</p>
      </div>
      <div class="add-group-btn-wrapper">
        <el-button class="add-group-btn" plain @click="handleAddGroup">+ 新增试题分组</el-button>
      </div>
    </el-aside>

    <el-main class="right-panel">
      <h1 class="page-title">题库</h1>
      <!-- <el-alert title="【新】新增三种模式：手动新增（可点击查看原型）、AI新增（可点击查看原型）、批量导入（见下方批量管理）" type="error" :closable="false" class="custom-alert"></el-alert> -->
  <FilterBar create-button-text="新增试题" :fields="questionFilterFields" :createOptions="createOptions" @create="handleCreateQuestion" @filter="handleFilterQuestions" />

      <el-table v-loading="tableLoading" :data="tableData" style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="题目">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleEditQuestion(scope.row)">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="题型" width="100" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="group" label="试题分组" width="120" />
        <el-table-column prop="difficulty" label="难度" width="80" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="creationTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEditQuestion(scope.row)">编辑</el-button>
            <el-button link type="primary" size="small">统计</el-button>
            <el-dropdown @command="(command) => handleDropdownCommand(command, scope.row)">
              <el-button link size="small" class="more-btn">
                <el-icon><More /></el-icon>
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
        <el-dropdown>
          <el-button>
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>批量删除</el-dropdown-item>
              <el-dropdown-item>批量分组</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size" :page-sizes="[10, 20, 50]" layout="total, prev, pager, next, jumper" :total="total" background></el-pagination>
      </div>
    </el-main>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%" :close-on-click-modal="false">
      <el-form :model="questionForm" label-width="80px">
        <el-form-item label="题目">
          <el-input v-model="questionForm.title" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="题型">
          <el-input v-model="questionForm.questionType" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="questionForm.questionCategory" />
        </el-form-item>
        <el-form-item label="分组ID">
          <el-input v-model="questionForm.groupId" />
        </el-form-item>
        <el-form-item label="难度">
          <el-input v-model="questionForm.difficulty" />
        </el-form-item>
         <el-form-item label="答案解析">
          <el-input v-model="questionForm.analysis" type="textarea" :rows="3" />
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
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { ArrowDown, Delete, More } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterBar from '@/components/FilterBar.vue'; // 确保您有这个子组件

import {
  getQuestionGroupList,
  addQuestionGroup,
  deleteQuestionGroup,
  updateQuestionGroup,
  getQuestionList,
  saveQuestionList,
  updateQuestion,
  getQuestionDetail,
  deleteQuestion
} from '../../api/teaching-center/QuestionBank'; // 确保路径正确

// --- 左侧分组状态 ---
const groupList = ref([]);
const activeGroupId = ref('all');

// --- 右侧表格和分页状态 ---
const tableData = ref([]);
const tableLoading = ref(false);
const total = ref(0);
const pagination = reactive({ page: 1, size: 10 });
const filters = ref({});

// --- 筛选栏配置 ---
const questionFilterFields = ref([
  { type: 'input', model: 'title', placeholder: '题目' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { type: 'select', model: 'type', placeholder: '题型', options: [ { label: '单选题', value: 'single_choice' }, { label: '多选题', value: 'multiple_choice' }, { label: '判断题', value: 'true_false' } ] },
  { type: 'select', model: 'category', placeholder: '分类', options: [ { label: '资金分析', value: 'cat_1' }, { label: '司法会计', value: 'cat_2' } ] },
  { type: 'select', model: 'difficulty', placeholder: '难度', options: [ { label: '简单', value: 'easy' }, { label: '中等', value: 'medium' }, { label: '困难', value: 'hard' } ] },
]);

// 创建按钮的下拉选项
const createOptions = ref([
  { label: '手动新增', value: 'manual' },
  { label: 'AI新增', value: 'ai' },
  { label: '批量导入', value: 'batch' }
]);

// --- 新增/编辑弹窗的状态 ---
const dialogVisible = ref(false);
const dialogMode = ref('add'); // 'add' 或 'edit'
// 可写的弹窗标题（根据不同创建模式/编辑状态调整）
const dialogTitle = ref('新增试题');
const questionForm = reactive({ // 弹窗表单的数据模型
  id: null,
  title: '',
  questionType: '',
  questionCategory: '',
  groupId: '',
  difficulty: '',
  analysis: '',
});

const router = useRouter();

// --- API 调用与事件处理 ---

// 获取左侧分组列表
const fetchGroups = async () => {
    try {
        const res = await getQuestionGroupList();
        if (res.code === 200 && res.data) { groupList.value = res.data; }
    } catch (error) { ElMessage.error('获取分组列表失败'); console.error(error); }
};

// 获取右侧题目列表
const fetchQuestions = async () => {
    tableLoading.value = true;
    try {
        const params = {
            groupId: activeGroupId.value === 'all' ? null : activeGroupId.value,
            page: pagination.page,
            size: pagination.size,
            ...filters.value
        };
        const res = await getQuestionList(params);
        if (res.code === 200 && res.data) {
            // 辅助函数：根据groupId获取分组名称
            const getGroupNameById = (groupId) => {
                if (!groupId && groupId !== 0) return '未分组';
                const group = groupList.value.find(g => g.id == groupId);
                return group ? group.name : `分组${groupId}`;
            };
            
            // 注意：这里的字段映射需要您根据 getQuestionList 的实际返回来调整
            tableData.value = res.data.records.map(item => ({
                id: item.id,
                title: item.title,
                type: item.questionType, // 假设返回的是 questionType
                category: item.questionCategory, // 假设返回的是 questionCategory
                group: getGroupNameById(item.groupId), // 将groupId转换为分组名称
                difficulty: item.difficulty,
                creator: item.creator, // 假设返回的是 creator
                creationTime: item.createTime, // 假设返回的是 createTime
            })); 
            total.value = res.data.total;
        }
    } catch (error) { ElMessage.error('获取题目列表失败'); console.error(error); }
    finally { tableLoading.value = false; }
};

// 点击左侧分组
const handleGroupSelect = (index) => {
    activeGroupId.value = index;
    pagination.page = 1; 
    fetchQuestions();
};

// 新增分组
const handleAddGroup = () => {
    ElMessageBox.prompt('请输入新分组的名称', '新增分组', { confirmButtonText: '确定', cancelButtonText: '取消' })
    .then(async ({ value }) => {
        await addQuestionGroup(value);
        ElMessage.success('新增分组成功！');
        fetchGroups();
    }).catch(() => {});
};

// 删除分组
const handleDeleteGroup = (group) => {
    ElMessageBox.confirm(`确定要删除分组 "${group.name}" 吗？`, '提示', { type: 'warning' })
    .then(async () => {
        await deleteQuestionGroup(group.id);
        ElMessage.success('删除成功！');
        // 如果删除的是当前选中的分组，则切换到“全部”
        if (activeGroupId.value === group.id.toString()) {
            activeGroupId.value = 'all';
        }
        fetchGroups();
        fetchQuestions(); // 刷新题目列表
    }).catch(() => {});
};

// 处理分组下拉菜单命令
const handleGroupDropdownCommand = (command, group) => {
  if (command === 'edit') {
    handleEditGroup(group);
  } else if (command === 'delete') {
    handleDeleteGroup(group);
  }
};

// 编辑分组
const handleEditGroup = (group) => {
  ElMessageBox.prompt('请输入新的分组名称', '编辑分组', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: group.name,
    inputValidator: (value) => {
      if (!value || value.trim() === '') {
        return '分组名称不可为空';
      }
      return true;
    }
  }).then(async ({ value }) => {
    try {
      await updateQuestionGroup({ 
        id: group.id, 
        name: value.trim() 
      });
      ElMessage.success('修改分组成功！');
      fetchGroups(); // 刷新分组列表
    } catch (error) {
      ElMessage.error('修改分组失败');
      console.error(error);
    }
  }).catch(() => {
    // 用户取消编辑
  });
};

// 点击筛选按钮
const handleFilterQuestions = (filterData) => {
    filters.value = filterData;
    pagination.page = 1;
    fetchQuestions();
};

// 新的创建入口：接收命令（'manual' | 'ai' | 'batch'）
const handleCreateQuestion = (command) => {
  if (command === 'manual') {
    // 跳转到产品指定的“手动新增”页面（产品会提供该页面）
    // 将当前分组 id 作为 query 传递，方便页面自动带入分组
    const query = {};
    if (activeGroupId.value && activeGroupId.value !== 'all') query.groupId = activeGroupId.value;
    router.push({ path: '/teaching-center/question/manual-add', query });
  } else if (command === 'ai') {
    // 跳转或打开 AI 新增 的页面/弹窗（此处简单示例为打开弹窗并预设模式）
    Object.keys(questionForm).forEach(key => { questionForm[key] = null; });
    if (activeGroupId.value !== 'all') questionForm.groupId = activeGroupId.value;
    dialogMode.value = 'add';
  dialogTitle.value = 'AI 新增试题';
  dialogVisible.value = true;
  } else if (command === 'batch') {
    // 跳转到批量导入/管理区域（如果页面下方有批量管理组件，可以跳到那里）
    // 这里我们简单滚动到表格底部，提示用户使用批量管理
    ElMessage.info('请在下方批量管理区域执行导入操作');
    // 可选：滚动到页面底部
    setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 50);
  } else {
    console.warn('未知的创建命令：', command);
  }
};

// 点击“编辑”按钮或标题
const handleEditQuestion = async (row) => {
  try {
    const res = await getQuestionDetail(row.id);
    if (res.code === 200 && res.data) {
      Object.assign(questionForm, res.data);
  dialogMode.value = 'edit';
  dialogTitle.value = '编辑试题';
  dialogVisible.value = true;
    } else {
      ElMessage.error(res.msg || '获取题目详情失败');
    }
  } catch (error) {
    ElMessage.error('获取题目详情失败');
    console.error(error);
  }
};

// 处理下拉菜单命令
const handleDropdownCommand = (command, row) => {
  if (command === 'delete') {
    handleDeleteQuestion(row);
  }
};

// 删除试题
const handleDeleteQuestion = (row) => {
  ElMessageBox.confirm('确定要删除该试题吗？', '删除提示', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    try {
      // 这里需要调用删除试题的API，假设API函数名为 deleteQuestion
      await deleteQuestion(row.id);
      ElMessage.success('删除成功！');
      fetchQuestions(); // 刷新表格数据
    } catch (error) {
      ElMessage.error('删除失败');
      console.error(error);
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 提交弹窗表单（新增或编辑）
const handleSubmit = async () => {
  try {
    if (dialogMode.value === 'add') {
      await saveQuestionList([questionForm]); // saveQuestionList 接口需要数组
      ElMessage.success('新增成功！');
    } else {
      await updateQuestion(questionForm);
      ElMessage.success('修改成功！');
    }
    dialogVisible.value = false;
    fetchQuestions(); // 刷新表格数据
  } catch (error) {
    ElMessage.error(dialogMode.value === 'add' ? '新增失败' : '修改失败');
    console.error(error);
  }
};

// --- 生命周期和监听器 ---
onMounted(() => {
  fetchGroups();
  fetchQuestions();
});
watch(pagination, () => { fetchQuestions(); });
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
.group-menu { border-right: none; }
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
.group-menu .el-menu-item .count { color: #909399; }
.el-menu-item.is-active { color: #409eff !important; background-color: #ecf5ff !important; font-weight: bold; }
.el-menu-item.is-active .count { color: #409eff !important; }
.el-menu-item:hover { background-color: #f5f7fa; }
.sidebar-info-box { margin: 20px 15px; padding: 10px 15px; border: 1px solid #f56c6c; background-color: #fff8f8; border-radius: 4px; font-size: 12px; line-height: 1.6; color: #606266; }
.info-box-title { color: #f56c6c; font-weight: bold; margin-bottom: 8px; }
.add-group-btn-wrapper { margin-top: auto; padding: 20px 15px; }
.add-group-btn { width: 100%; }

.right-panel { padding: 20px; }
.page-title { margin-top: 0; margin-bottom: 20px; font-size: 24px; }
.custom-alert { background-color: #fef0f0; color: #f56c6c; border: 1px solid #fde2e2; margin-bottom: 20px; }

.el-table { margin-top: 20px; }
.table-footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }

/* 三点菜单按钮样式 */
.more-btn {
  padding: 4px 8px !important;
  color: #909399 !important;
}

.more-btn:hover {
  color: #409eff !important;
}
</style>