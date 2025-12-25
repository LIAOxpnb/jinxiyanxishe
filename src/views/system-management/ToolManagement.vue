<template>
  <div class="tool-management">
    <div class="header">
      <h2>工具管理</h2>
      <el-button type="primary" @click="handleAdd">上传工具</el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :model="searchForm" inline>
        <el-form-item label="工具名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入工具名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        :header-cell-style="{ background: '#f8f9fe', color: '#5B6FD8', fontWeight: '600' }"
        :cell-style="{ padding: '12px 0' }"
        style="width: 100%"
      >
        <el-table-column prop="name" label="工具名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="tool-name">{{ row.name || '-' }}</span>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="sort" label="排序" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.sort || '-' }}</span>
          </template>
        </el-table-column> -->
        <el-table-column prop="remarks" label="备注" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.remarks || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleEdit(row)"
                :icon="Edit"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleDelete(row)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页区域 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <div v-if="!isEditMode" style="text-align: center; padding: 20px;">
        <el-form
          ref="uploadFormRef"
          :model="formData"
          :rules="formRules"
          label-width="80px"
          style="margin-bottom: 20px;"
        >
          <el-form-item label="工具名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入工具名称" />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" :controls="true" placeholder="请输入排序号" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="备注" prop="remarks">
            <el-input 
              v-model="formData.remarks" 
              placeholder="请输入备注" 
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-form>
        <el-upload
          ref="uploadRef"
          drag
          action="#"
          :limit="1"
          :auto-upload="false"
          v-model:file-list="fileList"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
        >
          <div style="padding: 40px 0;">
            <el-button type="primary" link>上传工具文件</el-button>
            <div class="el-upload__tip">
              支持单个文件上传，支持任意格式和大小
            </div>
          </div>
        </el-upload>
      </div>
      
      <div v-else>
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="80px"
        >
          <el-form-item label="工具名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入工具名称" />
          </el-form-item>
          <el-form-item label="URL路径" prop="urlPath">
            <el-input v-model="formData.urlPath" placeholder="请输入URL路径" />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" :controls="true" placeholder="请输入排序号" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="备注" prop="remarks">
            <el-input 
              v-model="formData.remarks" 
              placeholder="请输入备注" 
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <div v-if="isUploading" class="progress-container">
        <el-progress :percentage="uploadProgress" />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSubmit" 
            :loading="submitLoading"
            :disabled="!isEditMode && (fileList.length === 0 || !formData.name)"
          >
            {{ submitLoading ? `上传中... ${uploadProgress}%` : '确定' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { genFileId } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import {
  getToolsList,
  addTool,
  updateTool,
  deleteTool,
  getToolDetail
} from '../../api/system-management/Tool-Management.js'
import { uploadFiles } from '../../api/common/UploadFiles.js'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const uploadFormRef = ref()
const uploadRef = ref()
const fileList = ref([])
const isUploading = ref(false)
const uploadProgress = ref(0)
const isEditMode = ref(false)

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  urlPath: '',
  sort: 0,
  remarks: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入工具名称', trigger: 'blur' }
  ],
  urlPath: [
    { required: true, message: '请输入URL路径', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序号', trigger: ['blur', 'change'] },
    { validator: (rule, value, callback) => {
        const num = Number(value)
        if (value === '' || value === null || value === undefined) {
          callback(new Error('请输入排序号'))
        } else if (Number.isNaN(num)) {
          callback(new Error('排序必须是数字'))
        } else if (num < 0) {
          callback(new Error('排序不能为负数'))
        } else {
          callback()
        }
      }, trigger: ['blur', 'change'] }
  ],
  remarks: []
}

// 获取工具列表
const fetchToolsList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      name: searchForm.name
    }
    const response = await getToolsList(params)
    if (response.code === 200) {
      tableData.value = response.data.records || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取列表失败')
    }
  } catch (error) {
    console.error('获取工具列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchToolsList()
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  pagination.page = 1
  fetchToolsList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchToolsList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchToolsList()
}

// 新增工具
const handleAdd = () => {
  dialogTitle.value = '上传工具'
  dialogVisible.value = true
  isEditMode.value = false
  resetForm()
}

// 编辑工具
const handleEdit = async (row) => {
  dialogTitle.value = '编辑工具'
  dialogVisible.value = true
  isEditMode.value = true
  
  try {
    const response = await getToolDetail(row.id)
    if (response.code === 200) {
      Object.assign(formData, response.data)
    } else {
      ElMessage.error(response.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取工具详情失败:', error)
    ElMessage.error('获取详情失败')
  }
}

// 删除工具
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该工具吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const response = await deleteTool(row.id)
        if (response.code === 200) {
          ElMessage.success('删除成功')
          fetchToolsList()
        } else {
          ElMessage.error(response.message || '删除失败')
        }
      } catch (error) {
        console.error('删除工具失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {
      // 用户取消删除
    })
}

// 文件改变处理
const handleFileChange = (uploadFile, uploadFiles) => {
  console.log('文件改变:', uploadFile.name)
  
  // 移除文件格式和大小限制，允许任何类型和大小的文件
}

// 文件超出限制处理
const handleExceed = (files) => {
  ElMessage.warning('只能上传一个文件，将替换当前文件')
  uploadRef.value.clearFiles()
  const file = files[0]
  file.uid = genFileId()
  uploadRef.value.handleStart(file)
}

// 提交表单
const handleSubmit = async () => {
  if (isEditMode.value) {
    // 编辑模式
    if (!formRef.value) return
    
    try {
      await formRef.value.validate()
      submitLoading.value = true
      
      const payload = Object.assign({}, formData, { sort: Number(formData.sort) >= 0 ? Number(formData.sort) : 0 })
      const response = await updateTool(payload)
      
      if (response.code === 200) {
        ElMessage.success('修改成功')
        dialogVisible.value = false
        fetchToolsList()
      } else {
        ElMessage.error(response.message || '修改失败')
      }
    } catch (error) {
      console.error('修改失败:', error)
      ElMessage.error('修改失败')
    } finally {
      submitLoading.value = false
    }
  } else {
    // 上传模式
    if (!uploadFormRef.value) return
    
    try {
      await uploadFormRef.value.validate()
    } catch (error) {
      console.error('表单验证失败:', error)
      return
    }
    
    if (fileList.value.length === 0) {
      ElMessage.warning('请选择要上传的文件')
      return
    }
    
    submitLoading.value = true
    uploadProgress.value = 0
    
    try {
      const onProgress = (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
      
      const file = fileList.value[0]
      const rawFile = file.raw
      
      console.log('开始上传文件:', rawFile.name, '大小:', (rawFile.size / 1024 / 1024).toFixed(2) + 'MB')
      
      // 调用上传接口
      const uploadRes = await uploadFiles([rawFile], onProgress)
      
      if (uploadRes.code !== 200 || !uploadRes.data) {
        throw new Error(uploadRes.msg || '文件上传失败')
      }
      
      const filePath = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data
      
      if (typeof filePath !== 'string' || !filePath) {
        throw new Error('服务器未返回有效的文件路径')
      }
      
      console.log('文件上传成功，路径:', filePath)
      
      // 调用工具保存接口，使用用户输入的名称
      const toolData = {
        name: formData.name, // 使用用户输入的名称
        urlPath: filePath,
        sort: Number(formData.sort) >= 0 ? Number(formData.sort) : 0,
        remarks: formData.remarks
      }
      
      const response = await addTool(toolData)
      
      if (response.code === 200) {
        ElMessage.success('上传成功')
        dialogVisible.value = false
        fetchToolsList()
      } else {
        ElMessage.error(response.message || '保存工具信息失败')
      }
      
    } catch (error) {
      console.error('上传失败:', error)
      ElMessage.error(error.message || '上传失败')
    } finally {
      submitLoading.value = false
    }
  }
}

// 对话框关闭
const handleDialogClose = () => {
  resetForm()
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  Object.assign(formData, {
    id: null,
    name: '',
    urlPath: '',
    sort: 0,
    remarks: ''
  })
  fileList.value = []
  uploadProgress.value = 0
  isUploading.value = false
  isEditMode.value = false
}

// 初始化
onMounted(() => {
  fetchToolsList()
})
</script>

<style scoped>
.tool-management {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8eaf6;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.search-area {
  background: #f8f9fe;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #e8eaf6;
}

.table-container {
  margin-bottom: 24px;
}

.tool-name {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.progress-container {
  margin: 20px 0;
}

.pagination {
  margin-top: 24px;
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid #e8eaf6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  border-bottom: 2px solid #e8eaf6;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f3f4f6;
}

:deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #f3f4f6;
}

:deep(.el-table tbody tr:hover > td) {
  background-color: #f8f9fe !important;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
