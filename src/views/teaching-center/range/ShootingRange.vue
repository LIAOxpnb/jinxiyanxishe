<template>
  <div class="page-wrapper">
    <div class="main-content">
      <h1 class="page-title">靶场管理</h1>

      <div class="header-remark">【备注】默认展示我的靶场</div>

      <FilterBar create-button-text="创建靶场" :fields="shootingRangeFilterFields" @create="handleCreateShootingRange"
        @filter="handleFilter" />

      <el-table v-loading="loading" :data="tableData" style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="靶场名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="发布" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" disable-transitions>
              {{ scope.row.status === 1 ? '已发布' : '未发布' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shootingRangeType" label="类型" width="90">
          <template #default="scope">
            {{ scope.row.shootingRangeType === 0 ? '训练' : '比武' }}
          </template>
        </el-table-column>
        <el-table-column label="比赛时间" width="210">
          <template #default="scope">
            <div v-if="scope.row.participateDate === 0">不限制</div>
            <div v-else>
              <div>开始 {{ scope.row.startTime }}</div>
              <div>结束 {{ scope.row.endTime }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="比赛时长" width="100">
          <template #default="scope">
            {{ scope.row.duration === -1 ? '不限制' : `${scope.row.duration}分钟` }}
          </template>
        </el-table-column>
        <el-table-column label="分类" min-width="100">
          <template #default="scope">
            {{ getCategoryName(scope.row.shootingRangeCategory) }}
          </template>
        </el-table-column>
        <el-table-column prop="submitCount" label="交卷人数" width="100" />
        <el-table-column prop="clazzCount" label="班级" width="80" />
        <el-table-column prop="creatorName" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">靶场设置</el-button>
            <el-button link type="primary" size="small" @click="handleMarking(scope.row)">阅卷</el-button>
            <el-dropdown trigger="click" @command="(command) => handleMoreActions(command, scope.row)">
              <span class="el-dropdown-link">
                <el-button link type="primary" size="small"><el-icon>
                    <More />
                  </el-icon></el-button>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="scope.row.status === 1 ? 'cancelPublish' : 'publish'">
                    {{ scope.row.status === 1 ? '取消发布' : '发布' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="entry">入口</el-dropdown-item>
                  <el-dropdown-item command="quoteClass">引用班级</el-dropdown-item>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="delete" style="color: #F56C6C;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div>
          <el-button @click="handleBatchDelete" :disabled="selectedRanges.length === 0">批量删除</el-button>
        </div>
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="pagination.total"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" background />
      </div>
    </div>

    <el-dialog v-model="createDialogVisible" title="创建靶场" width="500px" @close="resetCreateForm">
      <el-form ref="createFormRef" :model="createForm" :rules="createFormRules" label-width="80px">
        <el-form-item label="靶场名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入靶场名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="靶场简介" prop="introduction">
          <el-input v-model="createForm.introduction" type="textarea" placeholder="请输入简介" />
        </el-form-item>
        <el-form-item label="靶场分类" prop="shootingRangeCategory">
          <el-select v-model="createForm.shootingRangeCategory" placeholder="请选择分类" style="width: 100%;">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="靶场类型" prop="shootingRangeType">
          <el-radio-group v-model="createForm.shootingRangeType">
            <el-radio :value="0">公开训练</el-radio>
            <el-radio :value="1">正式比武</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateShootingRange">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, More } from '@element-plus/icons-vue';
import FilterBar from '@/components/common/FilterBar.vue';
import { getShootingRangeList, createShootingRange, deleteShootingRange, updateShootingRangeStatus } from '@/api/teaching-center/ShootingRange.js';
import { getDictData } from '@/api/system-management/dictionary';

const router = useRouter();

const loading = ref(true);
const tableData = ref([]);
const selectedRanges = ref([]);

const filterParams = reactive({
  name: '',
  shootingRangeCategory: '',
  status: '',
  shootingRangeType: '',
  isMe: true,
});

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});
const categoryOptions = ref([]);
const typeOptions = ref([
  { label: '训练', value: 0 },
  { label: '比武', value: 1 },
]);

const shootingRangeFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '名称、创建人' },
  { type: 'select', model: 'shootingRangeType', placeholder: '类型', options: typeOptions, clearable: true },
  { type: 'select', model: 'shootingRangeCategory', placeholder: '分类', options: categoryOptions, clearable: true },
  { type: 'select', model: 'status', placeholder: '发布状态', options: [{ label: '已发布', value: 1 }, { label: '未发布', value: 0 }], clearable: true },
  { type: 'select', model: 'isMe', placeholder: '我的靶场', options: [{ label: '我的靶场', value: true }, { label: '全部靶场', value: false }] },
]);

const createDialogVisible = ref(false);
const createFormRef = ref(null);
const createForm = reactive({
  name: '',
  introduction: '',
  shootingRangeCategory: '',
  shootingRangeType: 0,
});
const createFormRules = reactive({
  name: [{ required: true, message: '请输入靶场名称', trigger: 'blur' }],
  introduction: [{ required: true, message: '请输入靶场简介', trigger: 'blur' }],
  shootingRangeCategory: [{ required: true, message: '请选择靶场分类', trigger: 'change' }],
  shootingRangeType: [{ required: true, message: '请选择靶场类型', trigger: 'change' }],
});

const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields();
  }
  Object.assign(createForm, { name: '', introduction: '', shootingRangeCategory: '', shootingRangeType: 0 });
};

const fetchShootingRanges = async () => {
  loading.value = true;
  try {
    const payload = { ...filterParams, page: pagination.page, size: pagination.size };
    const res = await getShootingRangeList(payload);
    if (res.code === 200) {
      tableData.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取列表失败');
    }
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await getDictData('shooting_range_category');
    if (res.code === 200) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue,
      }));
    }
  } catch (error) {
    console.error("获取靶场分类失败", error);
    ElMessage.error('获取靶场分类选项失败');
  }
};
// [新增] 辅助函数：根据分类ID获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return '-';
  const category = categoryOptions.value.find(c => c.value == categoryId);
  return category ? category.label : categoryId;
};

const handleFilter = (data) => {
  Object.assign(filterParams, data);
  pagination.page = 1;
  fetchShootingRanges();
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  fetchShootingRanges();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchShootingRanges();
};

const handleCreateShootingRange = () => {
  createDialogVisible.value = true;
};

const submitCreateShootingRange = async () => {
  if (!createFormRef.value) return;
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await createShootingRange(createForm);
        if (res.code === 200) {
          ElMessage.success('创建成功！');
          createDialogVisible.value = false;
          fetchShootingRanges();
        } else {
          ElMessage.error(res.msg || '创建失败');
        }
      } catch (error) {
        ElMessage.error('创建失败');
      }
    }
  });
};

const handleEdit = (row) => {
  router.push({ name: 'TeachingCenter-ShootingRangeSetup', params: { id: row.id } });
  
};

const handleMarking = (row) => {
  router.push({ name: 'TeachingCenter-ShootingRangeMarking', params: { id: row.id } });
  
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除靶场 “${row.name}” 吗？`, '删除提示', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  }).then(async () => {
    try {
      const res = await deleteShootingRange([row.id]);
      if (res.code === 200) {
        ElMessage.success('删除成功！');
        fetchShootingRanges();
      } else {
        ElMessage.error(res.msg || '删除失败');
      }
    } catch (error) {
      ElMessage.error('删除失败');
    }
  }).catch(() => { });
};

const handleSelectionChange = (selection) => {
  selectedRanges.value = selection;
};

const handleBatchDelete = () => {
  if (selectedRanges.value.length === 0) {
    ElMessage.warning('请至少选择一项进行删除');
    return;
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRanges.value.length} 项靶场吗？`, '批量删除确认', {
    type: 'warning'
  }).then(async () => {
    const ids = selectedRanges.value.map(item => item.id);
    try {
      await deleteShootingRange(ids);
      ElMessage.success('批量删除成功！');
      fetchShootingRanges();
    } catch (error) {
      ElMessage.error('批量删除失败');
    }
  }).catch(() => { });
};

const handleMoreActions = async (command, row) => {
  switch (command) {
    case 'publish':
    case 'cancelPublish':
      handlePublishCancel(row, command === 'publish' ? 1 : 0);
      break;
    case 'entry':
      ElMessage.info(`跳转到考试入口页面: ${row.id}`);
      break;
    case 'quoteClass':
      ElMessage.info(`引用班级功能: ${row.id}`);
      break;
    case 'copy':
      ElMessage.info(`复制考试功能: ${row.id}`);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      break;
  }
};

const handlePublishCancel = async (row, targetStatus) => {
  const actionText = targetStatus === 1 ? '发布' : '取消发布';
  ElMessageBox.confirm(`确定要${actionText}靶场 “${row.name}” 吗？`, `${actionText}提示`, {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await updateShootingRangeStatus({ id: row.id, status: targetStatus });
      if (res.code === 200) {
        ElMessage.success(`${actionText}成功！`);
        fetchShootingRanges();
      } else {
        ElMessage.error(res.msg || `${actionText}失败`);
      }
    } catch (error) {
      ElMessage.error(`${actionText}失败`);
    }
  }).catch(() => { });
};

onMounted(() => {
  fetchShootingRanges();
  fetchCategories();
});
</script>

<style scoped>
.page-wrapper {
  background-color: #f0f2f5;
  padding: 20px;
  min-height: 100vh;
}

.main-content {
  background-color: #ffffff;
  padding: 24px;
  border-radius: 4px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.header-remark {
  color: #F56C6C;
  margin-bottom: 20px;
  font-size: 14px;
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

.form-item-hint {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}
</style>