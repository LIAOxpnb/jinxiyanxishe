<template>
  <el-container class="page-container">
    <el-aside width="220px" class="left-panel">
      <el-menu :default-active="activeGroupId" class="group-menu" @select="handleGroupSelect">
        <!-- <el-menu-item index="all">
          <span>全部</span>
        </el-menu-item>
         <el-menu-item index="none">
          <span>未分组</span>
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
        <el-button class="add-group-btn" plain @click="handleAddGroup">+ 新增课件分组</el-button>
      </div>
    </el-aside>

    <el-main class="right-panel">
      <h1 class="page-title">课件库</h1>
      <FilterBar
  create-button-text="上传课件"
  :fields="coursewareFilterFields"
  @create="handleCreateCourseware"
  @filter="handleFilterCoursewares"
  @field-change="handleFieldChange"
/>
        <el-table v-loading="tableLoading" :data="tableData" style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="课件名称" min-width="200">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleEditCourseware(scope.row)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="文件类型" width="110" />
        <el-table-column prop="duration" label="时长" width="100" class-name="nowrap" label-class-name="nowrap" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100" class-name="nowrap" label-class-name="nowrap" show-overflow-tooltip />
        <el-table-column prop="group" label="课件组" width="120" />
        <el-table-column prop="creatorName" label="创建人" width="110" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEditCourseware(scope.row)">编辑</el-button>
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

      <div v-if="selectedCoursewares.length > 0" style="margin: 10px 0;">
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedCoursewares.length }})
        </el-button>
      </div>

      <div class="table-footer">
        <div></div>
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total" background
          @size-change="fetchCoursewares" @current-change="fetchCoursewares" />
      </div>
    </el-main>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="coursewareForm" :rules="rules" label-width="80px">
        <el-form-item label="课件名称" prop="name">
          <el-input v-model="coursewareForm.name" placeholder="请输入课件名称" />
        </el-form-item>
        <el-form-item label="课件分组" prop="groupId">
          <el-select v-model="coursewareForm.groupId" placeholder="请选择分组" style="width: 100%">
            <el-option label="不分组" :value="null" />
            <el-option v-for="group in groupList" :key="group.id" :label="group.name" :value="group.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="课件分类" prop="coursewareCategory">
          <el-select v-model="coursewareForm.coursewareCategory" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <UploadCoursewareDialog 
      v-model:visible="uploadDialogVisible"
      :groups="groupList"
      :categories="categoryOptions"
      :current-group-id="activeGroupId"
      @success="handleUploadSuccess"
      @create-group="handleAddGroup"
    />
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { More } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';

// 导入课件管理相关的API
import {
  getCoursewareGroupList,
  addCoursewareGroup,
  deleteCoursewareGroup,
  updateCoursewareGroup,
  getCoursewareList,
  updateCourseware,
  deleteCourseware,
} from '@/api/teaching-center/CoursewareManagement';
import { getDictByType } from '@/api/system-management/dictionary';
import UploadCoursewareDialog from './UploadCoursewareDialog.vue'; 

// --- 状态管理 --- 
const groupList = ref([]);
const tableData = ref([]);
const tableLoading = ref(false);
const total = ref(0);
const activeGroupId = ref('all');
const pagination = reactive({ page: 1, size: 10 });
const filters = ref({});
const categoryOptions = ref([]);
const fileTypeOptions = ref([]); // 文件类型选项
const groupOptions = ref([]); // 课件分组选项
const uploadDialogVisible = ref(false);
const selectedCoursewares = ref([]); // 选中的课件列表


// --- 筛选栏配置 ---
const coursewareFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '课件名称' },
  { type: 'input', model: 'creatorName', placeholder: '创建人' },
  { type: 'select', model: 'file_type', placeholder: '文件类型', options: fileTypeOptions },
  { type: 'select', model: 'coursewareCategory', placeholder: '分类', options: categoryOptions },
  { type: 'select', model: 'groupId', placeholder: '课件分组', options: groupOptions },
]);

// --- 编辑/新增弹窗 ---
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
const coursewareForm = reactive({
  id: null,
  name: '',
  groupId: null,
  coursewareCategory: '',
});
const rules = reactive({
  name: [{ required: true, message: '请输入课件名称', trigger: 'blur' }],
  groupId: [{ required: true, message: '请选择课件分组', trigger: 'change' }],
  coursewareCategory: [{ required: true, message: '请选择课件分类', trigger: 'change' }],
});
const dialogTitle = computed(() => isEdit.value ? '编辑课件' : '新增课件');

// --- API 调用与事件处理 ---
const fetchGroups = async () => {
  try {
    const res = await getCoursewareGroupList();
    if (res.code === 200 && res.data) {
      groupList.value = res.data;
      // 填充筛选用的分组选项（包括"全部"和"未分组"）
      groupOptions.value = res.data.map(g => ({ label: g.name, value: g.id }));
    }
  } catch (error) { ElMessage.error('获取分组列表失败'); }
};

const fetchCoursewares = async () => {
  tableLoading.value = true;
  const cleanFilters = Object.fromEntries(Object.entries(filters.value).filter(([_, v]) => v != null && v !== ''));

  // 优先使用筛选条件中的 groupId，如果没有，再使用左侧菜单选择的 groupId
  let groupId = null;
  if (cleanFilters.groupId) {
    // 筛选条件中有 groupId，使用它
    const selectedGroup = groupList.value.find(g => g.id == cleanFilters.groupId);
    if (selectedGroup) {
      if (selectedGroup.name === '全部') {
        groupId = null; // 全部不传 groupId
      } else if (selectedGroup.name === '未分组') {
        groupId = 0; // 未分组传 0
      } else {
        groupId = cleanFilters.groupId; // 其他分组传实际 ID
      }
    }
  } else if (activeGroupId.value !== 'all' && activeGroupId.value !== 'none') {
    // 左侧菜单选择了具体分组
    groupId = activeGroupId.value;
  } else if (activeGroupId.value === 'none') {
    // 左侧菜单选择了"未分组"
    groupId = 0;
  }

  try {
    const params = {
      groupId,
      page: pagination.page,
      size: pagination.size,
      ...cleanFilters,
    };
    const res = await getCoursewareList(params);
    if (res.code === 200 && res.data) {
      // 辅助函数：根据ID查找分组名
      const getGroupName = (gId) => {
        if (!gId && gId !== 0) return '未分组';
        const group = groupList.value.find(g => g.id == gId);
        return group ? group.name : '未分组';
      };
      // 辅助函数：根据ID查找分类名
      const getCategoryName = (catId) => {
        if (!catId) return '-';
        const cat = categoryOptions.value.find(c => c.value == catId);
        return cat ? cat.label : catId;
      };

      // [修改] 直接使用后端返回数据，并进行ID到名称的转换，不再有任何模拟数据
      tableData.value = res.data.records.map(item => ({
        ...item, // 保留后端返回的所有原始字段
        group: getGroupName(item.groupId),
        category: getCategoryName(item.coursewareCategory)
      }));
      total.value = res.data.total;
    } else {
      // API请求成功但业务码非200，或data为空
      tableData.value = [];
      total.value = 0;
    }
  } catch (error) {
    ElMessage.error('获取课件列表失败');
    tableData.value = [];
    total.value = 0;
  }
  finally { tableLoading.value = false; }
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
  const groupIdField = coursewareFilterFields.value.find(f => f.model === 'groupId');
  if (groupIdField) {
    groupIdField.defaultValue = groupIdValue;
  }
  
  fetchCoursewares();
};

const handleAddGroup = () => {
  ElMessageBox.prompt('请输入新分组的名称', '新增课件分组', { confirmButtonText: '确定', cancelButtonText: '取消' })
    .then(async ({ value }) => {
      await addCoursewareGroup({ name: value });
      ElMessage.success('新增分组成功！');
      fetchGroups();
    }).catch(() => { });
};

const handleEditGroup = (group) => {
  ElMessageBox.prompt('请输入新的分组名称', '编辑分组', { inputValue: group.name })
    .then(async ({ value }) => {
      await updateCoursewareGroup({ id: group.id, name: value });
      ElMessage.success('修改分组成功！');
      fetchGroups();
    }).catch(() => { });
};

const handleDeleteGroup = (group) => {
  ElMessageBox.confirm(`确定要删除分组 "${group.name}" 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteCoursewareGroup({ id: group.id });
      ElMessage.success('删除成功！');
      activeGroupId.value = 'all';
      fetchGroups();
      fetchCoursewares();
    }).catch(() => { });
};

const handleGroupDropdownCommand = (command, group) => {
  if (command === 'edit') handleEditGroup(group);
  else if (command === 'delete') handleDeleteGroup(group);
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
    const groupIdField = coursewareFilterFields.value.find(f => f.model === 'groupId');
    if (groupIdField) {
      groupIdField.defaultValue = value || '';
    }
  }
};

const handleFilterCoursewares = (filterData) => {
  filters.value = filterData;
  pagination.page = 1;
  // 同步更新左侧菜单的选中状态
  syncGroupSelection(filterData.groupId);
  fetchCoursewares();
};

const handleCreateCourseware = () => {
  uploadDialogVisible.value = true;
};

const handleUploadSuccess = () => {
  fetchCoursewares();
};

const handleEditCourseware = (row) => {
  isEdit.value = true;
  Object.assign(coursewareForm, {
    id: row.id,
    name: row.name,
    groupId: row.groupId,
    coursewareCategory: row.coursewareCategory,
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateCourseware(coursewareForm);
          ElMessage.success('修改成功！');
        } else {
          // 此处应为新增逻辑，暂时缺失
          ElMessage.info('新增逻辑待实现');
        }
        dialogVisible.value = false;
        fetchCoursewares();
      } catch (error) { ElMessage.error('操作失败'); }
    }
  });
};

const handleDeleteCourseware = (row) => {
  ElMessageBox.confirm('确定要删除该课件吗？', '删除提示', { type: 'warning' })
    .then(async () => {
      await deleteCourseware([row.id]);
      ElMessage.success('删除成功！');
      fetchCoursewares();
    }).catch(() => { });
};

const handleSelectionChange = (selection) => {
  selectedCoursewares.value = selection;
};

const handleBatchDelete = () => {
  if (selectedCoursewares.value.length === 0) {
    ElMessage.warning('请先选择要删除的课件');
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedCoursewares.value.length} 项课件吗？此操作不可恢复！`, 
    '批量删除确认', 
    { 
      type: 'warning', 
      confirmButtonText: '确定删除', 
      cancelButtonText: '取消' 
    }
  ).then(async () => {
    try {
      // 收集所有要删除的课件ID
      const deletePromises = selectedCoursewares.value.map(courseware => deleteCourseware([courseware.id]));
      
      // 并发执行所有删除操作
      await Promise.all(deletePromises);
      
      ElMessage.success(`成功删除 ${selectedCoursewares.value.length} 项课件！`);
      selectedCoursewares.value = [];
      fetchCoursewares();
    } catch (error) {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败，请重试');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

const handleDropdownCommand = (command, row) => {
  if (command === 'delete') {
    handleDeleteCourseware(row);
  }
};

onMounted(async () => {
  await fetchGroups();
  // 获取筛选用的字典数据
  getDictByType('courseware_category').then(res => {
    categoryOptions.value = res.data.map(d => ({ label: d.dictLabel, value: d.dictValue }));
  });
  getDictByType('file_type').then(res => {
    fileTypeOptions.value = res.data.map(d => ({ label: d.dictLabel, value: d.dictValue }));
  });
  fetchCoursewares();
});
</script>

<style scoped>
/* 样式与 QuestionBank.vue 完全相同 */
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
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.el-table {
  margin-top: 20px;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.more-btn {
  padding: 4px 8px !important;
  color: #909399 !important;
}

.more-btn:hover {
  color: #409eff !important;
}
.nowrap {
  white-space: nowrap;
}
</style>