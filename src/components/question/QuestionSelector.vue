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
      >
  <el-table-column type="selection" width="55" />
  <el-table-column prop="id" label="序号" width="100" />
  <el-table-column prop="title" label="题目" min-width="300" show-overflow-tooltip>
            <template #default="scope">
                <div class="question-title-cell">
                    <el-tag size="small" style="margin-right: 8px;">{{ scope.row.questionType }}</el-tag>
                    <span>{{ scope.row.title }}</span>
                </div>
            </template>
        </el-table-column>
        <el-table-column prop="questionCategoryName" label="分类" width="120" />
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="scope">
            {{ formatDifficulty(scope.row.difficulty) }}
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
      pagination.total = res.data.total || 0;
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

onMounted(() => {
  fetchQuestions();
  // 题型和难度使用静态选项，与 QuestionBank.vue 保持一致；只从字典接口加载分类
  fetchDictOptions('question_category', categoryOptions);
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
    align-items: center;
}
</style>