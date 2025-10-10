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
/>
      <el-table v-loading="tableLoading" :data="tableData" style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="课件名称" min-width="200">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleEditCourseware(scope.row)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="文件类型" width="100" />
        <el-table-column prop="duration" label="时长" width="100" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="group" label="课件组" width="120" />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
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
      <div class="table-footer">
        <!-- <el-button>批量操作</el-button> -->
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
const uploadDialogVisible = ref(false);


// --- 筛选栏配置 ---
const coursewareFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '课件名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { type: 'select', model: 'file_type', placeholder: '文件类型', options: fileTypeOptions },
  { type: 'select', model: 'coursewareCategory', placeholder: '分类', options: categoryOptions },
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
    }
  } catch (error) { ElMessage.error('获取分组列表失败'); }
};

const fetchCoursewares = async () => {
  tableLoading.value = true;
  const cleanFilters = Object.fromEntries(Object.entries(filters.value).filter(([_, v]) => v != null && v !== ''));

  let groupId = null;
  if (activeGroupId.value !== 'all' && activeGroupId.value !== 'none') {
    groupId = activeGroupId.value;
  }
  if (activeGroupId.value === 'none') {
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

const handleFilterCoursewares = (filterData) => {
  filters.value = filterData;
  pagination.page = 1;
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
</style>