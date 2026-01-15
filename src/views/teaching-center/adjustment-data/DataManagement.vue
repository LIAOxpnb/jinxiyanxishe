<template>
  <div class="data-management-page" v-loading="loading">
    <div v-if="dataDetails">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
        <span class="page-title">{{ dataDetails.name || '数据名称' }}</span>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleImportData">导入数据</el-button>
      </div>
      
      <!-- 筛选功能暂时注释
      <FilterBar 
        create-button-text="导入数据" 
        :fields="filterFields" 
        @create="handleImportData"
        @filter="handleFilter" 
      />
      -->

      <!-- 数据表格 -->
      <div class="data-table-container">
        <el-table 
          :data="accountList" 
          style="width: 100%"
          :header-cell-style="{ background: '#fafafa', color: '#666', fontWeight: 'normal' }"
          :cell-style="{ color: '#333' }"
        >
          <el-table-column 
            v-for="field in headerFields" 
            :key="field.sysName"
            :prop="field.sysName"
            :label="field.displayName"
            :min-width="field.sysName === 'id' ? 80 : 120"
          >
            <template #default="scope">
              <span :class="field.sysName !== 'id' ? 'link-text' : ''">{{ scope.row[field.sysName] }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="handleEditRow(scope.row, scope.$index)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="table-footer">
          <el-pagination 
            v-model:current-page="pagination.page" 
            v-model:page-size="pagination.size"
            :page-sizes="[10, 20, 50, 100]" 
            layout="total, prev, pager, next, sizes" 
            :total="pagination.total"
            @size-change="handleSizeChange" 
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 编辑行对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑数据" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="editFormRef" 
        :model="editForm" 
        label-width="100px"
      >
        <el-form-item 
          v-for="(field, index) in headerFields" 
          :key="field.sysName"
          :label="field.displayName"
          v-show="field.sysName !== 'id'"
        >
          <el-input 
            v-model="editForm[field.sysName]" 
            :disabled="index !== headerFields.length - 1" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导入数据对话框 -->
    <el-dialog 
      v-model="importDialogVisible" 
      title="导入数据" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls,.csv"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 Excel (.xlsx, .xls) 或 CSV 格式文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleImportSubmit">导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  ArrowLeft,
  UploadFilled 
} from '@element-plus/icons-vue';
import FilterBar from '@/components/common/FilterBar.vue';
import {
  importDataFromCSV,
  getDataPacketHeaders,
  getDataPacketDetailList,
  updateDataPacketDetail
} from '@/api/teaching-center/DataPacketDetail';
import { getDataPacketDetail } from '@/api/teaching-center/AdjustmentData';

const router = useRouter();
const route = useRoute();

// 页面加载状态
const loading = ref(false);

// 数据详情
const dataDetails = ref(null);

// 账户列表
const accountList = ref([]);

// 筛选字段配置
const filterFields = [
  {
    type: 'input',
    model: 'keyword',
    placeholder: '账户'
  }
];

// 分页信息
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
});

// 筛选条件
const filterConditions = reactive({
  keyword: ''
});

// 编辑对话框
const editDialogVisible = ref(false);
const editFormRef = ref(null);
const currentEditRow = ref(null);
const editForm = reactive({
  id: null,
  dataPacketId: null
});

// 动态字段数据
const dynamicFields = ref([]);

// 表头字段列表
const headerFields = ref([]);

// 导入对话框
const importDialogVisible = ref(false);
const importFile = ref(null);

// 返回上一页
const goBack = () => {
  router.push('/teaching-center/adjustment-data');
};

// 筛选处理（暂时注释）
// const handleFilter = (filters) => {
//   filterConditions.keyword = filters.keyword || '';
//   pagination.page = 1;
//   loadAccountList();
// };

// 加载数据详情
const loadDataDetails = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    const response = await getDataPacketDetail(id);
    
    if (response.code === 200) {
      dataDetails.value = response.data;
    }
    
    // 加载表头字段
    await loadHeaders();
  } catch (error) {
    ElMessage.error('加载数据详情失败');
    console.error('Error loading data details:', error);
  } finally {
    loading.value = false;
  }
};

// 加载表头字段
const loadHeaders = async () => {
  try {
    const id = route.params.id;
    const response = await getDataPacketHeaders(id);
    
    if (response.code === 200 && response.data) {
      // response.data 是一个数组，包含 { id, displayName, sysName } 对象
      headerFields.value = response.data;
    }
  } catch (error) {
    console.error('Error loading headers:', error);
  }
};

// 加载账户列表
const loadAccountList = async () => {
  loading.value = true;
  try {
    const response = await getDataPacketDetailList({
      id: route.params.id,
      page: pagination.page,
      size: pagination.size
    });
    
    if (response.code === 200) {
      accountList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    }
  } catch (error) {
    ElMessage.error('加载账户列表失败');
    console.error('Error loading account list:', error);
  } finally {
    loading.value = false;
  }
};

// 处理编辑行
const handleEditRow = (row, index) => {
  currentEditRow.value = row;
  editForm.id = row.id;
  editForm.dataPacketId = route.params.id;
  
  // 根据表头字段的 sysName 复制数据到编辑表单
  headerFields.value.forEach(field => {
    editForm[field.sysName] = row[field.sysName];
  });
  
  editDialogVisible.value = true;
};

// 处理编辑提交
const handleEditSubmit = async () => {
  try {
    await updateDataPacketDetail(editForm);
    ElMessage.success('编辑成功');
    editDialogVisible.value = false;
    loadAccountList();
  } catch (error) {
    ElMessage.error('编辑失败');
    console.error('Error updating data:', error);
  }
};

// 处理导入数据
const handleImportData = () => {
  importDialogVisible.value = true;
};

// 处理文件变化
const handleFileChange = (file) => {
  importFile.value = file;
};

// 处理导入提交
const handleImportSubmit = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('file', importFile.value.raw);
    formData.append('id', route.params.id);
    
    await importDataFromCSV(formData);
    
    ElMessage.success('导入成功');
    importDialogVisible.value = false;
    importFile.value = null;
    
    // 重新加载表头和数据列表
    await loadHeaders();
    await loadAccountList();
  } catch (error) {
    ElMessage.error('导入失败');
    console.error('Error importing data:', error);
  }
};

// 处理分页大小变化
const handleSizeChange = (val) => {
  pagination.size = val;
  pagination.page = 1;
  loadAccountList();
};

// 处理当前页变化
const handleCurrentChange = (val) => {
  pagination.page = val;
  loadAccountList();
};

// 组件挂载时加载数据
onMounted(() => {
  loadDataDetails();
  loadAccountList();
});
</script>

<style scoped>
.data-management-page {
  min-height: 100vh;
  background: #fff;
  padding: 20px 24px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.back-icon {
  font-size: 18px;
  color: #666;
  cursor: pointer;
  margin-right: 12px;
}

.back-icon:hover {
  color: #409eff;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.toolbar {
  margin-bottom: 16px;
}

.data-table-container {
  background: #fff;
  margin-top: 16px;
}

.data-table-container :deep(.el-table) {
  border: none;
}

.data-table-container :deep(.el-table th) {
  border-bottom: 1px solid #eee;
}

.data-table-container :deep(.el-table td) {
  border-bottom: 1px solid #f5f5f5;
}

.data-table-container :deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: #fafafa;
}

.link-text {
  color: #409eff;
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.amount-text {
  color: #409eff;
}

.remark-text {
  color: #409eff;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
}

.table-footer :deep(.el-pagination) {
  padding: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.el-upload__tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
