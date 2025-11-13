<template>
  <div class="organization-management">
    <div class="header-actions">
      <el-dropdown @command="handleCreateCommand">
        <el-button type="primary">
          新增组织<el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="single">单个新增</el-dropdown-item>
            <!-- <el-dropdown-item command="batch">批量导入</el-dropdown-item> -->
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <!-- <div class="table-note">【备注】父部门数据包含子部门</div> -->

    <el-table
      :data="orgTreeData"
      style="width: 100%; margin-top: 15px;"
      v-loading="loading"
      row-key="id"
      border
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      lazy
      :load="loadChildrenNodes"
    >
      <el-table-column prop="orgName" label="组织名称" min-width="200" />
      <el-table-column prop="id" label="部门ID" width="180" />
      <el-table-column prop="userCount" label="用户数" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="200" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="handleAddChild(row)">添加下级</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
       <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, prev, pager, next, page-sizes"
          :total="pagination.total"
        />
    </div>


    <el-dialog
      title="新建&编辑组织"
      v-model="dialogVisible"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="组织名称" prop="orgName">
          <el-input
            v-model="formData.orgName"
            placeholder="请输入名称"
            maxlength="20"
            show-word-limit
          />
          <div class="form-hint">【备注】大小写英文、数字，20个字以内</div>
        </el-form-item>
        <el-form-item label="上级组织" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="orgTreeDataForSelect"
            :props="treeProps"
            placeholder="请选择上级组织"
            check-strictly
            clearable
            :disabled="isParentRootDisabled"
            lazy
            :load="loadSelectTreeNodes"
            node-key="id"
          />
           <div class="form-hint">【备注】上级部门为根部门时，置灰不可修改;</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit, Delete, ArrowDown } from '@element-plus/icons-vue'
import {
  getOrgList,
  createOrg,
  updateOrg,
  deleteOrg
} from '@/api/system-management/Org.js'

const formRef = ref()
const orgTreeData = ref([])
const orgTreeDataForSelect = ref([]) // 用于弹窗选择的完整树形数据
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)

const treeProps = {
  children: 'children',
  label: 'orgName',
  value: 'id'
}

const pagination = reactive({
    page: 1,
    size: 10,
    total: 0,
});

const formData = reactive({
  id: null,
  orgName: '',
  parentId: null,
})

const formRules = {
  orgName: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { max: 20, message: '组织名称长度不能超过20个字符', trigger: 'blur' }
  ],
}

const isParentRootDisabled = computed(() => {
  // 当编辑根组织时（parentId 为 "0"），禁用上级组织选择
  return isEdit.value && (formData.parentId === '0' || !formData.parentId);
});

// 加载根目录组织列表
const fetchOrgTree = async () => {
  loading.value = true
  try {
    const response = await getOrgList({
      orgId: '1',
      personnel: false
    })
    if (response.code === 200) {
      const rootOrg = response.data;
      
      // 将根组织本身作为表格的根节点
      orgTreeData.value = [{
        id: rootOrg.id,
        orgName: rootOrg.orgName,
        parentId: rootOrg.parentId,
        createTime: rootOrg.createTime,
        userCount: 0, // 可以根据需要计算或从 API 获取
        hasChildren: rootOrg.children && rootOrg.children.length > 0
      }];
      
      pagination.total = 1; // 根节点计数为1
    } else {
      ElMessage.error(response.msg || '获取组织数据失败')
    }
  } catch (error) {
    console.error('获取组织数据失败:', error)
    ElMessage.error('获取组织数据失败')
  } finally {
    loading.value = false;
  }
}

// 懒加载子节点
const loadChildrenNodes = async (row, treeNode, resolve) => {
  try {
    const response = await getOrgList({
      orgId: row.id,
      personnel: false
    })
    if (response.code === 200) {
      const orgData = response.data;
      const children = orgData?.children || [];
      // 为子节点添加 hasChildren 标记
      const childrenWithFlag = children.map(item => ({
        ...item,
        hasChildren: item.children ? item.children.length > 0 : true
      }));
      resolve(childrenWithFlag);
    } else {
      ElMessage.error(response.msg || '获取子组织失败')
      resolve([]);
    }
  } catch (error) {
    console.error('获取子组织失败:', error)
    ElMessage.error('获取子组织失败')
    resolve([]);
  }
}

// 树形选择器的懒加载（用于弹窗）
const loadSelectTreeNodes = async (node, resolve) => {
  // 如果是根节点（level === 0），加载根组织；否则加载对应组织的子节点
  const orgId = node.level === 0 ? '1' : node.data.id;
  
  try {
    const response = await getOrgList({
      orgId: orgId,
      personnel: false
    })
    if (response.code === 200) {
      const orgData = response.data;
      const children = orgData?.children || [];
      
      // 如果没有子节点，返回空数组
      if (children.length === 0) {
        return resolve([]);
      }
      
      // 为子节点添加 isLeaf 标记
      const childrenWithFlag = children.map(item => ({
        ...item,
        isLeaf: item.children === null || (Array.isArray(item.children) && item.children.length === 0)
      }));
      resolve(childrenWithFlag);
    } else {
      resolve([]);
    }
  } catch (error) {
    console.error('加载组织节点失败:', error)
    resolve([]);
  }
}

// 初始化弹窗选择器的根节点数据
const initOrgTreeForSelect = async () => {
  try {
    const response = await getOrgList({
      orgId: '1',
      personnel: false
    })
    if (response.code === 200) {
      const rootOrg = response.data;
      
      // 将根组织本身作为树选择器的根节点
      orgTreeDataForSelect.value = [{
        id: rootOrg.id,
        orgName: rootOrg.orgName,
        parentId: rootOrg.parentId,
        isLeaf: false // 根组织必定有子节点
      }];
    }
  } catch (error) {
    console.error('初始化组织树失败:', error)
  }
}

const handleCreateCommand = (command) => {
    if (command === 'single') {
        handleAdd();
    } else if (command === 'batch') {
        ElMessage.info('批量导入功能待开发');
    }
};

const handleAdd = async () => {
  isEdit.value = false
  resetForm()
  formData.parentId = null;
  if (orgTreeDataForSelect.value.length === 0) {
    await initOrgTreeForSelect(); // 首次打开时初始化
  }
  dialogVisible.value = true
}

const handleAddChild = async (data) => {
  isEdit.value = false
  resetForm()
  formData.parentId = data.id
  if (orgTreeDataForSelect.value.length === 0) {
    await initOrgTreeForSelect(); // 首次打开时初始化
  }
  dialogVisible.value = true
}

const handleEdit = async (data) => {
  isEdit.value = true
  Object.assign(formData, {
      id: data.id,
      orgName: data.orgName,
      parentId: data.parentId,
  });
  if (orgTreeDataForSelect.value.length === 0) {
    await initOrgTreeForSelect(); // 首次打开时初始化
  }
  dialogVisible.value = true
}

const handleDelete = (data) => {
  const hasChildren = data.children && data.children.length > 0;
  const hasUsers = data.userCount && data.userCount > 0;

  if (hasChildren || hasUsers) {
    ElMessageBox.alert(
      '组织下有部门、人员时不可删除', 
      '删除组织', 
      {
        confirmButtonText: '知道了',
        type: 'warning',
      }
    )
  } else {
    ElMessageBox.confirm(
      '组织删除后不可恢复',
      '组织删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    ).then(async () => {
      try {
        const response = await deleteOrg(data.id)
        if (response.code === 200) {
          ElMessage.success('删除成功')
          fetchOrgTree()
        } else {
          ElMessage.error(response.msg || '删除失败')
        }
      } catch (error) {
         ElMessage.error('删除操作失败')
      }
    }).catch(() => {
      ElMessage.info('已取消删除');
    });
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const dataToSubmit = {
        id: formData.id,
        orgName: formData.orgName,
        parentId: formData.parentId,
    };

    const apiCall = isEdit.value ? updateOrg : createOrg
    const response = await apiCall(dataToSubmit)

    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '修改成功' : '新建成功')
      dialogVisible.value = false
      fetchOrgTree()
    } else {
      ElMessage.error(response.msg || '操作失败')
    }
  } catch (error) {
    // 表单验证失败时不显示消息
  } finally {
    submitLoading.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, { id: null, orgName: '', parentId: null });
  formRef.value?.resetFields()
}

const handleDialogClose = () => {
  dialogVisible.value = false
}

onMounted(() => {
  fetchOrgTree() // 只加载根目录的子节点用于表格显示
})
</script>

<style scoped>
.organization-management {
  padding: 20px;
}
.header-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
.table-note {
    font-size: 13px;
    color: #f56c6c;
}
.pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}
.form-hint { 
    font-size: 12px; 
    color: #909399; 
    line-height: 1.5; 
    margin-top: 4px; 
}
.el-form-item__label + .el-form-item__content .form-hint {
    color: #f56c6c;
}
</style>