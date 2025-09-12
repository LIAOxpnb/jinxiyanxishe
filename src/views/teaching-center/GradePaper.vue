<template>
  <div class="page-wrapper" v-loading="loading">
    <div v-if="paperDetails" class="main-content">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">
            试卷详情 - {{ paperDetails.exam?.name }} (学员: {{ paperDetails.userName }})
          </span>
        </template>
      </el-page-header>

      <div class="marking-content">
        <div class="left-panel">
          <el-descriptions title="试卷信息" :column="1" border>
            <el-descriptions-item label="已得分">{{ paperDetails.score }}</el-descriptions-item>
            <el-descriptions-item label="总得分">{{ paperDetails.score }}</el-descriptions-item>
            <el-descriptions-item label="试卷总分">{{ paperDetails.exam?.totalScore }}</el-descriptions-item>
            <el-descriptions-item label="合格分">{{ paperDetails.exam?.qualified }}</el-descriptions-item>
          </el-descriptions>
          <div class="question-nav">
            <el-button-group>
              <el-button :type="activeFilter === 'all' ? 'primary' : 'default'" @click="activeFilter = 'all'">全部</el-button>
              <el-button :type="activeFilter === 'ungraded' ? 'primary' : 'default'" @click="activeFilter = 'ungraded'">未判分</el-button>
              <el-button :type="activeFilter === 'graded' ? 'primary' : 'default'" @click="activeFilter = 'graded'">已判分</el-button>
            </el-button-group>
            <div class="nav-grid">
              <div 
                class="nav-item" 
                v-for="(item, index) in paperDetails.examSubmitRecordList" 
                :key="item.id"
                :class="{ 'correct': item.isCorrect === 2, 'incorrect': item.isCorrect === 1 }"
              >
                <span class="nav-item-index">{{ index + 1 }}</span>
                <span class="nav-item-score">{{ item.score }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <ExamQuestionCardForMarking 
            v-for="record in filteredQuestionList" 
            :key="record.id" 
            :record="record" 
            :index="record.originalIndex"
          />
          <el-empty v-if="filteredQuestionList.length === 0" description="该分类下暂无题目"></el-empty>
        </div>
      </div>

      <div class="footer-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmitScores">提交评分</el-button>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="无法加载试卷详情"></el-empty>
    <el-empty v-else description="正在加载试卷详情..."></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getGradePaperDetail, submitGradePaper } from '../../api/teaching-center/Exams.js';
import ExamQuestionCardForMarking from '@/components/ExamQuestionCardForMarking.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const submissionId = ref(null);
const paperDetails = ref(null);

// 1. 用于存储当前筛选类型的状态
const activeFilter = ref('all'); // 'all', 'ungraded', 'graded'

// 返回上一页
const goBack = () => router.back();

// 获取试卷详情
const fetchPaperDetails = async () => {
  loading.value = true;
  try {
    const res = await getGradePaperDetail(submissionId.value);
    if (res.code === 200) {
      // 为原始列表的每一项增加一个原始索引，确保筛选后题号不变
      if (res.data && res.data.examSubmitRecordList) {
        res.data.examSubmitRecordList.forEach((item, index) => {
          item.originalIndex = index;
        });
      }
      paperDetails.value = res.data;
    } else {
      ElMessage.error(res.msg || "获取详情失败");
    }
  } catch(error) {
    ElMessage.error("获取详情失败");
  } finally {
    loading.value = false;
  }
};

// 提交评分
const handleSubmitScores = async () => {
  if (!paperDetails.value || !paperDetails.value.examSubmitRecordList) {
    ElMessage.warning("没有可提交的评分数据");
    return;
  }
  const payload = paperDetails.value.examSubmitRecordList.map(item => ({
    id: item.id,
    score: item.score
  }));
  try {
    const res = await submitGradePaper(payload);
    if (res.code === 200) {
      ElMessage.success("评分提交成功！");
      goBack();
    } else {
      ElMessage.error(res.msg || "提交失败");
    }
  } catch (error) {
    ElMessage.error("提交失败");
  }
};

// 2. 创建一个计算属性，它会根据 activeFilter 的值返回不同的试题列表
const filteredQuestionList = computed(() => {
  const list = paperDetails.value?.examSubmitRecordList;
  if (!list) return [];

  switch (activeFilter.value) {
    case 'ungraded':
      // 假设“未判分”的题目是需要人工批阅且当前分数为0的题目 (例如主观题)
      // 您可以根据业务需求调整此处的判断逻辑
      return list.filter(item => ['论述', '简答'].includes(item.question.questionType) && item.score === 0);
    case 'graded':
       // 假设“已判分”是除了上面情况之外的所有题目
      return list.filter(item => !(['论述', '简答'].includes(item.question.questionType) && item.score === 0));
    case 'all':
    default:
      return list; // 返回完整列表
  }
});

// 页面加载时的生命周期钩子
onMounted(() => {
  submissionId.value = route.params.id;
  if(submissionId.value) {
    fetchPaperDetails();
  } else {
    ElMessage.error("无效的提交记录ID");
    loading.value = false;
  }
});
</script>

<style scoped>
.page-wrapper { padding: 20px; background-color: #f0f2f5; min-height: calc(100vh - 50px); }
.main-content { background-color: #fff; padding: 24px; border-radius: 4px; }
.page-header-title { font-size: 18px; }
.marking-content { display: flex; gap: 20px; margin-top: 20px; }
.left-panel { flex: 0 0 250px; }
.right-panel { flex: 1; overflow-y: auto; max-height: 75vh; background-color: #f9fafb; padding: 15px; border-radius: 4px; }
.question-nav { margin-top: 20px; }
.nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 10px; }
.nav-item { border: 1px solid #dcdfe6; border-radius: 4px; text-align: center; padding: 4px 0; cursor: pointer; }
.nav-item.correct { background-color: #f0f9eb; color: #67c23a; border-color: #e1f3d8; }
.nav-item.incorrect { background-color: #fef0f0; color: #f56c6c; border-color: #fde2e2; }
.nav-item-index { font-size: 14px; }
.nav-item-score { display: block; font-size: 12px; color: #909399; }
.footer-actions { margin-top: 20px; text-align: center; }
</style>