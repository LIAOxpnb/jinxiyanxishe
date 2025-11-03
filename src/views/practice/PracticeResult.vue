<template>
  <div class="page-wrapper" v-loading="loading">
    <div v-if="recordDetail" class="main-content">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">
            练习结果 - {{ recordDetail.practice?.name }}
          </span>
        </template>
      </el-page-header>

      <div class="result-content">
        <div class="left-panel">
          <el-descriptions title="练习信息" :column="1" border>
            <!-- <el-descriptions-item label="最终得分">
              <span style="color: #409eff; font-weight: bold; font-size: 16px;">{{ recordDetail.score }}</span>
            </el-descriptions-item> -->
            <!-- <el-descriptions-item label="练习总分">{{ recordDetail.practice?.totalScore }}</el-descriptions-item> -->
            <el-descriptions-item label="提交时间">{{ recordDetail.createTime }}</el-descriptions-item>
          </el-descriptions>
          <div class="question-nav">
            <div class="nav-grid">
              <div 
                class="nav-item" 
                v-for="(item, index) in recordDetail.practiceSubmitRecordList" 
                :key="item.id"
                :class="getNavItemClass(item)"
                @click="scrollToRecord(item.id)"
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
            v-for="(record, index) in recordDetail.practiceSubmitRecordList"
            :key="record.id"
            :data-record-id="record.id"
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
    <el-empty v-else-if="!loading" description="无法加载练习结果"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getPracticeRecordDetail } from '@/api/practice.js';
import PracticeResultQuestionDisplay from '@/components/practice/PracticeResultQuestionDisplay.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const recordId = ref(null);
const recordDetail = ref(null);

const rightPanelRef = ref(null);
const activeRecordId = ref(null);
let observer = null;

const goBack = () => router.back();

const fetchRecordDetail = async () => {
  loading.value = true;
  try {
    const res = await getPracticeRecordDetail(recordId.value);
    if (res.code === 200 && res.data) {
      recordDetail.value = res.data;
    } else {
      ElMessage.error(res.msg || "获取练习结果失败");
    }
  } catch(error) {
    ElMessage.error("获取练习结果失败");
  } finally {
    loading.value = false;
  }
};

const getNavItemClass = (item) => {
  if (item.id === activeRecordId.value) {
    return 'active';
  }
  if (item.userAnswer !== null && item.userAnswer !== '') {
    // 完全参考 ExamResult.vue 的逻辑：判断 isCorrect 是否严格等于 2
    return item.isCorrect === 2 ? 'correct' : 'incorrect';
  }
  return 'unanswered';
};

const scrollToRecord = (id) => {
  const targetElement = document.querySelector(`.question-wrapper[data-record-id='${id}']`);
  if (targetElement) {
    activeRecordId.value = id; 
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
                    activeRecordId.value = parseInt(entry.target.dataset.recordId);
                }
            });
        }, options);
        const questionElements = rightPanelRef.value.querySelectorAll('.question-wrapper');
        questionElements.forEach(el => observer.observe(el));
    }, 500);
};

onMounted(async () => {
  recordId.value = route.params.recordId;
  if(recordId.value) {
    await fetchRecordDetail();
    if (recordDetail.value) {
        initIntersectionObserver();
    }
  } else {
    ElMessage.error("无效的练习记录ID");
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
.page-wrapper {
  height: 100%;
  background-color: #f0f2f5;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.main-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}
.page-header-title { font-size: 18px; }
.result-content {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  flex-grow: 1;
  min-height: 0;
}
.left-panel { flex: 0 0 250px; overflow-y: auto; }
.right-panel {
  flex: 1;
  overflow-y: auto;
  background-color: #f9fafb;
  padding: 15px;
  border-radius: 4px;
}
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