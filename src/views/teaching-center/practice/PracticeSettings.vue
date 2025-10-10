<template>
  <div class="practice-settings-page" v-loading="loading">
    <div v-if="practiceDetails">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">{{ practiceDetails.name || '练习设置' }}</span>
        </template>
      </el-page-header>

      <div class="main-layout">
        <div class="left-panel">
          <el-card>
            <template #header>
              <div class="left-panel-header">
                <div class="stats-bar">
                  <el-dropdown @command="addQuestion">
                    <el-button type="primary">
                      新增试题<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="manual_select">从题库选择</el-dropdown-item>
                        <!-- <el-dropdown-item command="manual_add">新建试题</el-dropdown-item> -->
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <span>试题数量 <span class="stat-value">{{ totalQuestions }}</span> 道</span>
                  <div class="header-remark">【练习备注】左侧区域操作后自动保存</div>
                </div>
              </div>
            </template>
            <div class="question-list-container">
              <el-empty v-if="!questionList || questionList.length === 0" description="暂无试题，请新增"></el-empty>
              <div v-else>
                <div v-for="(item, index) in questionList" :key="item.id" class="question-card">
                  <div class="card-header">
                    <span class="question-index">{{ index + 1 }}.</span>
                    <div class="question-tags">
                      <el-tag size="small">{{ item.question?.questionType }}</el-tag>
                      <el-tag type="info" size="small">{{ item.question?.questionCategory }}</el-tag>
                      <el-tag type="warning" size="small">难度{{ item.question?.difficulty }}</el-tag>
                    </div>
                    <div class="question-actions">
                      <el-button :icon="Top" circle plain size="small" @click="handleMoveUp(index)"
                        :disabled="index === 0" />
                      <el-button :icon="Bottom" circle plain size="small" @click="handleMoveDown(index)"
                        :disabled="index === questionList.length - 1" />
                      <el-button :icon="Edit" circle plain size="small" @click="handleEditQuestion(item.question)" />
                      <el-button :icon="Delete" circle plain type="danger" size="small"
                        @click="handleDeleteQuestion(index)" />
                    </div>
                  </div>
<div class="card-body">
    <div class="question-title" v-html="item.question?.title"></div>
    
    <div class="question-options" v-if="item.question?.options && item.question.options.length > 0">
      <div v-for="opt in item.question.options" :key="opt.value" class="option">
        <el-radio 
          v-if="item.question.questionType === '单选' || item.question.questionType === '判断'"
          :model-value="item.question.answer"
          :label="opt.value"
          disabled
        >
          {{ opt.value }}. <span v-html="opt.text"></span>
        </el-radio>
        <el-checkbox
          v-else-if="item.question.questionType === '多选'"
          :model-value="(item.question.answer || '').includes(opt.value)"
          disabled
        >
          {{ opt.value }}. <span v-html="opt.text"></span>
        </el-checkbox>
        <div v-else>
          <span class="option-label">{{ opt.value }}.</span>
          <span v-html="opt.text"></span>
        </div>
      </div>
    </div>

    <div class="question-analysis">
      <strong>解析：</strong> <span v-html="item.question?.analysis || '暂无解析'"></span>
    </div>
  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="right-panel">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
                <el-button type="primary" link :icon="Edit" @click="openBasicInfoDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="练习名称">{{ practiceDetails.name }}</el-descriptions-item>
              <el-descriptions-item label="课程">{{ practiceDetails.courseName }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ practiceDetails.creatorName }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ practiceDetails.createTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span>练习设置</span>
                <el-button type="primary" link :icon="Edit" @click="openPracticeSettingsDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="试题乱序">{{ practiceDetails.disorder === 1 ? '开启' : '关闭'
                }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="未找到该练习的相关信息"></el-empty>
    
    <el-dialog v-model="basicInfoDialogVisible" title="编辑练习基本信息" width="700px" :close-on-click-modal="false">
      <el-form v-if="editForm" ref="formRef" :model="editForm" :rules="rules" label-width="80px">
        <el-form-item label="练习名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入练习名称" />
        </el-form-item>
        <el-form-item label="课程" prop="courseId">
           <el-select v-model="editForm.courseId" placeholder="请选择课程" style="width: 100%" filterable>
            <el-option v-for="course in courseOptions" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="章节" prop="chapterId">
          <el-select v-model="editForm.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!editForm.courseId || chapterOptions.length === 0">
            <el-option v-for="chapter in chapterOptions" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="小节" prop="sectionId">
          <el-select v-model="editForm.sectionId" placeholder="请选择小节" style="width: 100%" :disabled="!editForm.chapterId || sectionOptions.length === 0">
            <el-option v-for="section in sectionOptions" :key="section.id" :label="section.name" :value="section.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="basicInfoDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpdate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="practiceSettingsDialogVisible" title="练习设置" width="500px">
      <el-form v-if="editForm" :model="editForm" label-width="90px">
        <el-form-item label="试题乱序">
          <el-radio-group v-model="editForm.disorder">
            <el-radio :value="1">开启</el-radio>
            <el-radio :value="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="practiceSettingsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>

    <QuestionSelector v-if="selectorVisible" v-model:visible="selectorVisible" :existing-questions="questionList"
      @success="handleSelectionSuccess" />

    <QuestionEditDialog v-model:visible="editDialogVisible" :question-id="editQuestionId"
      @success="fetchPracticeDetails" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPracticeDetail, updatePractice, setPracticeQuestionList } from '@/api/teaching-center/PracticeManagement';
import { Edit, ArrowDown, Top, Bottom, Delete } from '@element-plus/icons-vue';
import QuestionSelector from '@/components/question/QuestionSelector.vue';
import QuestionEditDialog from '@/components/question/QuestionEditDialog.vue';
import { getCourseList, getCourseDetail } from '@/api/teaching-center/courseManagement';


const route = useRoute();
const router = useRouter();

const loading = ref(true);
const practiceId = ref(null);
const practiceDetails = ref(null);
const questionList = ref([]);
// [新增] 为表单增加ref
const formRef = ref(null); 

// [新增] 联动选择相关状态
const courseOptions = ref([]);
const chapterOptions = ref([]);
const sectionOptions = ref([]);
const currentCourseDetail = ref(null); // 用于缓存当前选中课程的完整数据

// [修改] 为 rules 增加章、节的校验
const rules = reactive({
  name: [{ required: true, message: '请输入练习名称', trigger: 'blur' }],
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  chapterId: [{ required: true, message: '请选择章节', trigger: 'change' }],
  sectionId: [{ required: true, message: '请选择小节', trigger: 'change' }],
});

const dialogTitle = computed(() => isEdit.value ? '編輯練習' : '新增練習');
const basicInfoDialogVisible = ref(false);
const practiceSettingsDialogVisible = ref(false);
const selectorVisible = ref(false);
const editDialogVisible = ref(false);
const editQuestionId = ref(null);
const editForm = ref(null);

// [新增] 获取课程列表（用于下拉框）
const fetchAllCourses = async () => {
  try {
    const res = await getCourseList({ page: 1, size: 1000 }); // 获取所有课程
    if (res.code === 200) {
      courseOptions.value = res.data.records;
    }
  } catch (error) {
    ElMessage.error('获取课程选项失败');
  }
};

// [新增] 监听课程选择的变化
watch(() => editForm.value?.courseId, async (newCourseId, oldCourseId) => {
  if (!editForm.value) return;
  // 只有在用户手动切换时才清空后续选项
  if (newCourseId !== oldCourseId) {
    editForm.value.chapterId = null;
    editForm.value.sectionId = null;
    chapterOptions.value = [];
    sectionOptions.value = [];
  }
  
  if (newCourseId) {
    try {
      const res = await getCourseDetail({ id: newCourseId });
      if (res.code === 200 && res.data) {
        currentCourseDetail.value = res.data; // 缓存整个课程数据
        chapterOptions.value = res.data.courseChapterList || [];
      }
    } catch (error) {
      ElMessage.error('获取章节列表失败');
    }
  }
});

// [新增] 监听章节选择的变化
watch(() => editForm.value?.chapterId, (newChapterId, oldChapterId) => {
  if (!editForm.value) return;
   if (newChapterId !== oldChapterId) {
    editForm.value.sectionId = null;
    sectionOptions.value = [];
  }

  if (newChapterId && currentCourseDetail.value) {
    const selectedChapter = currentCourseDetail.value.courseChapterList.find(
      chapter => chapter.id === newChapterId
    );
    if (selectedChapter) {
      sectionOptions.value = selectedChapter.courseSectionList || [];
    }
  }
});

const totalQuestions = computed(() => questionList.value.length);
const courseInfo = computed(() => {
  if (!practiceDetails.value) return '';
  const { course, courseChapter, courseSection } = practiceDetails.value;
  return `${course?.name || ''}-${courseChapter?.name || ''}-${courseSection?.name || ''}`;
});

const goBack = () => router.back();

const fetchPracticeDetails = async () => {
  loading.value = true;
  try {
    const res = await getPracticeDetail({ id: practiceId.value });
    if (res.code === 200 && res.data) {
      practiceDetails.value = res.data;
      const processedQuestions = (res.data.practiceQuestionList || []).map(item => {
        if (item.question && typeof item.question.details === 'string' && item.question.details.trim().startsWith('[')) {
          try {
            const optionsArray = JSON.parse(item.question.details);
            item.question.options = optionsArray.map(opt => ({
              value: opt.option,
              text: opt.value
            }));
          } catch (e) {
            console.error('解析题目options JSON失败:', e, item.question.details);
            item.question.options = [];
          }
        } else if (item.question) {
          item.question.options = [];
        }
        return item;
      });
      questionList.value = processedQuestions;
    } else {
      ElMessage.error(res.msg || '获取练习详情失败');
    }
  } catch (error) {
    ElMessage.error('获取练习详情失败');
  } finally {
    loading.value = false;
  }
};

const openBasicInfoDialog = async () => {
  editForm.value = JSON.parse(JSON.stringify(practiceDetails.value));
  await fetchAllCourses();
  formRef.value?.clearValidate();

  if (editForm.value.courseId) {
    const tempCourseId = editForm.value.courseId;
    const tempChapterId = editForm.value.chapterId;
    
    editForm.value.courseId = null; 
    await nextTick();
    editForm.value.courseId = tempCourseId;
    
    // 等待章節載入後，再設置章節ID以觸發小節載入
    const unsubscribe = watch(chapterOptions, (newChapters) => {
      if (newChapters && newChapters.length > 0) {
        editForm.value.chapterId = tempChapterId;
        unsubscribe(); // 執行一次後註銷監聽
      }
    });
  }
  
  basicInfoDialogVisible.value = true;
};

const openPracticeSettingsDialog = () => {
  // 深拷贝一份数据到表单模型，避免直接修改原始数据
  editForm.value = JSON.parse(JSON.stringify(practiceDetails.value));
  practiceSettingsDialogVisible.value = true;
};
const submitUpdate = async () => {
    try {
        // 直接使用 editForm 的数据调用 updatePractice 接口
        await updatePractice(editForm.value);
        ElMessage.success('更新成功！');
        
        // 更新成功后，重新获取最新数据
        await fetchPracticeDetails();

        // 关闭所有可能打开的编辑弹窗
        basicInfoDialogVisible.value = false;
        practiceSettingsDialogVisible.value = false;
    } catch (error) {
        ElMessage.error('更新失败');
    }
};

const addQuestion = (command) => {
  if (command === 'manual_select') {
    selectorVisible.value = true;
  } else if (command === 'manual_add') {
    router.push({ name: 'TeachingCenter-ManualAddQuestion', query: { practiceId: practiceId.value } });
  }
};

const handleSelectionSuccess = async (selectedIds) => {
  const newQuestions = selectedIds.map(id => ({ questionId: id, sort: questionList.value.length + 1 }));
  const currentQuestions = questionList.value.map(q => ({ questionId: q.questionId, sort: q.sort }));
  const payload = {
    id: practiceId.value,
    practiceQuestionList: [...currentQuestions, ...newQuestions],
  };
  await setPracticeQuestionList(payload);
  fetchPracticeDetails();
};

const updateQuestionListOnServer = async () => {
  const payload = {
    id: practiceId.value,
    practiceQuestionList: questionList.value.map((q, index) => ({
      questionId: q.questionId,
      sort: index + 1,
    })),
  };
  try {
    await setPracticeQuestionList(payload);
    ElMessage.success('操作成功！');
    fetchPracticeDetails();
  } catch (error) {
    ElMessage.error('操作失败');
    fetchPracticeDetails();
  }
};

const handleMoveUp = (index) => {
  if (index > 0) {
    [questionList.value[index - 1], questionList.value[index]] = [questionList.value[index], questionList.value[index - 1]];
    updateQuestionListOnServer();
  }
};
const handleMoveDown = (index) => {
  if (index < questionList.value.length - 1) {
    [questionList.value[index + 1], questionList.value[index]] = [questionList.value[index], questionList.value[index + 1]];
    updateQuestionListOnServer();
  }
};
const handleEditQuestion = (question) => {
  editQuestionId.value = question.id;
  editDialogVisible.value = true;
};
const handleDeleteQuestion = (index) => {
  ElMessageBox.confirm('确定要从练习中移除这道题目吗？', '提示', { type: 'warning' })
    .then(() => {
      questionList.value.splice(index, 1);
      updateQuestionListOnServer();
    }).catch(() => { });
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    practiceId.value = id;
    fetchPracticeDetails();
  } else {
    ElMessage.error('无效的练习ID');
    loading.value = false;
  }
});
</script>


<style scoped>
.practice-settings-page {
  height: 100%;
  padding: 20px;
  background-color: #f0f2f5;
  box-sizing: border-box;
  /* [核心修改] 让页面自身可以滚动，而不是内部的某个div滚动 */
  overflow-y: auto;
}

.page-header-title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}

.main-layout {
  display: flex;
  margin-top: 20px;
  gap: 20px;
}

.left-panel {
  flex: 3;
  min-width: 0;
}

.right-panel {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
  /* 右侧面板会随着页面滚动而固定在顶部 */
  align-self: flex-start;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

.stat-value {
  color: #303133;
  font-weight: bold;
}

.header-remark {
  font-size: 12px;
  color: #909399;
}

.question-list-container {
  /* 既然是页面滚动，内部容器就不再需要 overflow 和 flex:1 了 */
  padding: 0 8px;
}

.question-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 16px;
}

.question-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-index {
  font-weight: bold;
}

.question-tags {
  flex-grow: 1;
  display: flex;
  gap: 8px;
}

.question-title {
  margin-bottom: 12px;
}

.question-options .option {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.question-options .option-label {
  font-weight: 500;
  margin-right: 8px;
}

.question-analysis {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  font-size: 14px;
  color: #909399;
}


.practice-settings-page {
  height: 100%;
  padding: 20px;
  background-color: #f0f2f5;
  box-sizing: border-box;
  overflow-y: auto; 
}
.page-header-title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}
.main-layout {
  display: flex;
  margin-top: 20px;
  gap: 20px;
}
.left-panel {
  flex: 3;
  min-width: 0;
}
.right-panel {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
  align-self: flex-start;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}
.stat-value {
  color: #303133;
  font-weight: bold;
}
.header-remark {
  font-size: 12px;
  color: #909399;
}
.question-list-container {
  padding: 0 8px;
}
.question-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 16px;
}
.question-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.question-index {
  font-weight: bold;
}
.question-tags {
  flex-grow: 1;
  display: flex;
  gap: 8px;
}
.question-title {
  margin-bottom: 12px;
}
.question-options .option {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}
.question-options .option-label {
  font-weight: 500;
  margin-right: 8px;
}
.question-analysis {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  font-size: 14px;
  color: #909399;
}
</style>