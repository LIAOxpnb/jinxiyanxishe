<template>
  <div class="member-management-page">
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        班级详情
      </el-button>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-number">{{ statsData.studentCount || 0 }}</div>
        <div class="stat-label">学员数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ statsData.graduateRate || 0 }}%</div>
        <div class="stat-label">结业率</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ statsData.courseCompleteRate || 0 }}%</div>
        <div class="stat-label">课程完成率</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ statsData.examPassRate || 0 }}%</div>
        <div class="stat-label">考试合格率</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ statsData.practicePassRate || 0 }}%</div>
        <div class="stat-label">靶场合格率</div>
      </div>
    </div>

    <div class="notice">
      【备注】已到期结业的班级不能修改，隐藏添加学员，以及更多操作;
    </div>

    <div class="action-bar">
      <el-dropdown v-if="clazzStatus !== 2" @command="handleBatchAction">
        <el-button type="primary">
          已有学员<el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="add">添加学员</el-dropdown-item>
            <el-dropdown-item command="createNew">新建学员</el-dropdown-item>
            <el-dropdown-item command="batchImport">批量导入</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-input v-model="searchParams.param" placeholder="姓名、手机号、警号、身份证号" class="search-input" clearable
        @keyup.enter="handleSearch">
        <template #append>
          <el-button @click="handleSearch">
            <el-icon>
              <Search />
            </el-icon>
          </el-button>
        </template>
      </el-input>

      <el-select v-model="searchParams.graduate" placeholder="毕业状态" class="status-select" clearable
        @change="handleSearch">
        <el-option label="未毕业" :value="0" />
        <el-option label="已毕业" :value="1" />
      </el-select>
    </div>

    <div class="member-table">
      <el-table :data="memberList" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="学员姓名" min-width="100" />
        <el-table-column prop="username" label="手机号" min-width="120" />
        <el-table-column prop="policeNumber" label="警号" min-width="100" />
        <el-table-column prop="idCard" label="身份证号" min-width="180" />
        <el-table-column prop="orgName" label="组织" min-width="120" />
        <el-table-column prop="graduateStatus" label="毕业状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.graduate === 1 ? 'success' : 'warning'">
              {{ row.graduate === 1 ? '已毕业' : '未毕业' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studyRate" label="课程学习率" min-width="100">
          <template #default="{ row }">
            {{ row.studyRate || 0 }}%
          </template>
        </el-table-column>
        <el-table-column prop="examRate" label="考试合格率" min-width="100">
          <template #default="{ row }">
            {{ row.examRate || 0 }}%
          </template>
        </el-table-column>
        <el-table-column prop="shootingRangeRate" label="靶场合格率" min-width="100">
          <template #default="{ row }">
            {{ row.shootingRangeRate || 0 }}%
          </template>
        </el-table-column>
        <el-table-column prop="joinTime" label="加入时间" min-width="150" />
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-dropdown v-if="clazzStatus !== 2" @command="(command) => handleMemberAction(command, row)">
              <el-button type="primary" link>
                <el-icon>
                  <MoreFilled />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="remove">移除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="table-footer">
      <div class="batch-actions" v-if="clazzStatus !== 2">
        <el-checkbox v-model="selectAll" @change="handleSelectAll" :indeterminate="isIndeterminate" />
        <el-dropdown @command="handleBatchOperation" trigger="click">
          <el-button :disabled="selectedMembers.length === 0">
            批量操作<el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="batchRemove">批量移除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="pagination-wrapper">
        <div class="pagination-info">
          总共{{ total }}条
        </div>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="total" layout="sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>

    <el-dialog v-model="addMemberDialogVisible" title="添加人员" width="1000px" :close-on-click-modal="false" @close="clearAddMemberDialogState">
      <div class="add-member-dialog">
        <div class="user-tree-section">
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

          <div class="user-tree-container">
            <div v-if="userSearchKeyword" class="search-results">
              <div class="search-tip">
                包含 "{{ userSearchKeyword }}" 的搜索结果
              </div>
              <div v-for="user in searchedUsers" :key="user.id" class="user-item search-result" :class="{ 'in-class': memberList.some(member => member.id === user.id) }">
                <el-checkbox v-model="user.checked" @change="handleUserCheck(user)">
                  <div class="user-info">
                    <el-avatar :size="24" :src="user.avatar">
                      <el-icon>
                        <User />
                      </el-icon>
                    </el-avatar>
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-dept">{{ user.department }}</span>
                    <el-tag v-if="memberList.some(member => member.id === user.id)" type="success" size="small" class="in-class-tag">
                      已在班级
                    </el-tag>
                  </div>
                </el-checkbox>
                <!-- <div v-if="user.checked" class="checked-notice">
                  【备注】已选定的，搜索结果展示为灰站，如取消勾选，右侧同步取消
                </div> -->
              </div>
            </div>

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
                    <el-tag v-if="data.type === 'user' && memberList.some(member => member.id === data.originalId)" type="success" size="small" class="in-class-tag">
                      已在班级
                    </el-tag>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
        </div>

        <div class="selected-users-section">
          <div class="section-header">
            <span>已选：{{ selectedUsers.length }} 名用户</span>
            <el-button type="text" @click="clearSelectedUsers">清空</el-button>
          </div>

          <div class="selected-users-list">
            <div v-for="user in selectedUsers" :key="user.id" class="selected-user-item">
              <el-avatar :size="32" :src="user.avatar">
                <el-icon>
                  <User />
                </el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-dept">{{ user.department }}</div>
              </div>
              <el-button type="text" class="remove-btn" @click="removeSelectedUser(user)">
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
          <el-button @click="closeAddMemberDialog">取消</el-button>
          <el-button type="primary" @click="confirmAddMembers">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="userDetailDialogVisible" title="用户详情" width="600px">
      <div class="user-detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">
            {{ currentUserDetail.name || '' }}
          </el-descriptions-item>
          <!-- <el-descriptions-item label="管理员">
            {{ currentUserDetail.username || '' }}
          </el-descriptions-item> -->
          <el-descriptions-item label="警号">
            {{ currentUserDetail.policeNumber || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ currentUserDetail.username || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="身份证号">
            {{ currentUserDetail.idCard || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属组织">
            {{ currentUserDetail.orgName || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ currentUserDetail.createTime || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户状态">
            <el-tag :type="currentUserDetail.status === 0 ? 'success' : 'danger'">
              {{ currentUserDetail.status === 0 ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions">
          <div class="action-item">
            <span class="action-label">是否需要修改密码</span>
            <el-button type="text"
              :class="currentUserDetail.needChangePassword === 1 ? 'text-warning' : 'text-success'">
              {{ currentUserDetail.needChangePassword === 1 ? '是' : '否' }}
            </el-button>
          </div>
          <div class="action-item">
            <span class="action-label">教师标识</span>
            <el-button type="text" class="text-info">
              {{ currentUserDetail.teacher === 1 ? '是' : '否' }}
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDetailDialogVisible = false">关闭</el-button>
          <!-- <el-button type="primary" @click="handleEditUser">编辑用户</el-button> -->
        </span>
      </template>
    </el-dialog>

    <!-- 新建学员对话框 -->
    <el-dialog v-model="createMemberDialogVisible" title="新建学员" width="1060px" :before-close="handleCreateDialogClose">
      <el-form ref="createFormRef" :model="createFormData" :rules="createFormRules" label-width="80px">
        <!-- 基本信息行 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="姓名" prop="name" required>
              <el-input v-model="createFormData.name" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="手机号" prop="username" required>
              <el-input v-model="createFormData.username" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="警号" prop="policeNumber">
              <el-input v-model="createFormData.policeNumber" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="createFormData.idCard" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 组织状态行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="归属组织" prop="orgId" required>
              <el-tree-select
                v-model="createFormData.orgId"
                :data="orgTreeDataForSelect"
                :props="{ children: 'children', label: 'orgName', value: 'id' }"
                placeholder="请选择"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="createFormData.status">
                <el-radio :value="0">正常</el-radio>
                <el-radio :value="1">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 批量添加区域 -->
        <!-- <div style="margin-bottom: 20px; padding: 16px; background-color: #fafafa; border-radius: 4px;">
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
        </div> -->

        <!-- 密码设置区域 -->
        <div style="margin-bottom: 20px;">
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
                  v-model="createFormData.customPassword"
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
        <div style="margin-bottom: 20px;">
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
        <el-button @click="handleCreateDialogClose">取消</el-button>
        <el-button type="primary" @click="handleCreateSubmit" :loading="createSubmitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="batchImportDialogVisible" title="批量导入" width="800px" :before-close="handleBatchImportDialogClose">
      <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 4px;">
          <p style="margin: 2px 0; font-size: 14px;"><strong>【备注】</strong></p>
          <p style="margin: 2px 0; font-size: 12px;">1、学员不存在时，自动添加入A班级，学员存在即直接接入A班级；</p>
          <p style="margin: 2px 0; font-size: 12px;">2、初始密码为身份证号后6位，首次登录需要重置密码；</p>
          <p style="margin: 2px 0; font-size: 12px;">3、导入文件中姓名必填，并且是全部路径；如"一级组织名称/二级组织名称/三级组织名称"，斜线内提供了组织数据；</p>
          <p style="margin: 2px 0; font-size: 12px;">4、请务必按照模板填写上传，<a href="#" @click.prevent="downloadTemplate" style="color: #409EFF; text-decoration: underline;">下载模板</a></p>
        </div>

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :limit="1"
          accept=".xlsx,.xls"
          drag
          style="width: 100%;"
        >
          <div class="upload-content">
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">点击或拖拽文件到此处上传</div>
          </div>
        </el-upload>
      </div>

      <template #footer>
        <el-button @click="handleBatchImportDialogClose">取消</el-button>
        <el-button type="primary" @click="handleBatchImportSubmit" :loading="batchImportLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, ArrowDown, Search, MoreFilled, User, OfficeBuilding, Close, Plus, Upload } from '@element-plus/icons-vue';
import { getClassUsers, removeClassUsers, addClassUsers, downloadUserTemplate, uploadUserTemplate, getClazzSummary, getClassList } from '../../../api/teaching-center/ClassManagement.js';
import { getUserList, getUserDetail, batchSaveUsers } from '../../../api/system-management/User.js';
import { getAllOrgTree } from '../../../api/system-management/Org.js';
import { uploadFiles } from '../../../api/common/UploadFiles.js';

const router = useRouter();
const route = useRoute();
const classId = route.params.id;

const loading = ref(false);
const memberList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const selectedMembers = ref([]);
const statsData = reactive({ studentCount: 0, graduateRate: 0, courseCompleteRate: 0, examPassRate: 0, practicePassRate: 0 });
const searchParams = reactive({ param: '', graduate: '' });
const selectAll = ref(false);
const clazzStatus = ref(null); // 班级状态：0未开始，1进行中，2已结束
const isIndeterminate = computed(() => {
  const selectedCount = selectedMembers.value.length;
  return selectedCount > 0 && selectedCount < memberList.value.length;
});

const addMemberDialogVisible = ref(false);
const userSearchKeyword = ref('');
const searchedUsers = ref([]);
const selectedUsers = ref([]);
const orgTreeData = ref([]);

const userDetailDialogVisible = ref(false);
const currentUserDetail = ref({});

// 新建学员相关
const createMemberDialogVisible = ref(false);
const createFormRef = ref();
const createSubmitLoading = ref(false);
const batchUserInput = ref('');
const orgTreeDataForSelect = ref([]);

const createFormData = reactive({
  name: '',
  username: '',
  policeNumber: '',
  idCard: '',
  orgId: null,
  status: 0,
  customPassword: ''
});

// 新增学员相关数据
const passwordType = ref('phone'); // phone: 手机号后六位, custom: 自定义密码
const needChangePasswordOption = ref(1); // 1: 需要修改, 0: 不需要

const createFormRules = {
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
  customPassword: [
    { required: true, message: '请输入自定义密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度应在6-32位之间', trigger: 'blur' }
  ]
};

// 计算批量用户数量
const batchUserCount = computed(() => {
  if (!batchUserInput.value.trim()) return 0;
  return batchUserInput.value.trim().split('\n').filter(line => line.trim()).length;
});

// 批量导入相关
const batchImportDialogVisible = ref(false);
const uploadRef = ref();
const batchImportLoading = ref(false);
const importFile = ref(null);

const goBack = () => { router.go(-1); };

// 获取班级详情(包括状态)
const fetchClazzDetail = async () => {
  try {
    // 使用较大的size来确保能获取到目标班级
    const response = await getClassList({ 
      page: 1, 
      size: 1000, 
      name: '', 
      isMe: false, 
      clazzStatus: '' 
    });
    if (response.code === 200 && response.data && response.data.records) {
      const currentClass = response.data.records.find(c => c.id === parseInt(classId));
      if (currentClass) {
        clazzStatus.value = currentClass.clazzStatus;
      }
    }
  } catch (error) {
    console.error('获取班级详情失败:', error);
  }
};

// 获取班级汇总统计数据
const fetchClazzSummary = async () => {
  try {
    const response = await getClazzSummary(classId);
    if (response.code === 200 && response.data) {
      // 更新统计数据
      statsData.studentCount = response.data.studentCount || 0;
      statsData.graduateRate = response.data.graduateRate || 0;
      statsData.courseCompleteRate = response.data.courseCompleteRate || 0;
      statsData.examPassRate = response.data.examPassRate || 0;
      statsData.practicePassRate = response.data.practicePassRate || 0;
    }
  } catch (error) {
    console.error('获取班级汇总数据失败:', error);
  }
};

const fetchMemberList = async () => {
  try {
    loading.value = true;
    const params = { page: currentPage.value, size: pageSize.value, id: parseInt(classId), ...searchParams };
    const response = await getClassUsers(params);
    memberList.value = response.data.records || [];
    total.value = response.data.total || 0;
    if (response.data.stats) {
      Object.assign(statsData, response.data.stats);
    }
  } catch (error) {
    ElMessage.error('获取成员列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchMemberList();
};

const handleSelectionChange = (selection) => {
  selectedMembers.value = selection;
  selectAll.value = selection.length === memberList.value.length && memberList.value.length > 0;
};

const handleSelectAll = (checked) => {
  // 实际的全选/取消全选应由el-table的toggleAllSelection方法处理
};

const handleBatchAction = async (command) => {
  if (command === 'add') {
    addMemberDialogVisible.value = true;
    await fetchOrgTree();
  } else if (command === 'createNew') {
    // 新建学员
    createMemberDialogVisible.value = true;
    await fetchOrgTreeForSelect();
  } else if (command === 'batchImport') {
    // 批量导入
    batchImportDialogVisible.value = true;
    importResult.value = null;
  }
};

const handleViewDetail = async (member) => {
  try {
    const res = await getUserDetail(member.id);
    if (res.code === 200) {
      currentUserDetail.value = res.data;
      userDetailDialogVisible.value = true;
    } else {
      ElMessage.error(res.msg || '获取用户详情失败');
    }
  } catch(e) {
    ElMessage.error('获取用户详情失败');
  }
};

const handleMemberAction = async (command, member) => {
  if (command === 'remove') {
    try {
      await ElMessageBox.confirm(`确定要移除学员"${member.name}"吗？`, '确认移除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
      await removeClassUsers({ id: parseInt(classId), userIdList: [member.id] });
      ElMessage.success('移除成功');
      fetchMemberList();
    } catch (error) {
      if (error !== 'cancel') ElMessage.error('移除失败');
    }
  }
};

const handleBatchOperation = async (command) => {
  if (command === 'batchRemove') {
    if (selectedMembers.value.length === 0) {
      ElMessage.warning('请先选择要移除的学员');
      return;
    }
    try {
      await ElMessageBox.confirm(`确定要移除选中的 ${selectedMembers.value.length} 名学员吗？`, '确认批量移除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
      const userIds = selectedMembers.value.map(member => member.id);
      await removeClassUsers({ id: parseInt(classId), userIdList: userIds });
      ElMessage.success('批量移除成功');
      fetchMemberList();
    } catch (error) {
      if (error !== 'cancel') ElMessage.error('批量移除失败');
    }
  }
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchMemberList();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchMemberList();
};

const handleUserSearch = async () => {
  if (!userSearchKeyword.value.trim()) {
    searchedUsers.value = [];
    return;
  }
  try {
    const response = await getUserList({ pageNum: 1, pageSize: 50, param: userSearchKeyword.value.trim(), pagination: true });
    if (response.code === 200) {
      searchedUsers.value = response.data.records.map(user => {
        let department = user.orgName || user.organizationName || user.deptName || user.department;

        // 如果搜索结果中没有部门信息，尝试从组织树中查找
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

        return {
          id: user.id,
          name: user.name,
          department: department || '未知部门',
          avatar: user.avatar || '',
          checked: selectedUsers.value.some(u => u.id === user.id) || memberList.value.some(member => member.id === user.id)
        };
      });
    }
  } catch (error) { ElMessage.error('搜索用户失败'); }
};

const fetchOrgTree = async () => {
  try {
    const response = await getAllOrgTree({ personnel: true });
    if (response.code === 200) {
      orgTreeData.value = transformOrgTreeData(response.data);
    } else {
      ElMessage.error(response.msg || '获取组织树失败');
    }
  } catch (error) {
    ElMessage.error('获取组织树失败');
  }
};

// [核心修正] 重写转换函数以匹配您提供的真实API数据结构
const transformOrgTreeData = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];

  return nodes.map(orgNode => {
    // 转换组织节点
    const transformedOrg = {
      id: `org_${orgNode.id}`,
      name: orgNode.orgName,
      type: 'org',
      children: []
    };

    // 转换该组织下的用户
    const users = (orgNode.users || []).map(userNode => ({
      id: `user_${userNode.id}`,
      originalId: userNode.id,
      name: userNode.name,
      type: 'user',
      department: orgNode.orgName, // 部门名称是当前组织的名称
      avatar: userNode.avatar || '',
      policeNumber: userNode.policeNumber || '',
      phone: userNode.username || ''
    }));

    // 递归转换子组织
    const subOrgs = transformOrgTreeData(orgNode.children || []);

    // 将转换后的子组织和用户合并到 children 数组中
    transformedOrg.children = [...subOrgs, ...users];

    return transformedOrg;
  });
};

const handleUserCheck = (user) => {
  const isInClass = memberList.value.some(member => member.id === user.id);
  if (user.checked) {
    if (!selectedUsers.value.some(u => u.id === user.id)) {
      selectedUsers.value.push({ id: user.id, name: user.name, department: user.department, avatar: user.avatar });
    }
  } else {
    if (isInClass) {
      user.checked = true;
      ElMessage.warning('该用户已在班级中，无法取消选择');
      return;
    }
    const index = selectedUsers.value.findIndex(u => u.id === user.id);
    if (index > -1) {
      selectedUsers.value.splice(index, 1);
    }
  }
};

const handleOrgTreeCheck = (data, checkedInfo) => {
  const { checkedNodes } = checkedInfo;
  const usersFromTree = checkedNodes
    .filter(node => node.type === 'user' && !memberList.value.some(m => m.id === node.originalId))
    .map(user => ({
      id: user.originalId,
      name: user.name,
      department: user.department,
      avatar: user.avatar
    }));
  selectedUsers.value = [...usersFromTree];
};

const clearSelectedUsers = () => {
  selectedUsers.value = [];
  searchedUsers.value.forEach(user => {
    if(!memberList.value.some(m => m.id === user.id)) user.checked = false;
  });
};

// 清理添加学员弹窗的搜索状态
const clearAddMemberDialogState = () => {
  userSearchKeyword.value = '';
  searchedUsers.value = [];
  selectedUsers.value = [];
};

// 关闭添加学员弹窗
const closeAddMemberDialog = () => {
  addMemberDialogVisible.value = false;
  clearAddMemberDialogState();
};

const removeSelectedUser = (user) => {
  const index = selectedUsers.value.findIndex(u => u.id === user.id);
  if (index > -1) selectedUsers.value.splice(index, 1);
  const searchUser = searchedUsers.value.find(u => u.id === user.id);
  if (searchUser) searchUser.checked = false;
};

const confirmAddMembers = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要添加的学员');
    return;
  }
  try {
    const userIds = selectedUsers.value.map(user => parseInt(user.id));
    await addClassUsers({ id: parseInt(classId), userIdList: userIds });
    ElMessage.success('添加学员成功');
    addMemberDialogVisible.value = false;
    clearAddMemberDialogState();
    fetchMemberList();
  } catch (error) {
    ElMessage.error('添加学员失败');
  }
};

const handleEditUser = () => {
  userDetailDialogVisible.value = false;
  ElMessage.info('编辑用户功能');
};

// 获取组织树（用于新建学员的选择器）
const fetchOrgTreeForSelect = async () => {
  try {
    const response = await getAllOrgTree();
    if (response.code === 200) {
      orgTreeDataForSelect.value = response.data || [];
    } else {
      ElMessage.error(response.msg || '获取组织树失败');
    }
  } catch (error) {
    ElMessage.error('获取组织树失败');
  }
};

// 重置新建学员表单
const resetCreateForm = () => {
  createFormData.name = '';
  createFormData.username = '';
  createFormData.policeNumber = '';
  createFormData.idCard = '';
  createFormData.orgId = null;
  createFormData.status = 0;
  createFormData.customPassword = '';
  batchUserInput.value = '';
  passwordType.value = 'phone';
  needChangePasswordOption.value = 1;
  createFormRef.value?.resetFields();
};

// 关闭新建学员对话框
const handleCreateDialogClose = () => {
  createMemberDialogVisible.value = false;
  resetCreateForm();
};

// 提交新建学员
const handleCreateSubmit = async () => {
  try {
    // 验证基本信息
    if (!createFormData.orgId) {
      ElMessage.error('请选择归属组织');
      return;
    }
    
    // 验证自定义密码
    if (passwordType.value === 'custom') {
      if (!createFormData.customPassword) {
        ElMessage.error('请输入自定义密码');
        return;
      }
      if (createFormData.customPassword.length < 6 || createFormData.customPassword.length > 32) {
        ElMessage.error('密码长度应在6-32位之间');
        return;
      }
    }
    
    createSubmitLoading.value = true;
    
    const users = [];
    
    // 检查是否有批量用户输入
    if (batchUserInput.value.trim()) {
      // 解析批量用户数据
      const lines = batchUserInput.value.trim().split('\n');
      for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          const [name, phone, policeNumber = '', idCard = ''] = parts;
          users.push({
            name,
            username: phone,
            policeNumber,
            idCard,
            orgId: createFormData.orgId
          });
        }
      }
    } else {
      // 单个用户 - 验证必填字段
      if (!createFormData.name || !createFormData.username) {
        ElMessage.error('请输入姓名和手机号');
        createSubmitLoading.value = false;
        return;
      }
      
      users.push({
        username: createFormData.username,
        policeNumber: createFormData.policeNumber,
        idCard: createFormData.idCard,
        name: createFormData.name,
        orgId: createFormData.orgId
      });
    }
    
    if (users.length === 0) {
      ElMessage.error('请至少添加一个用户');
      createSubmitLoading.value = false;
      return;
    }
    
    // 确定密码
    let password = '';
    if (passwordType.value === 'custom') {
      // 使用自定义密码
      password = createFormData.customPassword;
    } else {
      // 使用手机号后6位
      if (users[0].username && users[0].username.length >= 6) {
        password = users[0].username.slice(-6);
      } else {
        password = '123456'; // 默认密码
      }
    }
    
    const userData = {
      password: password,
      needChangePassword: needChangePasswordOption.value, // 使用用户选择的修改密码选项
      clazzId: parseInt(classId), // 添加班级ID
      users: users
    };
    
    const response = await batchSaveUsers(userData);
    if (response.code === 200) {
      ElMessage.success('新建学员成功');
      
      // 获取新建的用户ID并添加到班级
      if (response.data && response.data.length > 0) {
        const userIds = response.data.map(user => user.id || user.userId);
        try {
          await addClassUsers({ id: parseInt(classId), userIdList: userIds });
          ElMessage.success('学员已自动添加到班级');
        } catch (error) {
          ElMessage.warning('学员创建成功，但添加到班级失败，请手动添加');
        }
      }
      
      createMemberDialogVisible.value = false;
      resetCreateForm();
      fetchMemberList();
    } else {
      ElMessage.error(response.msg || '新建学员失败');
    }
  } catch (error) {
    console.error('新建学员错误:', error);
    ElMessage.error('新建学员失败');
  } finally {
    createSubmitLoading.value = false;
  }
};

// 文件变化处理
// 文件变化处理
const handleFileChange = (uploadFile) => {
  importFile.value = uploadFile.raw;
};

// 文件移除处理
const handleFileRemove = () => {
  importFile.value = null;
};

// 提交批量导入
const handleBatchImportSubmit = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件');
    return;
  }

  batchImportLoading.value = true;
  try {
    // 创建表单数据
    const formData = new FormData();
    formData.append('file', importFile.value);
    formData.append('clazzId', classId);
    
    // 调用批量导入API
    const response = await uploadUserTemplate(formData);

    if (response.code === 200) {
      ElMessage.success('批量导入成功');
      
      // 关闭对话框并刷新列表
      setTimeout(() => {
        handleBatchImportDialogClose();
        fetchMemberList();
      }, 1000);
    } else {
      ElMessage.error(response.msg || '导入失败');
    }
  } catch (error) {
    console.error('批量导入错误:', error);
    ElMessage.error('批量导入失败');
  } finally {
    batchImportLoading.value = false;
  }
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await downloadUserTemplate();
    
    // 创建blob对象
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '学员导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('模板下载成功');
  } catch (error) {
    console.error('下载模板失败:', error);
    ElMessage.error('下载模板失败');
  }
};

// 关闭批量导入对话框
const handleBatchImportDialogClose = () => {
  batchImportDialogVisible.value = false;
  importFile.value = null;
  uploadRef.value?.clearFiles();
};

onMounted(() => {
  fetchClazzDetail(); // 获取班级详情(包括状态)
  fetchClazzSummary(); // 获取班级汇总统计数据
  fetchMemberList();
});
</script>
<style scoped>
.member-management-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  padding: 0;
}

.back-btn:hover {
  color: #409eff;
}

.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  flex: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.notice {
  color: #ff4d4f;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.status-select {
  width: 120px;
}

.member-table {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-info {
  color: #6b7280;
  font-size: 14px;
}

/* 添加学员弹窗样式 */
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
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
}

.user-tree-container {
  flex-grow: 1;
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

.search-result.in-class {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
  padding-left: 8px;
}

.in-class-tag {
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
  display: flex;
  flex-direction: column;
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
  flex-grow: 1;
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

/* 用户详情弹窗样式 */
.user-detail-content {
  padding: 20px 0;
}

.detail-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e6e6e6;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.action-label {
  font-weight: 500;
  color: #606266;
}

.text-warning {
  color: #e6a23c !important;
}

.text-success {
  color: #67c23a !important;
}

.text-info {
  color: #409eff !important;
}
</style>