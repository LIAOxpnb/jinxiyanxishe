<template>
  <el-dialog
    :model-value="visible"
    title="手动选题"
    width="70%"
    top="5vh"
    :close-on-click-modal="false"
    @update:modelValue="$emit('update:visible', $event)"
  >
    <div class="selector-content">
      <FilterBar
        :fields="questionFilterFields"
        @filter="handleFilter"
      />

      <el-table
        v-loading="loading"
        :data="questionList"
        style="width: 100%; margin-top: 20px;"
        height="50vh"
        @selection-change="handleSelectionChange"
        ref="tableRef"
        :row-class-name="rowClassName"
      >
  <el-table-column type="selection" width="55" :selectable="rowSelectable" />
  <el-table-column prop="id" label="序号" width="100" />
  <el-table-column prop="title" label="题目" min-width="450">
            <template #default="scope">
                <div class="question-title-cell">
                    <div class="question-header">
                        <div class="question-tags">
                            <el-tag 
                                size="small" 
                                :type="getQuestionTypeColor(scope.row.questionType)"
                                class="question-type-tag"
                            >
                                {{ scope.row.questionType }}
                            </el-tag>
                            <el-tag 
                                v-if="scope.row.isExisting" 
                                type="info" 
                                size="small" 
                                class="existing-tag"
                            >
                                已存在
                            </el-tag>
                        </div>
                        <span class="question-id">ID: {{ scope.row.id }}</span>
                    </div>
                    <div 
                        class="question-content" 
                        :class="{ 'existing-content': scope.row.isExisting }"
                        :title="scope.row.title"
                    >
                        {{ scope.row.title }}
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column prop="questionCategory" label="分类" width="120" />
        <el-table-column prop="difficulty" label="难度" width="100" align="center">
          <template #default="scope">
            <el-tag 
              size="small" 
              :type="getDifficultyColor(scope.row.difficulty)"
              class="difficulty-tag"
            >
              {{ formatDifficulty(scope.row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="selector-footer">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          @size-change="fetchQuestions"
          @current-change="fetchQuestions"
        />
        <div>
          <span>已选 {{ selectedQuestions.length }} 道</span>
          <el-button @click="$emit('update:visible', false)" style="margin-left: 20px;">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';
import { getQuestionList } from '@/api/teaching-center/QuestionBank';
import { setExamQuestions } from '@/api/teaching-center/Exams';
import { getDictByType as getDictData } from '@/api/system-management/dictionary';

const props = defineProps({
  visible: Boolean,
  examId: [String, Number],
  existingQuestions: {
    type: Array,
    default: () => []
  },
  // 新增：是否仅返回选择结果，不调用API
  onlyReturnSelection: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['update:visible', 'success']);

const loading = ref(false);
const questionList = ref([]);
const selectedQuestions = ref([]); // 用于界面显示（已选数量、提交）
const selectedMap = reactive({}); // 持久化跨页选择：id -> row
let restoringSelections = false;
const filterParams = reactive({});
const pagination = reactive({ page: 1, size: 10, total: 0 });
const tableRef = ref(null);

const typeOptions = ref([
  { label: '单选题', value: '单选' },
  { label: '多选题', value: '多选' },
  { label: '填空题', value: '填空' },
  { label: '判断题', value: '判断' },
  { label: '论述题', value: '论述' }
]);
const categoryOptions = ref([]);
const difficultyOptions = ref([
  { label: '高', value: 0 },
  { label: '中', value: 1 },
  { label: '低', value: 2 }
]);

const questionFilterFields = ref([
  { type: 'input', model: 'id', placeholder: '序号' },
  { type: 'input', model: 'title', placeholder: '题目' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { type: 'select', model: 'questionType', placeholder: '题型', options: typeOptions },
  { type: 'select', model: 'questionCategory', placeholder: '分类', options: categoryOptions },
  { type: 'select', model: 'difficulty', placeholder: '难度', options: difficultyOptions },
]);

const formatDifficulty = (val) => ({0: '高', 1: '中', 2: '低'}[val] || '未知');

const getQuestionTypeColor = (type) => {
  const colorMap = {
    '单选': 'primary',
    '多选': 'success', 
    '填空': 'warning',
    '判断': 'info',
    '论述': 'danger'
  };
  return colorMap[type] || '';
};

const getDifficultyColor = (difficulty) => {
  const colorMap = {
    0: 'danger',  // 高难度 - 红色
    1: 'warning', // 中难度 - 橙色
    2: 'success'  // 低难度 - 绿色
  };
  return colorMap[difficulty] || 'info';
};

const rowClassName = ({ row }) => {
  return row.isExisting ? 'existing-question-row' : '';
};

const rowSelectable = (row) => {
  return !row.isExisting;
};

const fetchDictOptions = async (dictType, optionsRef) => {
  try {
    const res = await getDictData(dictType);
    if (res.code === 200) {
      optionsRef.value = res.data.map(item => ({ label: item.dictLabel, value: item.dictValue }));
    }
  } catch (error) { console.error(`获取${dictType}失败`, error); }
};

const fetchQuestions = async () => {
  loading.value = true;

  // 1. 创建一个干净的参数副本, 过滤掉所有空值 (null, undefined, '')
  const cleanFilters = {};
  for (const key in filterParams) {
    const value = filterParams[key];
    if (value !== null && value !== undefined && value !== '') {
      cleanFilters[key] = value;
    }
  }

  // 2. 对特定字段进行手动类型转换
  if (cleanFilters.difficulty) {
    cleanFilters.difficulty = Number(cleanFilters.difficulty);
  }
  if (cleanFilters.id) {
    cleanFilters.id = Number(cleanFilters.id);
  }

  try {
    const payload = {
      page: pagination.page,
      size: pagination.size,
      ...cleanFilters // 3. 使用清洗和转换后的参数
    };
    console.log('向API发送的最终参数:', payload);
    const res = await getQuestionList(payload);
    if (res.code === 200) {
      questionList.value = res.data.records || [];
      // 将 questionCategory 映射为可读标签
      const getCategoryLabel = (categoryValue) => {
        if (categoryValue === null || categoryValue === undefined || categoryValue === '') return '未分类';
        const found = categoryOptions.value.find(opt => String(opt.value) === String(categoryValue));
        return found ? found.label : String(categoryValue);
      };
      // 把映射后的字段写入行，保持原键名以便表格 prop 使用
      questionList.value = questionList.value.map(item => ({
        ...item,
        questionCategory: getCategoryLabel(item.questionCategory)
      }));
      pagination.total = res.data.total || 0;
      
      // 标记已存在的题目
      const existingQuestionIds = (props.existingQuestions || []).map(q => q.questionId);
      questionList.value.forEach(question => {
        question.isExisting = existingQuestionIds.includes(question.id);
      });
      // 恢复已选状态（跨页保留）
      restoringSelections = true;
      await nextTick();
      if (tableRef.value && questionList.value.length) {
        questionList.value.forEach(row => {
          if (selectedMap[row.id]) {
            try { tableRef.value.toggleRowSelection(row, true); } catch (e) { /* ignore */ }
          }
        });
      }
      // 等恢复完成后短延迟再关闭标志，确保 selection-change 不会误删
      setTimeout(() => { restoringSelections = false; }, 50);
    }
  } catch (error) {
    ElMessage.error('获取题库列表失败');
  } finally {
    loading.value = false;
  }
};

const handleFilter = (filterData) => {
  // 直接赋值，与 QuestionBank.vue 保持一致
  Object.assign(filterParams, filterData);
  pagination.page = 1;
  fetchQuestions();
};

const handleSelectionChange = (selection) => {
  // selection 是当前页被选中的行数组。
  // 将当前页中被选中的加入 selectedMap，不在当前页但之前已选的保留。
  const currentPageIds = questionList.value.map(q => q.id);

  if (restoringSelections) {
    // 恢复选中时只增加，不做删除，防止在恢复过程中误删已有选择
    selection.forEach(row => { selectedMap[row.id] = row; });
  } else {
    // 把当前页选中的加入映射
    selection.forEach(row => { selectedMap[row.id] = row; });
    // 对当前页中未被选中的，从映射中移除（表示用户取消了本页的选中项）
    currentPageIds.forEach(id => {
      const stillSelected = selection.find(s => s.id === id);
      if (!stillSelected && selectedMap[id]) {
        delete selectedMap[id];
      }
    });
  }

  // 更新用于提交/显示的数组
  selectedQuestions.value = Object.values(selectedMap);
};

const handleConfirm = async () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请至少选择一道题目');
    return;
  }
  
  const finalSelected = Object.values(selectedMap);
  
  // 如果只返回选择结果，不调用API
  if (props.onlyReturnSelection) {
    const selectedIds = finalSelected.map(q => q.id);
    emit('success', selectedIds);
    emit('update:visible', false);
    return;
  }
  
  // 原有的考试选题逻辑
  // 合并现有题目和新选择的题目
  const existingQuestionList = props.existingQuestions || [];
  const newQuestions = finalSelected.map((q, index) => ({
    questionId: q.id,
    score: 5,
    sort: existingQuestionList.length + index, // 新题目排在现有题目后面
  }));
  
  // 保留现有题目，添加新题目
  const allQuestions = [
    ...existingQuestionList.map(eq => ({
      questionId: eq.questionId,
      score: eq.score || 5,
      sort: eq.sort
    })),
    ...newQuestions
  ];

  const payload = {
    id: props.examId,
    examQuestionList: allQuestions
  };

  try {
    const res = await setExamQuestions(payload);
    if (res.code === 200) {
      ElMessage.success('选题成功！');
      emit('success');
      emit('update:visible', false);
    } else {
      ElMessage.error(res.msg || '选题失败');
    }
  } catch(error) {
    ElMessage.error('选题失败');
  }
};

onMounted(async () => {
  // 先加载分类字典，确保 fetchQuestions 可以正确映射
  await fetchDictOptions('question_category', categoryOptions);
  fetchQuestions();
});
</script>

<style scoped>
.selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.question-title-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.question-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.question-type-tag {
  font-weight: 500;
  border-radius: 6px;
}

.existing-tag {
  opacity: 0.8;
  border-radius: 4px;
}

.question-id {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.difficulty-tag {
  border-radius: 4px;
  font-weight: 500;
}

.question-content {
  line-height: 1.5;
  color: #303133;
  font-size: 14px;
  max-width: 100%;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.question-content.existing-content {
  color: #909399;
}

:deep(.existing-question-row) {
  background-color: #f5f7fa;
  color: #909399;
}

:deep(.existing-question-row:hover) {
  background-color: #f5f7fa !important;
}

:deep(.existing-question-row .question-content) {
  color: #909399;
}

/* 增加表格行高以适应新的布局 */
:deep(.el-table .el-table__row) {
  height: auto;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}
</style>