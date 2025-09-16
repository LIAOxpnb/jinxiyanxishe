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
import { ref, reactive, onMounted, watch } from 'vue';
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
const selectedQuestions = ref([]);
const filterParams = reactive({});
const pagination = reactive({ page: 1, size: 10, total: 0 });
const tableRef = ref(null);

const typeOptions = ref([]);
const categoryOptions = ref([]);
const difficultyOptions = ref([]);

const questionFilterFields = ref([
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
  try {
    const payload = { ...filterParams, page: pagination.page, size: pagination.size };
    const res = await getQuestionList(payload);
    if (res.code === 200) {
      questionList.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取题库列表失败');
  } finally {
    loading.value = false;
  }
};

const handleFilter = (data) => {
  Object.assign(filterParams, data);
  pagination.page = 1;
  fetchQuestions();
};

const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection;
};

const handleConfirm = async () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请至少选择一道题目');
    return;
  }
  
  const payload = {
    id: props.examId,
    examQuestionList: selectedQuestions.value.map((q, index) => ({
      questionId: q.id,
      score: 5,
      sort: index,
    }))
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
  fetchDictOptions('question_type', typeOptions);
  fetchDictOptions('question_category', categoryOptions);
  fetchDictOptions('question_difficulty', difficultyOptions);
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