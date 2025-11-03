<template>
  <div class="page-wrapper">
    <div class="main-content">
      <h1 class="page-title">考试管理</h1>
      
      <!-- <div class="header-remark">【备注】默认展示我预约的考试</div> -->

      <FilterBar
        create-button-text="创建考试"
        :fields="examFilterFields"
        @create="handleCreateExam"
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
        <el-table-column prop="name" label="考试名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="发布" width="90">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 1 ? 'success' : 'danger'"
              disable-transitions
            >{{ scope.row.status === 1 ? '已发布' : '未发布' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试时间" width="210">
           <template #default="scope">
            <div v-if="scope.row.examDate === 0">不限时</div>
            <div v-else>
              <div>开始 {{ scope.row.startTime }}</div>
              <div>结束 {{ scope.row.endTime }}</div>
            </div>
           </template>
        </el-table-column>
        <el-table-column prop="duration" label="考试时长" width="100">
           <template #default="scope">
            {{ scope.row.duration === -1 ? '不限制' : `${scope.row.duration}分钟` }}
           </template>
        </el-table-column>
        <el-table-column prop="examCategoryName" label="分类" min-width="100" />
        <el-table-column prop="questionCount" label="试题数" width="80" />
        <el-table-column prop="totalScore" label="总分数" width="80" />
        <el-table-column prop="submitCount" label="交卷数" width="80" />
        <el-table-column prop="qualifiedCount" label="合格数" width="80" />
        <el-table-column prop="creatorName" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">考试设置</el-button>
            
            <el-button link type="primary" size="small" @click="handleMarking(scope.row)">阅卷</el-button>
            
            <el-dropdown trigger="click" @command="(command) => handleMoreActions(command, scope.row)">
              <span class="el-dropdown-link">
                <el-button link type="primary" size="small">
                  <el-icon><More /></el-icon>
                </el-button>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="scope.row.status === 1 ? 'cancelPublish' : 'publish'">
                    {{ scope.row.status === 1 ? '取消发布' : '发布' }}
                  </el-dropdown-item>
                  <!-- <el-dropdown-item command="entry">入口</el-dropdown-item> -->
                  <el-dropdown-item command="quoteClass">引用班级</el-dropdown-item>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="delete" style="color: #F56C6C;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedExams.length > 0" style="margin: 10px 0;">
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedExams.length }})
        </el-button>
      </div>

      <div class="table-footer">
        <div></div>
        
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

    <el-dialog
      v-model="createDialogVisible"
      title="创建考试"
      width="500px"
      @close="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="80px"
      >
        <el-form-item label="考试名称" prop="name">
          <el-input 
            v-model="createForm.name" 
            placeholder="请输入考试名称"
            maxlength="30"
            show-word-limit 
          />
          <div class="form-item-hint">【备注】考试名称重复性校验</div>
        </el-form-item>
        <el-form-item label="考试分类" prop="examCategory">
          <el-select v-model="createForm.examCategory" placeholder="请选择分类" style="width: 100%;">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateExam">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 复制考试对话框 -->
    <el-dialog
      v-model="copyDialogVisible"
      title="复制考试"
      width="500px"
      @close="resetCopyForm"
    >
      <el-form
        ref="copyFormRef"
        :model="copyForm"
        :rules="copyFormRules"
        label-width="80px"
      >
        <el-form-item label="原考试名" prop="originalName">
          <el-input 
            v-model="copyForm.originalName" 
            placeholder="原考试名称"
            disabled
          />
        </el-form-item>
        <el-form-item label="新考试名" prop="name">
          <el-input 
            v-model="copyForm.name" 
            placeholder="请输入新考试名称"
            maxlength="30"
            show-word-limit 
          />
          <div class="form-item-hint">【备注】考试名称重复性校验</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="copyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCopyExam">确定</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, More } from '@element-plus/icons-vue';
import FilterBar from '@/components/common/FilterBar.vue';
import { getExamList, addExam, deleteExam, updateExamStatus, copyExam } from '../../../api/teaching-center/Exams.js';
import { getDictData } from '@/api/system-management/dictionary';

const router = useRouter();

const loading = ref(true);
const tableData = ref([]);
const selectedExams = ref([]);

// 筛选参数，与接口字段完全对应
const filterParams = reactive({
  name: '',
  creator: '', // 对应UI上的“创建人”，但后端接口暂不支持
  examCategory: '',
  status: '',
  isMe: true, // 对应UI上的“范围”，默认为 true
});

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});
const categoryOptions = ref([]);

// 筛选栏配置，以完全匹配原型图
const examFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '考试名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' }, // 视觉上存在，但功能待后端支持
  { 
    type: 'select', 
    model: 'examCategory', 
    placeholder: '分类', 
    options: categoryOptions,
    clearable: true
  },
  { 
    type: 'select', 
    model: 'status', 
    placeholder: '发布状态', 
    options: [
        { label: '已发布', value: 1 },
        { label: '未发布', value: 0 },
    ],
    clearable: true
  },
  { 
    type: 'select', 
    model: 'isMe', 
    placeholder: '我的考试', 
    options: [
        { label: '我的考试', value: true },
        { label: '全部考试', value: false },
    ]
  },
]);

// --- 创建考试对话框相关 ---
const createDialogVisible = ref(false);
const createFormRef = ref(null);
const createForm = reactive({
  name: '',
  examCategory: '',
});
const createFormRules = reactive({
  name: [{ required: true, message: '请输入考试名称', trigger: 'blur' }],
  examCategory: [{ required: true, message: '请选择考试分类', trigger: 'change' }],
});

// --- 复制考试对话框相关 ---
const copyDialogVisible = ref(false);
const copyFormRef = ref(null);
const copyForm = reactive({
  id: '',
  originalName: '',
  name: '',
});
const copyFormRules = reactive({
  name: [{ required: true, message: '请输入新考试名称', trigger: 'blur' }],
});

const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields();
  }
};

const resetCopyForm = () => {
  if (copyFormRef.value) {
    copyFormRef.value.resetFields();
  }
  copyForm.id = '';
  copyForm.originalName = '';
  copyForm.name = '';
};

const fetchExams = async () => {
  loading.value = true;
  try {
    const payload = {
      ...filterParams,
      page: pagination.page,
      size: pagination.size,
    };
    const res = await getExamList(payload);
    if (res.code === 200) {
      // 将分类值转换为分类名称
      const records = res.data.records || [];
      tableData.value = records.map(item => {
        const category = categoryOptions.value.find(c => c.value === item.examCategory);
        return {
          ...item,
          examCategoryName: category ? category.label : item.examCategory
        };
      });
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

const fetchCategories = async () => {
  try {
    const res = await getDictData('exam_category');
    if (res.code === 200) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue,
      }));
    }
  } catch (error) { 
    console.error("获取考试分类失败", error);
    ElMessage.error('获取考试分类选项失败');
  }
};

const handleFilter = (data) => {
  Object.assign(filterParams, data);
  pagination.page = 1;
  fetchExams();
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  fetchExams();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchExams();
};

const handleCreateExam = () => {
  createDialogVisible.value = true;
};

const submitCreateExam = async () => {
  if (!createFormRef.value) return;
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await addExam(createForm);
        if (res.code === 200) {
          ElMessage.success('创建成功！');
          createDialogVisible.value = false;
          fetchExams();
        } else {
          ElMessage.error(res.msg || '创建失败');
        }
      } catch (error) {
        ElMessage.error('创建失败');
      }
    }
  });
};

const submitCopyExam = async () => {
  if (!copyFormRef.value) return;
  await copyFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await copyExam({
          id: copyForm.id,
          name: copyForm.name
        });
        if (res.code === 200) {
          ElMessage.success('复制成功！');
          copyDialogVisible.value = false;
          fetchExams();
        } else {
          ElMessage.error(res.msg || '复制失败');
        }
      } catch (error) {
        ElMessage.error('复制失败');
      }
    }
  });
};

const handleEdit = (row) => {
  router.push({
    name: 'TeachingCenter-ExamSettings',
    params: {
      id: row.id
    }
  });
};

const handleMarking = (row) => {
  router.push({
    name: 'TeachingCenter-ExamMarking',
    params: {
      id: row.id
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除考试 “${row.name}” 吗？`, '删除提示', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  }).then(async () => {
    try {
      const res = await deleteExam(row.id);
      if (res.code === 200) {
        ElMessage.success('删除成功！');
        fetchExams();
      } else {
        ElMessage.error(res.msg || '删除失败');
      }
    } catch (error) {
      ElMessage.error('删除失败');
    }
  }).catch(() => {});
};

const handleSelectionChange = (selection) => {
  selectedExams.value = selection;
};

const handleBatchDelete = () => {
  if (selectedExams.value.length === 0) {
    ElMessage.warning('请先选择要删除的考试');
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedExams.value.length} 项考试吗？此操作不可恢复！`, 
    '批量删除确认', 
    { 
      type: 'warning', 
      confirmButtonText: '确定删除', 
      cancelButtonText: '取消' 
    }
  ).then(async () => {
    try {
      // 收集所有要删除的考试ID
      const deletePromises = selectedExams.value.map(exam => deleteExam(exam.id));
      
      // 并发执行所有删除操作
      await Promise.all(deletePromises);
      
      ElMessage.success(`成功删除 ${selectedExams.value.length} 项考试！`);
      selectedExams.value = [];
      fetchExams();
    } catch (error) {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败，请重试');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

const handleCopy = (row) => {
  copyForm.id = row.id;
  copyForm.originalName = row.name;
  copyForm.name = `${row.name}_副本`;
  copyDialogVisible.value = true;
};

const handleMoreActions = async (command, row) => {
  switch (command) {
    case 'publish':
    case 'cancelPublish':
      handlePublishCancel(row, command === 'publish' ? 1 : 0);
      break;
    case 'entry':
      ElMessage.info(`跳转到考试入口页面: ${row.id}`);
      break;
    case 'quoteClass':
      ElMessage.info(`引用班级功能: ${row.id}`);
      break;
    case 'copy':
      handleCopy(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      break;
  }
};

const handlePublishCancel = async (row, targetStatus) => {
  const actionText = targetStatus === 1 ? '发布' : '取消发布';
  ElMessageBox.confirm(`确定要${actionText}考试 “${row.name}” 吗？`, `${actionText}提示`, {
    type: 'warning',
    confirmButtonText: actionText,
    cancelButtonText: '取消',
  }).then(async () => {
    try {
      const res = await updateExamStatus({ id: row.id, status: targetStatus });
      if (res.code === 200) {
        ElMessage.success(`${actionText}成功！`);
        fetchExams();
      } else {
        ElMessage.error(res.msg || `${actionText}失败`);
      }
    } catch (error) {
      ElMessage.error(`${actionText}失败`);
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchExams();
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
.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}
.header-remark {
  color: #F56C6C;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: right; /* 将备注信息靠右对齐 */
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
.form-item-hint {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}
</style>