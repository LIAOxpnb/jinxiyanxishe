<template>
  <div class="class-detail-page" v-loading="loading">
    <div v-if="classDetail" class="main-container">
      <div class="left-content">
        <el-page-header class="class-page-header" @back="goBack" content="班级详情" />
        <div class="banner">
          <h2>{{ classDetail.name }}</h2>
          <p>欢迎加入，预祝您学有所成！ 我是您的班主任，有问题请联系13800138000，有问必答！</p>
          <el-tag type="success" size="large" class="status-tag">进行中</el-tag>
        </div>

        <div class="task-section">
          <h3><el-icon><Tickets /></el-icon> 学习任务</h3>

          <div v-for="course in classDetail.courseList" :key="course.id" class="task-card">
            <div class="task-icon course"><el-icon><Reading /></el-icon></div>
            <div class="task-info">
              <h4>{{ course.name }}</h4>
              <p>学习时间：{{ classDetail.startTime }} 至 {{ classDetail.endTime }}</p>
            </div>
            <div class="task-actions">
              <el-progress :percentage="courseProgressMap[course.id] || 0" :stroke-width="6" class="task-progress" />
              <el-button type="primary" link>查看</el-button>
            </div>
          </div>

          <div v-for="range in classDetail.shootingRangeList" :key="range.id" class="task-card">
            <div class="task-icon range"><el-icon><Aim /></el-icon></div>
            <div class="task-info">
              <h4>{{ range.name }}</h4>
              <p>比武时间：{{ range.startTime }} 至 {{ range.endTime }}，比武时长{{ range.duration === -1 ? '不限' : range.duration }}分钟</p>
            </div>
            <div class="task-actions">
              <span class="task-status">比武结果：未开始</span>
              <el-button type="primary" link>查看</el-button>
            </div>
          </div>
          
          <div v-for="exam in classDetail.examList" :key="exam.id" class="task-card">
             <div class="task-icon exam"><el-icon><DocumentChecked /></el-icon></div>
             <div class="task-info">
                <h4>{{ exam.name }}</h4>
                <p>考试时间：{{ exam.startTime }} 至 {{ exam.endTime }}，考试时长{{ exam.duration }}分钟</p>
             </div>
             <div class="task-actions">
                <span class="task-status">考试结果：未开始</span>
                <el-button type="primary" link>查看</el-button>
             </div>
          </div>
        </div>
      </div>

      <div class="right-sidebar">
        <el-card>
          <template #header><strong>基本信息</strong></template>
          <div class="info-item"><span>班级名称</span><span>{{ classDetail.name }}</span></div>
          <div class="info-item"><span>学习时间</span><span>{{ classDetail.startTime }} 至 {{ classDetail.endTime }}</span></div>
          <div class="info-item"><span>毕业证书</span><span>证书名称</span></div>
          <div class="info-item"><span>班级人数</span><span>{{ classDetail.studentCount }}</span></div>
          <div class="info-item"><span>班主任</span><span>用户姓名</span></div>
          <div class="info-item"><span>创建时间</span><span>{{ classDetail.createTime }}</span></div>
        </el-card>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="无法加载班级详情"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getClazzDetail, getLearningProgress } from '@/api/mypage.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import { Tickets, Reading, Aim, DocumentChecked } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const classDetail = ref(null);
const courseProgressMap = ref({}); // 存储课程ID到进度的映射

onMounted(async () => {
  const classId = route.params.id;
  if (!classId) {
    ElMessage.error('无效的班级ID');
    loading.value = false;
    return;
  }
  try {
    // 并行获取班级详情和学习进度
    const [clazzRes, progressRes] = await Promise.all([
      getClazzDetail(classId),
      getLearningProgress({ page: 1, size: 100 }) // 获取足够多的记录
    ]);
    
    if (clazzRes.code === 200) {
      classDetail.value = clazzRes.data;
    } else {
      ElMessage.error(clazzRes.msg || '获取班级详情失败');
    }
    
    // 处理学习进度数据
    if (progressRes.code === 200 && progressRes.data.records) {
      const progressItems = progressRes.data.records;
      // 创建课程ID到进度的映射
      progressItems.forEach(item => {
        if (item.course?.id) {
          courseProgressMap.value[item.course.id] = item.progress || 0;
        }
      });
    }
  } catch (error) {
    ElMessage.error('网络错误，获取班级详情失败');
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.class-detail-page { background-color: #f5f7fa; padding: 20px; }
.main-container { display: flex; gap: 20px; }
.left-content { flex: 1; }
.right-sidebar { width: 320px; flex-shrink: 0; }
.banner { background: linear-gradient(135deg, #53a8ff, #409eff); color: white; padding: 24px; border-radius: 8px; position: relative; }
.banner h2 { margin: 0 0 10px 0; font-size: 24px; }
.banner p { margin: 0; font-size: 14px; opacity: 0.9; }
.status-tag { position: absolute; top: 24px; right: 24px; }
.task-section { margin-top: 20px; }
.task-section h3 { display: flex; align-items: center; gap: 8px; font-size: 18px; margin-bottom: 20px;}
.task-card { display: flex; align-items: center; background: #fff; padding: 20px; border-radius: 4px; margin-bottom: 16px; }
.task-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; margin-right: 16px; }
.task-icon.course { background-color: #409eff; }
.task-icon.range { background-color: #f56c6c; }
.task-icon.exam { background-color: #e6a23c; }
.task-info { flex: 1; }
.task-info h4 { margin: 0 0 8px 0; font-size: 16px; }
.task-info p { margin: 0; font-size: 13px; color: #909399; }
.task-actions { text-align: right; width: 150px; }
.task-progress { margin-bottom: 8px; }
.task-status { font-size: 13px; color: #909399; }
.info-item { display: flex; justify-content: space-between; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #f0f2f5; }
.info-item:last-child { border-bottom: none; }
.info-item span:first-child { color: #606266; }

/* 返回按钮样式 */
.class-page-header {
  margin-bottom: 12px;
  background: transparent;
  padding: 8px 0;
}
.class-page-header :deep .el-page-header__title {
  font-size: 16px;
  color: #606266;
}
</style>