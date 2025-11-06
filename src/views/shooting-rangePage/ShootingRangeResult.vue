<template>
  <div class="page-wrapper" v-loading="loading">
    <div v-if="resultDetails" class="main-content">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">
            靶场结果 - {{ resultDetails.name }}
          </span>
        </template>
      </el-page-header>

      <div class="marking-content">
        <div class="left-panel">
          <el-descriptions title="靶场信息" :column="1" border>
            <el-descriptions-item label="最终得分">{{ resultDetails.score }}</el-descriptions-item>
            <el-descriptions-item label="靶场总分">{{ resultDetails.shootingRange?.score || '-' }}</el-descriptions-item>
            <el-descriptions-item label="合格分">{{ resultDetails.shootingRange?.qualified || '-' }}</el-descriptions-item>
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
                v-for="(item, index) in resultDetails.shootingRangeSubmitRecordList" 
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
            v-for="(record, index) in resultDetails.shootingRangeSubmitRecordList"
            :key="record.id"
            :data-question-id="record.question.id"
            class="question-wrapper"
          >
            <PracticeResultQuestionDisplay 
              :record="record" 
              :index="index"
            />
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="无法加载靶场结果"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getShootingRangeRecordDetail } from '@/api/shooting-range.js';
import PracticeResultQuestionDisplay from '@/components/practice/PracticeResultQuestionDisplay.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const resultId = ref(null);
const resultDetails = ref(null);

const rightPanelRef = ref(null);
const activeQuestionId = ref(null);
let observer = null;

const goBack = () => router.back();

const fetchRangeResult = async () => {
  loading.value = true;
  try {
    const res = await getShootingRangeRecordDetail(resultId.value);
    if (res.code === 200) {
      // 将 shootingRangeQuestion 映射为 question，以兼容组件
      if (res.data && res.data.shootingRangeSubmitRecordList) {
        res.data.shootingRangeSubmitRecordList.forEach(item => {
          if (item.shootingRangeQuestion) {
            item.question = item.shootingRangeQuestion;
          }
        });
      }
      resultDetails.value = res.data;
    } else {
      ElMessage.error(res.msg || "获取靶场结果失败");
    }
  } catch(error) {
    ElMessage.error("获取靶场结果失败");
  } finally {
    loading.value = false;
  }
};

const getNavItemClass = (item) => {
  if (item.question.id === activeQuestionId.value) {
    return 'active';
  }
  if (item.userAnswer !== null && item.userAnswer !== '') {
    if (item.isCorrect === 1) {
      return 'correct';
    }
    return 'incorrect';
  }
  return 'unanswered';
};

const scrollToQuestion = (questionId) => {
  const targetElement = document.querySelector(`.question-wrapper[data-question-id='${questionId}']`);
  if (targetElement) {
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
    await fetchRangeResult();
    if (resultDetails.value) {
        initIntersectionObserver();
    }
  } else {
    ElMessage.error("无效的靶场记录ID");
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
/* 1. 根容器设置为100%高度的flex布局 */
.page-wrapper {
  height: 100%; /* 继承父级的高度 */
  background-color: #f0f2f5;
  padding: 20px;
  box-sizing: border-box; /* 让 padding 不会撑大容器 */
  display: flex;
  flex-direction: column;
}

/* 2. 主内容区设置为flex自适应填充 */
.main-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* 占据所有剩余空间 */
  min-height: 0; /* flex布局防溢出技巧 */
}

.page-header-title { font-size: 18px; }

/* 3. 两栏容器也设置为flex自适应填充 */
.marking-content {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  flex-grow: 1; /* 占据所有剩余空间 */
  min-height: 0; /* flex布局防溢出技巧 */
}

.left-panel { flex: 0 0 250px; overflow-y: auto; }

/* 4. 移除右侧面板不稳定的 max-height，让flex自动计算高度 */
.right-panel {
  flex: 1;
  overflow-y: auto;
  background-color: #f9fafb;
  padding: 15px;
  border-radius: 4px;
}

/* --- 以下样式保持不变 --- */
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
