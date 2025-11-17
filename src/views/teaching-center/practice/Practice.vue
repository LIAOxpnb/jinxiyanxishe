<template>
  <div class="page-container">
    <div class="main-content">
      <h1 class="page-title">练习管理</h1>

      <FilterBar
        create-button-text="新增练习"
        :fields="practiceFilterFields"
        @create="handleCreate"
        @filter="handleFilter"
      />

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="练习名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="courseInfo" label="关联课程" min-width="250" show-overflow-tooltip />
        <el-table-column prop="questionCount" label="试题数量" width="110" align="center" />
        <el-table-column prop="creatorName" label="创建人" width="120" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="220" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleSettings(scope.row)">练习设置</el-button>
            <el-dropdown @command="(command) => handleDropdownAction(command, scope.row)">
              <el-button link type="primary" size="small" class="more-btn">
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <!-- <el-dropdown-item command="edit">编辑</el-dropdown-item> -->
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="delete" style="color: #F56C6C;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedItems.length > 0" style="margin: 10px 0;">
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedItems.length }})
        </el-button>
      </div>

      <div class="table-footer">
        <div></div>
        
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @size-change="fetchPracticeList"
          @current-change="fetchPracticeList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="practiceForm" :rules="rules" label-width="80px">
        <el-form-item label="练习名称" prop="name">
          <el-input v-model="practiceForm.name" placeholder="请输入练习名称" />
        </el-form-item>
        <el-form-item label="关联课程" prop="courseId">
          <el-row :gutter="10">
            <el-col :span="8">
              <el-select v-model="practiceForm.courseId" placeholder="请选择课程" style="width: 100%">
                <el-option v-for="course in courseOptions" :key="course.id" :label="course.name" :value="course.id" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select v-model="practiceForm.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!practiceForm.courseId">
                <el-option v-for="chapter in chapterOptions" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select v-model="practiceForm.sectionId" placeholder="请选择小节" style="width: 100%" :disabled="!practiceForm.chapterId">
                <el-option v-for="section in sectionOptions" :key="section.id" :label="section.name" :value="section.id" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 复制练习对话框 -->
    <el-dialog
      v-model="copyDialogVisible"
      title="复制练习"
      width="500px"
      @close="resetCopyForm"
    >
      <el-form
        ref="copyFormRef"
        :model="copyForm"
        :rules="copyFormRules"
        label-width="80px"
      >
        <el-form-item label="原练习名" prop="originalName">
          <el-input 
            v-model="copyForm.originalName" 
            placeholder="原练习名称"
            disabled
          />
        </el-form-item>
        <el-form-item label="新练习名" prop="name">
          <el-input 
            v-model="copyForm.name" 
            placeholder="请输入新练习名称"
            maxlength="30"
            show-word-limit 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="copyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCopyPractice">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { More, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';

import {
  getPracticeList,
  createPractice,
  deletePractice,
  updatePractice,
  copyPractice,
} from '@/api/teaching-center/PracticeManagement';
import { getCourseList, getCourseDetail } from '@/api/teaching-center/courseManagement';


const router = useRouter();
const loading = ref(true);
const tableData = ref([]);
const total = ref(0);
const pagination = reactive({ page: 1, size: 10 });
const filters = ref({ isMe: true }); // 初始化时默认包含 isMe: true
const selectedItems = ref([]);
const courseOptions = ref([]);

// 联动选择相关状态
const chapterOptions = ref([]);
const sectionOptions = ref([]);
const currentCourseDetail = ref(null);

const practiceFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '练习名称' },
  { type: 'input', model: 'creatorName', placeholder: '创建人' },
  { type: 'select', model: 'courseId', placeholder: '课程', options: courseOptions, props: { value: 'id', label: 'name' } },
  { type: 'select', model: 'isMe', placeholder: '我的练习', options: [{label: '我的练习', value: true}, {label: '全部练习', value: false}], defaultValue: true },
]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
const practiceForm = reactive({
  id: null,
  name: '',
  courseId: null,
  chapterId: null,
  sectionId: null,
});
const rules = reactive({
  name: [{ required: true, message: '请输入练习名称', trigger: 'blur' }],
  courseId: [{ required: true, message: '请选择课程、章节和小节', trigger: 'change' }],
});
const dialogTitle = computed(() => isEdit.value ? '编辑练习' : '新增练习');

// --- 复制练习对话框相关 ---
const copyDialogVisible = ref(false);
const copyFormRef = ref(null);
const copyForm = reactive({
  id: '',
  originalName: '',
  name: '',
});
const copyFormRules = reactive({
  name: [{ required: true, message: '请输入新练习名称', trigger: 'blur' }],
});

// --- API 调用与事件处理 ---
const fetchPracticeList = async () => {
  loading.value = true;
  const cleanFilters = Object.fromEntries(Object.entries(filters.value).filter(([_, v]) => v != null && v !== ''));
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...cleanFilters,
    };
    const res = await getPracticeList(params);
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records.map(item => {
        const courseName = item.course?.name || '未知课程';
        const chapterName = item.courseChapter?.name || '未知章节';
        const sectionName = item.courseSection?.name || '未知小节';
        
        return {
          ...item,
          courseInfo: `${courseName}-${chapterName}-${sectionName}`,
        };
      });
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error('获取练习列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchCoursesForFilter = async () => {
    try {
        const res = await getCourseList({ page: 1, size: 1000 });
        if (res.code === 200) {
            courseOptions.value = res.data.records;
        }
    } catch (error) {
        ElMessage.error('获取课程筛选选项失败');
    }
};

watch(() => practiceForm.courseId, async (newCourseId) => {
  practiceForm.chapterId = null;
  practiceForm.sectionId = null;
  chapterOptions.value = [];
  sectionOptions.value = [];
  currentCourseDetail.value = null;

  if (newCourseId) {
    try {
      const res = await getCourseDetail({ id: newCourseId });
      if (res.code === 200 && res.data) {
        currentCourseDetail.value = res.data;
        chapterOptions.value = res.data.courseChapterList || [];
      }
    } catch (error) {
      ElMessage.error('获取章节列表失败');
    }
  }
});

watch(() => practiceForm.chapterId, (newChapterId) => {
  practiceForm.sectionId = null;
  sectionOptions.value = [];

  if (newChapterId && currentCourseDetail.value) {
    const selectedChapter = currentCourseDetail.value.courseChapterList.find(
      chapter => chapter.id === newChapterId
    );
    if (selectedChapter) {
      sectionOptions.value = selectedChapter.courseSectionList || [];
    }
  }
});

const handleFilter = (filterData) => {
  filters.value = filterData;
  pagination.page = 1;
  fetchPracticeList();
};

const resetForm = () => {
    Object.assign(practiceForm, {
        id: null, name: '', courseId: null, chapterId: null, sectionId: null,
    });
    chapterOptions.value = [];
    sectionOptions.value = [];
    currentCourseDetail.value = null;
};

const resetCopyForm = () => {
  if (copyFormRef.value) {
    copyFormRef.value.resetFields();
  }
  copyForm.id = '';
  copyForm.originalName = '';
  copyForm.name = '';
};

const handleCreate = () => {
  resetForm();
  isEdit.value = false;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm();
  isEdit.value = true;
  Object.assign(practiceForm, row);
  dialogVisible.value = true;
};

const handleSettings = (row) => {
  router.push({
    name: 'TeachingCenter-PracticeSettings',
    params: {
      id: row.id
    }
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const apiCall = isEdit.value ? updatePractice : createPractice;
        await apiCall(practiceForm);
        ElMessage.success(isEdit.value ? '修改成功！' : '新增成功！');
        dialogVisible.value = false;
        fetchPracticeList();
      } catch (error) {
        ElMessage.error('操作失败');
      }
    }
  });
};

const submitCopyPractice = async () => {
  if (!copyFormRef.value) return;
  await copyFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await copyPractice({
          id: copyForm.id,
          name: copyForm.name
        });
        if (res.code === 200) {
          ElMessage.success('复制成功！');
          copyDialogVisible.value = false;
          fetchPracticeList();
        } else {
          ElMessage.error(res.msg || '复制失败');
        }
      } catch (error) {
        ElMessage.error('复制失败');
      }
    }
  });
};

const handleCopy = (row) => {
  copyForm.id = row.id;
  copyForm.originalName = row.name;
  copyForm.name = `${row.name}_副本`;
  copyDialogVisible.value = true;
};

const handleSelectionChange = (selection) => {
  selectedItems.value = selection;
};

const handleBatchDelete = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要删除的练习');
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedItems.value.length} 项练习吗？此操作不可恢复！`, 
    '批量删除确认', 
    { 
      type: 'warning', 
      confirmButtonText: '确定删除', 
      cancelButtonText: '取消' 
    }
  ).then(async () => {
    try {
      // 收集所有要删除的练习ID
      const ids = selectedItems.value.map(item => item.id);
      const deletePromises = ids.map(id => deletePractice([id]));
      
      // 并发执行所有删除操作
      await Promise.all(deletePromises);
      
      ElMessage.success(`成功删除 ${selectedItems.value.length} 项练习！`);
      selectedItems.value = [];
      fetchPracticeList();
    } catch (error) {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败，请重试');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

const handleDropdownAction = (command, row) => {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'copy':
      handleCopy(row);
      break;
    case 'delete':
      ElMessageBox.confirm(`确定要删除练习 "${row.name}" 吗？`, '提示', { type: 'warning' })
        .then(async () => {
          await deletePractice([row.id]);
          ElMessage.success('删除成功！');
          fetchPracticeList();
        }).catch(() => {});
      break;
  }
};

onMounted(() => {
  fetchPracticeList();
  fetchCoursesForFilter();
});
</script>

<style scoped>
.page-container {
  height: 100vh;
  background-color: #f7f8fa;
}
.main-content {
  margin: 20px;
  background-color: #ffffff;
  padding: 24px;
  border-radius: 8px;
}
.page-title {
  margin: 0 0 20px 0;
  font-size: 24px !important;
  font-weight: 600;
  color: #303133;
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
.more-btn {
  margin-left: 8px;
}
</style>