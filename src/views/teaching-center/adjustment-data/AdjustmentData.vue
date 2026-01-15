<template>
  <div class="page-wrapper">
    <div class="main-content">
      <h2 class="page-title">查证数据</h2>

      <!-- <div class="header-remark">【备注】管理和查看调证数据</div> -->

      <FilterBar 
        create-button-text="创建数据" 
        :fields="adjustmentDataFilterFields" 
        @create="handleCreateData"
        @filter="handleFilter" 
      />

      <el-table 
        v-loading="loading" 
        :data="tableData" 
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }" 
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="数据名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleManage(scope.row)">数据管理</el-button>
            <el-dropdown trigger="click" @command="(command) => handleMoreActions(command, scope.row)">
              <span class="el-dropdown-link">
                <el-button link type="primary" size="small">
                  <el-icon><More /></el-icon>
                </el-button>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="delete" style="color: #F56C6C;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedData.length > 0" style="margin: 10px 0;">
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedData.length }})
        </el-button>
      </div>

      <div class="table-footer">
        <div></div>
        <el-pagination 
          v-model:current-page="pagination.page" 
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]" 
          layout="total, sizes, prev, pager, next, jumper" 
          :total="pagination.total"
          @size-change="handleSizeChange" 
          @current-change="handleCurrentChange" 
          background 
        />
      </div>
    </div>

    <!-- 创建/编辑数据对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="640px" 
      @close="resetForm"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef" 
        :model="dataForm" 
        :rules="formRules" 
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input 
            v-model="dataForm.name" 
            placeholder="【备注】名称重复性校验" 
            maxlength="30" 
            show-word-limit 
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="dataForm.remark" 
            type="textarea" 
            placeholder="备注" 
            :rows="5"
            maxlength="200"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span> 
      </template>
    </el-dialog>

    <!-- 复制数据对话框 -->
    <el-dialog 
      v-model="copyDialogVisible" 
      title="复制数据" 
      width="480px" 
      @close="resetCopyForm"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 16px; color: #606266;">复制当前数据内容</div>
      <el-form 
        ref="copyFormRef" 
        :model="copyForm" 
        :rules="copyFormRules"
      >
        <el-form-item prop="name">
          <el-input 
            v-model="copyForm.name" 
            placeholder="请输入名称" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="copyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCopySubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog 
      v-model="deleteDialogVisible" 
      title="删除提示" 
      width="460px" 
      :close-on-click-modal="false"
    >
      <div style="color: #606266; margin-bottom: 20px;">
        删除后无法恢复，请确认操作！
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { More } from '@element-plus/icons-vue';
import FilterBar from '@/components/common/FilterBar.vue';
import {
  createDataPacket,
  getDataPacketList,
  updateDataPacket,
  deleteDataPacket,
  getDataPacketDetail
} from '@/api/teaching-center/AdjustmentData';

const router = useRouter();

// 表格加载状态
const loading = ref(false);

// 表格数据
const tableData = ref([]);

// 选中的数据
const selectedData = ref([]);

// 分页信息
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
});

// 筛选条件
const filterConditions = reactive({
  name: ''
});

// 筛选条件字段配置
const adjustmentDataFilterFields = [
  {
    type: 'input',
    model: 'name',
    placeholder: '请输入数据包名称'
  }
];

// 对话框显示控制
const dialogVisible = ref(false);
const dialogTitle = ref('创建数据');
const isEditMode = ref(false);
const currentEditId = ref(null);

// 复制对话框
const copyDialogVisible = ref(false);
const currentCopyRow = ref(null);

// 删除对话框
const deleteDialogVisible = ref(false);
const currentDeleteRow = ref(null);

// 表单数据
const dataForm = reactive({
  name: '',
  remark: ''
});

// 复制表单数据
const copyForm = reactive({
  name: ''
});

// 表单引用
const formRef = ref(null);
const copyFormRef = ref(null);

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 30, message: '长度在 1 到 30 个字符', trigger: 'blur' }
  ]
};

// 复制表单验证规则
const copyFormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ]
};

// 加载表格数据
const loadTableData = async () => {
  loading.value = true;
  try {
    const response = await getDataPacketList({
      page: pagination.page,
      size: pagination.size,
      name: filterConditions.name
    });
    
    if (response.code === 200) {
      tableData.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    }
  } catch (error) {
    ElMessage.error('加载数据失败');
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

// 处理创建数据
const handleCreateData = () => {
  dialogTitle.value = '创建数据';
  isEditMode.value = false;
  currentEditId.value = null;
  resetForm();
  dialogVisible.value = true;
};

// 处理筛选
const handleFilter = (filters) => {
  filterConditions.name = filters.name || '';
  pagination.page = 1;
  loadTableData();
};

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedData.value = selection;
};

// 处理数据管理
const handleManage = (row) => {
  router.push(`/teaching-center/adjustment-data/manage/${row.id}`);
};

// 处理更多操作
const handleMoreActions = async (command, row) => {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'copy':
      handleCopy(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
  }
};

// 处理编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑数据';
  isEditMode.value = true;
  currentEditId.value = row.id;
  
  dataForm.name = row.name;
  dataForm.remark = row.remark;
  
  dialogVisible.value = true;
};

// 处理复制
const handleCopy = (row) => {
  currentCopyRow.value = row;
  copyForm.name = `${row.name}_副本`;
  copyDialogVisible.value = true;
};

// 处理复制提交
const handleCopySubmit = async () => {
  if (!copyFormRef.value) return;
  
  await copyFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createDataPacket({
          name: copyForm.name,
          remark: currentCopyRow.value.remark
        });
        
        ElMessage.success('复制成功');
        copyDialogVisible.value = false;
        loadTableData();
      } catch (error) {
        ElMessage.error('复制失败');
        console.error('Error copying data:', error);
      }
    }
  });
};

// 重置复制表单
const resetCopyForm = () => {
  if (copyFormRef.value) {
    copyFormRef.value.resetFields();
  }
  copyForm.name = '';
  currentCopyRow.value = null;
};

// 处理删除
const handleDelete = (row) => {
  currentDeleteRow.value = row;
  deleteDialogVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  if (!currentDeleteRow.value) return;
  
  try {
    await deleteDataPacket(currentDeleteRow.value.id);
    
    ElMessage.success('删除成功');
    deleteDialogVisible.value = false;
    currentDeleteRow.value = null;
    loadTableData();
  } catch (error) {
    ElMessage.error('删除失败');
    console.error('Error deleting data:', error);
  }
};

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedData.value.length === 0) {
    ElMessage.warning('请选择要删除的数据');
    return;
  }
  
  ElMessageBox.confirm(
    '删除后无法恢复，请确认操作！',
    '删除提示',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      const deletePromises = selectedData.value.map(item => deleteDataPacket(item.id));
      await Promise.all(deletePromises);
      
      ElMessage.success('删除成功');
      loadTableData();
    } catch (error) {
      ElMessage.error('删除失败');
      console.error('Error batch deleting:', error);
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEditMode.value) {
          await updateDataPacket({
            id: currentEditId.value,
            name: dataForm.name,
            remark: dataForm.remark
          });
          ElMessage.success('编辑成功');
        } else {
          await createDataPacket({
            name: dataForm.name,
            remark: dataForm.remark
          });
          ElMessage.success('创建成功');
        }
        
        dialogVisible.value = false;
        loadTableData();
      } catch (error) {
        ElMessage.error(isEditMode.value ? '编辑失败' : '创建失败');
        console.error('Error submitting form:', error);
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  dataForm.name = '';
  dataForm.remark = '';
};

// 处理分页大小变化
const handleSizeChange = (val) => {
  pagination.size = val;
  pagination.page = 1;
  loadTableData();
};

// 处理当前页变化
const handleCurrentChange = (val) => {
  pagination.page = val;
  loadTableData();
};

// 组件挂载时加载数据
onMounted(() => {
  loadTableData();
});
</script>

<style scoped>
.page-wrapper {
  min-height: 100%;
  height: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.main-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.page-title {
    margin: 0 0 20px 0;
  font-size: 24px !important;
  font-weight: 600;
  color: #303133;
}

.header-remark {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
  padding: 8px 12px;
  background: #f4f4f5;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
