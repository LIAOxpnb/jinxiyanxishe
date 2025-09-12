<template>
  <div class="page-wrapper" v-loading="loading">
    <div v-if="resultDetails" class="main-content">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">
            考试结果 - {{ resultDetails.exam?.name }}
          </span>
        </template>
      </el-page-header>

      <div class="marking-content">
        <div class="left-panel">
          <el-descriptions title="试卷信息" :column="1" border>
            <el-descriptions-item label="最终得分">{{ resultDetails.score }}</el-descriptions-item>
            <el-descriptions-item label="试卷总分">{{ resultDetails.exam?.totalScore }}</el-descriptions-item>
            <el-descriptions-item label="合格分">{{ resultDetails.exam?.qualified }}</el-descriptions-item>
            <el-descriptions-item label="考核结果">
              <el-tag :type="resultDetails.qualified === 1 ? 'success' : 'danger'">
                {{ resultDetails.qualified === 1 ? '合格' : '不合格' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <div class="question-nav">
            <div class="nav-grid">
              <div 
                class="nav-item" 
                v-for="(item, index) in resultDetails.examSubmitRecordList" 
                :key="item.id"
                :class="getNavItemClass(item)"
                @click="scrollToQuestion(item.question.id)"
              >
                {{ index + 1 }}
              </div>
            </div>
            <div class="nav-legend">
              <div><span class="legend-box active"></span>当前</div>
              <div><span class="legend-box correct"></span>正确</div>
              <div><span class="legend-box incorrect"></span>错误</div>
              <div><span class="legend-box unanswered"></span>未答</div>
            </div>
          </div>
        </div>

        <div class="right-panel" ref="rightPanelRef">
          <div
            v-for="(record, index) in resultDetails.examSubmitRecordList"
            :key="record.id"
            :data-question-id="record.question.id"
            class="question-wrapper"
          >
            <ExamResultQuestionDisplay 
              :record="record" 
              :index="index"
            />
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="无法加载考试结果"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getStudentExamResult } from '@/api/exams.js';
import ExamResultQuestionDisplay from '@/components/ExamResultQuestionDisplay.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const resultId = ref(null);
const resultDetails = ref(null);

const rightPanelRef = ref(null);
const activeQuestionId = ref(null);
let observer = null;

const goBack = () => router.back();

const fetchExamResult = async () => {
  loading.value = true;
  try {
    const res = await getStudentExamResult(resultId.value);
    if (res.code === 200) {
      resultDetails.value = res.data;
    } else {
      ElMessage.error(res.msg || "获取考试结果失败");
    }
  } catch(error) {
    ElMessage.error("获取考试结果失败");
  } finally {
    loading.value = false;
  }
};

// [核心修改] 将样式判断逻辑封装成一个函数
const getNavItemClass = (item) => {
  // 最高优先级：判断是否为当前激活的题目
  if (item.question.id === activeQuestionId.value) {
    return 'active'; // 蓝色
  }
  // 其次：判断是否已回答
  if (item.userAnswer !== null && item.userAnswer !== '') {
    if (item.isCorrect === 2) {
      return 'correct'; // 绿色
    }
    // 只要回答过但不是正确(isCorrect:2)，都算错误
    return 'incorrect'; // 红色
  }
  // 最后：未回答的题目
  return 'unanswered'; // 灰色
};

// [核心修改] 优化点击跳转逻辑
const scrollToQuestion = (questionId) => {
  const targetElement = document.querySelector(`.question-wrapper[data-question-id='${questionId}']`);
  if (targetElement) {
    // 立即更新高亮状态，提供即时反馈
    activeQuestionId.value = questionId;
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const initIntersectionObserver = () => {
    setTimeout(() => {
        if (!rightPanelRef.value) return;
        const options = {
            root: rightPanelRef.value,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    activeQuestionId.value = parseInt(entry.target.dataset.questionId);
                }
            });
        }, options);
        const questionElements = rightPanelRef.value.querySelectorAll('.question-wrapper');
        questionElements.forEach(el => observer.observe(el));
    }, 500);
};

onMounted(async () => {
  resultId.value = route.params.id;
  if(resultId.value) {
    await fetchExamResult();
    if (resultDetails.value) {
        initIntersectionObserver();
    }
  } else {
    ElMessage.error("无效的考试记录ID");
    loading.value = false;
  }
});

onBeforeUnmount(() => {
    if (observer) {
        observer.disconnect();
    }
});
</script>

<style scoped>
/* 样式部分无需修改 */
.page-wrapper { padding: 20px; background-color: #f0f2f5; min-height: calc(100vh - 50px); }
.main-content { background-color: #fff; padding: 24px; border-radius: 4px; }
.page-header-title { font-size: 18px; }
.marking-content { display: flex; gap: 20px; margin-top: 20px; }
.left-panel { flex: 0 0 250px; }
.right-panel { flex: 1; overflow-y: auto; max-height: 85vh; background-color: #f9fafb; padding: 15px; border-radius: 4px; }
.question-nav { margin-top: 20px; }
.nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.nav-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}
.nav-item.correct { background-color: #f0f9eb; color: #67c23a; border-color: #e1f3d8; }
.nav-item.incorrect { background-color: #fef0f0; color: #f56c6c; border-color: #fde2e2; }
.nav-item.unanswered { background-color: #f4f4f5; color: #909399; border-color: #e9e9eb; }
.nav-item.active {
  border-color: #409eff;
  background-color: #409eff;
  color: #fff;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.5);
}
.nav-legend { display: flex; flex-wrap: wrap; justify-content: space-around; margin-top: 15px; font-size: 12px; color: #909399; }
.legend-box { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border-radius: 2px; vertical-align: middle; }
.legend-box.correct { background-color: #f0f9eb; border: 1px solid #e1f3d8;}
.legend-box.incorrect { background-color: #fef0f0; border: 1px solid #fde2e2;}
.legend-box.unanswered { background-color: #f4f4f5; border: 1px solid #e9e9eb;}
.legend-box.active { background-color: #409eff; }
</style>