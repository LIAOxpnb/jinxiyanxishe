<template>
  <div class="range-setup-page" v-loading="loading">
    <div v-if="shootingRangeDetails">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">{{ shootingRangeDetails.name || '靶场设置' }}</span>
        </template>
      </el-page-header>

      <div class="main-layout">
        <div class="left-panel">
          <el-card>
            <template #header>
              <div class="left-panel-header">
                <div class="stats-bar">
                  <el-dropdown @command="handleAddItem">
                    <el-button type="primary">
                      新增内容<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="ADD_CLUE">添加线索</el-dropdown-item>
                        <el-dropdown-item command="SINGLE_CHOICE" divided>单选题</el-dropdown-item>
                        <el-dropdown-item command="MULTIPLE_CHOICE">多选题</el-dropdown-item>
                        <el-dropdown-item command="TRUE_FALSE">判断题</el-dropdown-item>
                        <el-dropdown-item command="FILL_IN_BLANK">填空题</el-dropdown-item>
                        <el-dropdown-item command="ESSAY">论述题</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <span>试题数 <span class="stat-value">{{ totalQuestions }}</span> 道</span>
                  <span>总分 <span class="stat-value">{{ totalScore }}</span> 分</span>
                  <span>合格分 <span class="stat-value">{{ shootingRangeDetails.qualified }}</span> 分</span>
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
                  <el-button type="success" @click="saveCluesAndQuestions" style="margin-left: auto;">保存</el-button>
                </div>
              </div>
            </template>
            <div class="content-list-container">
              <div class="section-title">靶场线索</div>
              <el-empty v-if="clues.length === 0" description="暂无线索" :image-size="80" />
              <div v-for="(clue, index) in clues" :key="`clue-${clue.id || index}`" class="item-card">
                 <div class="card-header">
                    <span class="item-index">线索 {{ index + 1 }}</span>
                    <div class="item-actions">
                        <el-button :icon="Edit" circle plain size="small" @click="editClue(clue)" title="编辑" />
                        <el-button :icon="Delete" circle plain type="danger" size="small" @click="deleteClue(index)" title="删除" />
                    </div>
                 </div>
                 <div class="item-body">
                    <div class="item-title" v-html="clue.title"></div>
                 </div>
              </div>
              
              <el-divider />

              <div class="section-title">靶场试题</div>
              <QuestionEditor
                v-for="(question, index) in questionList"
                :key="question.uid"
                :index="index"
                v-model="questionList[index]"
                @delete="handleDeleteQuestion(index)"
                @copy="copyQuestion(index)"
              />
              <el-empty v-if="questionList.length === 0" description="请从“新增内容”下拉菜单中添加试题" :image-size="80" />
            </div>
          </el-card>
        </div>

        <div class="right-panel">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>靶场信息</span>
                <el-button type="primary" link :icon="Edit" @click="openBasicInfoDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="靶场简介">{{ shootingRangeDetails.introduction }}</el-descriptions-item>
              <el-descriptions-item label="分类">{{ shootingRangeDetails.shootingRangeCategory }}</el-descriptions-item>
              <el-descriptions-item label="靶场类型">{{ shootingRangeDetails.shootingRangeType === 0 ? '训练' : '正式' }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ shootingRangeDetails.creator }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ shootingRangeDetails.createTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span>靶场设置</span>
                <el-button type="primary" link :icon="Edit" @click="openRangeSettingsDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="闯关模式">{{ shootingRangeDetails.challengeMode === 1 ? '开启' : '关闭' }}</el-descriptions-item>
              <el-descriptions-item label="比赛时间">{{ shootingRangeDetails.participateDate === 0 ? '不限制' : `${shootingRangeDetails.startTime} ~ ${shootingRangeDetails.endTime}` }}</el-descriptions-item>
              <el-descriptions-item label="比赛时长">{{ shootingRangeDetails.duration === -1 ? '不限制' : `${shootingRangeDetails.duration}分钟` }}</el-descriptions-item>
              <el-descriptions-item label="比赛人员">{{ ['不限制', '指定人员', '指定班级'][shootingRangeDetails.scope] || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="禁止复制">{{ shootingRangeDetails.disableCopy === 1 ? '开启' : '关闭' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

           <el-card>
            <template #header>
              <span>证书</span>
            </template>
            <div class="certificate-section">
                <div class="form-hint">【备注】初始状态人员显示为未颁定</div>
                <div>暂无证书，请联系管理员配置</div>
                <el-button disabled>证书名称</el-button>
            </div>
          </el-card>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="未找到该靶场的相关信息"></el-empty>
    
    <QuestionEditDialog v-model:visible="editDialogVisible" :question-id="editQuestionId" @success="fetchShootingRangeDetails" />

    <el-dialog v-model="batchSetScoreDialogVisible" title="批量设置分数" width="500px">
      <el-form :model="batchScoreForm" label-width="80px">
        <el-form-item v-for="item in questionTypesForBatchScore" :key="item.type">
          <template #label>{{ item.name }}</template>
          <span class="dialog-stat-text">共{{ questionCountsByType[item.type] || 0 }}题</span>
          <span class="dialog-stat-text">单题</span>
          <el-input-number v-model="batchScoreForm[item.type]" :min="0" controls-position="right"
            style="width: 100px;" />
          <span class="dialog-stat-text">分, 共{{ (questionCountsByType[item.type] || 0) * (batchScoreForm[item.type] || 0) }}分</span>
        </el-form-item>
        <el-divider />
        <el-form-item label="总共">
          <span class="dialog-stat-text">共{{ totalQuestions }}题</span>
          <span style="margin-left: 20px;">总分 <span class="stat-value">{{ batchTotalScore }}</span> 分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSetScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchScores">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="setPassingScoreDialogVisible" title="合格分设置" width="500px">
      <el-form :model="passingScoreForm" label-width="80px">
        <el-form-item label="总分">
          <span class="dialog-stat-text">{{ totalScore }}分</span>
        </el-form-item>
        <el-form-item label="合格分">
          <el-input-number v-model="passingScoreForm.qualified" :min="0" :max="totalScore" controls-position="right"
            style="width: 100px;" />
          <span class="dialog-stat-text">分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="setPassingScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassingScore">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getShootingRangeDetail, setClueAndQuestionList, setShootingRangeQualified } from '@/api/teaching-center/ShootingRange.js';
import { Edit, ArrowDown, Delete, Document } from '@element-plus/icons-vue';
import QuestionEditor from '@/components/question/QuestionEditor.vue';
import { v4 as uuidv4 } from 'uuid';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const rangeId = ref(null);
const shootingRangeDetails = ref(null);
const clues = ref([]);
const questionList = ref([]);
const editDialogVisible = ref(false);
const editQuestionId = ref(null);

const batchSetScoreDialogVisible = ref(false);
const setPassingScoreDialogVisible = ref(false);
const batchScoreForm = ref({});
const passingScoreForm = ref({ qualified: 0 });

const totalQuestions = computed(() => questionList.value.length);
const totalScore = computed(() => questionList.value.reduce((sum, item) => sum + (Number(item.score) || 0), 0));

const batchTotalScore = computed(() => {
  let score = 0;
  for (const type in batchScoreForm.value) {
    score += (questionCountsByType.value[type] || 0) * (batchScoreForm.value[type] || 0);
  }
  return score;
});

const questionCountsByType = computed(() => {
  return questionList.value.reduce((acc, item) => {
    const type = item.questionType;
    if (type) {
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
    }
    return acc;
  }, {});
});

const questionTypesForBatchScore = ref([
  { type: 'SINGLE_CHOICE', name: '单选' },
  { type: 'MULTIPLE_CHOICE', name: '多选' },
  { type: 'FILL_IN_BLANK', name: '填空' },
  { type: 'TRUE_FALSE', name: '判断' },
  { type: 'ESSAY', name: '论述' },
]);

const goBack = () => router.back();

const transformBackendToFrontend = (backendQuestions = []) => {
  const typeMapReverse = {
    '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE',
    '填空': 'FILL_IN_BLANK', '论述': 'ESSAY',
  };

  return backendQuestions.map(q => {
    const questionType = typeMapReverse[q.questionType] || 'SINGLE_CHOICE';
    const frontendQuestion = {
      uid: uuidv4(),
      id: q.id,
      title: q.title,
      questionType: questionType,
      difficulty: q.difficulty || 1,
      analysisContent: q.analysis || '',
      analysisType: q.analysis ? 'HAS_ANALYSIS' : 'NO_ANALYSIS',
      score: q.score || 5,
      editMode: 'simple',
      options: [],
      answer: null,
    };

    try {
      if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionType)) {
        const options = JSON.parse(q.details || '[]');
        frontendQuestion.options = options.map(opt => ({ content: opt.value }));
        
        if (questionType === 'SINGLE_CHOICE') {
          const correctOption = options.find(opt => opt.option === q.answer);
          frontendQuestion.answer = correctOption ? options.indexOf(correctOption) : null;
        } else {
          const answerArray = q.answer ? q.answer.split('#@#') : [];
          frontendQuestion.answer = options.reduce((acc, opt, index) => {
            if (answerArray.includes(opt.option)) {
              acc.push(index);
            }
            return acc;
          }, []);
        }
      } else if (questionType === 'TRUE_FALSE') {
        frontendQuestion.answer = q.answer;
      } else if (questionType === 'FILL_IN_BLANK') {
        frontendQuestion.answer = q.answer ? q.answer.split('#@#') : [];
      } else {
        frontendQuestion.answer = q.answer;
      }
    } catch(e) { console.error("解析题目详情失败", e); }

    return frontendQuestion;
  });
};

const fetchShootingRangeDetails = async () => {
  loading.value = true;
  try {
    const res = await getShootingRangeDetail({ id: rangeId.value });
    if (res.code === 200 && res.data) {
      shootingRangeDetails.value = res.data;
      clues.value = res.data.clues || [];
      questionList.value = transformBackendToFrontend(res.data.questions);
    } else {
      ElMessage.error(res.msg || '获取靶场详情失败');
    }
  } catch (error) {
    ElMessage.error('获取靶场详情失败');
  } finally {
    loading.value = false;
  }
};

const saveCluesAndQuestions = async () => {
    try {
        const questionTypeMap = {
            SINGLE_CHOICE: '单选', MULTIPLE_CHOICE: '多选', TRUE_FALSE: '判断',
            FILL_IN_BLANK: '填空', ESSAY: '论述',
        };

        const backendQuestions = questionList.value.map((q, i) => {
            const backendQuestion = {
                questionType: questionTypeMap[q.questionType] || '',
                title: q.title,
                details: '',
                answer: '',
                analysis: q.analysisType === 'HAS_ANALYSIS' ? q.analysisContent : '',
                score: q.score,
                sort: i + 1,
            };

            if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
                backendQuestion.details = JSON.stringify(q.options.map((opt, i) => ({
                    option: String.fromCharCode(65 + i),
                    value: opt.content
                })));
                if (q.questionType === 'SINGLE_CHOICE' && q.answer !== null) {
                    backendQuestion.answer = String.fromCharCode(65 + q.answer);
                } else if (q.questionType === 'MULTIPLE_CHOICE' && q.answer && q.answer.length > 0) {
                    backendQuestion.answer = [...q.answer].sort((a, b) => a - b).map(i => String.fromCharCode(65 + i)).join('#@#');
                }
            } else if (q.questionType === 'TRUE_FALSE') {
                backendQuestion.answer = q.answer;
                 backendQuestion.details = JSON.stringify([
                  { option: 'A', value: '正确' },
                  { option: 'B', value: '错误' }
                ]);
            } else if (q.questionType === 'FILL_IN_BLANK') {
                backendQuestion.answer = q.answer ? q.answer.join('#@#') : '';
            } else {
                backendQuestion.answer = q.answer;
            }
            return backendQuestion;
        });

        const payload = {
            id: rangeId.value,
            clues: clues.value.map((c, i) => ({ ...c, sort: i + 1 })),
            questions: backendQuestions,
        };

        await setClueAndQuestionList(payload);
        ElMessage.success('保存成功！');
        fetchShootingRangeDetails();
    } catch (error) {
        ElMessage.error('保存失败');
        console.error(error);
    }
};

const handleAddItem = (command) => {
  if (command === 'ADD_CLUE') {
    addClue();
  } else if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY'].includes(command)) {
    addQuestion(command);
  }
};

const createBaseQuestion = (type) => ({
  uid: uuidv4(),
  id: null,
  title: '',
  details: '',
  questionType: type,
  analysisType: 'NO_ANALYSIS',
  analysisContent: '',
  options: [{ content: '' }],
  answer: null,
  editMode: 'simple',
  score: 5,
});

const addQuestion = (type) => {
  const base = createBaseQuestion(type);
  switch (type) {
    case 'MULTIPLE_CHOICE': base.answer = []; break;
    case 'TRUE_FALSE': base.answer = '1'; break;
    case 'FILL_IN_BLANK': base.answer = ['']; base.options = []; break;
    case 'ESSAY': base.answer = ''; base.options = []; break;
  }
  questionList.value.push(base);
};

const addClue = () => { clues.value.push({ title: '新线索', fileName: '', filePath: ''}); };
const editClue = (clue) => { ElMessage.info(`编辑线索：${clue.title}`); };
const deleteClue = (index) => { clues.value.splice(index, 1); };
const handleDeleteQuestion = (index) => { questionList.value.splice(index, 1); };

const copyQuestion = (index) => {
  const originalQuestion = questionList.value[index];
  const copiedQuestion = JSON.parse(JSON.stringify(originalQuestion));
  copiedQuestion.uid = uuidv4();
  questionList.value.splice(index + 1, 0, copiedQuestion);
};

const handleEditQuestion = (question) => { ElMessage.info("编辑功能由QuestionEditor组件内部处理"); };
const openBasicInfoDialog = () => { ElMessage.info("开启编辑靶场信息弹窗"); };
const openRangeSettingsDialog = () => { ElMessage.info("开启编辑靶场设置弹窗"); };

const openBatchSetScoreDialog = () => {
  const defaultScores = {};
  questionTypesForBatchScore.value.forEach(item => {
    const firstQuestionOfType = questionList.value.find(q => q.questionType === item.type);
    defaultScores[item.type] = firstQuestionOfType ? firstQuestionOfType.score : 0;
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
  passingScoreForm.value.qualified = shootingRangeDetails.value.qualified || 0;
  setPassingScoreDialogVisible.value = true;
};

const submitBatchScores = async () => {
  questionList.value.forEach(q => {
    if (batchScoreForm.value[q.questionType] !== undefined) {
      q.score = batchScoreForm.value[q.questionType];
    }
  });
  await saveCluesAndQuestions();
  batchSetScoreDialogVisible.value = false;
};

const submitPassingScore = async () => {
  try {
    await setShootingRangeQualified({ id: rangeId.value, qualified: passingScoreForm.value.qualified });
    ElMessage.success('设置合格分成功！');
    setPassingScoreDialogVisible.value = false;
    await fetchShootingRangeDetails();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    rangeId.value = id;
    fetchShootingRangeDetails();
  } else {
    ElMessage.error('无效的靶场ID');
    loading.value = false;
  }
});
</script>

<style scoped>
.range-setup-page {
  padding: 20px;
  background-color: #f0f2f5;
  height: 100%;
  overflow-y: auto;
}
.page-header-title {
  font-size: 18px;
  font-weight: 600;
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
  top: 20px;
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
.content-list-container {
  padding: 8px;
}
.section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
}
.item-card {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    margin-bottom: 16px;
    padding: 16px;
}
.item-card .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}
.item-index {
    font-weight: bold;
    flex-shrink: 0;
}
.item-score {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}
.item-score .el-input-number {
    width: 80px;
}
.item-actions {
    margin-left: 16px;
}
.item-body .item-title {
    margin-bottom: 12px;
}
.item-attachment {
    font-size: 12px;
    color: #409eff;
    cursor: pointer;
}
.form-hint {
  font-size: 12px;
  color: #f56c6c;
}
.certificate-section {
    color: #909399;
    font-size: 14px;
}
.dialog-stat-text {
  margin: 0 10px;
  color: #606266;
  font-size: 14px;
}
</style>