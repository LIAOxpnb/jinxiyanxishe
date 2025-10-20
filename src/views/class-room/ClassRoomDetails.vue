<template>
  <div class="details-page-container">
    <el-container>
      <el-main class="main-column">
        <div class="video-player-wrapper">
          <!-- 视频播放器 -->
          <div class="video-player" v-if="currentCourseware.type === 'video' && currentCourseware.url">
            <video
              ref="videoPlayerRef"
              class="video-js vjs-big-play-centered"
              controls
              preload="auto"
            >
              <source :src="currentCourseware.url" :type="currentCourseware.mimeType" />
              您的浏览器不支持视频播放
            </video>
          </div>
          
          <!-- PDF 预览 -->
          <div class="courseware-viewer" v-else-if="currentCourseware.type === 'pdf' && currentCourseware.url">
            <iframe :src="currentCourseware.url" class="pdf-viewer" frameborder="0"></iframe>
          </div>
          
          <!-- 图片预览 -->
          <div class="courseware-viewer" v-else-if="currentCourseware.type === 'image' && currentCourseware.url">
            <img :src="currentCourseware.url" class="image-viewer" alt="课件图片" />
          </div>
          
          <!-- 文档类型（需要下载） -->
          <div class="courseware-viewer document-viewer" v-else-if="currentCourseware.type === 'document' && currentCourseware.url">
            <div class="document-info">
              <el-icon class="document-icon" :size="80"><Document /></el-icon>
              <h3>{{ currentSection?.courseware?.fileName || '课件文档' }}</h3>
              <p class="document-type">{{ getFileExtension(currentSection?.courseware?.fileType) }} 文档</p>
              <el-button type="primary" size="large" @click="downloadCourseware">
                <el-icon><Download /></el-icon>
                下载查看
              </el-button>
            </div>
          </div>
          
          <!-- 其他类型或空状态 -->
          <div v-else class="video-player">
            <el-icon class="play-icon"><VideoPlay /></el-icon>
            <p class="video-placeholder-text">请从右侧课程目录选择要学习的小节</p>
          </div>
          
          <div class="progress-bar">
            <el-icon><InfoFilled /></el-icon>
            <span>已自动为您记录课程学习进度，无需手动操作</span>
          </div>
        </div>

        <div class="course-header">
          <div class="title-line">
            <span class="title-tag">课程</span>
            <h1 class="course-title">{{ courseDetail.name }}</h1>
            <el-button link class="like-btn" @click="toggleFavorite">
              <el-icon><Star v-if="!courseDetail.isCollected" /><StarFilled v-else /></el-icon>
              {{ courseDetail.collectCount || 0 }}
            </el-button>
          </div>
          <p class="course-subtitle">
            本分组 / {{ courseDetail.createTime }}
          </p>
          <p class="course-description">
            {{ courseDetail.summary }}
          </p>
          
          <div v-if="currentSection" class="current-section-info">
            <el-tag type="success" effect="dark">正在学习</el-tag>
            <span class="section-name">{{ currentSection.name }}</span>
            <span v-if="currentSection.courseware" class="section-duration">
              时长: {{ formatDuration(currentSection.courseware.duration) }}
            </span>
          </div>
        </div>
        
        <el-tabs v-model="activeTab" class="details-tabs">
          <el-tab-pane label="课程介绍" name="intro">
            <div class="tab-content">
              <h2 class="section-title">讲师介绍</h2>
              <div class="instructor-info">
                <el-avatar :size="80" :src="courseDetail.instructorAvatar" />
                <div class="instructor-details">
                  <h3>{{ courseDetail.instructorName || '讲师姓名' }}</h3>
                  <p>{{ courseDetail.instructorTitle || '知名学院教授' }}</p>
                </div>
              </div>
              <p class="instructor-bio">{{ courseDetail.instructorBio }}</p>

              <h2 class="section-title">课程详情</h2>
              <div class="course-full-details" v-html="courseDetail.intro"></div>
            </div>
          </el-tab-pane>
          
          <!-- 【核心修改】 -->
          <el-tab-pane label="课程练习" name="syllabus">
            <div class="tab-content" v-loading="practiceLoading">
              <el-table v-if="practiceList.length > 0" :data="practiceList" style="width: 100%">
                <el-table-column prop="name" label="练习试卷的名称" />
                <el-table-column prop="questionCount" label="题目数量" width="120" align="center" />
                <el-table-column label="操作" width="120" align="center">
                  <template #default="{ row }">
                    <el-button type="primary" link>开始练习</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="当前小节暂无关联练习" />
            </div>
          </el-tab-pane>

          <el-tab-pane label="课程资料" name="materials">
            <div class="tab-content">
              <div v-if="currentSection && currentSection.courseSectionMaterialList && currentSection.courseSectionMaterialList.length > 0">
                <h3>当前小节资料</h3>
                <el-table :data="currentSection.courseSectionMaterialList" style="width: 100%">
                  <el-table-column prop="fileName" label="资料名称" />
                  <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                      <el-button link type="primary" @click="downloadMaterial(row)">下载</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-else description="暂无课程资料" />
            </div>
          </el-tab-pane>
        </el-tabs>

      </el-main>

      <el-aside width="300px" class="sidebar-column">
        <el-card class="sidebar-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>课程目录</span>
            </div>
          </template>
          <el-menu 
            class="syllabus-menu" 
            :default-active="activeMenuIndex"
            v-loading="loading"
          >
            <el-sub-menu 
              v-for="chapter in courseDetail.courseChapterList" 
              :key="chapter.id" 
              :index="String(chapter.id)"
            >
              <template #title>
                <span>{{ chapter.name }}</span>
              </template>
              <el-menu-item 
                v-for="section in chapter.courseSectionList" 
                :key="section.id" 
                :index="`${chapter.id}-${section.id}`"
                @click="handleSectionClick(section)"
                :class="{ 'is-active-section': currentSection && currentSection.id === section.id }"
              >
                <div class="menu-item-content">
                  <el-icon v-if="currentSection && currentSection.id === section.id" class="playing-icon">
                    <VideoPlay />
                  </el-icon>
                  <span>{{ section.name }}</span>
                </div>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
          
          <el-empty 
            v-if="!loading && (!courseDetail.courseChapterList || courseDetail.courseChapterList.length === 0)" 
            description="暂无课程目录"
            :image-size="60"
          />
        </el-card>

        <el-card class="sidebar-card" shadow="never">
           <template #header>
            <div class="card-header">
              <span>相关推荐</span>
            </div>
          </template>
          <div class="recommend-list">
            <div v-for="item in recommendedCourses" :key="item.id" class="recommend-item">
              <img :src="item.cover" class="recommend-cover" alt="课程封面" />
              <div class="recommend-info">
                <p class="recommend-title">{{ item.title }}</p>
                <span class="recommend-desc">{{ item.desc }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-aside>
    </el-container>
    
    <div class="details-footer">
      <span>重庆市公安局经侦总队</span>
      <span>产品说明文档</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { VideoPlay, InfoFilled, Star, StarFilled, Document, Download } from '@element-plus/icons-vue';
import { 
  getStudentCourseDetail, 
  toggleCourseCollect, 
  getStudentSectionDetail,
  submitSection,
  sendHeartbeat 
} from '@/api/classroom.js';
// 【已添加】引入获取练习列表的API
import { getPracticeList } from '@/api/teaching-center/PracticeManagement';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { previewFile } from '@/api/common/PreviewFile';

const route = useRoute();
const courseId = ref(null);
const loading = ref(true);
const activeTab = ref('intro');
const currentSection = ref(null);
const videoPlayerRef = ref(null);
const activeMenuIndex = ref('');
const player = shallowRef(null);
let heartbeatTimer = null;
let lastHeartbeatTime = 0;
let totalWatchTime = 0;

// 【已添加】练习列表相关状态
const practiceList = ref([]);
const practiceLoading = ref(false);

const currentCourseware = reactive({
  type: '',
  url: '',
  mimeType: '',
});

const courseDetail = reactive({
  id: null,
  name: '加载中...',
  createTime: '加载中...',
  summary: '加载中...',
  intro: '<p>加载中...</p>',
  collectCount: 0,
  isCollected: false,
  instructorName: '加载中...',
  instructorTitle: '',
  instructorAvatar: '',
  instructorBio: '加载中...',
  courseChapterList: [],
});

const recommendedCourses = ref([
  { id: 1, title: '课程标题课程标题课程标题', desc: '课程介绍课程介绍课程介绍', cover: '' },
  { id: 2, title: 'Excel之数据透视表与高级数据分析', desc: '课程介绍课程介绍课程介绍', cover: '' },
  { id: 3, title: '用 DeepSeek 帮数据讲故事', desc: '课程介绍课程介绍课程介绍', cover: '' },
]);

// 【已添加】获取练习列表的函数
const fetchPracticesForSection = async (sectionId) => {
  if (!sectionId) {
    practiceList.value = [];
    return;
  }
  practiceLoading.value = true;
  try {
    // 假设我们一次性获取所有练习，不分页
    const res = await getPracticeList({ sectionId: sectionId, page: 1, size: 100 });
    if (res.code === 200) {
      practiceList.value = res.data.records || [];
    } else {
      ElMessage.error(res.msg || '获取练习列表失败');
      practiceList.value = [];
    }
  } catch (error) {
    console.error("获取练习列表异常:", error);
    practiceList.value = [];
  } finally {
    practiceLoading.value = false;
  }
};

// 【已添加】监听当前小节变化，自动加载练习
watch(currentSection, (newSection) => {
  fetchPracticesForSection(newSection?.id);
});


const downloadMaterial = async (material) => {
  try {
    ElMessage.info('正在获取下载链接...');
    const downloadUrl = await previewFile(material.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = material.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("下载资料失败:", error);
    ElMessage.error("获取下载链接失败，请重试");
  }
};


const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getFileExtension = (fileType) => {
  if (!fileType) return '未知';
  return fileType.toUpperCase();
};

const getCoursewareType = (fileType) => {
  if (!fileType) return 'other';
  const type = fileType.toLowerCase();
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(type)) return 'video';
  if (type === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type)) return 'image';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'].includes(type)) return 'document';
  return 'other';
};

const getMimeType = (fileType) => {
  const mimeTypes = {
    'mp4': 'video/mp4', 'webm': 'video/webm', 'pdf': 'application/pdf',
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
  };
  return mimeTypes[fileType?.toLowerCase()] || 'application/octet-stream';
};

const downloadCourseware = () => {
  if (currentCourseware.url) {
    const link = document.createElement('a');
    link.href = currentCourseware.url;
    link.download = currentSection.value?.courseware?.fileName || 'courseware';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('开始下载');
  }
};

const initVideoPlayer = () => {
  if (player.value) {
    player.value.dispose();
    player.value = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  nextTick(() => {
    if (videoPlayerRef.value && currentCourseware.type === 'video') {
      player.value = videojs(videoPlayerRef.value, {
        controls: true, autoplay: false, preload: 'auto', fluid: true,
        playbackRates: [0.5, 1, 1.5, 2], language: 'zh-CN',
        sources: [{ src: currentCourseware.url, type: currentCourseware.mimeType }],
      });
      player.value.on('play', () => {
        lastHeartbeatTime = Date.now();
        startHeartbeat();
      });
      player.value.on('pause', () => stopHeartbeat());
      player.value.on('ended', async () => {
        stopHeartbeat();
        if (currentSection.value) {
          await submitSectionRecord();
          ElMessage.success('恭喜你完成本小节学习！');
        }
      });
    }
  });
};

const startHeartbeat = () => {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(async () => {
    if (!player.value || player.value.paused()) {
      stopHeartbeat();
      return;
    }
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastHeartbeatTime) / 1000);
    if (elapsedSeconds > 0 && currentSection.value) {
      try {
        await sendHeartbeat({
          sectionId: currentSection.value.id,
          watchSecond: Math.min(elapsedSeconds, 30),
          playbackRate: player.value.playbackRate()
        });
        totalWatchTime += elapsedSeconds;
        lastHeartbeatTime = now;
      } catch (error) { console.error('心跳上报失败:', error); }
    }
  }, 15000);
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

const submitSectionRecord = async () => {
  if (!currentSection.value) return;
  try {
    await submitSection({ sectionId: currentSection.value.id });
  } catch (error) { console.error('提交小节学习记录失败:', error); }
};

const fetchCourseDetail = async () => {
  loading.value = true;
  try {
    const res = await getStudentCourseDetail(courseId.value);
    if (res.code === 200 && res.data) {
      Object.assign(courseDetail, res.data); 
      courseDetail.courseChapterList = res.data.courseChapterList || [];
      courseDetail.instructorName = courseDetail.instructorName || '张教授';
      courseDetail.instructorTitle = '知名学院教授';
      courseDetail.instructorBio = courseDetail.instructorBio || '讲师简介讲师简介讲师简介。';
    } else {
      ElMessage.error(res.msg || '获取课程详情失败');
    }
  } catch (error) {
    console.error("获取课程详情异常:", error);
    ElMessage.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const toggleFavorite = async () => {
  try {
    const newStatus = !courseDetail.isCollected;
    const res = await toggleCourseCollect({ courseId: courseId.value, collect: newStatus });
    if (res.code === 200) {
      courseDetail.isCollected = newStatus;
      courseDetail.collectCount += newStatus ? 1 : -1;
      ElMessage.success(newStatus ? '收藏成功' : '取消收藏成功');
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch(e) { ElMessage.error('网络错误，请稍后重试'); }
};

const handleSectionClick = async (section) => {
  stopHeartbeat();
  totalWatchTime = 0;
  currentCourseware.type = '';
  currentCourseware.url = '';
  currentCourseware.mimeType = '';
  activeMenuIndex.value = `${section.chapterId}-${section.id}`;
  
  try {
    loading.value = true;
    const res = await getStudentSectionDetail(section.id);
    if (res.code === 200 && res.data) {
      currentSection.value = res.data;
      if (res.data.courseware && res.data.courseware.fileName) {
        try {
          const fileType = res.data.courseware.fileType;
          const coursewareType = getCoursewareType(fileType);
          const coursewareUrl = await previewFile(res.data.courseware.fileName);
          
          currentCourseware.type = coursewareType;
          currentCourseware.url = coursewareUrl;
          currentCourseware.mimeType = getMimeType(fileType);
          
          if (coursewareType === 'video') {
            await nextTick();
            initVideoPlayer();
          }
        } catch (error) { ElMessage.error('课件加载失败'); }
      } else {
        ElMessage.warning('该小节暂无课件内容');
      }
    } else {
      ElMessage.error(res.msg || '获取小节详情失败');
    }
  } catch (error) {
    ElMessage.error('加载失败，请重试');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  courseId.value = route.params.id;
  if (courseId.value) {
    fetchCourseDetail();
  } else {
    ElMessage.error('未找到课程ID');
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  stopHeartbeat();
  if (player.value) {
    player.value.dispose();
    player.value = null;
  }
});
</script>

<style scoped>
.details-page-container {
  max-width: 1400px;
  margin: 20px auto;
  background-color: #fff;
  padding: 24px;
}
.main-column {
  padding-right: 24px;
}
.sidebar-column {
  border-left: 1px solid #e4e7ed;
  padding-left: 24px;
}
.video-player-wrapper {
  margin-bottom: 24px;
}
.video-player {
  width: 100%;
  height: 650px;
  background-color: #000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.video-player .video-js {
  width: 100%;
  height: 100%;
}
.courseware-viewer {
  width: 100%;
  height: 650px;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}
.image-viewer {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.document-viewer {
  background-color: #fff;
}
.document-info {
  text-align: center;
  padding: 40px;
}
.document-icon {
  color: #409eff;
  margin-bottom: 20px;
}
.document-info h3 {
  font-size: 18px;
  color: #303133;
  margin: 16px 0 8px 0;
}
.document-type {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
}
.play-icon {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}
.video-placeholder-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-top: 16px;
}
.progress-bar {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fef0f0;
  border-radius: 4px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.course-header {
  margin-bottom: 24px;
}
.title-line {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-tag {
  background-color: #fdf6ec;
  color: #e6a23c;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}
.course-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
}
.like-btn {
  font-size: 16px;
  color: #909399;
}
.like-btn .el-icon {
  color: #e6a23c;
}
.course-subtitle, .course-description {
  color: #606266;
  font-size: 14px;
  margin: 8px 0 0 0;
}
.current-section-info {
  margin-top: 16px;
  padding: 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-name {
  font-weight: 600;
  color: #303133;
}
.section-duration {
  color: #909399;
  font-size: 14px;
}
.details-tabs {
  margin-top: 20px;
}
.tab-content {
  padding: 16px 0;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  padding-left: 12px;
  border-left: 4px solid #409eff;
  margin-bottom: 20px;
}
.instructor-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}
.instructor-details h3 { margin: 0 0 8px 0; font-size: 16px; }
.instructor-details p { margin: 0; color: #909399; font-size: 14px; }
.instructor-bio, .course-full-details {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}
.sidebar-card {
  border: none;
  margin-bottom: 20px;
}
.sidebar-card .card-header {
  font-weight: 600;
  font-size: 16px;
}
.syllabus-menu {
  border-right: none;
}
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.playing-icon {
  color: #67c23a;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.is-active-section {
  background-color: #f0f9ff !important;
}
.recommend-list .recommend-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  cursor: pointer;
}
.recommend-cover {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background-color: #f5f7fa;
}
.recommend-info .recommend-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
.recommend-info .recommend-desc {
  font-size: 12px;
  color: #909399;
}
.details-footer {
  margin-top: 40px;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
}
.details-footer span {
  margin: 0 10px;
}
.course-full-details :deep(p) {
  margin-bottom: 1em;
}
.course-full-details :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
</style>