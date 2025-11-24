<template>
  <div class="page-wrapper" v-loading="loading">
    <div v-if="paperDetails" class="main-content">
      <div class="custom-header">
        <div class="header-left">
          <el-button link @click="goBack" class="back-button">
            <el-icon>
              <ArrowLeft />
            </el-icon>
            试卷详情
          </el-button>
        </div>
        <div class="header-actions">
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" @click="handleSubmitScores">提交评分</el-button>
        </div>
      </div>

      <div class="marking-content">
        <div class="left-panel">
          <el-descriptions title="" :column="1" border>
            <el-descriptions-item label="已得分">
              <span style="color: #409eff; font-weight: bold; font-size: 16px;">{{ paperDetails.score || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="已扣分">
              <span style="color: #f56c6c; font-weight: bold; font-size: 16px;">{{ calculateDeduction() }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="总得分">
              <span style="color: #67c23a; font-weight: bold; font-size: 16px;">{{ paperDetails.score || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="试卷总分">{{ paperDetails.shootingRange?.score || 0 }}</el-descriptions-item>
            <el-descriptions-item label="合格分">{{ paperDetails.shootingRange?.qualified || 0 }}</el-descriptions-item>
          </el-descriptions>
          
          <div class="question-nav">
            <el-button-group>
              <el-button 
                :type="activeFilter === 'all' ? 'primary' : 'default'"
                @click="activeFilter = 'all'"
                size="small"
              >
                全部
              </el-button>
              <el-button 
                :type="activeFilter === 'ungraded' ? 'primary' : 'default'"
                @click="activeFilter = 'ungraded'"
                size="small"
              >
                未判分
              </el-button>
              <el-button 
                :type="activeFilter === 'graded' ? 'primary' : 'default'"
                @click="activeFilter = 'graded'"
                size="small"
              >
                已判分
              </el-button>
            </el-button-group>
            
            <div class="nav-grid">
              <div 
                class="nav-item" 
                v-for="(item, index) in paperDetails.shootingRangeSubmitRecordList" 
                :key="item.id" 
                :class="{
                  'correct': item.isCorrect === 2,
                  'incorrect': item.isCorrect === 1,
                  'current': currentQuestionId == item.id
                }" 
                @click="scrollToQuestion('question-' + item.id)"
              >
                <span class="nav-item-type">{{ getQuestionTypeShort(item.shootingRangeQuestion?.questionType) }}</span>
                <span class="nav-item-index">{{ index + 1 }}</span>
                <span class="nav-item-score">{{ item.score === null ? 0 : item.score }}</span>
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
            :id="'question-' + record.id" 
          />
          <el-empty v-if="filteredQuestionList.length === 0" description="该分类下暂无题目"></el-empty>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="无法加载试卷详情"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { getGradePaperDetail, gradePaper } from '@/api/teaching-center/ShootingRange.js';
import ExamQuestionCardForMarking from '@/components/exam/ExamQuestionCardForMarking.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const submissionId = ref(null);
const paperDetails = ref(null);
const currentQuestionId = ref(null);

const activeFilter = ref('all');

const goBack = () => router.back();

// 获取题型简称
const getQuestionTypeShort = (type) => {
  const typeMap = {
    '单选题': '单',
    '单选': '单',
    '多选题': '多',
    '多选': '多',
    '判断题': '判',
    '判断': '判',
    '简答': '简',
    '论述': '论',
    '填空': '填'
  };
  return typeMap[type] || type?.substring(0, 1) || '题';
};

// 计算扣分
const calculateDeduction = () => {
  if (!paperDetails.value?.shootingRangeSubmitRecordList) return 0;
  const totalScore = paperDetails.value.shootingRange?.score || 0;
  const currentScore = paperDetails.value.score || 0;
  return Math.max(0, totalScore - currentScore);
};

const scrollToQuestion = (elementId) => {
  const targetElement = document.getElementById(elementId);
  const rightPanel = document.querySelector('.right-panel');

  if (targetElement && rightPanel) {
    const panelRect = rightPanel.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const relativeTop = targetRect.top - panelRect.top + rightPanel.scrollTop;

    rightPanel.scrollTo({
      top: relativeTop - 20,
      behavior: 'smooth'
    });

    const questionId = elementId.replace('question-', '');
    currentQuestionId.value = questionId;
  } else {
    console.warn('未找到目标元素或面板:', elementId);
  }
};

const fetchPaperDetails = async () => {
  loading.value = true;
  try {
    const res = await getGradePaperDetail({ id: submissionId.value });
    if (res.code === 200) {
      if (res.data && res.data.shootingRangeSubmitRecordList) {
        // 将 shootingRangeQuestion 映射为 question，以便组件能正确读取
        res.data.shootingRangeSubmitRecordList.forEach((item, index) => {
          item.originalIndex = index;
          // 映射数据结构：shootingRangeQuestion -> question
          if (item.shootingRangeQuestion) {
            item.question = {
              ...item.shootingRangeQuestion,
              questionCategoryName: item.shootingRangeQuestion.questionCategory || '默认分类',
              difficulty: 1 // 靶场题目默认难度，如果接口有该字段可以映射
            };
            // 设置totalScore字段为题目的满分(从shootingRangeQuestion.score获取)
            item.totalScore = item.shootingRangeQuestion.score || 0;
          }
        });
      }
      paperDetails.value = res.data;
    } else {
      ElMessage.error(res.msg || "获取详情失败");
    }
  } catch (error) {
    console.error("获取详情失败:", error);
    ElMessage.error("获取详情失败");
  } finally {
    loading.value = false;
  }
};

const handleSubmitScores = async () => {
  if (!paperDetails.value || !paperDetails.value.shootingRangeSubmitRecordList) {
    ElMessage.warning("没有可提交的评分数据");
    return;
  }

  // 检查是否有未评分的题目
  const hasUngraded = paperDetails.value.shootingRangeSubmitRecordList.some(item => item.score === null);
  
  if (hasUngraded) {
    ElMessageBox.alert('未完成评卷禁止发布', '操作提示', {
      confirmButtonText: '关闭',
      type: 'warning'
    });
    return;
  }

  // 过滤出真正需要提交评分的题目（分数不为null的）
  const payload = paperDetails.value.shootingRangeSubmitRecordList
    .filter(item => item.score !== null)
    .map(item => ({
      id: item.id,
      score: item.score
    }));

  if (payload.length === 0) {
    ElMessage.warning("没有已评分的题目可提交");
    return;
  }

  ElMessageBox.confirm('评卷完成，立即发布比试结果', '操作提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await gradePaper(payload);
      if (res.code === 200) {
        ElMessage.success("评分提交成功！");
        goBack();
      } else {
        ElMessage.error(res.msg || "提交失败");
      }
    } catch (error) {
      console.error("提交失败:", error);
      ElMessage.error("提交失败");
    }
  }).catch(() => {
    // 用户取消
  });
};

const filteredQuestionList = computed(() => {
  const list = paperDetails.value?.shootingRangeSubmitRecordList;
  if (!list) return [];

  switch (activeFilter.value) {
    case 'ungraded':
      return list.filter(item => item.score === null);
    case 'graded':
      return list.filter(item => item.score !== null);
    case 'all':
    default:
      return list;
  }
});

onMounted(() => {
  submissionId.value = route.params.id;
  if (submissionId.value) {
    fetchPaperDetails();
  } else {
    ElMessage.error("无效的提交记录ID");
    loading.value = false;
  }
});
</script>

<style scoped>
.page-wrapper {
  padding: 20px;
  background-color: #f0f2f5;
  height: calc(100vh - 64px - 64px); /* 减去Header和Footer高度 */
  overflow: hidden;
  box-sizing: border-box;
}

.main-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
  height: calc(100vh - 64px - 64px - 40px); /* 减去Header、Footer和外层padding */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #dcdfe6;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  font-size: 14px;
  color: #409eff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.marking-content {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  overflow-y: auto;
  background-color: #f9fafb;
  padding: 15px;
  padding-bottom: 60px;
  border-radius: 4px;
}

.question-nav {
  margin-top: 20px;
  overflow-y: auto;
  flex: 1;
}

.el-button-group {
  display: flex;
  width: 100%;
  margin-bottom: 10px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 10px;
  align-content: start;
  overflow-y: auto;
  flex: 1;
  max-height: none;
  padding-bottom: 10px;
  padding-right: 5px;
}

.nav-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  padding: 6px 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.nav-item.correct {
  background-color: #f0f9eb;
  color: #67c23a;
  border-color: #e1f3d8;
}

.nav-item.incorrect {
  background-color: #fef0f0;
  color: #f56c6c;
  border-color: #fde2e2;
}

.nav-item.current {
  border-color: #f56c6c;
  background-color: #f56c6c;
  color: #fff;
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.3);
}

.nav-item-type {
  font-size: 10px;
  color: #909399;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 2px;
}

.nav-item.current .nav-item-type {
  background-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.nav-item-index {
  font-size: 14px;
  font-weight: bold;
}

.nav-item-score {
  display: block;
  font-size: 12px;
  color: #909399;
}

.nav-item.current .nav-item-score {
  color: #fff;
}
</style>
