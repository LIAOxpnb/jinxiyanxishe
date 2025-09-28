<template>
  <div class="message-management">
    <FilterBar
      :create-button-text="'新增信息'"
      :fields="filterFields"
      @create="handleCreate"
      @filter="handleFilter"
    />

    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        class="message-table"
        :header-cell-style="{ backgroundColor: '#fafafa', color: '#262626', fontWeight: '500' }"
      >
        <el-table-column prop="content" label="推送内容" min-width="200" align="left" />
        <el-table-column prop="id" label="消息编号" min-width="120" align="center" />
        <el-table-column prop="creator" label="操作者" min-width="120" align="center">
          <template #default="scope">
            {{ scope.row.creator || '用户名 (ID)' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="推送时间" min-width="180" align="center">
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

    <!-- 新增/编辑消息对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="消息内容" prop="content" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="5"
            placeholder="请输入消息内容"
            style="width: 100%"
            maxlength="500"
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
      title="删除消息"
      v-model="deleteDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 20px; font-size: 14px;">
        确定要删除该消息吗？删除后不可恢复。
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
import { getMessageList, createMessage, updateMessage, getMessageDetail, deleteMessage } from '../../api/system-management/Message-Management.js'

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
    model: 'content',
    placeholder: '搜索',
    defaultValue: ''
  }
]

const currentFilters = ref({})

const formData = reactive({
  id: null,
  content: ''
})

const formRules = {
  content: [
    { required: true, message: '请输入消息内容', trigger: 'blur' },
    { min: 1, max: 500, message: '消息内容长度在 1 到 500 个字符', trigger: 'blur' }
  ]
}

const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentDeleteRow = ref(null)

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑消息' : '新增消息'
})

// 格式化时间
const formatTime = (time) => {
  if (!time) return 'YY-MM-DD HH:mm:ss'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-')
}

// 获取消息列表
const fetchMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...currentFilters.value
    }
    
    const res = await getMessageList(params)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
    ElMessage.error('获取消息列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选处理
const handleFilter = (filters) => {
  currentFilters.value = filters
  pagination.page = 1
  fetchMessages()
}

// 新增消息
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑消息
const handleEdit = async (row) => {
  try {
    // 先获取消息详情
    const res = await getMessageDetail(row.id)
    if (res.code === 200 && res.data) {
      isEdit.value = true
      Object.assign(formData, {
        id: row.id,
        content: res.data.content || row.content
      })
      dialogVisible.value = true
    } else {
      ElMessage.error('获取消息详情失败')
    }
  } catch (error) {
    console.error('获取消息详情失败:', error)
    ElMessage.error('获取消息详情失败')
  }
}

// 删除消息
const handleDelete = (row) => {
  currentDeleteRow.value = row
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!currentDeleteRow.value) return
  
  deleteLoading.value = true
  try {
    const res = await deleteMessage(currentDeleteRow.value.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      deleteDialogVisible.value = false
      fetchMessages()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  } finally {
    deleteLoading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    
    const submitData = {
      content: formData.content
    }
    
    if (isEdit.value) {
      submitData.id = formData.id
      const res = await updateMessage(submitData)
      if (res.code === 200) {
        ElMessage.success('修改成功')
        dialogVisible.value = false
        fetchMessages()
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    } else {
      const res = await createMessage(submitData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        fetchMessages()
      } else {
        ElMessage.error(res.msg || '新增失败')
      }
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
    content: ''
  })
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchMessages()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchMessages()
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.message-management {
  padding: 20px;
}

.table-container {
  background: white;
  border-radius: 8px;
  margin-top: 16px;
}

.message-table {
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
