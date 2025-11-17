<template>
  <div class="page-wrapper">
    <div class="main-content">
      <!-- <h1 class="page-title">证书管理</h1> -->

      <FilterBar create-button-text="新增证书" :fields="certificateFilterFields" @create="handleCreateCertificate"
        @filter="handleFilter" />

      <el-table v-loading="loading" :data="tableData" style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="证书名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="courseCount" label="关联课程" width="120" align="center">
          <template #default="scope">
            <span class="link-text" @click="handleViewCourses(scope.row)">{{ scope.row.courseCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="examCount" label="关联考试" width="120" align="center">
          <template #default="scope">
            <span class="link-text" @click="handleViewExams(scope.row)">{{ scope.row.examCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="shootingRangeCount" label="关联靶场" width="120" align="center">
          <template #default="scope">
            <span class="link-text" @click="handleViewShootingRanges(scope.row)">{{ scope.row.shootingRangeCount || 0
              }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="grantedUserCount" label="获得人数" width="120" align="center">
          <template #default="scope">
            <span class="link-text" @click="handleViewGrantedUsers(scope.row)">{{ scope.row.grantedUserCount || 0
              }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="220" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleGrantSettings(scope.row)">授予设置</el-button>
            <el-dropdown trigger="click" @command="(command) => handleMoreActions(command, scope.row)">
              <span class="el-dropdown-link">
                <el-button link type="primary" size="small">
                  <el-icon>
                    <More />
                  </el-icon>
                </el-button>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="grant">直接授予</el-dropdown-item>
                  <el-dropdown-item command="viewGrantedUsers">获得人员</el-dropdown-item>
                  <el-dropdown-item command="delete" style="color: #F56C6C;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div>
          <el-button @click="handleBatchDelete" :disabled="selectedCertificates.length === 0">批量删除</el-button>
        </div>

        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="pagination.total"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" background>
        </el-pagination>
      </div>
    </div>

    <!-- 新增/编辑证书对话框 -->
    <el-dialog v-model="createDialogVisible" :title="editingCertificate ? '编辑证书' : '新增证书'" width="600px"
      @close="resetCreateForm">
      <el-form ref="createFormRef" :model="createForm" :rules="createFormRules" label-width="100px">
        <el-form-item label="证书名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入证书名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="详情描述" prop="intro">
          <el-input v-model="createForm.intro" type="textarea" placeholder="请输入详情描述" :rows="3" maxlength="200"
            show-word-limit />
        </el-form-item>
        <el-form-item label="颁发单位" prop="unit">
          <el-input v-model="createForm.unit" placeholder="请输入颁发单位" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="颁发日期" prop="issueDate">
          <el-radio-group v-model="createForm.issueDate">
            <el-radio :label="0">获证时自动生成</el-radio>
            <el-radio :label="1">统一时间</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="统一时间" prop="unifyTime" v-if="createForm.issueDate === 1">
          <el-date-picker v-model="createForm.unifyTime" type="datetime" placeholder="选择统一时间"
            format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="背景图片" prop="background">
          <el-input v-model="createForm.background" placeholder="请输入背景图片URL或上传图片" />
        </el-form-item>
        <el-form-item label="公章图片" prop="officialSeal">
          <el-input v-model="createForm.officialSeal" placeholder="请输入公章图片URL或上传图片" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateCertificate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 授予设置对话框 -->
    <el-dialog v-model="grantSettingsDialogVisible" width="600px" @close="resetGrantForm" :show-close="false">
      <template #header>
        <div class="grant-dialog-header">
          <el-icon class="grant-icon">
            <Warning />
          </el-icon>
          <span class="grant-title">授予设置</span>
          <el-button text @click="grantSettingsDialogVisible = false" class="close-btn">
            <el-icon>
              <Close />
            </el-icon>
          </el-button>
        </div>
      </template>

      <div class="grant-settings-content">
        <el-form label-width="80px" :label-position="'left'">
          <el-form-item label="班级">
            <el-select v-model="grantForm.selectedClasses" multiple placeholder="选择班级" style="width: 100%" collapse-tags
              collapse-tags-tooltip>
              <el-option v-for="item in classOptions" :key="item.id" :label="item.name" :value="item.id">
                <div class="option-content">
                  <el-icon v-if="isClassAlreadyGranted(item.id)" class="granted-icon" color="#67c23a">
                    <Check />
                  </el-icon>
                  <span class="option-text" :class="{ 'already-granted': isClassAlreadyGranted(item.id) }">
                    {{ item.name }}
                  </span>
                </div>
              </el-option>
            </el-select>
            <div class="form-hint">可多选，所有者考试、自动获得证书、证书需要平台管理员配置。</div>
          </el-form-item>

          <el-form-item label="考试">
            <el-select v-model="grantForm.selectedExams" multiple placeholder="选择考试" style="width: 100%" collapse-tags
              collapse-tags-tooltip>
              <el-option v-for="item in examOptions" :key="item.id" :label="item.name" :value="item.id">
                <div class="option-content">
                  <el-icon v-if="isExamAlreadyGranted(item.id)" class="granted-icon" color="#67c23a">
                    <Check />
                  </el-icon>
                  <span class="option-text" :class="{ 'already-granted': isExamAlreadyGranted(item.id) }">
                    {{ item.name }}
                  </span>
                </div>
              </el-option>
            </el-select>
            <div class="form-hint">可多选</div>
          </el-form-item>

          <el-form-item label="靶场">
            <el-select v-model="grantForm.selectedShootingRanges" multiple placeholder="选择靶场" style="width: 100%"
              collapse-tags collapse-tags-tooltip>
              <el-option v-for="item in shootingRangeOptions" :key="item.id" :label="item.name" :value="item.id">
                <div class="option-content">
                  <el-icon v-if="isShootingRangeAlreadyGranted(item.id)" class="granted-icon" color="#67c23a">
                    <Check />
                  </el-icon>
                  <span class="option-text" :class="{ 'already-granted': isShootingRangeAlreadyGranted(item.id) }">
                    {{ item.name }}
                  </span>
                </div>
              </el-option>
            </el-select>
            <div class="form-hint">可多选</div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="grant-dialog-footer">
          <el-button @click="grantSettingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGrantSettings">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 直接授予对话框 -->
    <el-dialog v-model="directGrantDialogVisible" title="直接授予证书" width="600px">
      <div class="direct-grant-content">
        <h4>证书：{{ currentCertificate?.name }}</h4>
        <el-form label-width="100px">
          <el-form-item label="选择用户">
            <el-select v-model="directGrantForm.selectedUsers" multiple placeholder="请选择用户" style="width: 100%">
              <el-option v-for="item in grantableUsers" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="directGrantDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDirectGrant">确定授予</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 获得人员对话框 -->
    <el-dialog v-model="grantedUsersDialogVisible" title="获得人员" width="1200px" :close-on-click-modal="false" class="granted-users-dialog">
      <div class="granted-users-content">
        <!-- 证书信息卡片 -->
        <div class="certificate-info-card">
          <div class="info-label">当前证书：</div>
          <div class="info-value">{{ currentCertificate?.name }}</div>
        </div>

        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input 
            v-model="grantedUsersSearchParam" 
            placeholder="姓名、身份证号、警号" 
            style="width: 280px;" 
            clearable
            @keyup.enter="searchGrantedUsers"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select 
            v-model="grantedUsersSourceFilter" 
            placeholder="来源筛选" 
            style="width: 140px;" 
            clearable
          >
            <el-option label="班级来源" :value="0" />
            <el-option label="考试来源" :value="1" />
            <el-option label="靶场来源" :value="2" />
            <el-option label="直接授予" :value="3" />
          </el-select>
          <el-button type="primary" @click="searchGrantedUsers">筛选</el-button>
        </div>

        <!-- 用户列表表格 -->
        <el-table 
          :data="grantedUsersList" 
          border 
          style="width: 100%;" 
          max-height="450px"
          v-loading="grantedUsersLoading" 
          @selection-change="handleGrantedUsersSelectionChange"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '500' }"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="用户姓名" width="110" show-overflow-tooltip />
          <el-table-column prop="username" label="手机号" width="130" show-overflow-tooltip />
          <el-table-column prop="policeNumber" label="警号" width="100" align="center" />
          <el-table-column prop="idCard" label="身份证号" width="180" show-overflow-tooltip />
          <el-table-column prop="orgId" label="组织" width="120" show-overflow-tooltip />
          <el-table-column prop="sourceName" label="来源" width="110" align="center">
            <template #default="scope">
              <el-tag :type="getSourceTagType(scope.row.userCertificate?.source)" size="small">
                {{ scope.row.sourceName }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="获得时间" width="170" />
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="scope">
              <el-button type="danger" link size="small" @click="revokeUserCertificate(scope.row)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 底部操作栏 -->
        <div class="table-footer-actions">
          <div class="left-actions">
            <el-button 
              v-if="selectedGrantedUsers.length > 0" 
              type="danger" 
              plain
              @click="batchRevokeUserCertificates"
            >
              批量移除（{{ selectedGrantedUsers.length }}）
            </el-button>
            <span v-else class="hint-text">共 {{ grantedUsersPagination.total }} 条</span>
          </div>

          <!-- 分页 -->
          <el-pagination 
            v-model:current-page="grantedUsersPagination.page"
            v-model:page-size="grantedUsersPagination.size" 
            :page-sizes="[10, 20, 50, 100]"
            :total="grantedUsersPagination.total" 
            layout="prev, pager, next, jumper"
            @size-change="handleGrantedUsersPageSizeChange" 
            @current-change="handleGrantedUsersPageChange"
            background
          />
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="grantedUsersDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { More, Warning, Close, Check, Search } from '@element-plus/icons-vue';
import FilterBar from '@/components/common/FilterBar.vue';
import {
  getCertificateList,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  setCertificateGrantConfig,
  getCertificateGrantConfig,
  grantCertificateToUsers,
  revokeGrantedCertificate,
  getGrantableUsers,
  getGrantedUsers,
  getExamList,
  getShootingRangeList,
  getClassList
} from '@/api/system-management/Certificate-Management.js';

const router = useRouter();
const loading = ref(true);
const tableData = ref([]);
const selectedCertificates = ref([]);

// 筛选参数
const filterParams = reactive({
  name: '',
  creator: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

// 筛选栏配置
const certificateFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '证书名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  {
    type: 'select',
    model: 'status',
    placeholder: '状态',
    options: [
      { label: '正常', value: 0 },
      { label: '异常', value: 1 },
    ],
    clearable: true
  },
]);

// --- 新增/编辑证书相关 ---
const createDialogVisible = ref(false);
const editingCertificate = ref(null);
const createFormRef = ref(null);
const createForm = reactive({
  name: '',
  intro: '',
  unit: '',
  issueDate: 0,
  unifyTime: '',
  background: '',
  officialSeal: '',
});

const createFormRules = reactive({
  name: [{ required: true, message: '请输入证书名称', trigger: 'blur' }],
  intro: [{ required: true, message: '请输入详情描述', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入颁发单位', trigger: 'blur' }],
  issueDate: [{ required: true, message: '请选择颁发日期类型', trigger: 'change' }],
  unifyTime: [{ required: true, message: '请选择统一时间', trigger: 'blur' }],
  background: [{ required: true, message: '请输入背景图片', trigger: 'blur' }],
  officialSeal: [{ required: true, message: '请输入公章图片', trigger: 'blur' }],
});

// --- 授予设置相关 ---
const grantSettingsDialogVisible = ref(false);
const currentCertificate = ref(null);
const grantForm = reactive({
  selectedClasses: [],
  selectedExams: [],
  selectedShootingRanges: [],
});
const classOptions = ref([]);
const examOptions = ref([]);
const shootingRangeOptions = ref([]);

// 存储当前证书已授权的配置
const currentGrantConfig = ref([]);

// --- 直接授予相关 ---
const directGrantDialogVisible = ref(false);
const directGrantForm = reactive({
  selectedUsers: [],
});
const grantableUsers = ref([]);

// --- 获得人员相关 ---
const grantedUsersDialogVisible = ref(false);
const grantedUsersList = ref([]);
const grantedUsersLoading = ref(false);
const grantedUsersSearchParam = ref('');
const grantedUsersSourceFilter = ref(null);
const selectedGrantedUsers = ref([]);
const grantedUsersPagination = reactive({
  page: 1,
  size: 10,
  total: 0
});

const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields();
  }
  editingCertificate.value = null;
  Object.assign(createForm, {
    name: '',
    intro: '',
    unit: '',
    issueDate: 0,
    unifyTime: '',
    background: '',
    officialSeal: '',
  });
};

const resetGrantForm = () => {
  Object.assign(grantForm, {
    selectedClasses: [],
    selectedExams: [],
    selectedShootingRanges: [],
  });
};

const fetchCertificates = async () => {
  loading.value = true;
  try {
    const payload = {
      ...filterParams,
      page: pagination.page,
      size: pagination.size,
    };
    const res = await getCertificateList(payload);
    if (res.code === 200) {
      tableData.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取列表失败');
    }
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchOptions = async () => {
  try {
    // 获取班级选项
    const classRes = await getClassList({ page: 1, size: 1000, pagination: false });
    if (classRes.code === 200) {
      classOptions.value = classRes.data || [];
    }

    // 获取考试选项
    const examRes = await getExamList({ page: 1, size: 1000, pagination: false });
    if (examRes.code === 200) {
      examOptions.value = examRes.data || [];
    }

    // 获取靶场选项
    const shootingRes = await getShootingRangeList({ page: 1, size: 1000, pagination: false });
    if (shootingRes.code === 200) {
      shootingRangeOptions.value = shootingRes.data || [];
    }
  } catch (error) {
    console.error('获取选项数据失败', error);
  }
};

const handleFilter = (data) => {
  Object.assign(filterParams, data);
  pagination.page = 1;
  fetchCertificates();
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  fetchCertificates();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchCertificates();
};

const handleCreateCertificate = () => {
  router.push({ name: 'System-CertificateSettings' });
};

const handleEdit = (row) => {
  router.push({ name: 'System-CertificateEdit', params: { id: row.id } });
};

const submitCreateCertificate = async () => {
  if (!createFormRef.value) return;
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const apiCall = editingCertificate.value ? updateCertificate : addCertificate;
        const payload = editingCertificate.value
          ? { ...createForm, id: editingCertificate.value.id }
          : createForm;

        const res = await apiCall(payload);
        if (res.code === 200) {
          ElMessage.success(editingCertificate.value ? '编辑成功！' : '创建成功！');
          createDialogVisible.value = false;
          fetchCertificates();
        } else {
          ElMessage.error(res.msg || '操作失败');
        }
      } catch (error) {
        ElMessage.error('操作失败');
      }
    }
  });
};

const handleGrantSettings = async (row) => {
  currentCertificate.value = row;

  // 先获取选项数据，确保下拉框有数据
  await fetchOptions();

  // 获取当前证书的授予设置
  try {
    const res = await getCertificateGrantConfig(row.id);
    if (res.code === 200 && res.data) {
      // 存储当前证书已授权的配置
      currentGrantConfig.value = res.data;

      // 根据返回的数据设置表单的已选项
      const selectedClasses = [];
      const selectedExams = [];
      const selectedShootingRanges = [];

      res.data.forEach(config => {
        if (config.clazzId) {
          selectedClasses.push(config.clazzId);
        }
        if (config.examId) {
          selectedExams.push(config.examId);
        }
        if (config.shootingRangeId) {
          selectedShootingRanges.push(config.shootingRangeId);
        }
      });

      grantForm.selectedClasses = selectedClasses;
      grantForm.selectedExams = selectedExams;
      grantForm.selectedShootingRanges = selectedShootingRanges;
    } else {
      // 如果没有配置，清空数据
      currentGrantConfig.value = [];
      resetGrantForm();
    }
  } catch (error) {
    console.error('获取授予设置失败', error);
    currentGrantConfig.value = [];
    resetGrantForm();
  }

  grantSettingsDialogVisible.value = true;
};

const submitGrantSettings = async () => {
  try {
    const configData = [];

    // 添加班级配置
    grantForm.selectedClasses.forEach(clazzId => {
      configData.push({
        certificateId: currentCertificate.value.id,
        clazzId: clazzId
      });
    });

    // 添加考试配置
    grantForm.selectedExams.forEach(examId => {
      configData.push({
        certificateId: currentCertificate.value.id,
        examId: examId
      });
    });

    // 添加靶场配置
    grantForm.selectedShootingRanges.forEach(shootingRangeId => {
      configData.push({
        certificateId: currentCertificate.value.id,
        shootingRangeId: shootingRangeId
      });
    });

    const res = await setCertificateGrantConfig(configData);
    if (res.code === 200) {
      ElMessage.success('授予设置保存成功！');
      grantSettingsDialogVisible.value = false;
      fetchCertificates();
    } else {
      ElMessage.error(res.msg || '保存失败');
    }
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

const handleMoreActions = async (command, row) => {
  switch (command) {
    case 'grant':
      await handleDirectGrant(row);
      break;
    case 'viewGrantedUsers':
      await handleViewGrantedUsers(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      break;
  }
};

const handleDirectGrant = async (row) => {
  currentCertificate.value = row;

  // 获取可授予的用户列表
  try {
    const res = await getGrantableUsers(row.id);
    if (res.code === 200) {
      grantableUsers.value = res.data || [];
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  }

  directGrantDialogVisible.value = true;
};

const submitDirectGrant = async () => {
  if (directGrantForm.selectedUsers.length === 0) {
    ElMessage.warning('请选择要授予的用户');
    return;
  }

  try {
    const res = await grantCertificateToUsers({
      id: currentCertificate.value.id,
      userIds: directGrantForm.selectedUsers
    });

    if (res.code === 200) {
      ElMessage.success('证书授予成功！');
      directGrantDialogVisible.value = false;
      directGrantForm.selectedUsers = [];
      fetchCertificates();
    } else {
      ElMessage.error(res.msg || '授予失败');
    }
  } catch (error) {
    ElMessage.error('授予失败');
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除证书 "${row.name}" 吗？`, '删除提示', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  }).then(async () => {
    try {
      const res = await deleteCertificate({ id: row.id, param: 0 });
      if (res.code === 200) {
        ElMessage.success('删除成功！');
        fetchCertificates();
      } else {
        ElMessage.error(res.msg || '删除失败');
      }
    } catch (error) {
      ElMessage.error('删除失败');
    }
  }).catch(() => { });
};

const handleSelectionChange = (selection) => {
  selectedCertificates.value = selection;
};

const handleBatchDelete = () => {
  if (selectedCertificates.value.length === 0) {
    ElMessage.warning('请至少选择一项进行删除');
    return;
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedCertificates.value.length} 项证书吗？`, '批量删除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      for (const certificate of selectedCertificates.value) {
        await deleteCertificate({ id: certificate.id, param: 0 });
      }
      ElMessage.success('批量删除成功！');
      fetchCertificates();
    } catch (error) {
      ElMessage.error('批量删除失败');
    }
  }).catch(() => { });
};

// 查看关联数据的处理函数
// const handleViewCourses = (row) => {
//   ElMessage.info(`查看证书 "${row.name}" 的关联课程`);
// };

// const handleViewExams = (row) => {
//   ElMessage.info(`查看证书 "${row.name}" 的关联考试`);
// };

// const handleViewShootingRanges = (row) => {
//   ElMessage.info(`查看证书 "${row.name}" 的关联靶场`);
// };

const handleViewGrantedUsers = async (row) => {
  currentCertificate.value = row;
  grantedUsersDialogVisible.value = true;

  // 重置搜索条件和分页
  grantedUsersSearchParam.value = '';
  grantedUsersSourceFilter.value = null;
  grantedUsersPagination.page = 1;

  // 获取获得人员列表
  await fetchGrantedUsers();
};

// 获取获得人员列表
const fetchGrantedUsers = async () => {
  if (!currentCertificate.value) return;

  grantedUsersLoading.value = true;
  try {
    const params = {
      id: currentCertificate.value.id,
      page: grantedUsersPagination.page,
      size: grantedUsersPagination.size,
      param: grantedUsersSearchParam.value || '',
      source: grantedUsersSourceFilter.value !== null ? grantedUsersSourceFilter.value : ''
    };

    const res = await getGrantedUsers(params);
    if (res.code === 200) {
      grantedUsersList.value = res.data.records || [];
      grantedUsersPagination.total = res.data.total || 0;

      // 处理来源字段显示 - 从userCertificate对象中提取数据
      grantedUsersList.value = grantedUsersList.value.map(user => ({
        ...user,
        sourceName: user.userCertificate?.sourceName || getSourceName(user.userCertificate?.source),
        grantTime: user.userCertificate?.createTime || user.createTime || 'N/A'
      }));
    } else {
      ElMessage.error('获取获得人员列表失败：' + (res.message || '请求失败'));
    }
  } catch (error) {
    console.error('获取获得人员列表失败:', error);
    ElMessage.error('获取获得人员列表失败');
  } finally {
    grantedUsersLoading.value = false;
  }
};

// 获取来源名称
const getSourceName = (source) => {
  const sourceMap = {
    0: '班级来源',
    1: '考试来源',
    2: '靶场来源',
    3: '直接授予'
  };
  return sourceMap[source] || '未知来源';
};

// 获取来源标签类型
const getSourceTagType = (source) => {
  const typeMap = {
    0: 'success',  // 班级来源 - 绿色
    1: 'primary',  // 考试来源 - 蓝色
    2: 'warning',  // 靶场来源 - 橙色
    3: 'info'      // 直接授予 - 灰色
  };
  return typeMap[source] || '';
};

// 搜索获得人员
const searchGrantedUsers = () => {
  grantedUsersPagination.page = 1;
  fetchGrantedUsers();
};

// 分页处理
const handleGrantedUsersPageChange = (page) => {
  grantedUsersPagination.page = page;
  fetchGrantedUsers();
};

const handleGrantedUsersPageSizeChange = (size) => {
  grantedUsersPagination.size = size;
  grantedUsersPagination.page = 1;
  fetchGrantedUsers();
};

// 移除单个用户证书
const revokeUserCertificate = (user) => {
  ElMessageBox.confirm(
    `确定要移除用户 "${user.name}" 的证书吗？`,
    '确认移除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await revokeGrantedCertificate({
        id: currentCertificate.value.id,
        userIds: [user.id || user.userId]
      });

      if (res.code === 200) {
        ElMessage.success('移除成功！');
        fetchGrantedUsers(); // 刷新列表
      } else {
        ElMessage.error('移除失败：' + (res.message || '请求失败'));
      }
    } catch (error) {
      console.error('移除证书失败:', error);
      ElMessage.error('移除证书失败');
    }
  }).catch(() => { });
};

// 批量移除用户证书
const batchRevokeUserCertificates = () => {
  if (selectedGrantedUsers.value.length === 0) {
    ElMessage.warning('请选择要移除的用户');
    return;
  }

  ElMessageBox.confirm(
    `确定要批量移除选中的 ${selectedGrantedUsers.value.length} 个用户的证书吗？`,
    '确认移除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const userIds = selectedGrantedUsers.value.map(user => user.id || user.userId);
      const res = await revokeGrantedCertificate({
        id: currentCertificate.value.id,
        userIds: userIds
      });

      if (res.code === 200) {
        ElMessage.success('批量移除成功！');
        selectedGrantedUsers.value = [];
        fetchGrantedUsers(); // 刷新列表
      } else {
        ElMessage.error('批量移除失败：' + (res.message || '请求失败'));
      }
    } catch (error) {
      console.error('批量移除证书失败:', error);
      ElMessage.error('批量移除证书失败');
    }
  }).catch(() => { });
};

// 处理获得人员表格选择变化
const handleGrantedUsersSelectionChange = (selection) => {
  selectedGrantedUsers.value = selection;
};

// 判断班级是否已经被授权给当前证书
const isClassAlreadyGranted = (classId) => {
  return currentGrantConfig.value.some(config => config.clazzId === classId);
};

// 判断考试是否已经被授权给当前证书
const isExamAlreadyGranted = (examId) => {
  return currentGrantConfig.value.some(config => config.examId === examId);
};

// 判断靶场是否已经被授权给当前证书
const isShootingRangeAlreadyGranted = (shootingRangeId) => {
  return currentGrantConfig.value.some(config => config.shootingRangeId === shootingRangeId);
};

onMounted(() => {
  fetchCertificates();
  fetchOptions();
});
</script>

<style scoped>
.page-wrapper {
  background-color: #f0f2f5;
  padding: 20px;
  min-height: 100vh;
}

.main-content {
  background-color: #ffffff;
  padding: 24px;
  border-radius: 4px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.el-table {
  margin-top: 20px;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}

.link-text {
  color: var(--el-color-primary);
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.grant-settings-content h4,
.direct-grant-content h4 {
  margin-bottom: 20px;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 授予设置对话框样式 */
.grant-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.grant-dialog-header .grant-icon {
  color: #e6a23c;
  font-size: 18px;
  margin-right: 8px;
}

.grant-dialog-header .grant-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.grant-dialog-header .close-btn {
  padding: 0;
  color: #909399;
  font-size: 16px;
}

.grant-dialog-header .close-btn:hover {
  color: #606266;
}

.grant-settings-content {
  padding: 20px 0;
}

.grant-settings-content .el-form-item {
  margin-bottom: 24px;
}

.grant-settings-content .el-form-item__label {
  font-weight: 500;
  color: #606266;
}

.form-hint {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
  line-height: 1.4;
}

.grant-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0 0;
  border-top: 1px solid #e4e7ed;
}

/* 获得人员对话框样式 */
.granted-users-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #e4e7ed;
  padding: 20px 24px;
}

.granted-users-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.granted-users-content {
  padding: 0;
}

/* 证书信息卡片 */
.certificate-info-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.info-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  margin-right: 8px;
}

.info-value {
  font-size: 16px;
  color: #ffffff;
  font-weight: 600;
  flex: 1;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.granted-users-content .el-table {
  margin-top: 0;
  border-radius: 8px;
  overflow: hidden;
}

/* 底部操作栏 */
.table-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-text {
  font-size: 14px;
  color: #909399;
}

.granted-users-content .el-pagination {
  justify-content: flex-end;
  margin: 0;
}

.batch-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

/* 授权标识样式 */
.option-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.granted-icon {
  margin-right: 8px;
  font-size: 16px;
}

.option-text {
  flex: 1;
}

.option-text.already-granted {
  color: #67c23a;
  font-weight: 500;
}
</style>
