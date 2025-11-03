<template>
  <div class="lecturer-management">
    <FilterBar
      :create-button-text="'新增讲师'"
      :fields="filterFields"
      @create="handleCreate"
      @filter="handleFilter"
    />

    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        class="lecturer-table"
        @selection-change="handleSelectionChange"
        :header-cell-style="{ backgroundColor: '#fafafa', color: '#262626', fontWeight: '500' }"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="name" label="姓名" min-width="100" align="center" />
        <el-table-column prop="phone" label="手机号" min-width="130" align="center" />
        <el-table-column prop="idCard" label="身份证号" min-width="160" align="center">
          <template #default="{ row }">
            {{ maskIdCard(row.idCard) }}
          </template>
        </el-table-column>
        <el-table-column prop="courseCount" label="课程数" min-width="80" align="center" />
        <el-table-column prop="questionCount" label="试题数" min-width="80" align="center" />
        <el-table-column prop="examCount" label="考试数" min-width="80" align="center" />
        <el-table-column prop="practiceCount" label="练习数" min-width="80" align="center" />
        <el-table-column prop="rangeCount" label="靶场数" min-width="80" align="center" />
        <el-table-column prop="classCount" label="班级数" min-width="80" align="center" />
        <el-table-column prop="createTime" label="创建时间" min-width="160" align="center" />
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="text" @click="handleEdit(row)" class="action-btn" size="small">
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleDropdownAction(command, row)">
              <el-button type="text" class="action-btn more-btn" size="small">
                <el-icon><MoreFilled /></el-icon>
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
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="800px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="选择用户" prop="userIds" required>
          <div class="user-selector">
            <div v-if="selectedUsers.length > 0" class="selected-users-display">
              <div v-for="user in selectedUsers" :key="user.id" class="selected-user">
                <el-avatar :size="32" :src="user.avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-dept">{{ user.department || '未知部门' }}</div>
                </div>
                <el-button type="text" class="clear-btn" @click="removeSelectedUser(user)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            <el-button type="primary" plain @click="openUserSelectionDialog">
              <el-icon><Plus /></el-icon>
              {{ selectedUsers.length > 0 ? '继续添加用户' : '添加用户' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="数据权限" prop="dataPermission">
          <div style="color: #909399; font-size: 12px; margin-bottom: 10px;">
            （题库、练习、考试、课程、靶场、班级的数据权限）
          </div>
          <el-radio-group v-model="formData.dataPermission">
            <el-radio :value="0">仅查看和修改本人数据</el-radio>
            <el-radio :value="1">可修改本人数据，仅查看、复制全部数据</el-radio>
            <el-radio :value="2">可查看和修改全部数据</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="照片" prop="avatar">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :http-request="handleUploadAvatar"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="avatar" />
            <div v-else class="avatar-placeholder">
              <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="讲师简介" prop="introduction">
          <el-input
            v-model="formData.introduction"
            type="textarea"
            :rows="3"
            placeholder="请输入讲师简介"
            maxlength="10"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="讲师介绍" prop="intro">
          <el-input
            v-model="formData.intro"
            type="textarea"
            :rows="8"
            placeholder="请输入讲师介绍"
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

    <el-dialog
      title="删除讲师"
      v-model="deleteDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 20px; font-size: 14px;">
        仅删除该讲师身份
      </div>
      <el-checkbox v-model="deleteOptions.removeContent">
        下架该老师的课程、考试、靶场
      </el-checkbox>
      <br />
      <el-checkbox v-model="deleteOptions.removeUser" style="margin-top: 10px;">
        同时删除用户
      </el-checkbox>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 人员选择弹窗 -->
    <el-dialog v-model="userSelectionDialogVisible" title="选择用户" width="1000px" :close-on-click-modal="false">
      <div class="add-member-dialog">
        <!-- 左侧：用户树形选择 -->
        <div class="user-tree-section">
          <!-- 搜索框 -->
          <div class="search-section">
            <el-input v-model="userSearchKeyword" placeholder="姓名、手机号、警号、身份证号" @input="handleUserSearch" clearable>
              <template #append>
                <el-button @click="handleUserSearch">
                  <el-icon><Search /></el-icon>
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
              <div v-for="user in searchedUsers" :key="user.id" class="user-item search-result">
                <el-checkbox 
                  v-model="user.checked" 
                  @change="handleUserCheck(user)"
                  :disabled="user.isLecturer"
                >
                  <div class="user-info">
                    <el-avatar :size="24" :src="user.avatar">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-dept">{{ user.department }}</span>
                    <el-tag v-if="user.isLecturer" type="info" size="small" style="margin-left: 8px;">已是讲师</el-tag>
                  </div>
                </el-checkbox>
              </div>
            </div>

            <!-- 组织树 -->
            <div v-else class="org-tree">
              <el-tree 
                ref="orgTreeRef" 
                :data="orgTreeData" 
                :props="{ children: 'children', label: 'name' }"
                show-checkbox
                node-key="id" 
                :default-expand-all="true"
                @check="handleOrgTreeCheck"
              >
                <template #default="{ node, data }">
                  <div class="tree-node">
                    <el-icon v-if="data.type === 'org'" class="org-icon">
                      <OfficeBuilding />
                    </el-icon>
                    <el-avatar v-else :size="20" :src="data.avatar">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <span class="node-label">{{ data.name }}</span>
                    <span v-if="data.type === 'user'" class="user-dept">{{ data.department }}</span>
                    <el-tag v-if="data.type === 'user' && data.isLecturer" type="info" size="small" style="margin-left: 8px;">已是讲师</el-tag>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
        </div>

        <!-- 右侧：已选用户 -->
        <div class="selected-users-section">
          <div class="section-header">
            <span>已选：{{ tempSelectedUsers.length }} 名用户</span>
            <el-button type="text" @click="clearTempSelectedUsers">清空</el-button>
          </div>

          <div class="selected-users-list-dialog">
            <div v-for="user in tempSelectedUsers" :key="user.id" class="selected-user-item">
              <el-avatar :size="32" :src="user.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-dept">{{ user.department }}</div>
              </div>
              <el-button type="text" class="remove-btn" @click="removeTempSelectedUser(user)">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userSelectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelectedUsers">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus, User, Close, Search, OfficeBuilding } from '@element-plus/icons-vue'
import FilterBar from '@/components/common/FilterBar.vue'
import { getUserList } from '@/api/system-management/User'
import { addLecturer, updateLecturer, deleteLecturer, getLecturerDetail } from '@/api/system-management/lecturer'
import { uploadFiles } from '@/api/common/UploadFiles'
import { previewFile } from '@/api/common/PreviewFile'
import { getOrgTree } from '@/api/system-management/Org'

const loading = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const tableData = ref([])
const selectedLecturers = ref([])
const userOptions = ref([])
const avatarPreviewUrl = ref('');

// 人员选择弹窗相关
const userSelectionDialogVisible = ref(false)
const userSearchKeyword = ref('')
const searchedUsers = ref([])
const orgTreeData = ref([])
const orgTreeRef = ref(null)
const selectedUsers = ref([])
const tempSelectedUsers = ref([])
const existingLecturerIds = ref([])

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const filterFields = [
  {
    type: 'input',
    model: 'param',
    placeholder: '姓名、手机号、身份证号',
    defaultValue: ''
  }
]

const currentFilters = ref({})

const formData = reactive({
  id: null,
  userIds: [],
  dataPermission: 0,
  avatar: '', 
  introduction: '',
  intro: ''
})

const deleteOptions = reactive({
  removeContent: false,
  removeUser: false
})

const formRules = {
  userIds: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ],
  introduction: [
    { max: 10, message: '讲师简介不能超过10个字符', trigger: 'blur' }
  ],
  intro: [
    { max: 500, message: '讲师介绍不能超过500个字符', trigger: 'blur' }
  ]
}

const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentDeleteRow = ref(null)

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑讲师' : '新增讲师'
})

const maskIdCard = (idCard) => {
  if (!idCard || idCard.length < 6) return idCard
  return idCard.substring(0, 6) + '****' + idCard.substring(idCard.length - 4)
}

const fetchUserOptions = async () => {
  try {
    const res = await getUserList({
      teacher: 0, // 0表示获取非教师用户，用于选择成为讲师
      pagination: false
    })
    if (res.code === 200 && res.data) {
      userOptions.value = res.data.records || res.data
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

const fetchLecturers = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      teacher: 1, // 1表示获取教师列表
      ...currentFilters.value
    }
    
    const res = await getUserList(params)
    
    if (res.code === 200 && res.data) {
      // 获取教师列表数据
      const lecturers = res.data.records || []
      
      tableData.value = lecturers.map(item => ({
        ...item,
        phone: item.username,
      }))
      pagination.total = res.data.total || lecturers.length
    }
  } catch (error) {
    console.error('获取讲师列表错误:', error)
    ElMessage.error('获取讲师列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = (filters) => {
  currentFilters.value = filters
  pagination.pageNum = 1
  fetchLecturers()
}

const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true;
  // 尝试通过接口获取最新的讲师详情，如果失败则回退到传入的 row 数据
  detailLoading.value = true
  try {
  const res = await getLecturerDetail({ id: row.id })
  console.log('getLecturerDetail response:', res)
    if (res && res.code === 200 && res.data) {
      const d = res.data
      Object.assign(formData, {
        id: d.id,
        userId: d.id, // 直接使用 id，不需要 userId 字段
        dataPermission: d.dataPermission ?? d.role ?? 0,
        avatar: d.avatar || '',
        introduction: d.introduction || '',
        intro: d.intro || ''
      })

      // 设置选中的用户信息（编辑时只显示当前用户）
      selectedUsers.value = [{
        id: d.id,
        name: d.name || row.name,
        department: d.orgName || row.orgName || '未知部门',
        avatar: d.avatar || '',
        policeNumber: d.policeNumber || row.policeNumber || '',
        phone: d.username || row.phone || ''
      }]
      formData.userIds = [d.id]

      if (formData.avatar) {
        try {
          avatarPreviewUrl.value = await previewFile(formData.avatar)
        } catch (e) {
          avatarPreviewUrl.value = ''
        }
      } else {
        avatarPreviewUrl.value = ''
      }
    } else {
      // 回退到 row
      Object.assign(formData, {
        id: row.id,
        userId: row.id, // 直接使用 id，不需要 userId 字段
        dataPermission: row.dataPermission || 0,
        avatar: row.avatar || '',
        introduction: row.introduction || '',
        intro: row.intro || ''
      })

      // 设置选中的用户信息（编辑时只显示当前用户）
      selectedUsers.value = [{
        id: row.id,
        name: row.name,
        department: row.orgName || '未知部门',
        avatar: row.avatar || '',
        policeNumber: row.policeNumber || '',
        phone: row.phone || ''
      }]
      formData.userIds = [row.id]

      if (formData.avatar) {
        try {
          avatarPreviewUrl.value = await previewFile(formData.avatar)
        } catch (e) {
          avatarPreviewUrl.value = ''
        }
      } else {
        avatarPreviewUrl.value = ''
      }
    }
  } catch (error) {
    console.error('获取讲师详情失败，使用行数据回退:', error)
    Object.assign(formData, {
      id: row.id,
      userId: row.id, // 直接使用 id，不需要 userId 字段
      dataPermission: row.dataPermission || 0,
      avatar: row.avatar || '',
      introduction: row.introduction || '',
      intro: row.intro || ''
    })

    // 设置选中的用户信息（编辑时只显示当前用户）
    selectedUsers.value = [{
      id: row.id,
      name: row.name,
      department: row.orgName || '未知部门',
      avatar: row.avatar || '',
      policeNumber: row.policeNumber || '',
      phone: row.phone || ''
    }]
    formData.userIds = [row.id]

    if (formData.avatar) {
      try {
        avatarPreviewUrl.value = await previewFile(formData.avatar)
      } catch (e) {
        avatarPreviewUrl.value = ''
      }
    } else {
      avatarPreviewUrl.value = ''
    }
  } finally {
    detailLoading.value = false
    dialogVisible.value = true
  }
};

const handleDropdownAction = (command, row) => {
  if (command === 'delete') {
    handleDelete(row)
  }
}

const handleDelete = (row) => {
  currentDeleteRow.value = row
  deleteOptions.removeContent = false
  deleteOptions.removeUser = false
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  if (!currentDeleteRow.value) return
  try {
    await deleteLecturer({
      id: currentDeleteRow.value.id,
      takedown: deleteOptions.removeContent,
      removeUser: deleteOptions.removeUser
    })
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    fetchLecturers()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleSelectionChange = (selection) => {
  selectedLecturers.value = selection
}

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    
    // 验证必需字段
    if (!formData.userIds || formData.userIds.length === 0) {
      ElMessage.error('请选择用户');
      return;
    }
    
    submitLoading.value = true;
    
    if (isEdit.value) {
      // 编辑讲师 - 单个用户
      const submitData = {
        id: formData.id,
        role: formData.dataPermission,
        avatar: formData.avatar || '',
        introduction: formData.introduction || '',
        intro: formData.intro || ''
      };
      
      await updateLecturer(submitData);
      ElMessage.success('修改成功');
    } else {
      // 批量新增讲师
      const promises = formData.userIds.map(userId => 
        addLecturer({
          id: userId,
          role: formData.dataPermission,
          avatar: formData.avatar || '',
          introduction: formData.introduction || '',
          intro: formData.intro || ''
        })
      );
      
      await Promise.all(promises);
      ElMessage.success(`成功添加 ${formData.userIds.length} 名讲师`);
    }
    
    dialogVisible.value = false;
    
    // 稍微延迟一下再刷新，确保后端数据已处理完成
    setTimeout(() => {
      fetchLecturers();
    }, 500);
  } catch (error) {
    if (error !== false) {
      const errorMsg = error.response?.data?.msg || error.message || (isEdit.value ? '修改失败' : '新增失败');
      ElMessage.error(errorMsg);
    }
  } finally {
    submitLoading.value = false;
  }
};

const handleUploadAvatar = async (options) => {
  const { file } = options;
  try {
    const uploadRes = await uploadFiles([file]);
    if (uploadRes.code !== 200 || typeof uploadRes.data !== 'string') {
      throw new Error(uploadRes.msg || '上传接口返回格式错误');
    }
    const relativePath = uploadRes.data;
    
    formData.avatar = relativePath;
    ElMessage.success('文件上传成功！');

    const previewUrl = await previewFile(relativePath);
    avatarPreviewUrl.value = previewUrl;
  } catch (error) {
    console.error('上传或预览过程中出错:', error);
    ElMessage.error(error.message || '操作失败');
    formData.avatar = '';
    avatarPreviewUrl.value = '';
  }
};

const beforeAvatarUpload = (file) => {
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isJPGOrPNG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!');
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!');
  }
  return isJPGOrPNG && isLt2M;
};

const handleDialogClose = () => {
  dialogVisible.value = false;
  resetForm();
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(formData, {
    id: null,
    userIds: [],
    dataPermission: 0,
    avatar: '',
    introduction: '',
    intro: ''
  });
  avatarPreviewUrl.value = '';
  selectedUsers.value = [];
  tempSelectedUsers.value = [];
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchLecturers();
};

const handleCurrentChange = (page) => {
  pagination.pageNum = page;
  fetchLecturers();
};

// 人员选择相关方法
const openUserSelectionDialog = async () => {
  userSelectionDialogVisible.value = true;
  await fetchExistingLecturers();
  await fetchOrgTree();
  // 初始化临时选择状态
  tempSelectedUsers.value = [...selectedUsers.value];
  // 同步已选用户状态到组织树
  syncSelectedUsersToTree();
};

const fetchOrgTree = async () => {
  try {
    const response = await getOrgTree({ personnel: true });
    if (response.code === 200) {
      orgTreeData.value = transformOrgTreeData(response.data);
    } else {
      ElMessage.error(response.msg || '获取组织树失败');
    }
  } catch (error) {
    ElMessage.error('获取组织树失败');
  }
};

// 获取现有讲师列表
const fetchExistingLecturers = async () => {
  try {
    const response = await getUserList({
      teacher: 1, // 获取已是讲师的用户
      pagination: false
    });
    if (response.code === 200) {
      existingLecturerIds.value = response.data.records 
        ? response.data.records.map(lecturer => lecturer.id)
        : response.data.map(lecturer => lecturer.id);
    }
  } catch (error) {
    console.error('获取现有讲师列表失败:', error);
  }
};

const transformOrgTreeData = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];

  return nodes.map(orgNode => {
    const transformedOrg = {
      id: `org_${orgNode.id}`,
      name: orgNode.orgName,
      type: 'org',
      children: []
    };

    const users = (orgNode.users || []).map(userNode => ({
      id: `user_${userNode.id}`,
      originalId: userNode.id,
      name: userNode.name,
      type: 'user',
      department: orgNode.orgName,
      avatar: userNode.avatar || '',
      policeNumber: userNode.policeNumber || '',
      phone: userNode.username || '',
      isLecturer: existingLecturerIds.value.includes(userNode.id)
    }));

    const subOrgs = transformOrgTreeData(orgNode.children || []);
    transformedOrg.children = [...subOrgs, ...users];

    return transformedOrg;
  });
};

const handleUserSearch = async () => {
  if (!userSearchKeyword.value.trim()) {
    searchedUsers.value = [];
    return;
  }

  try {
    const response = await getUserList({
      pageNum: 1,
      pageSize: 50,
      param: userSearchKeyword.value.trim(),
      pagination: true
    });

    if (response.code === 200) {
      searchedUsers.value = response.data.records.map(user => {
        let department = user.orgName || user.organizationName || user.deptName || user.department;

        if (!department && orgTreeData.value.length > 0) {
          const findUserInTree = (nodes) => {
            for (const node of nodes) {
              if (node.type === 'user' && node.originalId === user.id) {
                return node.department;
              }
              if (node.children && node.children.length > 0) {
                const found = findUserInTree(node.children);
                if (found) return found;
              }
            }
            return null;
          };

          department = findUserInTree(orgTreeData.value);
        }

        const isLecturer = existingLecturerIds.value.includes(user.id);
        
        return {
          id: user.id,
          name: user.name,
          department: department || '未知部门',
          avatar: user.avatar || '',
          policeNumber: user.policeNumber || '',
          phone: user.username || '',
          isLecturer: isLecturer,
          checked: tempSelectedUsers.value.some(u => u.id === user.id)
        };
      });
    }
  } catch (error) {
    ElMessage.error('搜索用户失败');
  }
};

// 同步已选用户状态到组织树
const syncSelectedUsersToTree = () => {
  if (!orgTreeRef.value || tempSelectedUsers.value.length === 0) return;

  const checkedKeys = [];
  const collectUserNodeIds = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'user') {
        if (tempSelectedUsers.value.some(user => user.id === node.originalId)) {
          checkedKeys.push(node.id);
        }
      }
      if (node.children && node.children.length > 0) {
        collectUserNodeIds(node.children);
      }
    }
  };

  collectUserNodeIds(orgTreeData.value);

  setTimeout(() => {
    if (orgTreeRef.value && checkedKeys.length > 0) {
      orgTreeRef.value.setCheckedKeys(checkedKeys);
    }
  }, 100);
};

const handleUserCheck = (user) => {
  if (user.isLecturer) return; // 已是讲师的用户不能操作
  
  if (user.checked) {
    if (!tempSelectedUsers.value.some(u => u.id === user.id)) {
      tempSelectedUsers.value.push({
        id: user.id,
        name: user.name,
        department: user.department,
        avatar: user.avatar,
        policeNumber: user.policeNumber,
        phone: user.phone
      });
    }
  } else {
    const index = tempSelectedUsers.value.findIndex(u => u.id === user.id);
    if (index > -1) {
      tempSelectedUsers.value.splice(index, 1);
    }
  }
};

const handleOrgTreeCheck = (data, checkedInfo) => {
  const { checkedNodes } = checkedInfo;
  const users = checkedNodes.filter(node => node.type === 'user' && !node.isLecturer);

  tempSelectedUsers.value = users.map(user => ({
    id: user.originalId || user.id,
    name: user.name,
    department: user.department,
    avatar: user.avatar,
    policeNumber: user.policeNumber,
    phone: user.phone
  }));
};

const clearTempSelectedUsers = () => {
  tempSelectedUsers.value = [];
  searchedUsers.value.forEach(user => {
    user.checked = false;
  });
  if (orgTreeRef.value) {
    orgTreeRef.value.setCheckedKeys([]);
  }
};

const removeTempSelectedUser = (user) => {
  const index = tempSelectedUsers.value.findIndex(u => u.id === user.id);
  if (index > -1) {
    tempSelectedUsers.value.splice(index, 1);
  }

  const searchUser = searchedUsers.value.find(u => u.id === user.id);
  if (searchUser) {
    searchUser.checked = false;
  }

  // 更新组织树状态
  syncSelectedUsersToTree();
};

const confirmSelectedUsers = () => {
  selectedUsers.value = [...tempSelectedUsers.value];
  formData.userIds = tempSelectedUsers.value.map(user => user.id);
  userSelectionDialogVisible.value = false;
  userSearchKeyword.value = '';
  searchedUsers.value = [];
};

const removeSelectedUser = (user) => {
  const index = selectedUsers.value.findIndex(u => u.id === user.id);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
    formData.userIds = selectedUsers.value.map(u => u.id);
  }
};

onMounted(() => {
  fetchUserOptions();
  fetchLecturers();
});
</script>

<style scoped>
.lecturer-management {
  padding: 20px;
}
.table-container {
  background: white;
  border-radius: 8px;
  margin-top: 16px;
}
.lecturer-table {
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
.more-btn {
  color: #909399;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 100px;
  height: 100px;
}
.avatar-uploader:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}
.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}
.avatar-placeholder {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

/* 用户选择器样式 */
.user-selector {
  width: 100%;
}

.selected-users-display {
  margin-bottom: 12px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
  padding: 8px;
}

.selected-user {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
}

.selected-user:last-child {
  margin-bottom: 0;
}

.selected-user .user-info {
  flex: 1;
  margin-left: 12px;
}

.selected-user .user-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.selected-user .user-dept {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.selected-user .clear-btn {
  color: #909399;
  padding: 4px;
}

.selected-user .clear-btn:hover {
  color: #f56c6c;
}

/* 人员选择弹窗样式 */
.add-member-dialog {
  display: flex;
  gap: 24px;
  height: 500px;
}

.user-tree-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ebeef5;
  padding-right: 24px;
}

.search-section {
  margin-bottom: 16px;
}

.user-tree-container {
  flex: 1;
  overflow: auto;
}

.search-results {
  height: 100%;
  overflow: auto;
}

.search-tip {
  padding: 8px 0;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 8px;
}

.user-item {
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-item .user-name {
  font-size: 14px;
  color: #303133;
}

.user-item .user-dept {
  font-size: 12px;
  color: #909399;
}

.org-tree {
  height: 100%;
  overflow: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.user-tree-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-icon {
  color: #409eff;
  font-size: 16px;
}

.node-label {
  font-size: 14px;
  color: #303133;
}

.selected-users-section {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.selected-users-list-dialog {
  flex: 1;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.selected-user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  background-color: white;
  margin: 8px;
  border-radius: 4px;
}

.selected-user-item:last-child {
  margin-bottom: 8px;
}

.user-details {
  flex: 1;
  margin-left: 12px;
}

.user-details .user-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.user-details .user-dept {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.remove-btn {
  color: #909399;
  padding: 4px;
}

.remove-btn:hover {
  color: #f56c6c;
}

.empty-selection {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>