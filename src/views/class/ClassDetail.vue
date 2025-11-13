<template>
  <div class="class-detail-page" v-loading="loading">
    <div v-if="classDetail" class="main-container">
      <div class="left-content">
        <el-page-header class="class-page-header" @back="goBack" content="班级详情" />
        <div class="banner">
          <h2>{{ classDetail.name }}</h2>
          <p>欢迎加入，预祝您学有所成！ 我是您的{{classDetail.creatorName}}，有问题请联系{{classDetail.phone}}，有问必答！</p>
          <el-tag :type="getClazzStatusType(classDetail.clazzStatus)" size="large" class="status-tag">{{ getClazzStatusText(classDetail.clazzStatus) }}</el-tag>
        </div>

        <div class="task-section">
          <h3><el-icon><Tickets /></el-icon> 学习任务</h3>

          <template v-for="course in classDetail.courseList" :key="course.id">
            <div v-if="course.status !== 0" class="task-card">
              <div class="task-icon course"><el-icon><Reading /></el-icon></div>
              <div class="task-info">
                <h4>{{ course.name }}</h4>
                <p>学习时间：{{ classDetail.startTime }} 至 {{ classDetail.endTime }}</p>
              </div>
              <div class="task-actions">
                <el-progress :percentage="course.courseStudySummary?.progress || 0" :stroke-width="6" class="task-progress" />
                <el-button type="primary" link @click="viewCourseDetail(course.id)">查看</el-button>
              </div>
            </div>
          </template>

          <template v-for="range in classDetail.shootingRangeList" :key="range.id">
            <div v-if="range.status !== 0" class="task-card">
              <div class="task-icon range"><el-icon><Aim /></el-icon></div>
              <div class="task-info">
                <h4>{{ range.name }}</h4>
                <p>比武时间：{{ range.participateDate === 1 && range.startTime && range.endTime ? `${range.startTime} 至 ${range.endTime}` : '不限时间' }}，比武时长{{ range.duration === -1 ? '不限时间' : `${range.duration}分钟` }}</p>
              </div>
              <div class="task-actions">
                <span class="task-status">
                  比武结果：
                  <template v-if="range.shootingRangeRecord">
                    <span v-if="range.shootingRangeRecord.status === 4">
                      <span :style="{ color: range.shootingRangeRecord.qualified === 1 ? '#67c23a' : '#f56c6c' }">
                        {{ range.shootingRangeRecord.score }}分 ({{ range.shootingRangeRecord.qualified === 1 ? '合格' : '不合格' }})
                      </span>
                    </span>
                    <span v-else-if="range.shootingRangeRecord.status === 0" style="color: #909399;">未完成</span>
                    <span v-else-if="range.shootingRangeRecord.status === 1" style="color: #409eff;">进行中</span>
                    <span v-else-if="range.shootingRangeRecord.status === 2" style="color: #409eff;">阅卷中</span>
                    <span v-else-if="range.shootingRangeRecord.status === 3" style="color: #f56c6c;">异常</span>
                    <span v-else style="color: #909399;">-</span>
                  </template>
                  <span v-else style="color: #909399;">未参加</span>
                </span>
                <el-button 
                  v-if="range.shootingRangeRecord && range.shootingRangeRecord.status === 4" 
                  type="primary" 
                  link
                  @click="viewRangeResult(range.shootingRangeRecord.id)"
                >
                  查看
                </el-button>
                <span v-else style="color: #909399;">-</span>
              </div>
            </div>
          </template>
          
          <template v-for="exam in classDetail.examList" :key="exam.id">
            <div v-if="exam.status !== 0" class="task-card">
               <div class="task-icon exam"><el-icon><DocumentChecked /></el-icon></div>
               <div class="task-info">
                  <h4>{{ exam.name }}</h4>
                  <p>考试时间：{{ exam.examDate === 1 && exam.startTime && exam.endTime ? `${exam.startTime} 至 ${exam.endTime}` : '不限时间' }}，考试时长{{ exam.duration === -1 ? '不限时间' : `${exam.duration}分钟` }}</p>
               </div>
               <div class="task-actions">
                  <span class="task-status">
                    考试结果：
                    <template v-if="exam.examRecord">
                      <span v-if="exam.examRecord.status === 4">
                        <span :style="{ color: exam.examRecord.qualified === 1 ? '#67c23a' : '#f56c6c' }">
                          {{ exam.examRecord.score }}分 ({{ exam.examRecord.qualified === 1 ? '合格' : '不合格' }})
                        </span>
                      </span>
                      <span v-else-if="exam.examRecord.status === 0" style="color: #909399;">未完成</span>
                      <span v-else-if="exam.examRecord.status === 1" style="color: #e6a23c;">待修改</span>
                      <span v-else-if="exam.examRecord.status === 2" style="color: #409eff;">阅卷中</span>
                      <span v-else-if="exam.examRecord.status === 3" style="color: #f56c6c;">修改异常</span>
                      <span v-else style="color: #909399;">-</span>
                    </template>
                    <span v-else style="color: #909399;">未参加</span>
                  </span>
                  <el-button 
                    v-if="exam.examRecord && exam.examRecord.status === 4" 
                    type="primary" 
                    link
                    @click="viewExamResult(exam.examRecord.examId)"
                  >
                    查看
                  </el-button>
                  <span v-else style="color: #909399;">-</span>
               </div>
            </div>
          </template>
        </div>
      </div>

      <div class="right-sidebar">
        <el-card>
          <template #header><strong>基本信息</strong></template>
          <div class="info-item"><span>班级名称</span><span>{{ classDetail.name }}</span></div>
          <div class="info-item"><span>学习时间</span><span>{{ classDetail.startTime }} 至 {{ classDetail.endTime }}</span></div>
          <div class="info-item">
            <span>毕业证书</span>
            <div>
              <div v-for="cert in classDetail.certificateList" :key="cert.id" class="certificate-item">
                <el-tag type="success" style="margin: 2px;">{{ cert.name }}</el-tag>
              </div>
              <span v-if="!classDetail.certificateList || classDetail.certificateList.length === 0" class="no-certificates">暂无证书</span>
            </div>
          </div>
          <div class="info-item"><span>班级人数</span><span>{{ classDetail.studentCount }}</span></div>
          <div class="info-item"><span>班主任</span><span>{{ classDetail.creatorName }}</span></div>
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
import { getClazzDetail } from '@/api/mypage.js';
import { Tickets, Reading, Aim, DocumentChecked } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const classDetail = ref(null);

onMounted(async () => {
  const classId = route.params.id;
  if (!classId) {
    ElMessage.error('无效的班级ID');
    loading.value = false;
    return;
  }
  try {
    const res = await getClazzDetail(classId);
    if (res.code === 200) {
      classDetail.value = res.data;
    } else {
      ElMessage.error(res.msg || '获取班级详情失败');
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

// 查看课程详情
const viewCourseDetail = (courseId) => {
  router.push({ name: 'ClassRoomDetails', params: { id: courseId } });
};

// 查看靶场结果
const viewRangeResult = (recordId) => {
  router.push({ name: 'ShootingRangeResult', params: { id: recordId } });
};

// 查看考试结果
const viewExamResult = (examId) => {
  router.push({ name: 'Student-ExamResult', params: { id: examId } });
};

// 获取班级状态文本
const getClazzStatusText = (status) => {
  const statusMap = {
    0: '未开始',
    1: '进行中',
    2: '已结束'
  };
  return statusMap[status] || '未知';
};

// 获取班级状态标签类型
const getClazzStatusType = (status) => {
  const typeMap = {
    0: 'info',      // 未开始 - 灰色
    1: 'success',   // 进行中 - 绿色
    2: 'warning'    // 已结束 - 橙色
  };
  return typeMap[status] || 'info';
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

/* 证书相关样式 */
.certificate-item {
  margin-bottom: 4px;
}
.no-certificates {
  color: #909399;
  font-size: 13px;
}

/* 返回按钮样式 */
.class-page-header {
  margin-bottom: 12px;
  background: transparent;
  padding: 8px 0;
}
.class-page-header :deep(.el-page-header__title) {
  font-size: 16px;
  color: #606266;
}
</style>