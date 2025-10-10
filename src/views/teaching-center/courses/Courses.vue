<template>
  <div class="page-wrapper">
    
    <div class="main-content">
      <div class="page-header">
        <h1 class="page-title">课程管理</h1>
        <div class="header-remark">【备注】默认展示我创建的课程</div>
      </div>

      <FilterBar
        create-button-text="新增课程"
        :fields="courseFilterFields"
        @create="handleCreateCourse"
        @filter="handleFilter"
      />

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="课程名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="发布" width="90">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 1 ? 'success' : 'info'"
              disable-transitions
            >{{ scope.row.status === 1 ? '已发布' : '未发布' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="courseCategory" label="分类" min-width="100" />
        <el-table-column prop="scope" label="学习范围" width="120">
            <template #default="scope">
                {{ scopeMap[scope.row.scope] || '未知' }}
            </template>
        </el-table-column>
        <el-table-column prop="studentCount" label="学习人数" width="100" />
        <el-table-column prop="classCount" label="班级" width="80" />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160" />

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleProvision(scope.row)">课程设置</el-button>
            <el-button link type="primary" size="small" @click="handleStatistics(scope.row)">统计</el-button>
            
            <el-dropdown trigger="click" @command="(command) => handleMoreActions(command, scope.row)">
              <span class="el-dropdown-link">
                <el-button link type="primary" size="small">
                  <el-icon><More /></el-icon>
                </el-button>
              </span>
   <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="scope.row.status === 1 ? 'unpublish' : 'publish'">
                    {{ scope.row.status === 1 ? '取消发布' : '发布' }}
                  </el-dropdown-item>
                  
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  
                  <el-dropdown-item command="delete" style="color: #F56C6C;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div>
          <el-button @click="handleBatchDelete" :disabled="selectedCourses.length === 0">批量删除</el-button>
        </div>
        
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        >
        </el-pagination>
      </div>
    </div>
    <CreateCourseDialog v-model:visible="createDialogVisible" @success="handleCreateSuccess" />



  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { More } from '@element-plus/icons-vue';
import FilterBar from '@/components/common/FilterBar.vue'; // 确保路径正确
import  CreateCourseDialog  from '../courses/CreateCourseDialog.vue'; // 确保路径正确f

// 【注意】请确保已创建对应的API文件和函数
import { getCourseList, createCourse, updateCourseStatus,deleteCourse } from '../../../api/teaching-center/CourseManagement.js';
import { getDictByType } from '@/api/system-management/dictionary.js';

const router = useRouter();

const loading = ref(true);
const tableData = ref([]); // 表格数据
const selectedCourses = ref([]); // 表格中选中的行

// 筛选参数
const filterParams = reactive({
  name: '',
  creator: '',
  scope: '',
  courseCategory: '',
  status: '',
  isMe: true, // 默认只看我的课程
});

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const categoryOptions = ref([]); // 课程分类选项
const scopeMap = { // 用于在表格中显示学习范围的文本
    0: '公开课',
    1: '指定人员',
    2: '指定班级'
};

// FilterBar 的配置
const courseFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '课程名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { 
    type: 'select', 
    model: 'scope', 
    placeholder: '学习范围', 
    options: [
      { label: '公开课', value: 0 },
      { label: '指定人员', value: 1 },
      { label: '指定班级', value: 2 },
    ]
  },
  { 
    type: 'select', 
    model: 'courseCategory', 
    placeholder: '分类', 
    options: categoryOptions // 动态加载
  },
  { 
    type: 'select', 
    model: 'status', 
    placeholder: '发布状态', 
    options: [
      { label: '已发布', value: 1 },
      { label: '未发布', value: 0 },
    ]
  },
  { 
    type: 'select', 
    model: 'isMe', 
    placeholder: '我的课程', 
    defaultValue: true, // 默认选中"我的课程"
    options: [
      { label: '我的课程', value: true },
      { label: '全部课程', value: false },
    ]
  },
]);

// --- 新增课程对话框 ---
const createDialogVisible = ref(false);


// --- API 调用 ---
const fetchCourses = async () => {
  loading.value = true;
  try {
    const payload = { ...filterParams, ...pagination };
    const res = await getCourseList(payload); // 【API】获取课程列表
    if (res.code === 200) {
      // 【已修改】直接使用后端返回的数据，不再添加或修改任何字段
      tableData.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取列表失败');
    }
  } catch (error) {
    console.error("获取课程列表失败", error);
    ElMessage.error('获取课程列表失败，请检查API');
    // 【已修改】API失败时，不再加载假数据，表格将显示为空
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await getDictByType('course_category'); // 【API】获取课程分类字典
    if (res.code === 200) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue,
      }));
    }
  } catch (error) { 
    console.error("获取课程分类失败", error);
    ElMessage.error('获取课程分类选项失败');
  }
};

// --- 事件处理 ---
const handleFilter = (data) => {
  Object.assign(filterParams, data);
  pagination.page = 1;
  fetchCourses();
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  fetchCourses();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchCourses();
};

const handleCreateCourse = () => {
  createDialogVisible.value = true;
};

const resetCreateForm = () => {
  createFormRef.value?.resetFields();
};
const handleCreateSuccess = () => {
  // 重新加载第一页数据，以显示新创建的课程
  pagination.page = 1;
  fetchCourses();
};

const submitCreateCourse = async () => {
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      const res = await createCourse(createForm); // 【API】创建课程
      if (res.code === 200) {
        ElMessage.success('创建成功！');
        createDialogVisible.value = false;
        fetchCourses();
      } else {
        ElMessage.error(res.msg || '创建失败');
      }
    }
  });
};

// 【核心】跳转到课程设置/编排页面
const handleProvision = (row) => {
  router.push({
    name: 'TeachingCenter-CourseProvision',
    params: { id: row.id }
  });
};

// 【核心】跳转到课程统计页面
const handleStatistics = (row) => {
  router.push({
    name: 'TeachingCenter-CourseStatistics',
    params: { id: row.id }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除课程 “${row.name}” 吗？`, '删除提示', { type: 'warning' })
    .then(async () => {
      await deleteCourse([row.id]); // 【API】删除课程
      ElMessage.success('删除成功！');
      fetchCourses();
    }).catch(() => {});
};

const handleSelectionChange = (selection) => {
  selectedCourses.value = selection;
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedCourses.value.length} 项课程吗？`, '批量删除', { type: 'warning' })
    .then(async () => {
      const ids = selectedCourses.value.map(item => item.id);
      await deleteCourse(ids); // 【API】批量删除课程
      ElMessage.success('批量删除成功！');
      fetchCourses();
    }).catch(() => {});
};

const handleMoreActions = (command, row) => {
  switch (command) {
    case 'publish':
    case 'unpublish':
      togglePublishStatus(row, command === 'publish' ? 1 : 0);
      break;
    case 'copy':
      ElMessage.info(`复制课程功能待实现: ${row.name}`);
      break;
    case 'delete':
      handleDelete(row);
      break;
  }
};

const togglePublishStatus = (row, status) => {
  const actionText = status === 1 ? '发布' : '取消发布';
  ElMessageBox.confirm(`确定要${actionText}课程 “${row.name}” 吗？`, '操作确认', { type: 'warning' })
    .then(async () => {
      await updateCourseStatus({ id: row.id, status }); // 【API】更新课程状态
      ElMessage.success(`${actionText}成功！`);
      fetchCourses();
    }).catch(() => {});
};

onMounted(() => {
  fetchCourses();
  fetchCategories();
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}
.header-remark {
  color: #F56C6C;
  font-size: 14px;
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
  margin-left: 8px; /* 给更多操作按钮一些左边距 */
}
</style>