<template>
  <div class="exam-settings-page" v-loading="loading">
    <div v-if="examDetails">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">{{ examDetails.name || '考试设置' }}</span>
          <el-tag v-if="examDetails.status === 1" type="success" size="small">已发布</el-tag>
          <el-tag v-else type="info" size="small">未发布</el-tag>
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
              <el-dropdown-item command="manual_select">手动选题</el-dropdown-item>
              <el-dropdown-item command="manual_add">新增试题</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
                  <span>试题数 <span class="stat-value">{{ totalQuestions }}</span> 道</span>
                  <span>总分 <span class="stat-value">{{ totalScore }}</span> 分</span>
                  <span>合格分 <span class="stat-value">{{ examDetails.qualified }}</span> 分</span>
                  <el-button type="primary" link @click="openBatchSetScoreDialog">批量设置分数</el-button>
                  <el-dropdown @command="handleScoreCommands">
                    <el-button type="primary" link>
                      设置合格分<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="setPassingScore">设置合格分</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </template>
            <div class="question-list-container">
              <el-empty v-if="!questionList || questionList.length === 0" description="暂无试题，请新增"></el-empty>
              <div v-else>
                <ExamQuestionCard
                  v-for="(item, index) in questionList"
                  :key="item.id"
                  :item-data="item"
                  :index="index"
                />
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
              <el-descriptions-item label="考试名称">{{ examDetails.name }}</el-descriptions-item>
              <el-descriptions-item label="分类">{{ examDetails.examCategoryName || '未分类' }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ examDetails.creatorName }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ examDetails.createTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span>考试设置</span>
                 <el-button type="primary" link :icon="Edit" @click="openExamSettingsDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="考试时间">{{ examDetails.examDate === 0 ? '不限时' : `指定时间 (${examDetails.startTime} ~ ${examDetails.endTime})` }}</el-descriptions-item>
              <el-descriptions-item label="考试时长">{{ examDetails.duration === -1 ? '不限制' : `${examDetails.duration}分钟` }}</el-descriptions-item>
              <el-descriptions-item label="考试次数">{{ examDetails.attempts === -1 ? '不限制' : `${examDetails.attempts}次` }}</el-descriptions-item>
              <el-descriptions-item label="参考人员">{{ ['未指定', '指定人员', '指定班级'][examDetails.scope] || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="试题乱序">{{ examDetails.disorder === 1 ? '开启' : '关闭' }}</el-descriptions-item>
              <el-descriptions-item label="查看考卷">{{ examDetails.viewPaper === 1 ? '开启' : '关闭' }}</el-descriptions-item>
              <el-descriptions-item label="禁止复制">{{ examDetails.disableCopy === 1 ? '开启' : '关闭' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <div class="action-buttons">
            <el-button 
              :type="examDetails.status === 1 ? 'danger' : 'primary'"
              @click="handleTogglePublishStatus"
            >
              {{ examDetails.status === 1 ? '取消发布' : '发布' }}
            </el-button>
          </div>
          
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="未找到该考试的相关信息"></el-empty>

    <el-dialog v-model="basicInfoDialogVisible" title="编辑考试基本信息" width="500px">
      <el-form v-if="editForm" :model="editForm" label-width="80px" ref="basicInfoFormRef">
        <el-form-item label="考试名称" prop="name" required>
          <el-input v-model="editForm.name" maxlength="20" show-word-limit />
          <div class="form-hint">【备注】考试名称重复性校验</div>
        </el-form-item>
        <el-form-item label="分类" prop="examCategory" required>
          <el-select v-model="editForm.examCategory" placeholder="选择分类" style="width:100%;">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="basicInfoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="examSettingsDialogVisible" title="考试设置" width="600px">
      <el-form v-if="editForm" :model="editForm" label-width="90px" ref="examSettingsFormRef">
        <el-form-item label="考试时间">
          <el-radio-group v-model="editForm.examDate">
            <el-radio :label="0">不限制</el-radio>
            <el-radio :label="1">指定时间</el-radio>
          </el-radio-group>
          <div v-if="editForm.examDate === 1" style="margin-top: 10px;">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="选择开始时间"
              end-placeholder="选择结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </div>
        </el-form-item>
        <el-form-item label="考试时长">
          <el-radio-group v-model="editForm.duration" @change="(val) => { if(val !== -1) isDurationLimited = true }">
            <el-radio :label="-1">不限制</el-radio>
            <el-radio :label="customDuration > 0 ? customDuration : 60" @change="isDurationLimited=true">限制时长</el-radio>
          </el-radio-group>
          <el-input-number v-if="isDurationLimited" v-model="customDuration" :min="1" @change="(val) => editForm.duration = val" controls-position="right" style="margin-left: 10px;"/>
          <span v-if="isDurationLimited" style="margin-left: 5px;">分钟</span>
        </el-form-item>
        <el-form-item label="考试次数">
           <el-radio-group v-model="editForm.attempts">
            <el-radio :label="-1">不限制</el-radio>
            <el-radio :label="1">限制次数</el-radio>
          </el-radio-group>
          <template v-if="editForm.attempts !== -1">
            <el-input-number v-model="editForm.attempts" :min="1" controls-position="right" style="margin-left: 10px;"/>
            <span style="margin-left: 5px;">次</span>
          </template>
        </el-form-item>
        <el-form-item label="人员范围">
           <el-radio-group v-model="editForm.scope" @change="handleScopeChange">
            <el-radio :label="1">指定人员</el-radio>
            <el-radio :label="2" disabled>指定班级</el-radio>
          </el-radio-group>
          <div v-if="editForm.scope === 1" style="margin-top: 10px; width: 100%;">
              <el-select 
                v-model="selectedScopeItems"
                multiple 
                filterable
                remote
                :remote-method="searchUsers"
                :loading="userSearchLoading"
                placeholder="请输入用户姓名、手机号等搜索" 
                style="width: 100%;"
              >
                <el-option
                  v-for="item in userList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              <div class="form-hint">【备注】指定班级后，自动添加到班级设置中</div>
          </div>
        </el-form-item>
        <el-form-item label="试题乱序">
            <el-radio-group v-model="editForm.disorder">
                <el-radio :label="1">开启</el-radio>
                <el-radio :label="0">关闭</el-radio>
            </el-radio-group>
        </el-form-item>
         <el-form-item label="查看考卷">
            <el-radio-group v-model="editForm.viewPaper">
                <el-radio :label="1">开启</el-radio>
                <el-radio :label="0">关闭</el-radio>
            </el-radio-group>
        </el-form-item>
         <el-form-item label="禁止复制">
            <el-radio-group v-model="editForm.disableCopy">
                <el-radio :label="1">开启</el-radio>
                <el-radio :label="0">关闭</el-radio>
            </el-radio-group>
             <div class="form-hint">【备注】1. 试题乱序默认开启; 2. 查看考卷、禁止复制...</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="examSettingsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchSetScoreDialogVisible" title="批量设置分数" width="500px">
      <el-form :model="batchScoreForm" label-width="80px">
        <el-form-item 
          v-for="item in questionTypesForBatchScore" 
          :key="item.type"
        >
          <template #label>{{ item.name }}</template>
          <span class="dialog-stat-text">共{{ questionCountsByType[item.type] || 0 }}题</span>
          <span class="dialog-stat-text">单题</span>
          <el-input-number v-model="batchScoreForm[item.type]" :min="0" controls-position="right" style="width: 100px;"/>
          <span class="dialog-stat-text">分, 共{{ (questionCountsByType[item.type] || 0) * (batchScoreForm[item.type] || 0) }}分</span>
        </el-form-item>
        <el-divider />
        <el-form-item label="总共">
            <span class="dialog-stat-text">共{{ totalQuestions }}题</span>
            <span style="margin-left: 20px;">总分 <span class="stat-value">{{ totalScore }}</span> 分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSetScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchScores">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="setPassingScoreDialogVisible" title="合格分设置" width="500px">
        <el-form :model="passingScoreForm" label-width="80px">
            <el-form-item label="总共">
                <span class="dialog-stat-text">共{{ totalQuestions }}题</span>
                <span class="dialog-stat-text">合格</span>
                <el-input-number v-model="passingScoreForm.qualified" :min="0" :max="totalScore" controls-position="right" style="width: 100px;"/>
                <span class="dialog-stat-text">分, 共{{ totalScore }}分</span>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="setPassingScoreDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitPassingScore">确定</el-button>
        </template>
    </el-dialog>

    <QuestionSelector
      v-if="selectorVisible"
      v-model:visible="selectorVisible"
      :exam-id="examId"
      @success="handleSelectionSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getExamDetail, updateExam, setExamQuestions, setPassingScore, updateExamStatus, getUserList } from '../../api/teaching-center/Exams.js';
import { getDictData } from '@/api/system-management/dictionary';
import { Edit, ArrowDown } from '@element-plus/icons-vue';
import ExamQuestionCard from '@/components/exam/ExamQuestionCard.vue';
import QuestionSelector from '@/components/question/QuestionSelector.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const examId = ref(null);
const examDetails = ref(null);
const questionList = ref([]);
const categoryOptions = ref([]);

const basicInfoDialogVisible = ref(false);
const examSettingsDialogVisible = ref(false);
const batchSetScoreDialogVisible = ref(false);
const setPassingScoreDialogVisible = ref(false);
const selectorVisible = ref(false);

const editForm = ref(null);
const batchScoreForm = ref({});
const passingScoreForm = ref({ qualified: 0 });
const isDurationLimited = ref(false);
const customDuration = ref(60);

const userList = ref([]);
const classList = ref([]);
const selectedScopeItems = ref([]);
const userSearchLoading = ref(false);

watch(() => editForm.value?.duration, (newVal) => {
  isDurationLimited.value = newVal !== -1;
  if(newVal !== -1) {
    customDuration.value = newVal;
  }
});

const timeRange = computed({
  get() {
    if (editForm.value && editForm.value.startTime && editForm.value.endTime) {
      return [editForm.value.startTime, editForm.value.endTime];
    }
    return [];
  },
  set(val) {
    if (editForm.value) {
      editForm.value.startTime = val ? val[0] : null;
      editForm.value.endTime = val ? val[1] : null;
    }
  }
});

const questionCountsByType = computed(() => {
    return questionList.value.reduce((acc, item) => {
        const type = item.question?.questionType;
        if (!type) return acc;
        const typeKeyMap = { '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE', '填空': 'FILL_IN_BLANK', '论述': 'ESSAY', '简答': 'ESSAY' };
        const key = typeKeyMap[type];
        if (key) {
           if (!acc[key]) acc[key] = 0;
           acc[key]++;
        }
        return acc;
    }, {});
});

const totalQuestions = computed(() => questionList.value.length);

const totalScore = computed(() => {
    return questionList.value.reduce((sum, item) => sum + (item.score || 0), 0);
});

const questionTypesForBatchScore = ref([
    { type: 'SINGLE_CHOICE', name: '单选' },
    { type: 'MULTIPLE_CHOICE', name: '多选' },
    { type: 'FILL_IN_BLANK', name: '填空' },
    { type: 'TRUE_FALSE', name: '判断' },
    { type: 'ESSAY', name: '简答' },
]);

const scopeOptions = computed(() => {
  if (!editForm.value) return [];
  return editForm.value.scope === 1 ? userList.value : classList.value;
});

const scopePlaceholder = computed(() => {
  if (!editForm.value) return '';
  return editForm.value.scope === 1 ? '请输入用户姓名、手机号等搜索' : '请选择指定班级';
});

const goBack = () => {
  router.back();
};

const fetchExamDetails = async () => {
  loading.value = true;
  try {
    const res = await getExamDetail(examId.value);
    if (res.code === 200) {
      examDetails.value = res.data;
      questionList.value = res.data.examQuestionList || [];
    } else {
      ElMessage.error(res.msg || '获取考试详情失败');
    }
  } catch (error) {
    ElMessage.error('获取考试详情失败');
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
  } catch (error) { console.error("获取考试分类失败", error); }
};

const searchUsers = async (query) => {
    if (!query) {
        userList.value = [];
        return;
    }
    userSearchLoading.value = true;
    try {
        const res = await getUserList({ pageNum: 1, pageSize: 50, param: query, teacher: 1 });
        if(res.code === 200) {
            userList.value = res.data.records.map(u => ({ id: u.id, name: u.name || u.username }));
        }
    } catch(error) {
        console.error("搜索用户失败:", error);
    } finally {
        userSearchLoading.value = false;
    }
};

const openBasicInfoDialog = () => {
  editForm.value = JSON.parse(JSON.stringify(examDetails.value));
  basicInfoDialogVisible.value = true;
};

const openExamSettingsDialog = () => {
  editForm.value = JSON.parse(JSON.stringify(examDetails.value));
  selectedScopeItems.value = [];
  
  if (editForm.value.clazzUserBindList && editForm.value.scope === 1) {
    userList.value = editForm.value.clazzUserBindList.map(item => ({ id: item.userId, name: item.userName || `用户ID:${item.userId}`}));
    selectedScopeItems.value = editForm.value.clazzUserBindList.map(item => item.userId).filter(Boolean);
  } else if (editForm.value.clazzUserBindList && editForm.value.scope === 2) {
    // 班级逻辑暂不处理
    classList.value = editForm.value.clazzUserBindList.map(item => ({ id: item.clazzId, name: item.clazzName || `班级ID:${item.clazzId}`}));
    selectedScopeItems.value = editForm.value.clazzUserBindList.map(item => item.clazzId).filter(Boolean);
  }
  examSettingsDialogVisible.value = true;
};

const submitUpdate = async () => {
    if (editForm.value.scope === 1) {
        editForm.value.clazzUserBindList = selectedScopeItems.value.map(id => ({ userId: id }));
    } else if (editForm.value.scope === 2) {
        editForm.value.clazzUserBindList = selectedScopeItems.value.map(id => ({ clazzId: id }));
    } else {
        editForm.value.clazzUserBindList = [];
    }
    
    if (editForm.value.scope !== 0 && editForm.value.clazzUserBindList.length === 0) {
      ElMessage.warning('请至少选择一个指定人员或班级');
      return;
    }

    try {
        loading.value = true;
        const res = await updateExam(editForm.value);
        if (res.code === 200) {
            ElMessage.success('更新成功！');
            await fetchExamDetails();
            basicInfoDialogVisible.value = false;
            examSettingsDialogVisible.value = false;
        } else {
            ElMessage.error(res.msg || '更新失败');
        }
    } catch(error) {
        ElMessage.error('更新失败');
    } finally {
        loading.value = false;
    }
};

const openBatchSetScoreDialog = () => {
    const defaultScores = {};
    questionTypesForBatchScore.value.forEach(item => { defaultScores[item.type] = 5; });
    questionList.value.forEach(item => {
        const typeKeyMap = { '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE', '填空': 'FILL_IN_BLANK', '论述': 'ESSAY', '简答': 'ESSAY' };
        const key = typeKeyMap[item.question.questionType];
        if (key) { defaultScores[key] = item.score; }
    });
    batchScoreForm.value = defaultScores;
    batchSetScoreDialogVisible.value = true;
};

const handleScoreCommands = (command) => {
    if (command === 'setPassingScore') {
        openSetPassingScoreDialog();
    }
};

const openSetPassingScoreDialog = () => {
    passingScoreForm.value.qualified = examDetails.value.qualified || 0;
    setPassingScoreDialogVisible.value = true;
};

const submitBatchScores = async () => {
    const typeKeyMap = { '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE', '填空': 'FILL_IN_BLANK', '论述': 'ESSAY', '简答': 'ESSAY' };
    const examQuestionListPayload = questionList.value.map(q => ({
        questionId: q.questionId,
        score: batchScoreForm.value[typeKeyMap[q.question.questionType]] || 0,
        sort: q.sort
    }));
    try {
        const res = await setExamQuestions({ id: examId.value, examQuestionList: examQuestionListPayload });
        if (res.code === 200) {
            ElMessage.success('批量设置分数成功！');
            batchSetScoreDialogVisible.value = false;
            await fetchExamDetails();
        } else {
            ElMessage.error(res.msg || '操作失败');
        }
    } catch(error) { ElMessage.error('操作失败'); }
};

const submitPassingScore = async () => {
    try {
        const res = await setPassingScore({ id: examId.value, qualified: passingScoreForm.value.qualified });
         if (res.code === 200) {
            ElMessage.success('设置合格分成功！');
            setPassingScoreDialogVisible.value = false;
            await fetchExamDetails();
        } else {
            ElMessage.error(res.msg || '操作失败');
        }
    } catch(error) { ElMessage.error('操作失败'); }
};

const handleTogglePublishStatus = async () => {
  if (!examDetails.value) return;
  if ((!examDetails.value.clazzUserBindList || examDetails.value.clazzUserBindList.length === 0) && examDetails.value.scope !==0) {
    ElMessage.error('发布失败：请先在“考试设置”中指定参考人员或班级！');
    return;
  }
  const currentStatus = examDetails.value.status;
  const targetStatus = currentStatus === 1 ? 0 : 1;
  const actionText = targetStatus === 1 ? '发布' : '取消发布';
  try {
    await ElMessageBox.confirm(`您确定要“${actionText}”这场考试吗?`, '操作确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
    loading.value = true;
    const res = await updateExamStatus({ id: examId.value, status: targetStatus });
    if (res.code === 200) { ElMessage.success(`${actionText}成功！`); await fetchExamDetails(); }
    else { ElMessage.error(res.msg || `${actionText}失败`); }
  } catch (error) {
    if (error !== 'cancel') { ElMessage.error(`${actionText}失败`); }
  } finally {
    loading.value = false;
  }
};

const addQuestion = (command) => {
  if (command === 'manual_select') {
    selectorVisible.value = true;
  } else if (command === 'manual_add') {
     router.push({ name: 'TeachingCenter-ManualAddQuestion', query: { examId: examId.value } });
  }
};

const handleSelectionSuccess = () => {
  fetchExamDetails();
};

const handleScopeChange = () => {
  selectedScopeItems.value = [];
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    examId.value = id;
    fetchExamDetails();
    fetchCategories();
    // 首次加载不主动获取用户，等待用户搜索
    // fetchScopeOptionsData();
  } else {
    ElMessage.error('无效的考试ID');
    loading.value = false;
  }
});
</script>

<style scoped>
.exam-settings-page { 
  padding: 20px; 
  background-color: #f0f2f5; 
  height: 100%; 
  overflow-y: auto; 
  box-sizing: border-box; 
}
.page-header-title { font-size: 18px; font-weight: 600; margin-right: 12px; }
.main-layout { 
  display: flex; 
  margin-top: 20px; 
  gap: 20px; 
  height: calc(100% - 80px); /* 减去页头的高度 */
}
.left-panel { 
  flex: 3; 
  min-width: 0; 
  display: flex; 
  flex-direction: column; 
}
.right-panel { 
  flex: 1; 
  min-width: 300px; 
  display: flex; 
  flex-direction: column; 
  gap: 12px; /* 进一步减少卡片之间的间距 */
  height: fit-content; /* 让右侧面板高度根据内容适配 */
  position: sticky; /* 让右侧面板保持在顶部位置 */
  top: 0; /* 粘性定位的偏移量 */
  align-self: flex-start; /* 确保面板从容器顶部开始 */
}
.question-list-container {
  flex: 1; /* 让容器占据剩余的所有空间 */
  overflow-y: auto; /* 允许垂直滚动 */
  padding: 0 8px;
  min-height: 0; /* 允许 flex 子项收缩 */
}
.card-header { display: flex; justify-content: space-between; align-items: center; }
.el-card { 
  border-radius: 4px; 
  height: 100%; 
  display: flex; 
  flex-direction: column; 
}
.el-card :deep(.el-card__header) {
  flex-shrink: 0; /* 防止头部被压缩 */
}
.el-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px;
}
.form-hint { font-size: 12px; color: #f56c6c; line-height: 1.5; }
.left-panel-header { display: flex; justify-content: space-between; align-items: center; }
.stats-bar { display: flex; align-items: center; gap: 20px; font-size: 14px; color: #606266; }
.stats-bar .stat-value { color: #303133; font-weight: bold; margin: 0 4px; }
.dialog-stat-text { margin: 0 10px; color: #606266; font-size: 14px; }
.action-buttons { margin-top: 20px; display: flex; }
.action-buttons .el-button { width: 100%; height: 40px; font-size: 16px; }

/* 调整描述列表的行高和间距 */
.el-descriptions :deep(.el-descriptions__body) {
  background: #fff;
}
.el-descriptions :deep(.el-descriptions-item__cell) {
  padding: 8px 12px; /* 减少内边距，默认通常是 12px 16px */
}
.el-descriptions :deep(.el-descriptions-item__label) {
  width: 80px; /* 固定标签宽度 */
  font-weight: 500;
}
.el-descriptions :deep(.el-descriptions-item__content) {
  word-break: break-all;
}
</style>