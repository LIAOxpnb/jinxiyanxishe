<template>
  <div class="classes-page">
    <!-- 页面标题 -->
    <h1 class="page-title">班级管理 <span class="title-remark">【备注】默认展示我的班级</span></h1>

    <!-- 筛选栏 -->
    <FilterBar
      :fields="filterFields"
      createButtonText="新增班级"
      @create="handleCreate"
      @filter="handleFilter"
      @reset="handleReset"
    />

    <!-- 班级列表容器 -->
    <div class="classes-container">
      <!-- 班级列表 -->
      <div class="classes-grid">
        <div
          v-for="classItem in classList"
          :key="classItem.id"
          class="class-card"
        >
          <!-- 班级状态标签 -->
          <div class="status-tag" :class="getStatusClass(classItem.clazzStatus)">
            {{ getStatusText(classItem.clazzStatus) }}
          </div>

          <!-- 班级标题 -->
          <h3 class="class-title">{{ classItem.name }}</h3>

          <!-- 时间信息 -->
          <div class="time-info">
            <el-icon><Clock /></el-icon>
            <span v-if="classItem.studyDate === 0">不限时</span>
            <span v-else>{{ classItem.startTime }} 至 {{ classItem.endTime }}</span>
          </div>

          <!-- 统计信息 -->
          <div class="stats">
            <span class="stat-item">{{ classItem.userCount }} 学员</span>
            <span class="stat-item">{{ classItem.courseCount }} 课程</span>
            <span class="stat-item">{{ classItem.examCount }} 练习</span>
            <span class="stat-item">{{ classItem.examCount }} 考试</span>
            <span class="stat-item">{{ classItem.shootingRangeCount }} 靶场</span>
          </div>

          <!-- 操作按钮 -->
          <div class="class-actions">
            <el-button size="small" @click="handleClassSettings(classItem)">
              班级设置
            </el-button>
            <el-button size="small" @click="handleMemberManage(classItem)">
              成员管理
            </el-button>
            <el-dropdown @command="(command) => handleMoreActions(command, classItem)">
              <el-button size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" :disabled="classItem.clazzStatus === 2">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete" :disabled="classItem.clazzStatus === 2">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 已到期班级提示 -->
          <div v-if="classItem.clazzStatus === 2" class="expired-notice">
            【备注】已到期结业的班级不能修改，隐藏学习设置。
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-info">
          总共{{ total }}条
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑班级对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑班级' : '新增班级'"
      width="600px"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="学习时间" prop="studyDate">
          <el-radio-group v-model="formData.studyDate">
            <el-radio :label="0">不限时</el-radio>
            <el-radio :label="1">指定时间</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.studyDate === 1" label="开始时间" prop="startTime">
          <el-date-picker
            v-model="formData.startTime"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item v-if="formData.studyDate === 1" label="结束时间" prop="endTime">
          <el-date-picker
            v-model="formData.endTime"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Clock, MoreFilled } from '@element-plus/icons-vue';
import FilterBar from '../../../components/common/FilterBar.vue';
import { getClassList, createClass, updateClass, deleteClass } from '../../../api/teaching-center/ClassManagement.js';

const router = useRouter();

// 筛选栏配置
const filterFields = [
  {
    type: 'input',
    model: 'name',
    placeholder: '班级名称',
    defaultValue: ''
  },
  {
    type: 'select',
    model: 'isMe',
    placeholder: '我的班级',
    defaultValue: true,
    options: [
      { label: '我的班级', value: true },
      { label: '所有班级', value: false }
    ]
  },
  {
    type: 'select',
    model: 'clazzStatus',
    placeholder: '状态',
    defaultValue: '',
    options: [
      { label: '未开始', value: 0 },
      { label: '进行中', value: 1 },
      { label: '已结束', value: 2 }
    ]
  }
];

// 响应式数据
const classList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);

// 筛选参数
const filterParams = reactive({
  name: '',
  isMe: true,
  clazzStatus: ''
});

// 对话框
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  studyDate: 0,
  startTime: '',
  endTime: ''
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' }
  ],
  studyDate: [
    { required: true, message: '请选择学习时间类型', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
};

// 获取班级列表
const fetchClassList = async () => {
  try {
    loading.value = true;
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...filterParams
    };
    
    const response = await getClassList(params);
    classList.value = response.data.records || [];
    total.value = response.data.total || 0;
  } catch (error) {
    ElMessage.error('获取班级列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '未开始',
    1: '进行中',
    2: '已结束'
  };
  return statusMap[status] || '未知';
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    0: 'status-pending',
    1: 'status-active',
    2: 'status-finished'
  };
  return classMap[status] || '';
};

// 处理新增
const handleCreate = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 处理筛选
const handleFilter = (filterData) => {
  Object.assign(filterParams, filterData);
  currentPage.value = 1;
  fetchClassList();
};

// 处理重置
const handleReset = () => {
  Object.assign(filterParams, {
    name: '',
    isMe: true,
    clazzStatus: ''
  });
  currentPage.value = 1;
  fetchClassList();
};

// 处理班级设置
const handleClassSettings = (classItem) => {
  router.push({
    name: 'TeachingCenter-ClassSettings',
    params: { id: classItem.id }
  });
};

// 处理成员管理
const handleMemberManage = (classItem) => {
  router.push({
    name: 'TeachingCenter-MemberManagement',
    params: { id: classItem.id }
  });
};

// 处理更多操作
const handleMoreActions = (command, classItem) => {
  if (command === 'edit') {
    handleEdit(classItem);
  } else if (command === 'delete') {
    handleDelete(classItem);
  }
};

// 处理编辑
const handleEdit = (classItem) => {
  isEdit.value = true;
  
  Object.assign(formData, {
    id: classItem.id,
    name: classItem.name,
    studyDate: classItem.studyDate,
    startTime: classItem.startTime || '',
    endTime: classItem.endTime || ''
  });
  dialogVisible.value = true;
};

// 处理删除
const handleDelete = async (classItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除班级"${classItem.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await deleteClass(classItem.id);
    ElMessage.success('删除成功');
    fetchClassList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error(error);
    }
  }
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchClassList();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchClassList();
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: null,
    name: '',
    studyDate: 0,
    startTime: '',
    endTime: ''
  });
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    
    const submitData = { ...formData };
    
    if (isEdit.value) {
      await updateClass(submitData);
      ElMessage.success('编辑成功');
    } else {
      await createClass(submitData);
      ElMessage.success('新增成功');
    }
    
    dialogVisible.value = false;
    fetchClassList();
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败');
      console.error(error);
    }
  }
};

// 初始化
onMounted(() => {
  fetchClassList();
});
</script>

<style scoped>
.classes-page {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.title-remark {
  color: #ff4d4f;
  font-size: 14px;
  font-weight: 400;
  margin-left: 12px;
}

.classes-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.classes-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin: 20px 0;
  overflow-y: auto;
  padding-right: 10px;
}

.class-card {
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  height: fit-content;
}

.status-tag {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #f0f9ff;
  color: #0284c7;
}

.status-active {
  background-color: #f0fdf4;
  color: #16a34a;
}

.status-finished {
  background-color: #fafafa;
  color: #6b7280;
}

.class-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  padding-right: 80px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 14px;
}

.stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  color: #6b7280;
  font-size: 14px;
}

.class-actions {
  display: flex;
  gap: 8px;
}

.expired-notice {
  margin-top: 12px;
  padding: 8px;
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  color: #92400e;
  font-size: 12px;
}

.pagination-wrapper {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid #e6e6e6;
  background-color: #fff;
}

.pagination-info {
  color: #6b7280;
  font-size: 14px;
}
</style>
