<template>
  <div class="user-management">
    <!-- 筛选条件栏 -->
    <FilterBar
      :create-button-text="'新增用户'"
      :fields="filterFields"
      @create="handleCreate"
      @filter="handleFilter"
    />

    <!-- 用户列表表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        class="user-table"
        @selection-change="handleSelectionChange"
        :header-cell-style="{ backgroundColor: '#fafafa', color: '#262626', fontWeight: '500' }"
      >
        <!-- 选择框 -->
        <el-table-column type="selection" width="50" align="center" />

        <!-- 姓名 -->
        <el-table-column prop="name" label="姓名" min-width="100" align="center" />

        <!-- 状态 -->
        <el-table-column label="状态" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'info'" size="small">
              {{ row.status === 0 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 手机号 -->
        <el-table-column prop="username" label="手机号" min-width="130" align="center" />

        <!-- 警号 -->
        <el-table-column prop="policeNumber" label="警号" min-width="100" align="center" />

        <!-- 身份证号 -->
        <el-table-column prop="idCard" label="身份证号" min-width="160" align="center">
          <template #default="{ row }">
            {{ maskIdCard(row.idCard) }}
          </template>
        </el-table-column>

        <!-- 组织 -->
        <el-table-column prop="orgName" label="组织" min-width="120" align="center" />

        <!-- 创建时间 -->
        <el-table-column prop="createTime" label="创建时间" min-width="160" align="center" />

        <!-- 操作 -->
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="text" @click="handleView(row)" class="action-btn" size="small">
              查看
            </el-button>
            <el-button type="text" @click="handleEdit(row)" class="action-btn" size="small">
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleDropdownAction(command, row)">
              <el-button type="text" class="action-btn more-btn" size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作和分页 -->
      <div class="table-footer">
        <div class="batch-actions">
          <el-dropdown @command="handleBatchAction" :disabled="selectedUsers.length === 0">
            <el-button :disabled="selectedUsers.length === 0">
              批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="enable">启用</el-dropdown-item>
                <el-dropdown-item command="disable">禁用</el-dropdown-item>
                <el-dropdown-item command="transfer" divided>转移部门</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span class="selected-info" v-if="selectedUsers.length > 0">
            已选择 {{ selectedUsers.length }} 项
          </span>
        </div>

        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="1060px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <!-- 基本信息行 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="姓名" prop="name" required>
              <el-input v-model="formData.name" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="手机号" prop="username" required>
              <el-input v-model="formData.username" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="警号" prop="policeNumber">
              <el-input v-model="formData.policeNumber" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="formData.idCard" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 组织状态行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="归属组织" prop="orgId">
              <el-tree-select
                v-model="formData.orgId"
                :data="orgTreeData"
                :props="{ 
                  children: 'children', 
                  label: 'orgName', 
                  value: 'id',
                  isLeaf: 'isLeaf'
                }"
                :load="loadOrgChildren"
                lazy
                placeholder="请选择"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="0">正常</el-radio>
                <el-radio :value="1">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 批量添加区域 -->
        <div v-if="!isEdit" style="margin-bottom: 20px; padding: 16px; background-color: #fafafa; border-radius: 4px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <el-icon style="margin-right: 8px; color: #409EFF;"><Plus /></el-icon>
            <span style="font-weight: 500;">添加用户 ({{ batchUserCount }}/50)</span>
          </div>
          
          <el-form-item style="margin-bottom: 0;">
            <el-input
              v-model="batchUserInput"
              type="textarea"
              :rows="4"
              placeholder="一行一个用户，格式：姓名,手机号,警号,身份证号&#10;示例：&#10;张三,13800138000,001,110101199001011234&#10;李四,13900139000,002,110101199002022345"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <!-- 密码设置区域 -->
        <div v-if="!isEdit" style="margin-bottom: 20px;">
          <div style="margin-bottom: 12px; font-weight: 500;">密码设置</div>
          
          <el-row>
            <el-col :span="24">
              <el-form-item>
                <el-radio-group v-model="passwordType">
                  <el-radio value="phone">手机号后六位</el-radio>
                  <el-radio value="custom">自定义密码</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="passwordType === 'custom'">
            <el-col :span="12">
              <el-form-item prop="customPassword">
                <el-input
                  v-model="formData.customPassword"
                  type="password"
                  placeholder="6-32位"
                  show-password
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 初次登录密码修改设置 -->
        <div v-if="!isEdit" style="margin-bottom: 20px;">
          <div style="margin-bottom: 12px; font-weight: 500;">初次登录是否需要修改密码</div>
          
          <el-row>
            <el-col :span="24">
              <el-form-item>
                <el-radio-group v-model="needChangePasswordOption">
                  <el-radio :value="1">需要修改</el-radio>
                  <el-radio :value="0">不需要</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户详情查看对话框 -->
    <el-dialog
      title="用户详情"
      v-model="detailDialogVisible"
      width="600px"
    >
      <el-descriptions
        v-if="currentDetailUser"
        :column="2"
        border
        size="large"
      >
        <el-descriptions-item label="姓名">
          {{ currentDetailUser.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ currentDetailUser.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="警号">
          {{ currentDetailUser.policeNumber || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="身份证号">
          {{ currentDetailUser.idCard || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属组织">
          {{ currentDetailUser.orgName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户状态">
          <el-tag :type="currentDetailUser.status === 0 ? 'success' : 'info'">
            {{ currentDetailUser.status === 0 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ currentDetailUser.createTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="是否需要修改密码" :span="2">
          <el-tag :type="currentDetailUser.needChangePassword === 1 ? 'warning' : 'success'">
            {{ currentDetailUser.needChangePassword === 1 ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="教师标识" :span="2">
          <el-tag :type="currentDetailUser.teacher === 1 ? 'primary' : 'info'">
            {{ currentDetailUser.teacher === 1 ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">
          编辑用户
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      title="重置密码"
      v-model="passwordDialogVisible"
      width="400px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPassword" :loading="passwordLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 转移部门对话框 -->
    <el-dialog
      title="转移部门"
      v-model="transferDialogVisible"
      width="500px"
    >
      <div style="margin-bottom: 16px; color: #666;">
        <span>将选中的 {{ selectedUsers.length }} 个用户转移到新部门</span>
      </div>
      <el-form
        ref="transferFormRef"
        :model="transferForm"
        :rules="transferRules"
        label-width="100px"
      >
        <el-form-item label="目标组织" prop="targetOrgId">
          <el-tree-select
            v-model="transferForm.targetOrgId"
            :data="orgTreeData"
            :props="{ 
              children: 'children', 
              label: 'orgName', 
              value: 'id',
              isLeaf: 'isLeaf'
            }"
            :load="loadOrgChildren"
            lazy
            placeholder="请选择目标组织"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransferConfirm" :loading="transferLoading">
          确定转移
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, ArrowDown, Plus } from '@element-plus/icons-vue'
import FilterBar from '@/components/common/FilterBar.vue'
import {
  getUserList,
  getUserDetail,
  updateUser,
  deleteUser,
  updateUserPassword,
  batchSaveUsers
} from '@/api/system-management/User.js'
import { getOrgList } from '@/api/system-management/Org.js'

// 响应式数据
const formRef = ref()
const passwordFormRef = ref()
const transferFormRef = ref()
const tableData = ref([])
const orgTreeData = ref([])
const selectedUsers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const transferDialogVisible = ref(false)
const submitLoading = ref(false)
const passwordLoading = ref(false)
const transferLoading = ref(false)
const isEdit = ref(false)
const currentEditUser = ref(null)
const currentDetailUser = ref(null)

// 分页数据
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件配置
const filterFields = [
  {
    type: 'input',
    model: 'param',
    placeholder: '姓名、手机号、警号、身份证号',
    defaultValue: ''
  },
  {
    type: 'select',
    model: 'orgId',
    placeholder: '组织名称',
    options: [],
    defaultValue: ''
  },
  {
    type: 'select',
    model: 'status',
    placeholder: '状态',
    options: [
      { label: '全部', value: '' },
      { label: '正常', value: 0 },
      { label: '禁用', value: 1 }
    ],
    defaultValue: ''
  }
]

// 当前筛选条件
const currentFilters = ref({})

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  username: '',
  policeNumber: '',
  idCard: '',
  orgId: null,
  status: 0,
  password: '',
  customPassword: ''
})

// 新增用户相关数据
const batchUserInput = ref('')
const passwordType = ref('phone') // phone: 手机号后六位, custom: 自定义密码
const needChangePasswordOption = ref(1) // 1: 需要修改, 0: 不需要

// 密码表单
const passwordForm = reactive({
  id: null,
  password: ''
})

// 转移部门表单
const transferForm = reactive({
  targetOrgId: null
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  policeNumber: [
    { required: true, message: '请输入警号', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  orgId: [
    { required: true, message: '请选择组织', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  customPassword: [
    { required: true, message: '请输入自定义密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度应在6-32位之间', trigger: 'blur' }
  ]
}

// 密码表单验证规则
const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 转移部门验证规则
const transferRules = {
  targetOrgId: [
    { required: true, message: '请选择目标组织', trigger: 'change' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑用户' : '新增用户'
})

// 计算批量用户数量
const batchUserCount = computed(() => {
  if (!batchUserInput.value.trim()) return 0
  return batchUserInput.value.trim().split('\n').filter(line => line.trim()).length
})

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      pagination: true,
      ...currentFilters.value
    }
    
    const response = await getUserList(params)
    if (response.code === 200) {
      // 接口返回的数据在 records 字段中，直接使用后端返回的 orgName
      tableData.value = response.data?.records || []
      pagination.total = response.data?.total || 0
    } else {
      ElMessage.error(response.msg || '获取用户列表失败')
      tableData.value = []
      pagination.total = 0
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    console.error('获取用户列表错误:', error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 获取组织树数据（用于筛选条件和对话框）
const fetchOrgTree = async () => {
  try {
    const response = await getOrgList({
      orgId: '1',
      personnel: false
    })
    
    if (response.code === 200) {
      const orgData = response.data
      
      // 将根组织本身作为树的根节点
      const rootNode = {
        id: orgData.id,
        orgName: orgData.orgName,
        parentId: orgData.parentId,
        children: orgData.children || [],
        isLeaf: false
      }
      
      // 为子组织添加 isLeaf 标识
      const processChildren = (nodes) => {
        return (nodes || []).map(node => ({
          id: node.id,
          orgName: node.orgName,
          parentId: node.parentId,
          children: [], // 初始化为空数组，懒加载时填充
          isLeaf: false // 所有子组织都设为非叶子节点，允许懒加载检查
        }))
      }
      
      rootNode.children = processChildren(rootNode.children)
      
      // 组织树包含根节点
      orgTreeData.value = [rootNode]
      
      // 更新筛选条件中的组织选项 - 包含根组织和子组织
      const orgOptions = [{ label: '全部', value: '' }]
      
      // 添加根组织
      orgOptions.push({
        label: orgData.orgName,
        value: orgData.id
      })
      
      // 添加子组织
      ;(orgData.children || []).forEach(org => {
        orgOptions.push({
          label: org.orgName,
          value: org.id
        })
      })
      
      const orgField = filterFields.find(field => field.model === 'orgId')
      if (orgField) {
        orgField.options = orgOptions
      }
    }
  } catch (error) {
    console.error('获取组织树错误:', error)
  }
}

// 懒加载组织树子节点（用于对话框中的 el-tree-select）
const loadOrgChildren = async (node, resolve) => {
  if (node.level === 0) {
    // 根节点，返回已加载的数据
    return resolve(orgTreeData.value)
  }
  
  try {
    const response = await getOrgList({
      orgId: node.data.id,
      personnel: false
    })
    
    if (response.code === 200) {
      const orgData = response.data
      // API 返回的 children 可能是 null 或数组
      const children = orgData?.children
      
      // 如果 children 为 null 或空数组，说明没有子节点
      if (!children || children.length === 0) {
        return resolve([])
      }
      
      // 处理子节点：children 字段为 null 表示需要懒加载，不是叶子节点
      const processedChildren = children.map(child => ({
        id: child.id,
        orgName: child.orgName,
        parentId: child.parentId,
        children: [], // 初始化为空数组
        isLeaf: false // children 为 null 时，默认不是叶子节点，允许懒加载
      }))
      
      resolve(processedChildren)
    } else {
      resolve([])
    }
  } catch (error) {
    console.error('加载组织子节点错误:', error)
    resolve([])
  }
}

// 身份证号脱敏
const maskIdCard = (idCard) => {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})\d*(\d{4})/, '$1****$2')
}

// 筛选处理
const handleFilter = (filters) => {
  currentFilters.value = filters
  pagination.pageNum = 1
  fetchUserList()
}

// 从详情页跳转到编辑
const handleEditFromDetail = () => {
  detailDialogVisible.value = false
  if (currentDetailUser.value) {
    const userData = currentDetailUser.value
    isEdit.value = true
    currentEditUser.value = userData
    formData.id = userData.id
    formData.name = userData.name
    formData.username = userData.username
    formData.policeNumber = userData.policeNumber
    formData.idCard = userData.idCard
    formData.orgId = userData.orgId
    formData.status = userData.status
    dialogVisible.value = true
  }
}

// 新增用户
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 查看用户详情
const handleView = async (row) => {
  try {
    const response = await getUserDetail(row.id)
    if (response.code === 200) {
      currentDetailUser.value = response.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(response.msg || '获取用户详情失败')
    }
  } catch (error) {
    ElMessage.error('获取用户详情失败')
    console.error('获取用户详情错误:', error)
  }
}

// 编辑用户（使用详情接口获取最新数据）
const handleEdit = async (row) => {
  try {
    isEdit.value = true
    const response = await getUserDetail(row.id)
    if (response.code === 200) {
      const userData = response.data
      currentEditUser.value = userData
      formData.id = userData.id
      formData.name = userData.name
      formData.username = userData.username
      formData.policeNumber = userData.policeNumber
      formData.idCard = userData.idCard
      formData.orgId = userData.orgId
      formData.status = userData.status
      dialogVisible.value = true
    } else {
      ElMessage.error(response.msg || '获取用户信息失败')
    }
  } catch (error) {
    // 如果获取详情失败，使用表格数据作为备选
    ElMessage.warning('无法获取最新用户信息，使用当前显示数据')
    currentEditUser.value = row
    formData.id = row.id
    formData.name = row.name
    formData.username = row.username
    formData.policeNumber = row.policeNumber
    formData.idCard = row.idCard
    formData.orgId = row.orgId
    formData.status = row.status
    dialogVisible.value = true
  }
}

// 下拉操作处理
const handleDropdownAction = (command, row) => {
  switch (command) {
    case 'resetPassword':
      currentEditUser.value = row
      passwordForm.id = row.id
      passwordForm.password = ''
      passwordDialogVisible.value = true
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户"${row.name}"吗？`,
      '删除确认',
      { type: 'warning' }
    )
    
    const response = await deleteUser(row.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      fetchUserList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除用户错误:', error)
    }
  }
}

// 表格选择处理
const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

// 批量操作处理
const handleBatchAction = async (command) => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要操作的用户')
    return
  }

  // 转移部门单独处理
  if (command === 'transfer') {
    transferForm.targetOrgId = null
    transferDialogVisible.value = true
    return
  }

  let actionText = ''
  let newStatus = null
  
  switch (command) {
    case 'enable':
      actionText = '启用'
      newStatus = 0
      break
    case 'disable':
      actionText = '禁用'
      newStatus = 1
      break
    case 'delete':
      actionText = '删除'
      break
  }

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}选中的 ${selectedUsers.value.length} 个用户吗？`,
      `批量${actionText}确认`,
      { type: 'warning' }
    )

    if (command === 'delete') {
      // 批量删除
      const promises = selectedUsers.value.map(user => deleteUser(user.id))
      await Promise.all(promises)
    } else {
      // 批量更新状态
      const promises = selectedUsers.value.map(user => 
        updateUser({ ...user, status: newStatus })
      )
      await Promise.all(promises)
    }

    ElMessage.success(`批量${actionText}成功`)
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`批量${actionText}失败`)
      console.error(`批量${actionText}错误:`, error)
    }
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.pageNum = 1
  fetchUserList()
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchUserList()
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    
    if (isEdit.value) {
      // 编辑用户
      const response = await updateUser(formData)
      if (response.code === 200) {
        ElMessage.success('修改成功')
        dialogVisible.value = false
        fetchUserList()
      } else {
        ElMessage.error(response.msg || '修改失败')
      }
    } else {
      // 新增用户 - 处理批量和单个用户
      const users = []
      
      // 检查是否有批量用户输入
      if (batchUserInput.value.trim()) {
        // 解析批量用户数据
        const lines = batchUserInput.value.trim().split('\n')
        for (const line of lines) {
          const parts = line.split(',').map(part => part.trim())
          if (parts.length >= 2) {
            const [name, phone, policeNumber = '', idCard = ''] = parts
            users.push({
              name,
              username: phone,
              policeNumber,
              idCard,
              orgId: formData.orgId
            })
          }
        }
      } else {
        // 单个用户
        users.push({
          username: formData.username,
          policeNumber: formData.policeNumber,
          idCard: formData.idCard,
          name: formData.name,
          orgId: formData.orgId
        })
      }
      
      // 确定密码
      let password = ''
      if (passwordType.value === 'phone') {
        // 使用手机号后六位（这里使用单个用户的手机号，或第一个批量用户的手机号）
        const phone = users.length > 0 ? users[0].username : formData.username
        password = phone.slice(-6)
      } else {
        password = formData.customPassword
      }
      
      const userData = {
        password: password,
        needChangePassword: needChangePasswordOption.value,
        users: users
      }
      
      const response = await batchSaveUsers(userData)
      if (response.code === 200) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        fetchUserList()
      } else {
        ElMessage.error(response.msg || '新增失败')
      }
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error('操作失败')
      console.error('提交表单错误:', error)
    }
  } finally {
    submitLoading.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  try {
    await passwordFormRef.value.validate()
    
    passwordLoading.value = true
    
    const response = await updateUserPassword(passwordForm)
    if (response.code === 200) {
      ElMessage.success('密码重置成功')
      passwordDialogVisible.value = false
    } else {
      ElMessage.error(response.msg || '密码重置失败')
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error('密码重置失败')
      console.error('重置密码错误:', error)
    }
  } finally {
    passwordLoading.value = false
  }
}

// 转移部门确认
const handleTransferConfirm = async () => {
  try {
    await transferFormRef.value.validate()
    
    transferLoading.value = true
    
    // 批量更新用户组织
    const promises = selectedUsers.value.map(user => 
      updateUser({ ...user, orgId: transferForm.targetOrgId })
    )
    
    await Promise.all(promises)
    
    ElMessage.success('部门转移成功')
    transferDialogVisible.value = false
    fetchUserList()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('部门转移失败')
      console.error('转移部门错误:', error)
    }
  } finally {
    transferLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.username = ''
  formData.policeNumber = ''
  formData.idCard = ''
  formData.orgId = null
  formData.status = 0
  formData.password = ''
  formData.customPassword = ''
  
  // 重置新增用户相关字段
  batchUserInput.value = ''
  passwordType.value = 'phone'
  needChangePasswordOption.value = 1
  
  formRef.value?.resetFields()
}

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 页面初始化
onMounted(() => {
  fetchOrgTree()
  fetchUserList()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 16px;
  overflow: hidden;
}

.user-table {
  width: 100%;
}

/* 表格头部样式 */
.user-table :deep(.el-table__header-wrapper) {
  background-color: #fafafa;
}

.user-table :deep(.el-table__header) {
  color: #262626;
  font-weight: 500;
}

.user-table :deep(.el-table th) {
  background-color: #fafafa !important;
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 8px;
  font-weight: 500;
  color: #262626;
  text-align: center;
}

/* 表格行样式 */
.user-table :deep(.el-table__row) {
  height: 60px;
  transition: background-color 0.2s;
}

.user-table :deep(.el-table__row:hover) {
  background-color: #f8f9fa;
}

.user-table :deep(.el-table td) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 8px;
  text-align: center;
  vertical-align: middle;
}

/* 表格内容样式 */
.user-table :deep(.el-table .cell) {
  padding: 0 8px;
  line-height: 1.5;
  word-break: break-word;
}

/* 操作按钮样式 */
.action-btn {
  padding: 4px 8px;
  font-size: 13px;
  border: none;
  background: none;
  height: auto;
  line-height: 1;
  color: #1890ff;
  margin: 0 2px;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  color: #40a9ff;
  background-color: #e6f7ff;
}

.more-btn {
  padding: 4px 6px;
}

/* 状态标签样式 */
.user-table :deep(.el-tag) {
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
}

/* 表格底部样式 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: white;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-info {
  color: #8c8c8c;
  font-size: 14px;
}

/* 分页样式优化 */
.user-table + .table-footer :deep(.el-pagination) {
  font-size: 14px;
}

.user-table + .table-footer :deep(.el-pagination .el-select .el-input) {
  width: 100px;
}

/* 确保表格列均匀分布 */
.user-table :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.user-table :deep(.el-table__fixed-right) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .user-table :deep(.el-table th),
  .user-table :deep(.el-table td) {
    padding: 12px 6px;
  }
  
  .user-table :deep(.el-table .cell) {
    padding: 0 4px;
  }
}

@media (max-width: 1200px) {
  .user-management {
    padding: 16px;
  }
  
  .table-footer {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .user-table :deep(.el-table th),
  .user-table :deep(.el-table td) {
    padding: 10px 4px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .user-table {
    font-size: 12px;
  }
  
  .action-btn {
    font-size: 12px;
    padding: 2px 4px;
  }
}
</style>