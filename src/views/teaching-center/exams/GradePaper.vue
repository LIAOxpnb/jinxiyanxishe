<template>
  <div class="page-wrapper" v-loading="loading">
    <div v-if="paperDetails" class="main-content">
      <div class="custom-header">
        <div class="header-left">
          <el-button link @click="goBack" class="back-button">
            <el-icon>
              <ArrowLeft />
            </el-icon>
            返回
          </el-button>
          <span class="page-header-title">
            试卷详情 - {{ paperDetails.exam?.name }} 
          </span>
        </div>
        <div class="header-actions">
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" @click="handleSubmitScores">提交评分</el-button>
        </div>
      </div>

      <div class="marking-content">
        <div class="left-panel">
          <el-descriptions title="试卷信息" :column="1" border>
            <el-descriptions-item label="已得分">{{ currentTotalScore }}</el-descriptions-item>
            <el-descriptions-item label="总得分">{{ currentTotalScore }}</el-descriptions-item>
            <el-descriptions-item label="试卷总分">{{ paperDetails.exam?.score }}</el-descriptions-item>
            <el-descriptions-item label="合格分">{{ paperDetails.exam?.qualified }}</el-descriptions-item>
          </el-descriptions>
          <div class="question-nav">
            <el-button-group>
              <el-button :type="activeFilter === 'all' ? 'primary' : 'default'"
                @click="activeFilter = 'all'">全部</el-button>
              <el-button :type="activeFilter === 'ungraded' ? 'primary' : 'default'"
                @click="activeFilter = 'ungraded'">未判分</el-button>
              <el-button :type="activeFilter === 'graded' ? 'primary' : 'default'"
                @click="activeFilter = 'graded'">已判分</el-button>
            </el-button-group>
            <div class="nav-grid">
              <div class="nav-item" v-for="(item, index) in paperDetails.examSubmitRecordList" :key="item.id" :class="{
                'correct': item.isCorrect === 2,
                'incorrect': item.isCorrect === 1,
                'current': currentQuestionId == item.id
              }" @click="scrollToQuestion('question-' + item.id)">
                <span class="nav-item-index">{{ index + 1 }}</span>
                <span class="nav-item-score">{{ item.score === null ? '-' : item.score }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <ExamQuestionCardForMarking v-for="record in filteredQuestionList" :key="record.id" :record="record"
            :index="record.originalIndex" :id="'question-' + record.id" />
          <el-empty v-if="filteredQuestionList.length === 0" description="该分类下暂无题目"></el-empty>
        </div>
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
import { ArrowLeft } from '@element-plus/icons-vue';
import { getGradePaperDetail, submitGradePaper } from '../../../api/teaching-center/Exams.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import ExamQuestionCardForMarking from '@/components/exam/ExamQuestionCardForMarking.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const submissionId = ref(null);
const paperDetails = ref(null);
const currentQuestionId = ref(null);

const activeFilter = ref('all');

const goBack = () => router.back();

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

// 将HTML内容中的图片路径转换为预览URL
const convertImagesToPreviewUrls = async (htmlContent) => {
  if (!htmlContent) return '';
  
  // 使用DOMParser解析HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  
  // 收集所有需要转换的图片
  const imagePromises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src) return;
    
    // 跳过base64图片
    if (src.startsWith('data:')) return;
    
    try {
      // 如果是完整的URL（MinIO临时URL），需要提取相对路径
      let relativePath = src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        // 从完整URL中提取路径部分
        // 例如: http://183.230.195.24:7028/joyas/20251104/u4436%282%29.png?X-Amr-... 
        // 需要提取出: /20251104/u4436(2).png (去掉bucket名称 joyas)
        const url = new URL(src);
        let pathname = decodeURIComponent(url.pathname); // 得到 /joyas/20251104/u4436(2).png
        
        // 去掉第一个路径段（bucket名称）
        // /joyas/20251104/u4436(2).png => /20251104/u4436(2).png
        const pathParts = pathname.split('/').filter(p => p); // ['joyas', '20251104', 'u4436(2).png']
        if (pathParts.length > 1) {
          relativePath = '/' + pathParts.slice(1).join('/'); // /20251104/u4436(2).png
        } else {
          relativePath = pathname;
        }
      }
      
      // 调用预览接口获取新的临时URL
      const previewUrl = await previewFile(relativePath);
      img.setAttribute('src', previewUrl);
    } catch (error) {
      console.error('预览图片失败:', src, error);
    }
  });
  
  // 等待所有图片路径转换完成
  await Promise.all(imagePromises);
  
  // 返回转换后的HTML
  return doc.body.innerHTML;
};

const fetchPaperDetails = async () => {
  loading.value = true;
  try {
    const res = await getGradePaperDetail(submissionId.value);
    if (res.code === 200) {
      if (res.data && res.data.examSubmitRecordList) {
        // 转换题目列表中的图片预览URL
        const processedRecords = await Promise.all(
          res.data.examSubmitRecordList.map(async (item, index) => {
            item.originalIndex = index;
            // 转换解析内容中的图片
            if (item.question && item.question.analysis) {
              item.question.analysis = await convertImagesToPreviewUrls(item.question.analysis);
            }
            return item;
          })
        );
        res.data.examSubmitRecordList = processedRecords;
      }
      paperDetails.value = res.data;
    } else {
      ElMessage.error(res.msg || "获取详情失败");
    }
  } catch (error) {
    ElMessage.error("获取详情失败");
  } finally {
    loading.value = false;
  }
};

const handleSubmitScores = async () => {
  if (!paperDetails.value || !paperDetails.value.examSubmitRecordList) {
    ElMessage.warning("没有可提交的评分数据");
    return;
  }

  // 过滤出真正需要提交评分的题目（分数不为null的）
  const payload = paperDetails.value.examSubmitRecordList
    .filter(item => item.score !== null) // 只提交已打分的
    .map(item => ({
      id: item.id,
      score: item.score
    }));

  if (payload.length === 0) {
    ElMessage.warning("没有已评分的题目可提交");
    return;
  }

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

// 计算当前总得分
const currentTotalScore = computed(() => {
  const list = paperDetails.value?.examSubmitRecordList;
  if (!list) return 0;
  
  return list.reduce((total, item) => {
    // 只计算已经有分数的题目
    if (item.score !== null && item.score !== undefined) {
      return total + (Number(item.score) || 0);
    }
    return total;
  }, 0);
});

const filteredQuestionList = computed(() => {
  const list = paperDetails.value?.examSubmitRecordList;
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
/* 样式部分保持不变 */
.page-wrapper {
  padding: 20px;
  background-color: #f0f2f5;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
}

.main-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
  height: calc(100vh - 40px);
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

.page-header-title {
  font-size: 18px;
  font-weight: bold;
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

.nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 10px;
  overflow-y: auto;
  max-height: calc(100vh - 320px);
  padding-right: 5px;
}

.nav-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  padding: 4px 0;
  cursor: pointer;
  transition: all 0.2s;
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

.nav-item-index {
  font-size: 14px;
}

.nav-item-score {
  display: block;
  font-size: 12px;
  color: #909399;
}
</style>