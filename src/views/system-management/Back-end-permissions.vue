<template>
  <div class="backend-permissions">
    <!-- <div class="notice-banner">
      <span class="notice-text">
        <strong>【备注】</strong>仅添加了后管权限的用户顶部导航才可见系统管理，并根据权限能操作哪些功能模块
      </span>
    </div> -->

    <FilterBar
      :create-button-text="'新增角色'"
      :fields="filterFields"
      @create="handleCreate"
      @filter="handleFilter"
    />

    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        class="permissions-table"
        @selection-change="handleSelectionChange"
        :header-cell-style="{ backgroundColor: '#fafafa', color: '#262626', fontWeight: '500' }"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="name" label="角色名称" min-width="150" align="center" />
        <el-table-column prop="userCount" label="授权人数" min-width="100" align="center" />
        <el-table-column prop="createBy" label="创建人" min-width="120" align="center" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" align="center" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="text" @click="handleAssign(row)" class="action-btn" size="small">
                人员
              </el-button>
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

    <!-- 新增/编辑角色对话框 -->
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
        <el-form-item label="角色名称" prop="name" required>
          <el-input
            v-model="formData.name"
            placeholder="请输入角色名称"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="权限配置" prop="roleDetailsList">
          <div class="permissions-config">
            <!-- 权限搜索框 -->
            <div class="permission-search">
              <el-input
                v-model="permissionSearchText"
                placeholder="搜索权限"
                clearable
                @input="handlePermissionSearch"
                style="margin-bottom: 12px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            
            <el-tree
              ref="permissionTreeRef"
              :data="filteredPermissionTreeData"
              :props="treeProps"
              show-checkbox
              node-key="dictId"
              :default-checked-keys="defaultCheckedKeys"
              :check-strictly="false"
              :filter-node-method="filterPermissionNode"
              class="permission-tree"
            />
          </div>
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
      title="删除角色"
      v-model="deleteDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 20px; font-size: 14px;">
        确定要删除该角色吗？删除后不可恢复。
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 授权人员对话框 -->
    <el-dialog
      title="授权人员"
      v-model="assignDialogVisible"
      width="900px"
      :before-close="handleAssignDialogClose"
    >
      <FilterBar
        :create-button-text="'添加人员'"
        :fields="userFilterFields"
        @create="handleAddUser"
        @filter="handleUserFilter"
      />

      <div class="assign-table-container">
        <el-table
          :data="assignedUsers"
          style="width: 100%"
          v-loading="assignLoading"
          @selection-change="handleUserSelectionChange"
          :header-cell-style="{ backgroundColor: '#fafafa', color: '#262626', fontWeight: '500' }"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="userName" label="用户姓名" min-width="100" align="center" />
          <el-table-column prop="phone" label="手机号" min-width="130" align="center" />
          <el-table-column prop="jobNumber" label="学号" min-width="100" align="center" />
          <el-table-column prop="orgType" label="组织类型" min-width="100" align="center" />
          <el-table-column prop="roleName" label="角色" min-width="100" align="center" />
          <el-table-column label="操作" width="80" fixed="right" align="center">
            <template #default="{ row }">
              <el-button 
                type="text" 
                @click="handleRemoveUser(row)" 
                class="action-btn delete-btn" 
                size="small"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div class="batch-operations" style="margin-top: 16px;">
          <el-checkbox v-model="selectAllUsers" @change="handleSelectAllUsers">
            批量操作
          </el-checkbox>
          <el-button 
            v-if="selectedUsers.length > 0" 
            type="danger" 
            size="small" 
            @click="handleBatchRemove"
            style="margin-left: 16px;"
          >
            批量移除 ({{ selectedUsers.length }})
          </el-button>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加人员弹窗 -->
    <el-dialog v-model="addMemberDialogVisible" title="添加人员" width="1000px" :close-on-click-modal="false">
      <div class="add-member-dialog">
        <!-- 左侧：用户树形选择 -->
        <div class="user-tree-section">
          <!-- 搜索框 -->
          <div class="search-section">
            <el-input v-model="userSearchKeyword" placeholder="姓名、手机号、警号、身份证号" @input="handleUserSearch" clearable>
              <template #append>
                <el-button @click="handleUserSearch">
                  <el-icon>
                    <Search />
                  </el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- 用户树 -->
          <div class="user-tree-container">
            <!-- 搜索结果 -->
            <div v-if="userSearchKeyword" class="search-results">
              <div class="search-tip">
                包含 "{{ userSearchKeyword }}" 的搜索结果
              </div>
              <div v-for="user in searchedUsers" :key="user.id" class="user-item search-result" :class="{ 'in-role': assignedUsers.some(member => member.id === user.id) }">
                <el-checkbox v-model="user.checked" @change="handleUserCheck(user)">
                  <div class="user-info">
                    <el-avatar :size="24" :src="user.avatar">
                      <el-icon>
                        <User />
                      </el-icon>
                    </el-avatar>
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-dept">{{ user.department }}</span>
                    <el-tag v-if="assignedUsers.some(member => member.id === user.id)" type="success" size="small" class="in-role-tag">
                      已有角色
                    </el-tag>
                  </div>
                </el-checkbox>
                <div v-if="user.checked" class="checked-notice">
                  【备注】已选定的，搜索结果展示为灰色，如取消勾选，右侧同步取消
                </div>
              </div>
            </div>

            <!-- 组织树 -->
            <div v-else class="org-tree">
              <el-tree :data="orgTreeData" :props="{ children: 'children', label: 'name' }" show-checkbox node-key="id"
                :default-expand-all="true" @check="handleOrgTreeCheck">
                <template #default="{ node, data }">
                  <div class="tree-node">
                    <el-icon v-if="data.type === 'org'" class="org-icon">
                      <OfficeBuilding />
                    </el-icon>
                    <el-avatar v-else :size="20" :src="data.avatar">
                      <el-icon>
                        <User />
                      </el-icon>
                    </el-avatar>
                    <span class="node-label">{{ data.name }}</span>
                    <span v-if="data.type === 'user'" class="user-dept">{{ data.department }}</span>
                    <el-tag v-if="data.type === 'user' && assignedUsers.some(member => member.id === data.originalId)" type="success" size="small" class="in-role-tag">
                      已有角色
                    </el-tag>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
        </div>

        <!-- 右侧：已选用户 -->
        <div class="selected-users-section">
          <div class="section-header">
            <span>已选：{{ selectedNewUsers.length }} 名用户</span>
            <el-button type="text" @click="clearSelectedNewUsers">清空</el-button>
          </div>

          <div class="selected-users-list">
            <div v-for="user in selectedNewUsers" :key="user.id" class="selected-user-item">
              <el-avatar :size="32" :src="user.avatar">
                <el-icon>
                  <User />
                </el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-dept">{{ user.department }}</div>
              </div>
              <el-button type="text" class="remove-btn" @click="removeSelectedNewUser(user)">
                <el-icon>
                  <Close />
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addMemberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAddMembers">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User, OfficeBuilding, Close } from '@element-plus/icons-vue'
import FilterBar from '@/components/common/FilterBar.vue'
import { getRoleList, saveRole, getRoleDetail, updateRole, grantUserRole, revokeUserRole } from '@/api/system-management/Back-end-permissions'
import { getDictByType } from '@/api/system-management/dictionary'
import { getUserList } from '@/api/system-management/User'
import { getOrgTree } from '@/api/system-management/Org'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const selectedRoles = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const filterFields = [
  {
    type: 'input',
    model: 'name',
    placeholder: '角色名称',
    defaultValue: ''
  }
]

// 人员筛选字段配置
const userFilterFields = [
  {
    type: 'input',
    model: 'userName',
    placeholder: '用户姓名',
    defaultValue: ''
  },
  {
    type: 'input',
    model: 'phone',
    placeholder: '手机号',
    defaultValue: ''
  },
  {
    type: 'input',
    model: 'jobNumber',
    placeholder: '学号',
    defaultValue: ''
  },
  {
    type: 'select',
    model: 'orgType',
    placeholder: '组织',
    defaultValue: '',
    options: [
      { label: '全部', value: '' },
      { label: '组织A', value: 'A' },
      { label: '组织B', value: 'B' }
    ]
  }
]

const currentFilters = ref({})

const formData = reactive({
  id: null,
  name: '',
  roleDetailsList: []
})

const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const assignDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const permissionTreeRef = ref(null)
const currentDeleteRow = ref(null)
const currentAssignRole = ref(null)

// 人员管理相关数据
const assignedUsers = ref([])
const selectedUsers = ref([])
const assignLoading = ref(false)
const selectAllUsers = ref(false)
const currentUserFilters = ref({})

// 添加人员弹窗相关数据
const addMemberDialogVisible = ref(false)
const userSearchKeyword = ref('')
const searchedUsers = ref([])
const selectedNewUsers = ref([])
const orgTreeData = ref([])

// 权限树相关数据
const permissionTreeData = ref([])
const defaultCheckedKeys = ref([])
const permissionSearchText = ref('')
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'dictId'
}

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑角色' : '新增角色'
})

// 过滤后的权限树数据
const filteredPermissionTreeData = computed(() => {
  if (!permissionSearchText.value) {
    return permissionTreeData.value
  }
  
  const filterTree = (nodes) => {
    return nodes.filter(node => {
      // 检查当前节点是否匹配
      const matchesSearch = node.name.toLowerCase().includes(permissionSearchText.value.toLowerCase())
      
      // 如果有子节点，递归过滤子节点
      if (node.children && node.children.length > 0) {
        const filteredChildren = filterTree(node.children)
        // 如果当前节点匹配或有匹配的子节点，则保留
        if (matchesSearch || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren
          }
        }
        return false
      }
      
      // 叶子节点直接返回匹配结果
      return matchesSearch
    }).filter(Boolean)
  }
  
  return filterTree(permissionTreeData.value)
})

// 从接口获取权限树数据
const initPermissionTreeData = async () => {
  try {
    const res = await getDictByType('sys_role')
    console.log('获取权限字典数据:', res) // 调试日志
    
    if (res.code === 200 && res.data) {
      // 将接口返回的数据转换为权限树格式
      permissionTreeData.value = res.data.map(item => ({
        dictId: item.id,           // id 对应 dictId
        name: item.dictLabel,      // dictLabel 对应 name
        rolePath: item.dictValue   // dictValue 对应 rolePath
      }))
      
      console.log('转换后的权限树数据:', permissionTreeData.value) // 调试日志
    } else {
      console.error('获取权限字典失败:', res.msg)
      ElMessage.error('获取权限数据失败')
      // 如果接口失败，使用默认数据作为备份
      permissionTreeData.value = [
        {
          dictId: 5,
          name: '所有权限',
          rolePath: '*'
        }
      ]
    }
  } catch (error) {
    console.error('获取权限字典失败:', error)
    ElMessage.error('获取权限数据失败')
    // 错误时使用默认数据
    permissionTreeData.value = [
      {
        dictId: 5,
        name: '所有权限',
        rolePath: '*'
      }
    ]
  }
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      pagination: true,
      ...currentFilters.value
    }
    
    const res = await getRoleList(params)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = (filters) => {
  currentFilters.value = filters
  pagination.page = 1
  fetchRoles()
}

// 处理权限搜索
const handlePermissionSearch = () => {
  // 搜索逻辑已在 filteredPermissionTreeData 计算属性中处理
  // 这里可以添加额外的搜索逻辑，比如高亮匹配文本等
}

// 权限树节点过滤方法（备用）
const filterPermissionNode = (value, data) => {
  if (!value) return true
  return data.name.toLowerCase().includes(value.toLowerCase())
}

const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true
  
  try {
    // 调用API获取角色详情
    const res = await getRoleDetail(row.id)
    console.log('获取角色详情API返回:', res) // 调试日志
    
    if (res.code === 200 && res.data) {
      console.log('角色详情数据:', res.data) // 调试日志
      console.log('权限列表:', res.data.roleDetailsList) // 调试日志
      
      Object.assign(formData, {
        id: res.data.id,
        name: res.data.name,
        roleDetailsList: res.data.roleDetailsList || []
      })
      
      // 先打开对话框
      dialogVisible.value = true
      
      // 等待DOM更新后设置权限树的选中状态
      await nextTick()
      if (permissionTreeRef.value) {
        const checkedKeys = formData.roleDetailsList.map(item => item.dictId)
        console.log('设置选中的权限ID:', checkedKeys) // 调试日志
        console.log('权限树数据:', permissionTreeData.value) // 调试日志
        console.log('权限树组件:', permissionTreeRef.value) // 调试日志
        
        // 检查权限树中是否存在这些ID
        const flattenTree = (nodes) => {
          let result = []
          nodes.forEach(node => {
            result.push(node.dictId)
            if (node.children) {
              result = result.concat(flattenTree(node.children))
            }
          })
          return result
        }
        const allTreeIds = flattenTree(permissionTreeData.value)
        console.log('权限树所有可用ID:', allTreeIds)
        console.log('要选中的ID是否存在:', checkedKeys.map(id => ({id, exists: allTreeIds.includes(id)})))
        
        permissionTreeRef.value.setCheckedKeys(checkedKeys)
        
        // 验证设置结果
        setTimeout(() => {
          const actualCheckedKeys = permissionTreeRef.value.getCheckedKeys()
          console.log('实际选中的权限ID:', actualCheckedKeys)
        }, 100)
      }
    } else {
      console.error('API返回错误:', res) // 调试日志
      ElMessage.error('获取角色详情失败')
    }
  } catch (error) {
    console.error('获取角色详情失败:', error)
    ElMessage.error('获取角色详情失败')
  }
}

const handleAssign = async (row) => {
  currentAssignRole.value = row
  assignDialogVisible.value = true
  
  // 获取已授权的用户列表
  await fetchAssignedUsers(row.id)
}

const handleDelete = (row) => {
  currentDeleteRow.value = row
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  // 这里需要添加删除API
  ElMessage.info('删除功能待实现')
  deleteDialogVisible.value = false
}

const handleSelectionChange = (selection) => {
  selectedRoles.value = selection
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    
    // 获取选中的权限
    const checkedNodes = permissionTreeRef.value ? permissionTreeRef.value.getCheckedNodes() : []
    const roleDetailsList = checkedNodes
      .filter(node => !node.children || node.children.length === 0) // 只要叶子节点
      .map(node => ({
        dictId: node.dictId,
        rolePath: node.rolePath
      }))
    
    submitLoading.value = true
    
    const submitData = {
      id: isEdit.value ? formData.id : 0,
      name: formData.name,
      roleDetailsList: roleDetailsList || []
    }
    
    console.log('提交数据:', submitData) // 添加调试日志
    
    if (isEdit.value) {
      await updateRole(submitData)
      ElMessage.success('修改成功')
    } else {
      await saveRole(submitData)
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    fetchRoles()
  } catch (error) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error(isEdit.value ? '修改失败' : '新增失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    id: null,
    name: '',
    roleDetailsList: []
  })
  defaultCheckedKeys.value = []
  
  // 清空权限搜索框
  permissionSearchText.value = ''
  
  // 清空权限树选中状态
  if (permissionTreeRef.value) {
    permissionTreeRef.value.setCheckedKeys([])
  }
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchRoles()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchRoles()
}

// 人员管理相关方法
const fetchAssignedUsers = async (roleId) => {
  assignLoading.value = true
  try {
    // 使用getUserList接口，加上roleId参数获取已授权用户
    const params = {
      pageNum: 1,
      pageSize: 1000,
      roleId: roleId,
      pagination: true,
      ...currentUserFilters.value // 合并筛选条件
    }

    console.log('获取角色用户列表参数:', params)
    
    const response = await getUserList(params)
    
    if (response.code === 200) {
      // 处理返回的用户数据
      const users = response.data.records || response.data || []
      
      assignedUsers.value = users.map(user => ({
        id: user.id,
        userName: user.name || user.userName,
        phone: user.username || user.phone,
        jobNumber: user.policeNumber || user.jobNumber,
        idCard: user.idCard,
        orgName: user.orgName,
        orgType: user.orgType || user.orgName,
        roleName: currentAssignRole.value?.name || '角色名称',
        status: user.status,
        createTime: user.createTime
      }))
      
      console.log('获取到的已授权用户:', assignedUsers.value)
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取已授权用户失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    assignLoading.value = false
  }
}

const handleUserFilter = (filters) => {
  currentUserFilters.value = filters
  // 根据筛选条件重新获取用户列表
  if (currentAssignRole.value) {
    fetchAssignedUsers(currentAssignRole.value.id)
  }
}



const handleUserSelectionChange = (selection) => {
  selectedUsers.value = selection
  selectAllUsers.value = selection.length === assignedUsers.value.length && assignedUsers.value.length > 0
}

const handleSelectAllUsers = (checked) => {
  // TODO: 这里需要通过表格的 ref 来操作全选
  // 暂时通过手动设置来模拟
  if (checked) {
    selectedUsers.value = [...assignedUsers.value]
  } else {
    selectedUsers.value = []
  }
}

const handleRemoveUser = async (user) => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要移除该用户的角色授权吗？',
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      await revokeUserRole({
        roleId: currentAssignRole.value.id,
        userList: [user.id]
      })
      
      ElMessage.success('移除成功')
      // 重新获取用户列表
      await fetchAssignedUsers(currentAssignRole.value.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除用户失败:', error)
      ElMessage.error('移除失败')
    }
  }
}

const handleBatchRemove = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要移除的用户')
    return
  }
  
  try {
    const result = await ElMessageBox.confirm(
      `确定要移除选中的 ${selectedUsers.value.length} 个用户的角色授权吗？`,
      '批量移除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      const userIds = selectedUsers.value.map(user => user.id)
      await revokeUserRole({
        roleId: currentAssignRole.value.id,
        userList: userIds
      })
      
      ElMessage.success(`成功移除 ${selectedUsers.value.length} 个用户`)
      // 重新获取用户列表
      await fetchAssignedUsers(currentAssignRole.value.id)
      // 清空选择
      selectedUsers.value = []
      selectAllUsers.value = false
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量移除用户失败:', error)
      ElMessage.error('批量移除失败')
    }
  }
}

const handleAssignDialogClose = () => {
  assignDialogVisible.value = false
  currentAssignRole.value = null
  assignedUsers.value = []
  selectedUsers.value = []
  selectAllUsers.value = false
  currentUserFilters.value = {}
}

// 添加人员弹窗功能
const handleAddUser = async () => {
  addMemberDialogVisible.value = true
  // 打开弹窗时获取组织树数据
  await fetchOrgTree()
}

// 用户搜索
const handleUserSearch = async () => {
  if (!userSearchKeyword.value.trim()) {
    searchedUsers.value = []
    return
  }

  try {
    const response = await getUserList({
      pageNum: 1,
      pageSize: 50,
      param: userSearchKeyword.value.trim(),
      pagination: true
    })

    if (response.code === 200) {
      searchedUsers.value = response.data.records.map(user => {
        // 尝试多种方式获取部门信息
        let department = user.orgName || user.organizationName || user.deptName || user.department

        // 如果组织树数据已加载，尝试从中查找
        if (!department && orgTreeData.value.length > 0) {
          const findUserInTree = (nodes) => {
            for (const node of nodes) {
              if (node.type === 'user' && node.originalId === user.id) {
                return node.department
              }
              if (node.children && node.children.length > 0) {
                const found = findUserInTree(node.children)
                if (found) return found
              }
            }
            return null
          }

          department = findUserInTree(orgTreeData.value)
        }

        return {
          id: user.id,
          name: user.name,
          department: department || '未知部门',
          avatar: user.avatar || '',
          policeNumber: user.policeNumber || '',
          phone: user.username || '',
          checked: selectedNewUsers.value.some(u => u.id === user.id) || assignedUsers.value.some(member => member.id === user.id)
        }
      })
    }
  } catch (error) {
    ElMessage.error('搜索用户失败')
  }
}

// 获取组织树数据
const fetchOrgTree = async () => {
  try {
    const response = await getOrgTree()
    if (response.code === 200) {
      // 处理组织树数据，添加用户节点
      await processOrgTreeWithUsers(response.data)
    }
  } catch (error) {
    ElMessage.error('获取组织树失败')
  }
}

// 处理组织树并添加用户数据
const processOrgTreeWithUsers = async (orgTree) => {
  try {
    // 递归处理组织树，为每个组织获取其下的用户
    const processTreeNode = async (node) => {
      const processedNode = {
        id: `org_${node.id}`, // 给组织ID添加前缀，避免与用户ID冲突
        name: node.orgName,
        type: 'org',
        children: []
      }

      // 先处理子组织
      const childOrgs = []
      if (node.children && node.children.length > 0) {
        const childNodes = await Promise.all(
          node.children.map(child => processTreeNode(child))
        )
        childOrgs.push(...childNodes)
      }

      // 获取当前组织下的直属用户（不包括子组织的用户）
      const orgUsers = []
      try {
        console.log(`正在获取组织 ${node.orgName} (ID: ${node.id}) 的用户`)

        // 尝试不同的参数组合
        const userParams1 = {
          pageNum: 1,
          pageSize: 1000,
          orgId: node.id,
          pagination: false
        }

        // 尝试参数2 - 不设置teacher参数，获取所有用户
        const userParams2 = {
          pageNum: 1,
          pageSize: 1000,
          orgId: node.id,
          teacher: 0, // 不限制教师
          pagination: false
        }

        // 尝试参数3 - 包含教师和学生
        const userParams3 = {
          pageNum: 1,
          pageSize: 1000,
          orgId: node.id
        }

        console.log('尝试参数1:', userParams1)

        let userResponse = await getUserList(userParams1)

        console.log('参数1响应:', userResponse)

        // 如果第一种方式没有用户，尝试第二种
        if (!userResponse.data || !userResponse.data.records || userResponse.data.records.length === 0) {
          console.log('尝试参数2:', userParams2)
          userResponse = await getUserList(userParams2)
          console.log('参数2响应:', userResponse)
        }

        // 如果还是没有，尝试第三种
        if (!userResponse.data || !userResponse.data.records || userResponse.data.records.length === 0) {
          console.log('尝试参数3:', userParams3)
          userResponse = await getUserList(userParams3)
          console.log('参数3响应:', userResponse)
        }

        if (userResponse.code === 200) {
          if (userResponse.data && userResponse.data.records) {
            console.log(`组织 ${node.orgName} 找到 ${userResponse.data.records.length} 个用户`)

            const users = userResponse.data.records.map(user => ({
              id: `user_${user.id}`, // 给用户ID添加前缀
              originalId: user.id, // 保存原始ID供后续使用
              name: user.name,
              type: 'user',
              department: user.orgName || node.orgName,
              avatar: user.avatar || '',
              policeNumber: user.policeNumber || '',
              phone: user.username || '',
              checked: false
            }))
            orgUsers.push(...users)
          } else if (userResponse.data && Array.isArray(userResponse.data)) {
            // 如果直接返回数组
            console.log(`组织 ${node.orgName} 找到 ${userResponse.data.length} 个用户（数组格式）`)

            const users = userResponse.data.map(user => ({
              id: `user_${user.id}`,
              originalId: user.id,
              name: user.name,
              type: 'user',
              department: user.orgName || node.orgName,
              avatar: user.avatar || '',
              policeNumber: user.policeNumber || '',
              phone: user.username || '',
              checked: false
            }))
            orgUsers.push(...users)
          } else {
            console.log(`组织 ${node.orgName} 没有找到用户数据`)
          }
        } else {
          console.log(`获取组织 ${node.orgName} 用户失败，返回码: ${userResponse.code}`)
        }
      } catch (error) {
        console.error(`获取组织 ${node.orgName} 用户时出错:`, error)
      }

      // 先添加子组织，再添加用户
      processedNode.children = [...childOrgs, ...orgUsers]

      return processedNode
    }

    const processedTree = await Promise.all(
      orgTree.map(node => processTreeNode(node))
    )

    console.log('最终的组织树数据:', processedTree)
    orgTreeData.value = processedTree
  } catch (error) {
    ElMessage.error('处理组织树数据失败')
  }
}

const handleUserCheck = (user) => {
  // 检查用户是否已经有该角色
  const hasRole = assignedUsers.value.some(member => member.id === user.id)

  if (user.checked) {
    // 添加到已选列表
    if (!selectedNewUsers.value.some(u => u.id === user.id)) {
      selectedNewUsers.value.push({
        id: user.id,
        name: user.name,
        department: user.department,
        avatar: user.avatar,
        policeNumber: user.policeNumber,
        phone: user.phone
      })
    }
  } else {
    // 如果用户已经有该角色，不允许取消勾选，重新勾选
    if (hasRole) {
      user.checked = true
      ElMessage.warning('该用户已有此角色，无法取消选择')
      return
    }

    // 从已选列表移除
    const index = selectedNewUsers.value.findIndex(u => u.id === user.id)
    if (index > -1) {
      selectedNewUsers.value.splice(index, 1)
    }
  }
}

const handleOrgTreeCheck = (data, checkedInfo) => {
  // 处理组织树选择
  const { checkedNodes } = checkedInfo
  const users = checkedNodes.filter(node => node.type === 'user')

  // 更新已选用户列表
  selectedNewUsers.value = users.map(user => ({
    id: user.originalId || user.id, // 使用原始ID
    name: user.name,
    department: user.department,
    avatar: user.avatar,
    policeNumber: user.policeNumber,
    phone: user.phone
  }))
}

const clearSelectedNewUsers = () => {
  selectedNewUsers.value = []
  // 清空搜索结果的选中状态
  searchedUsers.value.forEach(user => {
    user.checked = false
  })
}

const removeSelectedNewUser = (user) => {
  const index = selectedNewUsers.value.findIndex(u => u.id === user.id)
  if (index > -1) {
    selectedNewUsers.value.splice(index, 1)
  }

  // 同步更新搜索结果的选中状态
  const searchUser = searchedUsers.value.find(u => u.id === user.id)
  if (searchUser) {
    searchUser.checked = false
  }
}

const confirmAddMembers = async () => {
  if (selectedNewUsers.value.length === 0) {
    ElMessage.warning('请先选择要添加的用户')
    return
  }

  try {
    const userIds = selectedNewUsers.value.map(user => parseInt(user.id))
    await grantUserRole({
      roleId: currentAssignRole.value.id,
      userList: userIds
    })

    ElMessage.success('添加用户成功')
    addMemberDialogVisible.value = false
    selectedNewUsers.value = []
    userSearchKeyword.value = ''
    searchedUsers.value = []
    // 重新获取已分配用户列表
    await fetchAssignedUsers(currentAssignRole.value.id)
  } catch (error) {
    ElMessage.error('添加用户失败')
  }
}

onMounted(async () => {
  await initPermissionTreeData() // 先获取权限数据
  fetchRoles() // 再获取角色列表
})
</script>

<style scoped>
.backend-permissions {
  padding: 20px;
}

.notice-banner {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.notice-text {
  color: #ff4d4f;
  font-size: 14px;
}

.table-container {
  background: white;
  border-radius: 8px;
  margin-top: 16px;
}

.permissions-table {
  border-radius: 8px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px;
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

.permissions-config {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.permission-search {
  margin-bottom: 12px;
}

.permission-tree {
  width: 100%;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node__label) {
  font-size: 14px;
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

/* 人员管理对话框样式 */
.assign-table-container {
  margin-top: 16px;
}

.batch-operations {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
}

.batch-operations .el-checkbox {
  font-weight: 500;
}

/* 添加人员弹窗样式 */
.add-member-dialog {
  display: flex;
  height: 500px;
  gap: 20px;
}

.user-tree-section {
  flex: 1;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  overflow: hidden;
}

.search-section {
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
}

.user-tree-container {
  height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.search-results .search-tip {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.user-name {
  font-weight: 500;
}

.user-dept {
  color: #999;
  font-size: 12px;
}

.checked-notice {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
  padding-left: 24px;
}

.search-result {
  flex-direction: column;
  align-items: flex-start;
}

.search-result.in-role {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
  padding-left: 8px;
}

.in-role-tag {
  margin-left: 8px;
}

.org-tree {
  height: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.org-icon {
  color: #409eff;
}

.node-label {
  font-size: 14px;
}

.selected-users-section {
  width: 320px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
  background-color: #f9f9f9;
}

.selected-users-list {
  height: 420px;
  overflow-y: auto;
  padding: 16px;
}

.selected-user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.selected-user-item:last-child {
  border-bottom: none;
}

.user-details {
  flex: 1;
}

.user-details .user-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.user-details .user-dept {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  color: #999;
  padding: 4px;
}

.remove-btn:hover {
  color: #ff4d4f;
}
</style>
