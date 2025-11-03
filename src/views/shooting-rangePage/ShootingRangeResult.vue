<template>
  <div class="page-wrapper" v-loading="loading">
    <div v-if="recordDetail" class="main-content">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">
            靶场结果 - {{ recordDetail.name }}
          </span>
        </template>
      </el-page-header>

      <div class="result-content">
        <div class="result-info">
          <el-descriptions title="靶场成绩" :column="2" border>
            <el-descriptions-item label="靶场名称">{{ recordDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="参加人员">{{ recordDetail.userName }}</el-descriptions-item>
            <el-descriptions-item label="最终得分">
              <span style="color: #409eff; font-weight: bold; font-size: 16px;">{{ recordDetail.score }}分</span>
            </el-descriptions-item>
            <el-descriptions-item label="结果">
              <el-tag :type="recordDetail.qualified === 1 ? 'success' : 'danger'">
                {{ recordDetail.qualified === 1 ? '合格' : '不合格' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="排名">
              第 {{ recordDetail.rank }} / {{ recordDetail.totalCount }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ recordDetail.createTime }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="question-section" v-if="recordDetail.shootingRangeSubmitRecordList && recordDetail.shootingRangeSubmitRecordList.length > 0">
          <h3>答题详情</h3>
          <div class="question-nav">
            <div class="nav-grid">
              <div 
                class="nav-item" 
                v-for="(item, index) in recordDetail.shootingRangeSubmitRecordList" 
                :key="item.id"
                :class="getNavItemClass(item)"
                @click="scrollToRecord(item.id)"
              >
                {{ index + 1 }}
              </div>
            </div>
            <div class="nav-legend">
              <div><span class="legend-box correct"></span>正确</div>
              <div><span class="legend-box incorrect"></span>错误</div>
              <div><span class="legend-box unanswered"></span>未答</div>
            </div>
          </div>

          <div class="questions-wrapper" ref="rightPanelRef">
            <div
              v-for="(record, index) in recordDetail.shootingRangeSubmitRecordList"
              :key="record.id"
              :data-record-id="record.id"
              class="question-wrapper"
            >
              <TakeRangeQuestionCard
                :record="record"
                :index="index"
                :readonly="true"
              />
            </div>
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
import { getShootingRangeResult } from '@/api/shooting-range.js';
import TakeRangeQuestionCard from '@/components/range/TakeRangeQuestionCard.vue';

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
    const res = await getShootingRangeResult(recordId.value);
    if (res.code === 200 && res.data) {
      recordDetail.value = res.data;
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
  if (item.id === activeRecordId.value) {
    return 'active';
  }
  if (item.isCorrect === 1) {
    return 'correct';
  } else if (item.isCorrect === 0) {
    return 'incorrect';
  } else {
    return 'unanswered';
  }
};

const scrollToRecord = (recordId) => {
  if (!rightPanelRef.value) return;
  const element = rightPanelRef.value.querySelector(`[data-record-id="${recordId}"]`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

onMounted(() => {
  recordId.value = route.params.id;
  fetchRecordDetail();

  // 使用 Intersection Observer 来跟踪当前可见的题目
  if (rightPanelRef.value) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeRecordId.value = entry.target.dataset.recordId;
        }
      });
    }, { threshold: 0.5 });

    const questions = rightPanelRef.value.querySelectorAll('.question-wrapper');
    questions.forEach((q) => observer.observe(q));
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
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 50px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.result-content {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  margin-top: 20px;
}

.result-info {
  margin-bottom: 40px;
}

.question-section {
  margin-top: 30px;
}

.question-section h3 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.question-nav {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
  margin-bottom: 15px;
}

.nav-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background-color: #f0f0f0;
  color: #666;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: #e0e0e0;
}

.nav-item.active {
  background-color: #409eff;
  color: white;
}

.nav-item.correct {
  background-color: #67c23a;
  color: white;
}

.nav-item.incorrect {
  background-color: #f56c6c;
  color: white;
}

.nav-item.unanswered {
  background-color: #e4e4e4;
  color: #999;
}

.nav-legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.nav-legend > div {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 3px;
}

.legend-box.correct {
  background-color: #67c23a;
}

.legend-box.incorrect {
  background-color: #f56c6c;
}

.legend-box.unanswered {
  background-color: #e4e4e4;
}

.questions-wrapper {
  margin-top: 20px;
}

.question-wrapper {
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #eee;
}

.question-wrapper:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>
