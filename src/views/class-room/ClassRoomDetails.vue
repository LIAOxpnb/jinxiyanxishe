<template>
  <div class="details-page-container">
    <el-container>
      <el-main class="main-column">
        <div class="video-player-wrapper">
          <div class="video-player" v-if="currentCourseware.type === 'video' && currentCourseware.url">
            <video ref="videoPlayerRef" class="video-js vjs-big-play-centered" controls preload="metadata" crossorigin="anonymous">
              <source :src="currentCourseware.url" :type="currentCourseware.mimeType" />
              <!-- 备用格式支持 -->
              <source v-if="currentCourseware.webmUrl" :src="currentCourseware.webmUrl" type="video/webm" />
              <source v-if="currentCourseware.ogvUrl" :src="currentCourseware.ogvUrl" type="video/ogg" />
              您的浏览器不支持视频播放，请尝试升级浏览器或下载视频
            </video>
            <!-- 浏览器兼容性提示 -->
            <div v-if="videoError" class="video-compatibility-notice">
              <el-icon :size="20"><WarningFilled /></el-icon>
              <span>当前浏览器可能不支持此视频格式，建议使用Chrome浏览器</span>
              <!-- <el-button type="text" @click="downloadCourseware">下载视频</el-button> -->
            </div>
          </div>

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
                <el-icon class="audio-icon" :size="60">
                  <Headset />
                </el-icon>
                <h3 class="audio-title">{{ currentSection?.name || '音频课件' }}</h3>
                <p class="audio-subtitle">正在播放音频课程</p>
              </div>
            </div>
            <audio ref="audioPlayerRef" :src="currentCourseware.url" controls>
              您的浏览器不支持音频播放
            </audio>
          </div>

          <div class="courseware-viewer pdf-container"
            v-else-if="currentCourseware.type === 'pdf' && currentCourseware.url">
            <el-button class="fullscreen-btn" type="primary" :icon="FullScreen" circle @click="toggleFullscreen"
              :title="isFullscreen ? '退出全屏' : '全屏查看'">
            </el-button>
            <iframe :src="`${currentCourseware.url}#toolbar=0`" class="pdf-viewer" frameborder="0"
                    @contextmenu.prevent=""></iframe>
          </div>

          <div class="courseware-viewer" v-else-if="currentCourseware.type === 'image' && currentCourseware.url">
            <img :src="currentCourseware.url" class="image-viewer" alt="课件图片" 
                 @contextmenu.prevent="" @dragstart.prevent="" />
          </div>

          <div class="courseware-viewer office-viewer word-viewer"
            v-else-if="currentCourseware.type === 'word' && currentCourseware.arrayBuffer">
            <div v-if="wordLoading" class="loading-overlay">
              <el-icon class="is-loading" :size="40">
                <Loading />
              </el-icon>
              <p>正在加载 Word 文档...</p>
              <p v-if="documentSize" class="size-info">文件大小: {{ documentSize }}</p>
            </div>
            <VueOfficeDocx v-if="!wordError" :src="currentCourseware.arrayBuffer" style="height: 100%; width: 100%;"
              @rendered="handleDocxRendered" @error="handleDocxError" />
            <div v-else class="document-error">
              <el-icon class="error-icon" :size="80">
                <WarningFilled />
              </el-icon>
              <h3>Word 文档加载失败</h3>
              <p class="error-message">{{ wordError }}</p>
              <el-button type="primary" @click="downloadCourseware">
                <el-icon>
                  <Download />
                </el-icon>
                下载文档查看
              </el-button>
            </div>
          </div>

          <div class="courseware-viewer office-viewer ppt-viewer"
            v-else-if="currentCourseware.type === 'ppt' && currentCourseware.arrayBuffer">
            <div v-if="pptLoading" class="loading-overlay">
              <el-icon class="is-loading" :size="40">
                <Loading />
              </el-icon>
              <p>正在加载 PPT 文档...</p>
              <p v-if="documentSize" class="size-info">文件大小: {{ documentSize }}</p>
              <p class="size-info" style="color: #909399; font-size: 12px;">大文件加载可能需要较长时间，请耐心等待...</p>
            </div>
            <VueOfficePptx v-if="!pptError" :src="currentCourseware.arrayBuffer" style="height: 100%; width: 100%;"
              @rendered="handlePptxRendered" @error="handlePptxError" />
            <div v-else class="document-error">
              <el-icon class="error-icon" :size="80">
                <WarningFilled />
              </el-icon>
              <h3>PPT 文档加载失败</h3>
              <p class="error-message">{{ pptError }}</p>
              <el-button type="primary" @click="downloadCourseware">
                <el-icon>
                  <Download />
                </el-icon>
                下载文档查看
              </el-button>
            </div>
          </div>

          <div class="courseware-viewer document-viewer"
            v-else-if="(currentCourseware.type === 'word' || currentCourseware.type === 'ppt') && !currentCourseware.arrayBuffer && (wordError || pptError)">
            <div class="document-info">
              <el-icon class="document-icon" :size="80">
                <Document />
              </el-icon>
              <h3>{{ currentSection?.name || '课件文档' }}</h3>
              <p class="document-type">{{ getFileExtension(currentSection?.courseware?.fileType) }} 文档</p>
              <p v-if="documentSize" class="size-info">文件大小: {{ documentSize }}</p>
              <p class="error-message">{{ wordError || pptError }}</p>
              <el-button type="primary" size="large" @click="downloadCourseware">
                <el-icon>
                  <Download />
                </el-icon>
                下载查看
              </el-button>
            </div>
          </div>

          <div class="courseware-viewer document-viewer"
            v-else-if="currentCourseware.type === 'document' && currentCourseware.url">
            <div class="document-info">
              <el-icon class="document-icon" :size="80">
                <Document />
              </el-icon>
              <h3>{{ currentSection?.name || '课件文档' }}</h3>
              <p class="document-type">{{ getFileExtension(currentSection?.courseware?.fileType) }} 文档</p>
              <el-button type="primary" size="large" @click="downloadCourseware">
                <el-icon>
                  <Download />
                </el-icon>
                下载查看
              </el-button>
            </div>
          </div>

          <div v-else class="video-player">
            <el-icon class="play-icon">
              <VideoPlay />
            </el-icon>
            <p class="video-placeholder-text">请从右侧课程目录选择要学习的小节</p>
          </div>

        </div>
<div class="content-align-box">
        <div class="course-header">
          <div class="title-line">
            <span class="title-tag">课程</span>
            <el-tag v-if="courseDetail.mustLearn" type="danger" effect="dark" style="margin-right: 12px;">必学</el-tag>

            <el-tooltip effect="dark" :content="courseDetail.name" placement="top-start" :show-after="500">
              <h3 class="course-title">{{ courseDetail.name }}</h3>
            </el-tooltip>
            <el-button link class="like-btn" @click="toggleFavorite">
              <el-icon>
                <Star v-if="!courseDetail.collect" />
                <StarFilled v-else />
              </el-icon>
              {{ courseDetail.collectNumber || 0 }}
            </el-button>
          </div>
          <p class="course-subtitle">
            创建时间 : {{ courseDetail.createTime }}
          </p>
          <p class="course-description">
            {{ courseDetail.summary }}
          </p>
        </div>

        <div class="progress-bar">
          <el-icon>
            <InfoFilled />
          </el-icon>
          <span>已自动为您记录课程学习进度，无需手动操作</span>
        </div>

        <el-tabs v-model="activeTab" class="details-tabs">
          <el-tab-pane label="课程介绍" name="intro">
            <div class="tab-content">
              <h2 class="section-title">讲师介绍</h2>
              <div class="instructor-info">
                <el-avatar :size="80" :src="courseDetail.instructorAvatar" />
                <div class="instructor-details">
                  <h3>{{ courseDetail.instructorName || '讲师姓名' }}</h3>
                </div>
              </div>
              <p class="instructor-bio">{{ courseDetail.instructorBio }}</p>

              <h2 class="section-title">课程详情</h2>
              <div class="course-full-details" v-html="courseDetail.intro"></div>
            </div>
          </el-tab-pane>

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
              <div
                v-if="currentSection && currentSection.courseSectionMaterialList && currentSection.courseSectionMaterialList.length > 0">
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
</div>
      </el-main>

      <el-aside width="400px" class="sidebar-column">
        <el-card class="sidebar-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>课程目录</span>
            </div>
          </template>
          <el-menu class="syllabus-menu" :default-active="activeMenuIndex" v-loading="loading">
            <el-sub-menu v-for="chapter in courseDetail.courseChapterList" :key="chapter.id"
              :index="String(chapter.id)">
              <template #title>
                <span>{{ chapter.name }}</span>
              </template>
              <el-menu-item v-for="section in chapter.courseSectionList" :key="section.id"
                :index="`${chapter.id}-${section.id}`" @click="handleSectionClick(section)" :class="{
                  'is-active-section': currentSection && currentSection.id === section.id,
                  'is-completed-section': completedSectionIds.has(section.id) && (!currentSection || currentSection.id !== section.id)
                }">
                <div class="menu-item-content">
                  <el-icon v-if="currentSection && currentSection.id === section.id" class="playing-icon">
                    <VideoPlay />
                  </el-icon>
                  <el-icon v-else-if="completedSectionIds.has(section.id)" class="completed-icon"
                    style="color: #67c23a; font-size: 18px;">
                    <Check />
                  </el-icon>
                  <span>{{ section.name }}</span>
                </div>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>

          <el-empty v-if="!loading && (!courseDetail.courseChapterList || courseDetail.courseChapterList.length === 0)"
            description="暂无课程目录" :image-size="60" />
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
                <el-tooltip class="box-item" effect="dark" :content="item.name" placement="top" :show-after="500">
                  <p class="recommend-title">{{ item.name }}</p>
                </el-tooltip>
                <span class="recommend-desc">{{ item.summary }}</span>
              </div>
            </div>
            <el-empty v-if="!recommendLoading && recommendedCourses.length === 0" description="暂无推荐课程"
              :image-size="60" />
          </div>
        </el-card>
      </el-aside>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { VideoPlay, InfoFilled, Star, StarFilled, Document, Download, Loading, WarningFilled, Headset, FullScreen, Check } from '@element-plus/icons-vue';
import {
  getStudentCourseDetail,
  getStudentCourseList,
  toggleCourseCollect,
  getStudentSectionDetail,
  submitSection,
  sendHeartbeat,
  getCourseProgress
} from '@/api/classroom.js';

import { getVideoStreamUrl } from '@/api/common/VideoStream';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { previewFile } from '@/api/common/PreviewFile';
import { getLecturerDetail } from '@/api/system-management/lecturer';
// 引入 Office 文档预览组件
import VueOfficeDocx from '@vue-office/docx';
import '@vue-office/docx/lib/index.css';
import VueOfficePptx from '@vue-office/pptx';

// 禁用右键菜单防护
const disableContextMenu = () => {
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
};

// 禁用视频右键和拖拽
const disableVideoContextMenu = () => {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    video.addEventListener('contextmenu', e => e.preventDefault());
    video.addEventListener('dragstart', e => e.preventDefault());
  });
};

// 检测浏览器视频格式支持
const checkVideoSupport = () => {
  const video = document.createElement('video');
  const support = {
    mp4: video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),
    webm: video.canPlayType('video/webm; codecs="vp8, vorbis"'),
    ogg: video.canPlayType('video/ogg; codecs="theora, vorbis"')
  };
  
  console.log('浏览器视频格式支持:', support);
  return support;
};

// 检测浏览器类型
const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
  if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('Safari') > -1) return 'Safari';
  if (userAgent.indexOf('Edge') > -1) return 'Edge';
  return 'Unknown';
};

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
const videoError = ref(false); // 视频播放错误状态
const documentSize = ref(''); // 文档大小信息
let heartbeatTimer = null;
let lastHeartbeatTime = 0;
let totalWatchTime = 0;
let contentViewing = false; // 非音视频内容查看状态
let autoSubmitted = false;  // 文档/图片自动提交一次

// 练习列表相关状态 - 从当前小节获取
const practiceList = ref([]);
const practiceLoading = ref(false);

// 课程进度相关状态
const courseProgress = ref({});
const completedSectionIds = ref(new Set()); // 存储已完成的小节ID

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
    // 获取文件类型
    const fileType = currentSection.value?.courseware?.fileType;

    let newFileName = 'courseware'; // 默认值

    if (sectionName && fileType) {
      newFileName = `${sectionName}.${fileType}`;
    } else if (sectionName) {
      newFileName = sectionName;
    } else if (currentSection.value?.courseware?.fileName) {
      newFileName = currentSection.value.courseware.fileName;
    }

    link.download = newFileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('开始下载');
  }
};

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

const handleDocxRendered = () => {
  console.log('Word 文档渲染完成');
  wordLoading.value = false;
  wordError.value = '';
  ElMessage.success('Word 文档加载成功');
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
      // 重置错误状态
      videoError.value = false;
      
      // 检测浏览器兼容性
      const browser = detectBrowser();
      const support = checkVideoSupport();
      console.log(`当前浏览器: ${browser}`, support);
      
      // 优化视频播放器配置，解决抖动问题
      player.value = videojs(videoPlayerRef.value, {
        controls: true,
        autoplay: false,
        preload: 'metadata',
        fluid: false, // 关闭自适应流体模式，防止高度计算冲突
        fill: true,   // 开启填充模式，填满父容器
        playbackRates: [0.5, 1, 1.5, 2],
        language: 'zh-CN',
        html5: {
          vhs: {
            overrideNative: true,
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
        sources: [{ 
          src: currentCourseware.url, 
          type: currentCourseware.mimeType || 'video/mp4' 
        }],
        techOrder: ['html5'], // 优先使用HTML5播放器
      });

      // 错误处理
      player.value.on('error', () => {
        console.error('视频播放错误:', player.value.error());
        videoError.value = true;
        
        // 根据浏览器类型给出具体建议
        const browser = detectBrowser();
        let suggestion = '建议使用Chrome浏览器获得最佳播放体验';
        if (browser === 'Firefox' && support.mp4 === '') {
          suggestion = 'Firefox可能不支持此MP4编码，建议使用Chrome或转换视频格式';
        } else if (browser === 'Safari' && support.webm === 'probably') {
          suggestion = 'Safari建议使用MP4格式';
        }
        
        ElMessage.warning(`视频播放失败: ${suggestion}`);
      });

      // 监听 loadedmetadata 事件
      player.value.on('loadedmetadata', () => {
        if (player.value.duration() > 0) {
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
      
      // 视频加载完成后应用防护
      setTimeout(disableVideoContextMenu, 50);
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
      
      // 为音频元素添加防护
      audioEl.addEventListener('contextmenu', e => e.preventDefault());
      audioEl.addEventListener('dragstart', e => e.preventDefault());

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

const startContentHeartbeat = () => {
  contentViewing = true;
  lastHeartbeatTime = Date.now();
  startHeartbeat();
};

const submitSectionRecord = async () => {
  if (!currentSection.value) return;
  try {
    await submitSection({ sectionId: currentSection.value.id });
    // 学习完成后，立即更新前端状态
    if (!completedSectionIds.value.has(currentSection.value.id)) {
      completedSectionIds.value.add(currentSection.value.id);
      // 强制刷新 Set 引用，确保响应式生效
      completedSectionIds.value = new Set(completedSectionIds.value);
    }
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
        courseDetail.instructorName = '讲师';
        courseDetail.instructorTitle = '知名学院教授';
        courseDetail.instructorBio = '暂无讲师简介';
        courseDetail.instructorAvatar = '';
      }

      // 获取推荐课程
      if (res.data.courseCategory) {
        fetchRecommendedCourses(res.data.courseCategory);
      }

      // 优先获取进度
      await fetchCourseProgress();

      // 自动选择第一节课 (如果当前未选择)
      if (!currentSection.value && courseDetail.courseChapterList.length > 0) {
        // 寻找第一个章节
        const firstChapter = courseDetail.courseChapterList[0];
        if (firstChapter.courseSectionList && firstChapter.courseSectionList.length > 0) {
          const firstSection = firstChapter.courseSectionList[0];
          activeMenuIndex.value = `${firstChapter.id}-${firstSection.id}`;
          handleSectionClick(firstSection);
        }
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
      if (res.data.avatar) {
        try {
          courseDetail.instructorAvatar = await previewFile(res.data.avatar);
        } catch (error) {
          console.error('获取讲师头像失败:', error);
          courseDetail.instructorAvatar = '';
        }
      } else {
        courseDetail.instructorAvatar = '';
      }
    } else {
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

// 获取推荐课程
const fetchRecommendedCourses = async (courseCategory) => {
  recommendLoading.value = true;
  try {
    const res = await getStudentCourseList({
      page: 1,
      size: 100,
      course_category: courseCategory
    });

    if (res.code === 200 && res.data && res.data.records) {
      const otherCourses = res.data.records.filter(course => course.id !== courseId.value);
      const shuffled = otherCourses.sort(() => Math.random() - 0.5);
      const selectedCourses = shuffled.slice(0, 3);

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
    }
  } catch (error) {
    console.error('获取推荐课程失败:', error);
  } finally {
    recommendLoading.value = false;
  }
};

// 获取课程进度
const fetchCourseProgress = async () => {
  try {
    const res = await getCourseProgress(courseId.value);

    if (res.code === 200 && res.data) {
      const sectionsData = Array.isArray(res.data) ? res.data : [];
      const completedIds = sectionsData
        .filter(section => section.status === 1)
        .map(section => section.sectionId);

      completedSectionIds.value = new Set(completedIds);
    }
  } catch (error) {
    console.error('获取课程进度失败:', error);
  }
};

const toggleFavorite = async () => {
  try {
    const newStatus = !courseDetail.collect;
    const res = await toggleCourseCollect({ courseId: courseId.value, collect: newStatus });
    if (res.code === 200) {
      courseDetail.collect = newStatus;
      courseDetail.collectNumber = (courseDetail.collectNumber || 0) + (newStatus ? 1 : -1);
      if (courseDetail.collectNumber < 0) {
        courseDetail.collectNumber = 0;
      }
      ElMessage.success(newStatus ? '收藏成功' : '取消收藏成功');
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (e) {
    console.error('收藏操作失败:', e);
    ElMessage.error('网络错误，请稍后重试');
  }
};

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
  pptError.value = '';
  wordError.value = '';
  documentSize.value = '';
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
          let coursewareUrl = '';

          if (coursewareType === 'video') {
            // 使用加密视频流接口
            coursewareUrl = getVideoStreamUrl(res.data.courseware.fileName);
          } else {
            // 其他类型使用预览接口
            coursewareUrl = await previewFile(res.data.courseware.fileName);
          }

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

watch(() => route.params.id, (newId) => {
  if (newId) {
    cleanupPlayer();
    currentSection.value = null;
    activeMenuIndex.value = '';
    activeTab.value = 'intro';
    currentCourseware.type = '';
    currentCourseware.url = '';
    currentCourseware.mimeType = '';
    currentCourseware.arrayBuffer = null;
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

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // 启用防护措施
  disableContextMenu();
  setTimeout(disableVideoContextMenu, 100); // 延迟执行确保视频元素已渲染
});

onBeforeUnmount(() => {
  cleanupPlayer();
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<style scoped>
/* 防护措施 - 禁用文本选择和触摸调用 */
.details-page-container {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

/* 允许输入框等需要选择的元素 */
input, textarea, [contenteditable] {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

/* 视频兼容性提示 */
.video-compatibility-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  margin-top: 8px;
  color: #dc2626;
  font-size: 14px;
}

.video-compatibility-notice .el-icon {
  color: #ef4444;
}

/* .details-page-container {
  max-width: 100%;
  margin: 20px auto;
  background-color: #fff;
  padding: 24px;
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;
} */

.details-page-container {
  max-width: 100%;
  
  /* --- 修改重点 --- */
  /* 1. 改成负边距，抵消父级容器(el-main)自带的 padding */
  margin: -20px; 
  
  /* 2. 补回内部的间距，保持美观 */
  padding: 20px;
  
  /* 3. 如果你想让整个背景变成浅灰色（跟之前讨论的一样），这里可以改颜色 */
  background-color: #f5f7fa; 
  /* 如果你想要白色背景，就保持 #fff */
  /* ---------------- */
  
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;
  min-height: 100vh; /* 建议加上这个，保证高度撑满 */
}
.details-page-container :deep(.el-container) {
  display: flex;
  flex-wrap: nowrap;
}

.main-column {
  padding-right: 24px;
  flex: 1;
  min-width: 0;
  overflow: visible;
  position: relative;
}

.sidebar-column {
  border-left: 1px solid #e4e7ed;
  padding-left: 24px;
  flex-shrink: 0;
}

/* --- 统一容器样式 (核心优化) --- */
.video-player-wrapper {
  width: 100%;
  /* 核心：限制最大宽度，避免在宽屏下高度过高 */
  max-width: 1220px;
  /* 核心：居中显示 */
  margin: 0 auto 32px;
  position: relative;
}

/* --- 定义所有播放器/查看器的公共尺寸规则 --- */
.video-player,
.audio-player,
.courseware-viewer,
.office-viewer,
.document-viewer {
  width: 100%;
  /* 核心：强制统一 16:9 比例 */
  aspect-ratio: 16 / 9;
  /* 兼容不支持 aspect-ratio 的浏览器 */
  height: auto;

  background-color: #000;
  /* 视频默认黑底 */
  border-radius: 8px;
  overflow: hidden;
  /* 防止内容溢出 */
  position: relative;
  z-index: 1;

  /* 弹性布局让内部内容居中 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  /* 阴影让视窗更有立体感 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 1. 视频播放器 */
.video-player :deep(.video-js) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 8px;
  background-color: #000;
}

.video-player :deep(.vjs-control-bar) {
  z-index: 100;
}

/* 2. 音频播放器 */
.audio-player {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
}

/* 3. 文档/PDF 查看器 */
.courseware-viewer {
  background-color: #f5f7fa;
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

/* 4. Office (Word/PPT) 专用 */
.office-viewer {
  background-color: #fff;
  padding: 0;
}

.word-viewer {
  padding: 0;
  background-color: #f0f2f5;
}

/* 强制 VueOffice 组件填满容器 */
.office-viewer :deep(.docx-wrapper),
.office-viewer :deep(.pptx-wrapper) {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
}

.office-viewer :deep(section.docx) {
  box-shadow: none !important;
  margin-bottom: 0 !important;
  width: 100% !important;
}

.office-viewer :deep(canvas) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
}

/* 5. 图片查看器 */
.image-viewer {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
  
  /* 禁用图片拖拽 - 使用标准属性 */
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  
  /* 禁用图片长按保存 */
  -webkit-touch-callout: none;
}

/* 6. 错误/下载提示容器 */
.document-viewer {
  background-color: #f9fafc;
  border: 1px dashed #dcdfe6;
}

/* 音频样式 */
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

.audio-wave:nth-child(1) {
  animation-delay: 0s;
}

.audio-wave:nth-child(2) {
  animation-delay: 0.1s;
}

.audio-wave:nth-child(3) {
  animation-delay: 0.2s;
}

.audio-wave:nth-child(4) {
  animation-delay: 0.3s;
}

.audio-wave:nth-child(5) {
  animation-delay: 0.4s;
}

@keyframes wave {

  0%,
  100% {
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

/* PDF 全屏按钮 */
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

/* PDF全屏模式下的特殊覆盖 */
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

/* 加载与错误样式 */
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

.document-info {
  text-align: center;
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

/* 播放图标 */
.play-icon {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.video-placeholder-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-top: 16px;
  text-align: center;
}

/* 其他课程信息样式 */
.progress-bar {
  margin-top: 20px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background-color: #fef0f0;
  border-radius: 4px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  position: relative;
  z-index: 0;
  clear: both;
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
  /* --- 新增代码：防止被挤压 --- */
  flex-shrink: 0;       /* 关键：告诉浏览器这个元素禁止缩小 */
  white-space: nowrap;  /* 关键：强制文字不换行，保持一行显示 */
  margin-right: 4px;    /* 额外加一点点右边距，微调视觉 */
}

.course-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  flex-grow: 1; /* 让标题占据剩余空间 */
  
  /* --- 核心修改：单行截断 --- */
  min-width: 0; /* 关键：防止 flex 子元素撑破容器 */
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 超出隐藏 */
  text-overflow: ellipsis; /* 显示省略号 */
  margin-right: 12px; /* 给右边的收藏按钮留点空隙 */
}

.like-btn {
  font-size: 16px;
  color: #909399;
}

.like-btn .el-icon {
  color: #e6a23c;
}

.course-subtitle,
.course-description {
  color: #606266;
  font-size: 14px;
  margin: 8px 0 0 0;
}

.details-tabs {
  margin-top: 20px;
}

.tab-content {
  padding: 16px 0;
}

.section-title {
  font-size: 18px !important;
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

.instructor-details h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.instructor-details p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.instructor-bio,
.course-full-details {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.course-full-details :deep(p) {
  margin-bottom: 1em;
}

.course-full-details :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* 侧边栏样式 */
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

.syllabus-menu .el-sub-menu .el-menu {
  background-color: #fff !important;
  border-radius: 0;
  margin: 0;
  padding: 0;
}

/* 活跃小节样式 */
.syllabus-menu .el-menu-item.is-active-section {
  background-color: #ecf5ff !important;
  color: #409eff !important;
  font-weight: 500;
  border-left: 3px solid #409eff;
  opacity: 1 !important;
}

.syllabus-menu .el-menu-item.is-active-section::before {
  background-color: #409eff;
  width: 6px;
  height: 6px;
}

.syllabus-menu .el-sub-menu__icon-arrow {
  color: #909399 !important;
  font-size: 12px;
}

.playing-icon {
  color: #409eff;
  font-size: 14px;
}

/* 已完成小节样式 */
.syllabus-menu .el-menu-item.is-completed-section {
  background-color: #f0f9ff !important;
  border-left: 3px solid #67c23a !important;
}

.syllabus-menu .el-menu-item.is-completed-section>span {
  color: #67c23a !important;
  font-weight: 500 !important;
}

.syllabus-menu .el-menu-item.is-completed-section:hover {
  background-color: #e6f7ff !important;
}

.syllabus-menu .el-menu-item.is-completed-section::before {
  background-color: #67c23a !important;
  width: 6px !important;
  height: 6px !important;
}

.completed-icon {
  color: #67c23a !important;
  font-size: 16px !important;
  flex-shrink: 0;
}

/* 推荐列表样式 */
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

.recommend-info {
  /* 关键：Flex子元素必须设置 min-width: 0 才能让内部的 text-overflow 生效 */
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.recommend-info .recommend-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #303133;
  font-weight: 500;

  /* 强制单行显示，超出打点 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommend-info .recommend-desc {
  font-size: 12px;
  color: #909399;

  /* 描述也可以限制显示1行或2行，这里限制为1行保持整齐 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

* {
  box-sizing: border-box;
}

body,
html {
  overflow-x: hidden;
}

.el-container {
  overflow-x: hidden;
}
/* --- 新增样式的包装层 --- */
.content-align-box {
  width: 100%;
  
  /* 核心：这里的宽度要和你的视频容器(.video-player-wrapper)保持一致 */
  /* 比如你觉得视频现在的宽度刚好，就把视频的 max-width 抄过来 */
  /* 假设你之前视频设置的是 900px 或 1000px */
  max-width: 1230px; 
  
  /* 核心：居中显示，这样左右边距就会和视频一样了 */
  margin: 0 auto; 
}
</style>