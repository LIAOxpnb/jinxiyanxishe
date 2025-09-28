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
        <el-form-item label="选择用户" prop="userId" required>
          <el-select
            v-model="formData.userId"
            placeholder="选择"
            style="width: 100%"
            filterable
            clearable
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus } from '@element-plus/icons-vue'
import FilterBar from '@/components/common/FilterBar.vue'
import { getUserList } from '@/api/system-management/User'
import { addLecturer, updateLecturer, deleteLecturer, getLecturerDetail } from '@/api/system-management/lecturer'
import { uploadFiles } from '@/api/common/UploadFiles'
import { previewFile } from '@/api/common/PreviewFile'

const loading = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const tableData = ref([])
const selectedLecturers = ref([])
const userOptions = ref([])
const avatarPreviewUrl = ref('');

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
  userId: null,
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
  userId: [
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
    if (!formData.userId) {
      ElMessage.error('请选择用户');
      return;
    }
    
    submitLoading.value = true;
    
    const submitData = {
      id: isEdit.value ? formData.id : formData.userId, // 编辑时用讲师ID，新增时用用户ID
      role: formData.dataPermission,
      avatar: formData.avatar || '',
      introduction: formData.introduction || '',
      intro: formData.intro || ''
    };
    
    const apiCall = isEdit.value ? updateLecturer : addLecturer;
    const result = await apiCall(submitData);
    
    ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
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
    userId: null,
    dataPermission: 0,
    avatar: '',
    introduction: '',
    intro: ''
  });
  avatarPreviewUrl.value = '';
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
</style>