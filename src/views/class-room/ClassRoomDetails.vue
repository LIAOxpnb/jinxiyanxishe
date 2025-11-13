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
              preload="metadata"
            >
              <source :src="currentCourseware.url" :type="currentCourseware.mimeType" />
              您的浏览器不支持视频播放
            </video>
          </div>
          
          <!-- 音频播放器 -->
          <div class="audio-player" v-else-if="currentCourseware.type === 'audio' && currentCourseware.url">
            <div class="audio-background">
              <div class="audio-visual">
                <div class="audio-wave"></div>
                <div class="audio-wave"></div>
                <div class="audio-wave"></div>
                <div class="audio-wave"></div>
                <div class="audio-wave"></div>
              </div>
              <div class="audio-info">
                <el-icon class="audio-icon" :size="60"><Headset /></el-icon>
                <h3 class="audio-title">{{ currentSection?.name || '音频课件' }}</h3>
                <p class="audio-subtitle">正在播放音频课程</p>
              </div>
            </div>
            <audio
              ref="audioPlayerRef"
              :src="currentCourseware.url"
              controls
            >
              您的浏览器不支持音频播放
            </audio>
          </div>

          <!-- PDF 预览 -->
          <div class="courseware-viewer pdf-container" v-else-if="currentCourseware.type === 'pdf' && currentCourseware.url">
            <el-button 
              class="fullscreen-btn" 
              type="primary" 
              :icon="FullScreen"
              circle
              @click="toggleFullscreen"
              :title="isFullscreen ? '退出全屏' : '全屏查看'"
            >
            </el-button>
            <iframe :src="currentCourseware.url" class="pdf-viewer" frameborder="0"></iframe>
          </div>
          
          <!-- 图片预览 -->
          <div class="courseware-viewer" v-else-if="currentCourseware.type === 'image' && currentCourseware.url">
            <img :src="currentCourseware.url" class="image-viewer" alt="课件图片" />
          </div>
          
          <!-- Word 文档预览 -->
 <!-- 原代码：整个 Word 文档预览的 div -->
 <!-- 替换为： -->
 <div class="courseware-viewer office-viewer word-viewer" v-else-if="currentCourseware.type === 'word' && currentCourseware.arrayBuffer">
   <div v-if="wordLoading" class="loading-overlay">
     <el-icon class="is-loading" :size="40"><Loading /></el-icon>
     <p>正在加载 Word 文档...</p>
     <p v-if="documentSize" class="size-info">文件大小: {{ documentSize }}</p>
   </div>
  <VueOfficeDocx 
    v-if="!wordError"
    :src="currentCourseware.arrayBuffer"
    style="height: 650px; width: 100%;"
    @rendered="handleDocxRendered"
    @error="handleDocxError"
  />
  <div v-else class="document-error">
    <el-icon class="error-icon" :size="80"><WarningFilled /></el-icon>
    <h3>Word 文档加载失败</h3>
    <p class="error-message">{{ wordError }}</p>
    <el-button type="primary" @click="downloadCourseware">
      <el-icon><Download /></el-icon>
      下载文档查看
    </el-button>
  </div>
</div>
          
 <!-- 原代码：整个 PPT 文档预览的 div -->
 <!-- 替换为： -->
 <div class="courseware-viewer office-viewer ppt-viewer" v-else-if="currentCourseware.type === 'ppt' && currentCourseware.arrayBuffer">
   <div v-if="pptLoading" class="loading-overlay">
     <el-icon class="is-loading" :size="40"><Loading /></el-icon>
     <p>正在加载 PPT 文档...</p>
     <p v-if="documentSize" class="size-info">文件大小: {{ documentSize }}</p>
     <p class="size-info" style="color: #909399; font-size: 12px;">大文件加载可能需要较长时间，请耐心等待...</p>
   </div>
  <VueOfficePptx 
    v-if="!pptError"
    :src="currentCourseware.arrayBuffer"
    style="height: 650px; width: 100%;"
    @rendered="handlePptxRendered"
    @error="handlePptxError"
  />
  <div v-else class="document-error">
    <el-icon class="error-icon" :size="80"><WarningFilled /></el-icon>
    <h3>PPT 文档加载失败</h3>
    <p class="error-message">{{ pptError }}</p>
    <el-button type="primary" @click="downloadCourseware">
      <el-icon><Download /></el-icon>
      下载文档查看
    </el-button>
  </div>
</div>
          
          <!-- Word/PPT文档过大时显示下载提示 -->
          <div class="courseware-viewer document-viewer" v-else-if="(currentCourseware.type === 'word' || currentCourseware.type === 'ppt') && !currentCourseware.arrayBuffer && (wordError || pptError)">
            <div class="document-info">
              <el-icon class="document-icon" :size="80"><Document /></el-icon>
              <h3>{{ currentSection?.name || '课件文档' }}</h3>              <p class="document-type">{{ getFileExtension(currentSection?.courseware?.fileType) }} 文档</p>
              <p v-if="documentSize" class="size-info">文件大小: {{ documentSize }}</p>
              <p class="error-message">{{ wordError || pptError }}</p>
              <el-button type="primary" size="large" @click="downloadCourseware">
                <el-icon><Download /></el-icon>
                下载查看
              </el-button>
            </div>
          </div>
          
          <!-- Excel 和其他文档类型（需要下载） -->
          <div class="courseware-viewer document-viewer" v-else-if="currentCourseware.type === 'document' && currentCourseware.url">
            <div class="document-info">
              <el-icon class="document-icon" :size="80"><Document /></el-icon>
              <h3>{{ currentSection?.name || '课件文档' }}</h3>              <p class="document-type">{{ getFileExtension(currentSection?.courseware?.fileType) }} 文档</p>
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
          
          <!-- 调试信息 (开发时使用) -->

        </div>

        <div class="course-header">
          <div class="title-line">
            <span class="title-tag">课程</span>
            <el-tag v-if="courseDetail.mustLearn" type="danger" effect="dark" style="margin-right: 12px;">必学</el-tag>
            <h1 class="course-title">{{ courseDetail.name }}</h1>
            <el-button link class="like-btn" @click="toggleFavorite">
              <el-icon><Star v-if="!courseDetail.collect" /><StarFilled v-else /></el-icon>
              {{ courseDetail.collectNumber || 0 }}
            </el-button>
          </div>
          <p class="course-subtitle">
            创建时间 : {{ courseDetail.createTime }}
          </p>
          <p class="course-description">
            {{ courseDetail.summary }}
          </p>
          
          <!-- <div v-if="currentSection" class="current-section-info">
            <el-tag type="success" effect="dark">正在学习</el-tag>
            <span class="section-name">{{ currentSection.name }}</span>
            <span v-if="currentSection.courseware" class="section-duration">
              时长: {{ formatDuration(currentSection.courseware.duration) }}
            </span>
          </div> -->
        </div>
        
        <el-tabs v-model="activeTab" class="details-tabs">
          <el-tab-pane label="课程介绍" name="intro">
            <div class="tab-content">
              <h2 class="section-title">讲师介绍</h2>
              <div class="instructor-info">
                <el-avatar :size="80" :src="courseDetail.instructorAvatar" />
                <div class="instructor-details">
                  <h3>{{ courseDetail.instructorName || '讲师姓名' }}</h3>
                  <!-- <p>{{ courseDetail.instructorTitle || '知名学院教授' }}</p> -->
                </div>
              </div>
              <p class="instructor-bio">{{ courseDetail.instructorBio }}</p>

              <h2 class="section-title">课程详情</h2>
              <div class="course-full-details" v-html="courseDetail.intro"></div>
            </div>
          </el-tab-pane>
          
          <!-- 课程练习标签页 -->
          <el-tab-pane label="课程练习" name="practice">
            <div class="tab-content" v-loading="practiceLoading">
              <div v-if="currentSection" class="current-section-practice">
                <h3>{{ currentSection.name }} - 相关练习</h3>
                <el-table v-if="practiceList.length > 0" :data="practiceList" style="width: 100%">
                  <el-table-column prop="name" label="练习试卷名称" min-width="200" />
                  <el-table-column prop="questionCount" label="题目数量" width="120" align="center">
                    <template #default="{ row }">
                      <el-tag size="small">{{ row.questionCount || 0 }}题</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="timeLimit" label="时长限制" width="120" align="center">
                    <template #default="{ row }">
                      <span v-if="row.timeLimit">{{ row.timeLimit }}分钟</span>
                      <span v-else class="text-muted">不限时</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="120" align="center">
                    <template #default="{ row }">
                      <el-button type="primary" link @click="startPractice(row)">开始练习</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="当前小节暂无关联练习" />
              </div>
              <el-empty v-else description="请先选择一个小节查看相关练习" />
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
          <div class="recommend-list" v-loading="recommendLoading">
            <div v-for="item in recommendedCourses" :key="item.id" class="recommend-item" @click="goToCourse(item.id)">
              <img :src="item.coverUrl" class="recommend-cover" alt="课程封面" />
              <div class="recommend-info">
                <p class="recommend-title">{{ item.name }}</p>
                <span class="recommend-desc">{{ item.summary }}</span>
              </div>
            </div>
            <el-empty v-if="!recommendLoading && recommendedCourses.length === 0" description="暂无推荐课程" :image-size="60" />
          </div>
        </el-card>
      </el-aside>
    </el-container>
    
    <!-- <div class="details-footer">
      <span>重庆市公安局经侦总队</span>
      <span>产品说明文档</span>
    </div> -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { VideoPlay, InfoFilled, Star, StarFilled, Document, Download, Loading, WarningFilled, Headset, FullScreen } from '@element-plus/icons-vue';
import { 
  getStudentCourseDetail, 
  getStudentCourseList,
  toggleCourseCollect, 
  getStudentSectionDetail,
  submitSection,
  sendHeartbeat 
} from '@/api/classroom.js';
// 移除单独的练习管理API引入，改用课程详情中的practiceList

import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { previewFile } from '@/api/common/PreviewFile';
import { getLecturerDetail } from '@/api/system-management/lecturer';
// 引入 Office 文档预览组件
import VueOfficeDocx from '@vue-office/docx';
import '@vue-office/docx/lib/index.css';
import VueOfficePptx from '@vue-office/pptx';

const route = useRoute();
const router = useRouter();
const courseId = ref(null);
const loading = ref(true);
const activeTab = ref('intro');
const currentSection = ref(null);
const videoPlayerRef = ref(null);
const audioPlayerRef = ref(null);
const activeMenuIndex = ref('');
const player = shallowRef(null);
let audioEventHandlers = null;
const pptLoading = ref(false);
const wordLoading = ref(false);
const pptError = ref('');
const wordError = ref('');
const documentSize = ref(''); // 文档大小信息
let heartbeatTimer = null;
let lastHeartbeatTime = 0;
let totalWatchTime = 0;
let contentViewing = false; // 非音视频内容查看状态
let autoSubmitted = false;  // 文档/图片自动提交一次

// 练习列表相关状态 - 从当前小节获取
const practiceList = ref([]);
const practiceLoading = ref(false);

const currentCourseware = reactive({
  type: '',
  url: '',
  mimeType: '',
  arrayBuffer: null, // 用于 Office 文档的二进制数据
});

const courseDetail = reactive({
  id: null,
  name: '加载中...',
  createTime: '加载中...',
  summary: '加载中...',
  intro: '<p>加载中...</p>',
  collectNumber: 0,
  collect: false,
  mustLearn: false,
  instructorName: '加载中...',
  instructorTitle: '',
  instructorAvatar: '',
  instructorBio: '加载中...',
  courseChapterList: [],
});

const recommendedCourses = ref([]);
const recommendLoading = ref(false);

// PDF 全屏功能
const isFullscreen = ref(false);
const pdfContainerRef = ref(null);

// 切换全屏
const toggleFullscreen = () => {
  const container = document.querySelector('.pdf-container');
  if (!container) return;

  if (!document.fullscreenElement) {
    container.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(err => {
      ElMessage.error(`无法进入全屏模式: ${err.message}`);
    });
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    });
  }
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// 从当前小节中获取练习列表
const updatePracticeList = (section) => {
  if (!section) {
    practiceList.value = [];
    return;
  }
  
  // 从当前小节的practiceList中获取练习数据
  practiceList.value = section.practiceList || [];
};

// 监听当前小节变化，自动更新练习列表
watch(currentSection, (newSection) => {
  updatePracticeList(newSection);
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

// 开始练习功能
const startPractice = (practice) => {
  if (!practice || !practice.id) {
    ElMessage.warning('练习信息不完整');
    return;
  }
  
  // 跳转到练习页面，传递练习ID
  const routeData = router.resolve({
    name: 'TakePractice', // 假设练习页面的路由名称
    params: { id: practice.id },
    query: { 
      from: 'course',
      courseId: courseId.value,
      sectionId: currentSection.value?.id 
    }
  });
  
  // 在新窗口打开练习页面
  window.open(routeData.href, '_blank');
  
  ElMessage.success('正在打开练习页面...');
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
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(type)) return 'audio';
  if (type === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type)) return 'image';
  if (['doc', 'docx'].includes(type)) return 'word';
  if (['ppt', 'pptx'].includes(type)) return 'ppt';
  if (['xls', 'xlsx', 'txt', 'zip', 'rar'].includes(type)) return 'document';
  return 'other';
};

const getMimeType = (fileType) => {
  const mimeTypes = {
    'mp4': 'video/mp4', 'webm': 'video/webm',
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4', 'aac': 'audio/aac', 'flac': 'audio/flac',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
  };
  return mimeTypes[fileType?.toLowerCase()] || 'application/octet-stream';
};

const downloadCourseware = () => {
  if (currentCourseware.url) {
    const link = document.createElement('a');
    link.href = currentCourseware.url;
    
    // 获取小节名称
    const sectionName = currentSection.value?.name;
    // 获取文件类型 (扩展名，不含点)
    const fileType = currentSection.value?.courseware?.fileType;
    
    let newFileName = 'courseware'; // 默认值
    
    if (sectionName && fileType) {
      // 组合：小节名称 + . + 扩展名
      newFileName = `${sectionName}.${fileType}`;
    } else if (sectionName) {
      newFileName = sectionName; // 如果没有类型，至少使用名称
    } else if (currentSection.value?.courseware?.fileName) {
      newFileName = currentSection.value.courseware.fileName; // 回退到原始文件名
    }
    
    link.download = newFileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('开始下载');
  }
};
// 在 downloadCourseware 函数后面添加这个新函数：
const loadOfficeDocument = async (url, type) => {
  try {
    console.log(`开始加载 ${type} 文档:`, url);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // 获取文件大小
    const contentLength = response.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength) : 0;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    
    console.log(`${type} 文件大小: ${fileSizeMB} MB`);
    
    // 更新文件大小显示
    documentSize.value = `${fileSizeMB} MB`;
    
    // 检查文件大小，如果 Word 或 PPT 超过 70MB 就直接提示下载
    const maxSizeForPreview = 70 * 1024 * 1024; // 70MB
    if (fileSize > maxSizeForPreview) {
      const msg = `文件过大 (${fileSizeMB} MB)，超过70MB限制，请直接下载查看`;
      throw new Error(msg);
    }
    
    // 如果文件较大但未超过70MB，给出警告提示
    const warnSize = type === 'PPT' ? 30 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileSize > warnSize) {
      const msg = `文件较大 (${fileSizeMB} MB)，在线预览可能较慢，请耐心等待`;
      ElMessage.warning({
        message: msg,
        duration: 6000,
        showClose: true
      });
      console.warn(msg);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('文件内容为空');
    }
    
    console.log(`${type} 文档加载成功，实际大小:`, (arrayBuffer.byteLength / 1024 / 1024).toFixed(2), 'MB');
    return arrayBuffer;
    
  } catch (error) {
    console.error(`加载 ${type} 文档失败:`, error);
    
    if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
      throw new Error('文档加载失败：跨域限制，请尝试下载查看');
    }
    
    throw new Error(`文档加载失败: ${error.message}`);
  }
};
// Office 文档渲染事件处理
const handleDocxRendered = () => {
  console.log('Word 文档渲染完成');
  wordLoading.value = false;
  wordError.value = '';
  ElMessage.success('Word 文档加载成功');
  // Word 渲染完成后，开始文档查看心跳
  startContentHeartbeat();
};
const handleDocxError = (error) => {
  console.error('Word 文档渲染失败:', error);
  wordLoading.value = false;
  wordError.value = error?.message || '文档格式不支持或文件已损坏';
  ElMessage.error('Word 文档加载失败');
};

const handlePptxRendered = () => {
  console.log('PPT 文档渲染完成');
  pptLoading.value = false;
  pptError.value = '';
  ElMessage.success('PPT 加载成功');
  // PPT 渲染完成后，开始文档查看心跳
  startContentHeartbeat();
};

const handlePptxError = (error) => {
  console.error('PPT 文档渲染失败:', error);
  pptLoading.value = false;
  pptError.value = error?.message || '文档格式不支持或文件已损坏';
  ElMessage.error('PPT 文档加载失败');
};
const cleanupPlayer = () => {
  stopHeartbeat();
  contentViewing = false;
  autoSubmitted = false;
  if (player.value) {
    if (typeof player.value.dispose === 'function') {
      player.value.dispose();
    }
  }
  if (audioEventHandlers && audioPlayerRef.value) {
    const { onPlay, onPause, onEnded } = audioEventHandlers;
    audioPlayerRef.value.removeEventListener('play', onPlay);
    audioPlayerRef.value.removeEventListener('pause', onPause);
    audioPlayerRef.value.removeEventListener('ended', onEnded);
  }
  if (audioPlayerRef.value) {
    audioPlayerRef.value = null;
  }
  audioEventHandlers = null;
  player.value = null;
};

const initVideoPlayer = () => {
  if (player.value && typeof player.value.dispose === 'function') {
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
        controls: true, 
        autoplay: false, 
        preload: 'metadata', 
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2], 
        language: 'zh-CN',
        sources: [{ src: currentCourseware.url, type: currentCourseware.mimeType }],
      });
      
      // 监听 loadedmetadata 事件，在视频元数据加载后捕获第一帧作为封面
      player.value.on('loadedmetadata', () => {
        // 确保视频已经有了时长信息
        if (player.value.duration() > 0) {
          // 设置当前时间为0.1秒（避免全黑帧）
          player.value.currentTime(0.1);
        }
      });
      
      player.value.on('play', () => {
        lastHeartbeatTime = Date.now();
        contentViewing = false;
        startHeartbeat();
      });
      player.value.on('pause', () => { stopHeartbeat(); });
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

const initAudioPlayer = () => {
  nextTick(() => {
    if (audioPlayerRef.value && currentCourseware.type === 'audio') {
      const audioEl = audioPlayerRef.value;
      const onPlay = () => {
        lastHeartbeatTime = Date.now();
        contentViewing = false;
        startHeartbeat();
      };
      const onPause = () => stopHeartbeat();
      const onEnded = async () => {
        stopHeartbeat();
        if (currentSection.value) {
          await submitSectionRecord();
          ElMessage.success('恭喜你完成本小节学习！');
        }
      };

      audioEventHandlers = { onPlay, onPause, onEnded };
      audioEl.addEventListener('play', onPlay);
      audioEl.addEventListener('pause', onPause);
      audioEl.addEventListener('ended', onEnded);

      player.value = audioEl;
    }
  });
};

const getCurrentPlaybackRate = () => {
  if (!player.value) return 1;
  if (typeof player.value.playbackRate === 'function') {
    return player.value.playbackRate();
  }
  if (typeof player.value.playbackRate === 'number') {
    return player.value.playbackRate;
  }
  return 1;
};

const isMediaPaused = () => {
  if (!player.value) return true;
  if (typeof player.value.paused === 'function') {
    return player.value.paused();
  }
  if (typeof player.value.paused === 'boolean') {
    return player.value.paused;
  }
  return true;
};

const startHeartbeat = () => {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(async () => {
    if (!contentViewing && isMediaPaused()) {
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
          playbackRate: contentViewing ? 1 : getCurrentPlaybackRate()
        });
        totalWatchTime += elapsedSeconds;
        lastHeartbeatTime = now;
        // 对文档/图片类型，达到阈值自动提交一次学习记录
        if (contentViewing && !autoSubmitted && totalWatchTime >= 60) {
          try {
            await submitSectionRecord();
            autoSubmitted = true;
            ElMessage.success('已记录本小节学习（文档/图片）');
          } catch (e) { console.error(e); }
        }
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

// 针对文档/图片内容的心跳启动
const startContentHeartbeat = () => {
  contentViewing = true;
  lastHeartbeatTime = Date.now();
  startHeartbeat();
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
      
      // 获取讲师信息
      if (res.data.creator) {
        fetchInstructorInfo(res.data.creator);
      } else {
        // 没有创建人ID时使用默认值
        courseDetail.instructorName = '讲师';
        courseDetail.instructorTitle = '知名学院教授';
        courseDetail.instructorBio = '暂无讲师简介';
        courseDetail.instructorAvatar = '';
      }
      
      // 获取推荐课程
      if (res.data.courseCategory) {
        fetchRecommendedCourses(res.data.courseCategory);
      }
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

// 获取讲师信息
const fetchInstructorInfo = async (creatorId) => {
  try {
    const res = await getLecturerDetail({ id: creatorId });
    if (res.code === 200 && res.data) {
      courseDetail.instructorName = res.data.name || '讲师';
      courseDetail.instructorTitle = res.data.title || res.data.role || '讲师';
      courseDetail.instructorBio = res.data.introduction || res.data.intro || '暂无讲师简介';
      // 如果有头像字段，使用 previewFile 获取预览URL
      if (res.data.avatar) {
        try {
          courseDetail.instructorAvatar = await previewFile(res.data.avatar);
          console.log('讲师头像URL:', courseDetail.instructorAvatar);
        } catch (error) {
          console.error('获取讲师头像失败:', error);
          courseDetail.instructorAvatar = '';
        }
      } else {
        courseDetail.instructorAvatar = '';
      }
      console.log('讲师信息:', res.data);
    } else {
      console.error('获取讲师信息失败:', res.msg);
      courseDetail.instructorName = '讲师';
      courseDetail.instructorTitle = '讲师';
      courseDetail.instructorBio = '暂无讲师简介';
      courseDetail.instructorAvatar = '';
    }
  } catch (error) {
    console.error('获取讲师信息异常:', error);
    courseDetail.instructorName = '讲师';
    courseDetail.instructorTitle = '讲师';
    courseDetail.instructorBio = '暂无讲师简介';
    courseDetail.instructorAvatar = '';
  }
};

// 获取推荐课程（同分类下的随机3个其他课程）
const fetchRecommendedCourses = async (courseCategory) => {
  recommendLoading.value = true;
  try {
    const res = await getStudentCourseList({
      page: 1,
      size: 100, // 获取更多课程以便随机选择
      course_category: courseCategory
    });
    
    if (res.code === 200 && res.data && res.data.records) {
      // 过滤掉当前课程
      const otherCourses = res.data.records.filter(course => course.id !== courseId.value);
      
      // 随机打乱数组
      const shuffled = otherCourses.sort(() => Math.random() - 0.5);
      
      // 取前3个
      const selectedCourses = shuffled.slice(0, 3);
      
      // 处理封面图片预览
      const coursesWithCover = selectedCourses.filter(c => c.cover);
      if (coursesWithCover.length > 0) {
        const previewPromises = coursesWithCover.map(c => previewFile(c.cover));
        const previewUrls = await Promise.all(previewPromises);
        const urlMap = new Map();
        coursesWithCover.forEach((course, index) => {
          urlMap.set(course.id, previewUrls[index]);
        });
        recommendedCourses.value = selectedCourses.map(item => ({
          ...item,
          coverUrl: urlMap.get(item.id) || ''
        }));
      } else {
        recommendedCourses.value = selectedCourses.map(item => ({ 
          ...item, 
          coverUrl: '' 
        }));
      }
      
      console.log('推荐课程:', recommendedCourses.value);
    }
  } catch (error) {
    console.error('获取推荐课程失败:', error);
  } finally {
    recommendLoading.value = false;
  }
};

const toggleFavorite = async () => {
  try {
    const newStatus = !courseDetail.collect;
    const res = await toggleCourseCollect({ courseId: courseId.value, collect: newStatus });
    if (res.code === 200) {
      // 更新收藏状态
      courseDetail.collect = newStatus;
      // 更新收藏数量：收藏时+1，取消收藏时-1
      courseDetail.collectNumber = (courseDetail.collectNumber || 0) + (newStatus ? 1 : -1);
      // 确保收藏数量不小于0
      if (courseDetail.collectNumber < 0) {
        courseDetail.collectNumber = 0;
      }
      ElMessage.success(newStatus ? '收藏成功' : '取消收藏成功');
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch(e) { 
    console.error('收藏操作失败:', e);
    ElMessage.error('网络错误，请稍后重试'); 
  }
};

// 跳转到推荐课程
const goToCourse = (id) => {
  router.push({ name: 'ClassRoomDetails', params: { id } });
};

const handleSectionClick = async (section) => {
  cleanupPlayer();
  totalWatchTime = 0;
  currentCourseware.type = '';
  currentCourseware.url = '';
  currentCourseware.mimeType = '';
  currentCourseware.arrayBuffer = null;
  pptLoading.value = false;
  wordLoading.value = false;
  pptError.value = '';  // 新增
  wordError.value = '';  // 新增
  documentSize.value = ''; // 重置文件大小
  activeMenuIndex.value = `${section.chapterId}-${section.id}`;
  
  try {
    loading.value = true;
    const res = await getStudentSectionDetail(section.id);
    if (res.code === 200 && res.data) {
      currentSection.value = res.data;
      updatePracticeList(res.data);
      
      if (res.data.courseware && res.data.courseware.fileName) {
        try {
          const fileType = res.data.courseware.fileType;
          const coursewareType = getCoursewareType(fileType);
          const coursewareUrl = await previewFile(res.data.courseware.fileName);
          
          currentCourseware.type = coursewareType;
          currentCourseware.url = coursewareUrl;
          currentCourseware.mimeType = getMimeType(fileType);
          
          console.log('课件类型:', coursewareType, '文件类型:', fileType, 'URL:', coursewareUrl);
          
          if (coursewareType === 'video') {
            await nextTick();
            initVideoPlayer();
          } else if (coursewareType === 'audio') {
            initAudioPlayer();
          } else if (coursewareType === 'word') {
            // 修改这部分 ⬇️
            wordLoading.value = true;
            wordError.value = '';
            try {
              const arrayBuffer = await loadOfficeDocument(coursewareUrl, 'Word');
              currentCourseware.arrayBuffer = arrayBuffer;
              await nextTick();
            } catch (error) {
              wordError.value = error.message;
              wordLoading.value = false;
            }
          } else if (coursewareType === 'ppt') {
            // 修改这部分 ⬇️
            pptLoading.value = true;
            pptError.value = '';
            try {
              const arrayBuffer = await loadOfficeDocument(coursewareUrl, 'PPT');
              currentCourseware.arrayBuffer = arrayBuffer;
              await nextTick();
            } catch (error) {
              pptError.value = error.message;
              pptLoading.value = false;
            }
          }
          else if (coursewareType === 'pdf' || coursewareType === 'image' || coursewareType === 'document') {
            // 对于PDF/图片/需下载查看的文档，直接开启内容心跳
            startContentHeartbeat();
          }
        } catch (error) { 
          console.error('课件加载失败:', error);
          ElMessage.error('课件加载失败'); 
        }
      } else {
        ElMessage.warning('该小节暂无课件内容');
      }
    } else {
      ElMessage.error(res.msg || '获取小节详情失败');
    }
  } catch (error) {
    console.error('加载失败:', error);
    ElMessage.error('加载失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 监听路由参数变化，当切换课程时重新加载数据
watch(() => route.params.id, (newId) => {
  if (newId) {
    // 清理之前的播放器
    cleanupPlayer();
    // 重置状态
    currentSection.value = null;
    activeMenuIndex.value = '';
    activeTab.value = 'intro';
    currentCourseware.type = '';
    currentCourseware.url = '';
    currentCourseware.mimeType = '';
    currentCourseware.arrayBuffer = null;
    // 更新课程ID并重新获取数据
    courseId.value = newId;
    fetchCourseDetail();
  }
});

onMounted(() => {
  courseId.value = route.params.id;
  if (courseId.value) {
    fetchCourseDetail();
  } else {
    ElMessage.error('未找到课程ID');
    loading.value = false;
  }
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onBeforeUnmount(() => {
  cleanupPlayer();
  // 移除全屏事件监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<style scoped>
.details-page-container {
  max-width: 1400px;
  margin: 20px auto;
  background-color: #fff;
  padding: 24px;
  box-sizing: border-box;
  overflow-x: hidden;
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
.audio-player {
  width: 100%;
  height: 650px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.audio-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.audio-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 40px;
}

.audio-wave {
  width: 6px;
  height: 40px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 3px;
  animation: wave 1.2s ease-in-out infinite;
}

.audio-wave:nth-child(1) { animation-delay: 0s; }
.audio-wave:nth-child(2) { animation-delay: 0.1s; }
.audio-wave:nth-child(3) { animation-delay: 0.2s; }
.audio-wave:nth-child(4) { animation-delay: 0.3s; }
.audio-wave:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% {
    height: 40px;
  }
  50% {
    height: 80px;
  }
}

.audio-info {
  text-align: center;
  color: white;
}

.audio-icon {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
}

.audio-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: white;
}

.audio-subtitle {
  font-size: 16px;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.audio-player audio {
  width: 80%;
  max-width: 600px;
  position: relative;
  z-index: 2;
  margin-top: auto;
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
  box-sizing: border-box;
}
/* PDF 容器 */
.pdf-container {
  position: relative;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

/* 全屏按钮 */
.fullscreen-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: linear-gradient(135deg, #5B6FD8 0%, #7CB3E8 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(91, 111, 216, 0.4);
  transition: all 0.3s ease;
}

.fullscreen-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(91, 111, 216, 0.6);
}

/* 全屏模式下的样式 */
.pdf-container:fullscreen {
  background: #525659;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-container:fullscreen .pdf-viewer {
  width: 100%;
  height: 100%;
}

.pdf-container:fullscreen .fullscreen-btn {
  top: 20px;
  right: 20px;
}
.image-viewer {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.office-viewer {
  background-color: #fff;
  padding: 20px;
  overflow: hidden;
  display: block;
  position: relative;
  box-sizing: border-box;
}
.word-viewer {
  padding: 10px 20px;
}
.ppt-viewer {
  padding: 0;
  background-color: #f5f5f5;
}
.office-viewer :deep(.docx-wrapper),
.office-viewer :deep(.pptx-wrapper) {
  width: 100% !important;
  max-width: 100% !important;
  min-height: 600px;
  overflow: hidden !important;
  box-sizing: border-box !important;
}
.office-viewer :deep(canvas) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  box-sizing: border-box !important;
}
.ppt-viewer :deep(.pptx-wrapper) {
  height: 650px !important;
}
.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
}
.loading-overlay p {
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
}
.size-info {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
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
  border: 2px solid #e4e7ed;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  overflow: hidden;
}
.sidebar-card .card-header {
  font-weight: 600;
  font-size: 16px;
}
.syllabus-menu {
  border-right: none;
}

/* 章节标题样式 */
.syllabus-menu .el-sub-menu__title {
  height: auto !important;
  min-height: 45px;
  line-height: 1.5;
  padding: 14px 16px !important;
  white-space: normal;
  font-weight: 600;
  font-size: 14px;
  background-color: #fafbfc !important;
  color: #303133 !important;
  border-radius: 0;
  margin: 0;
  transition: all 0.2s ease;
  border-bottom: 1px solid #e4e7ed;
}

.syllabus-menu .el-sub-menu__title:hover {
  background-color: #f0f2f5 !important;
}

/* 小节样式 */
.syllabus-menu .el-menu-item {
  height: auto !important;
  min-height: 40px;
  line-height: 1.5;
  padding: 12px 16px 12px 36px !important;
  white-space: normal;
  font-size: 13px;
  margin: 0;
  border-radius: 0;
  transition: all 0.2s ease;
  background-color: #fff;
  color: #606266;
  position: relative;
  border-bottom: 1px solid #ebeef5;
}

.syllabus-menu .el-menu-item::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #c0c4cc;
  transition: all 0.2s ease;
}

.syllabus-menu .el-menu-item:hover {
  background-color: #f5f7fa !important;
  color: #409eff;
}

.syllabus-menu .el-menu-item:hover::before {
  background-color: #409eff;
  width: 6px;
  height: 6px;
}
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.menu-item-content span {
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  line-height: 1.3;
  flex: 1;
  font-size: 13px;
}

/* 优化子菜单容器 */
.syllabus-menu .el-sub-menu .el-menu {
  background-color: #fff !important;
  border-radius: 0;
  margin: 0;
  padding: 0;
}

/* 活跃小节的特殊样式 */
.syllabus-menu .el-menu-item.is-active-section {
  background-color: #ecf5ff !important;
  color: #409eff !important;
  font-weight: 500;
  border-left: 3px solid #409eff;
}

.syllabus-menu .el-menu-item.is-active-section::before {
  background-color: #409eff;
  width: 6px;
  height: 6px;
}

/* 章节展开/收起图标样式 */
.syllabus-menu .el-sub-menu__icon-arrow {
  color: #909399 !important;
  font-size: 12px;
}
.playing-icon {
  color: #409eff;
  font-size: 14px;
}

/* 移除旧的活跃样式，使用新的样式 */
.recommend-list .recommend-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.recommend-list .recommend-item:hover {
  background-color: #f5f7fa;
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

/* 练习相关样式 */
.current-section-practice h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}
.document-error {
  text-align: center;
  padding: 60px 40px;
}
.error-icon {
  color: #f56c6c;
  margin-bottom: 20px;
}
.document-error h3 {
  font-size: 18px;
  color: #303133;
  margin: 16px 0;
}
.error-message {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
  line-height: 1.6;
}

/* 防止出现水平滚动条 */
* {
  box-sizing: border-box;
}

body, html {
  overflow-x: hidden;
}

.el-container {
  overflow-x: hidden;
}
</style>