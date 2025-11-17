<template>
  <div class="message-templates">
    <FilterBar
      :create-button-text="'新增模板'"
      :fields="filterFields"
      @create="handleCreate"
      @filter="handleFilter"
    />

    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        class="template-table"
        :header-cell-style="{ backgroundColor: '#fafafa', color: '#262626', fontWeight: '500' }"
      >
        <el-table-column prop="name" label="模板名称" min-width="150" align="left" />
        <el-table-column prop="code" label="编码" min-width="180" align="left">
          <template #default="scope">
            {{ scope.row.code || 'MessageTemplate' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" align="left">
          <template #default="scope">
            {{ scope.row.remark || '备注说明' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="text" @click="handleEdit(row)" class="action-btn" size="small">
                编辑
              </el-button>
              <el-button type="text" @click="handleDelete(row)" class="action-btn delete-btn" size="small">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-count">总共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑模板对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="700px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name" required>
          <el-input
            v-model="formData.name"
            placeholder="请输入模板名称"
            style="width: 100%"
            :disabled="isEdit"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark" required>
          <el-input
            v-model="formData.remark"
            placeholder="请输入备注信息"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="模板内容" prop="content" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="8"
            placeholder="请输入模板内容"
            style="width: 100%"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      title="删除模板"
      v-model="deleteDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 20px; font-size: 14px;">
        确定要删除该模板吗？删除后不可恢复。
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import FilterBar from '../../components/common/FilterBar.vue'
import { getMessageTemplateList, updateMessageTemplate, getMessageTemplateDetail } from '../../api/system-management/Message-Templates.js'

const loading = ref(false)
const submitLoading = ref(false)
const deleteLoading = ref(false)
const tableData = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const filterFields = [
  {
    type: 'input',
    model: 'name',
    placeholder: '搜索',
    defaultValue: ''
  }
]

const currentFilters = ref({})

const formData = reactive({
  id: null,
  name: '',
  remark: '',
  content: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 1, max: 100, message: '模板名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  remark: [
    { required: true, message: '请输入备注信息', trigger: 'blur' },
    { min: 1, max: 200, message: '备注长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入模板内容', trigger: 'blur' },
    { min: 1, max: 2000, message: '模板内容长度在 1 到 2000 个字符', trigger: 'blur' }
  ]
}

const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentDeleteRow = ref(null)

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑模板' : '新增模板'
})

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

// 获取模板列表
const fetchTemplates = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...currentFilters.value
    }
    
    const res = await getMessageTemplateList(params)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取模板列表失败:', error)
    ElMessage.error('获取模板列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选处理
const handleFilter = (filters) => {
  currentFilters.value = filters
  pagination.page = 1
  fetchTemplates()
}

// 新增模板
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑模板
const handleEdit = async (row) => {
  try {
    // 先获取模板详情
    const res = await getMessageTemplateDetail(row.id)
    if (res.code === 200 && res.data) {
      isEdit.value = true
      Object.assign(formData, {
        id: row.id,
        name: res.data.name || row.name,
        remark: res.data.remark || row.remark,
        content: res.data.content || ''
      })
      dialogVisible.value = true
    } else {
      ElMessage.error('获取模板详情失败')
    }
  } catch (error) {
    console.error('获取模板详情失败:', error)
    ElMessage.error('获取模板详情失败')
  }
}

// 删除模板
const handleDelete = (row) => {
  currentDeleteRow.value = row
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = async () => {
  // 由于API文档中没有删除接口，暂时显示提示
  ElMessage.info('删除功能待后端提供删除接口')
  deleteDialogVisible.value = false
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    
    if (isEdit.value) {
      // 修改模板
      const submitData = {
        id: formData.id,
        remark: formData.remark,
        content: formData.content
      }
      const res = await updateMessageTemplate(submitData)
      if (res.code === 200) {
        ElMessage.success('修改成功')
        dialogVisible.value = false
        fetchTemplates()
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    } else {
      // 新增模板 - API文档中没有新增接口，暂时提示
      ElMessage.info('新增功能待后端提供新增接口')
    }
  } catch (error) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error(isEdit.value ? '修改失败' : '新增失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    id: null,
    name: '',
    remark: '',
    content: ''
  })
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchTemplates()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchTemplates()
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.message-templates {
  padding: 20px;
}

.table-container {
  background: white;
  border-radius: 8px;
  margin-top: 16px;
}

.template-table {
  border-radius: 8px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.total-count {
  font-size: 14px;
  color: #606266;
}

.action-btn {
  margin-right: 8px;
  color: #409eff;
}

.delete-btn {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.action-buttons {
  display: flex;
  gap: 1px;
  align-items: center;
  justify-content: center;
}

.action-buttons .el-button {
  padding: 0 6px;
  height: 28px;
}
</style>
