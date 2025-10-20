<template>
  <div class="my-page">
    <!-- 个人信息横幅（全局） -->
    <section class="profile-hero">
      <div class="avatar-wrap">
        <img :src="userProfile.avatar || defaultAvatar" alt="头像" class="avatar" />
      </div>
      <div class="profile-info">
        <div class="profile-name-row">
          <h2 class="profile-name">{{ userProfile.name || '用户名' }}</h2>
        </div>
        <div class="profile-org">{{ userProfile.orgName || '组织名称 / 学校名称' }}</div>
        <div class="badge-row" v-if="userBadges.length">
          <span v-for="(b,i) in userBadges" :key="i" class="badge-chip">{{ b }}</span>
        </div>
      </div>
    </section>

    <el-tabs v-model="activeTab" class="my-page-tabs" @tab-click="handleTabClick">
      
      <el-tab-pane label="个人首页" name="personalHome">
        <div v-loading="loading.personalHome">
          <section class="page-section">
            <div class="section-header">
              <h3>学习记录</h3>
              <el-link type="primary">查看更多 <el-icon><ArrowRight /></el-icon></el-link>
            </div>
            <div v-if="learningProgress.length > 0">
              <el-scrollbar>
                <div class="progress-list">
                  <div v-for="item in learningProgress" :key="item.id" class="progress-item" @click="goToCourseDetail(item.course.id)">
                    <div class="progress-card" :style="getProgressCardStyle(item.coverUrl)">
                      <div class="card-content">
                        <h4>{{ item.course?.name }}</h4>
                        <p>继续学习</p>
                      </div>
                    </div>
                    <div class="progress-bar-wrapper">
                      <el-progress :percentage="item.progress || 0" :stroke-width="6" :show-text="false" color="#409EFF" />
                      <span class="progress-text">{{ item.progress || 0 }}%</span>
                    </div>
                  </div>
                </div>
              </el-scrollbar>
            </div>
            <el-empty v-else description="暂无学习记录"></el-empty>
          </section>

          <section class="page-section">
            <div class="section-header">
              <h3>课程收藏</h3>
              <el-link type="primary">查看更多 <el-icon><ArrowRight /></el-icon></el-link>
            </div>
            <div v-if="collectedCourses.length > 0" class="course-grid">
              <el-card v-for="item in collectedCourses" :key="item.id" class="course-card" shadow="hover" :body-style="{ padding: '0px' }" @click="goToCourseDetail(item.course.id)">
                <img :src="item.coverUrl" class="course-image" alt="课程封面"/>
                <div class="course-info">
                  <h4 class="course-title">{{ item.course.name }}</h4>
                  <p class="course-summary">{{ item.course.summary }}</p>
                </div>
              </el-card>
            </div>
            <el-empty v-else description="暂无收藏课程"></el-empty>
          </section>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的班级" name="myClasses">
        <div v-loading="loading.myClasses">
          <div v-if="myClasses.length > 0" class="class-grid">
            <el-card v-for="clazz in myClasses" :key="clazz.id" class="class-card" shadow="hover" @click="goToClassDetail(clazz.id)">
              <div class="card-header">
                <h4 class="class-title">{{ clazz.name }}</h4>
                <el-tag type="success">进行中</el-tag>
              </div>
              <p class="class-period">不限时 / {{ clazz.startTime }} 至 {{ clazz.endTime }}</p>
              <div class="class-stats">
                <el-tag type="info" size="small">{{ clazz.courseCount }} 课程</el-tag>
                <el-tag type="info" size="small">{{ clazz.practiceCount || 0 }} 练习</el-tag>
                <el-tag type="info" size="small">{{ clazz.examCount }} 考试</el-tag>
                <el-tag type="info" size="small">{{ clazz.shootingRangeCount }} 靶场</el-tag>
              </div>
              <p class="class-members">班级人数 {{ clazz.studentCount }}人</p>
            </el-card>
          </div>
          <el-empty v-else description="您还没有加入任何班级"></el-empty>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的证书" name="myCertificates">
        <div v-loading="loading.myCertificates" class="page-section">
          <div v-if="myCertificates.length > 0" class="certificate-grid">
            <div v-for="cert in myCertificates" :key="cert.id" class="certificate-item-card" @click="viewCertificate(cert)">
              <div class="certificate-frame-small">
                <div 
                  class="certificate-content-small" 
                  :style="{ 
                    backgroundImage: cert.backgroundUrl ? `url(${cert.backgroundUrl})` : 'linear-gradient(45deg, #e8f4f8 0%, #f0f8ff 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }"
                >
                  <div class="certificate-overlay-small">
                    <div class="certificate-header-small">
                      <img src="@/assets/img/u42.png" alt="徽章" class="badge-small" />
                    </div>
                    
                    <div class="certificate-title-small">
                      {{ cert.name || '证书名称' }}
                    </div>
                    
                    <div class="certificate-recipient-small">
                      {{ cert.userName || '用户姓名' }} 同志
                    </div>
                    
                    <div class="certificate-body-small">
                      {{ cert.intro || '证书介绍内容' }}
                    </div>
                    
                    <div class="certificate-footer-small">
                      <div class="footer-content-small">
                        <div class="unit-date-info-small">
                          <div class="unit-name-small">{{ cert.unit || '单位名称' }}</div>
                          <div class="issue-date-small">{{ cert.issueDate || '2025年10月' }}</div>
                        </div>
                        <div class="seal-container-small">
                          <img 
                            v-if="cert.sealUrl"
                            :src="cert.sealUrl" 
                            alt="公章" 
                            class="seal-image-small"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <span class="certificate-name-label">{{ cert.name }}</span>
            </div>
          </div>
          <el-empty v-else description="您还没有获得任何证书"></el-empty>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我开的课" name="myTaughtCourses">
        <div v-loading="loading.myTaughtCourses">
          <div v-if="myTaughtCourses.length > 0" class="course-grid">
            <el-card
              v-for="course in myTaughtCourses"
              :key="course.id"
              class="course-card"
              shadow="hover"
              :body-style="{ padding: '0px' }"
              @click="goToCourseDetail(course.id)"
            >
              <img :src="course.coverUrl" class="course-image" alt="课程封面" />
              <div class="course-info">
                <h4 class="course-title">{{ course.name }}</h4>
                <p class="course-summary">{{ course.summary }}</p>
                <el-tag :type="course.status === 1 ? 'success' : 'info'" size="small">
                  {{ course.status === 1 ? '已发布' : '未发布' }}
                </el-tag>
              </div>
            </el-card>
          </div>
          <el-empty v-else description="暂无我开的课"></el-empty>
        </div>
      </el-tab-pane>

    </el-tabs>

    <el-dialog 
      v-model="certificateDialogVisible" 
      title="证书预览" 
      width="600px"
      align-center
      :close-on-click-modal="false"
    >
      <!-- 【核心修正】HTML 结构完全复制自 CertificateSettings.vue -->
      <div class="certificate-preview-dialog">
        <div class="certificate-frame">
          <div 
            class="certificate-content" 
            :style="{ 
              backgroundImage: currentCertificate.backgroundUrl ? `url(${currentCertificate.backgroundUrl})` : 'linear-gradient(45deg, #e8f4f8 0%, #f0f8ff 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }"
          >
            <div class="certificate-overlay">
              <div class="certificate-header">
                <img src="@/assets/img/u42.png" alt="徽章" class="badge" />
              </div>
              
              <div class="certificate-title">
                {{ currentCertificate.name || '证书名称' }}
              </div>
              
              <div class="certificate-recipient">
                {{ currentCertificate.userName || '用户姓名 同志' }}
              </div>
              
              <div class="certificate-body">
                {{ currentCertificate.intro || '证书介绍内容' }}
              </div>
              
              <div class="certificate-footer">
                <div class="footer-content">
                  <div class="unit-date-info">
                    <div class="unit-name">{{ currentCertificate.unit || '单位名称' }}</div>
                    <div class="issue-date">{{ currentCertificate.issueDate || '2025年10月' }}</div>
                  </div>
                  <div class="seal-container">
                    <img 
                      v-if="currentCertificate.sealUrl"
                      :src="currentCertificate.sealUrl" 
                      alt="公章" 
                      class="seal-image"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="downloadCertificate">下载</el-button>
          <el-button type="primary" @click="certificateDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowRight, Document } from '@element-plus/icons-vue';
import { 
  getLearningProgress, 
  getCollectedCourses, 
  getMyClasses, 
  getMyCertificates 
} from '@/api/mypage.js';
import { getCourseList } from '@/api/teaching-center/CourseManagement.js';
import { getProfile, getUserInfo } from '@/api/common/user.js';
import defaultAvatar from '@/assets/img/u71.png';
import { previewFile } from '@/api/common/PreviewFile.js';

const route = useRoute();
const router = useRouter();

const activeTab = ref('personalHome');
const loading = reactive({
  personalHome: false,
  myClasses: false,
  myCertificates: false,
  myTaughtCourses: false,
});

const learningProgress = ref([]);
const collectedCourses = ref([]);
const myClasses = ref([]);
const myCertificates = ref([]);
const myTaughtCourses = ref([]);
const userProfile = reactive({ name: '', orgName: '', avatar: '' });
const userBadges = ref([]);
const certificateDialogVisible = ref(false);
const currentCertificate = reactive({ 
  url: '', 
  name: '', 
  intro: '',
  unit: '',
  issueDate: '',
  userName: '',
  backgroundUrl: '',
  sealUrl: ''
});

const goToCourseDetail = (courseId) => {
  router.push({ name: 'ClassRoomDetails', params: { id: courseId } });
};
const goToClassDetail = (classId) => {
  router.push({ name: 'ClassDetails', params: { id: classId } });
};

const fetchPersonalHomeData = async () => {
  if (learningProgress.value.length > 0 || collectedCourses.value.length > 0) return;
  loading.personalHome = true;
  try {
    const [progressRes, collectRes] = await Promise.all([
      getLearningProgress({ page: 1, size: 10 }),
      getCollectedCourses({ page: 1, size: 8 })
    ]);
    if (progressRes.code === 200 && progressRes.data.records) {
      const progressItems = progressRes.data.records;
      const coverPromises = progressItems.map(item => item.course?.cover ? previewFile(item.course.cover) : Promise.resolve(''));
      const coverUrls = await Promise.all(coverPromises);
      learningProgress.value = progressItems.map((item, index) => ({ ...item, coverUrl: coverUrls[index] }));
    } else { ElMessage.error(progressRes.msg || '获取学习记录失败'); }
    if (collectRes.code === 200 && collectRes.data.records) {
      const collectItems = collectRes.data.records;
      const coverPromises = collectItems.map(item => item.course?.cover ? previewFile(item.course.cover) : Promise.resolve(''));
      const coverUrls = await Promise.all(coverPromises);
      collectedCourses.value = collectItems.map((item, index) => ({ ...item, coverUrl: coverUrls[index] }));
    } else { ElMessage.error(collectRes.msg || '获取收藏课程失败'); }
  } catch (error) {
    console.error("加载首页数据失败:", error);
    ElMessage.error('加载首页数据失败');
  } finally {
    loading.personalHome = false;
  }
};

const getProgressCardStyle = (coverUrl) => {
  const defaultGradient = 'linear-gradient(to top, #48c6ef 0%, #6f86d6 100%)';
  return {
    backgroundImage: coverUrl ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${coverUrl})` : defaultGradient,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
};

const fetchMyClasses = async () => {
  if (myClasses.value.length > 0) return;
  loading.myClasses = true;
  try {
    const res = await getMyClasses();
    if (res.code === 200) { myClasses.value = res.data || []; } 
    else { ElMessage.error(res.msg || '获取班级列表失败'); }
  } catch (error) { ElMessage.error('加载班级数据失败'); } 
  finally { loading.myClasses = false; }
};

const fetchMyCertificates = async () => {
  if (myCertificates.value.length > 0) return;
  loading.myCertificates = true;
  try {
    const res = await getMyCertificates();
    if (res.code === 200 && res.data) {
      const certs = res.data || [];
      const processedCerts = await Promise.all(
        certs.filter(cert => cert.certificate).map(async (cert) => {
            const certInfo = cert.certificate;
            const [backgroundUrl, sealUrl] = await Promise.all([
              certInfo.background ? previewFile(certInfo.background).catch(() => '') : Promise.resolve(''),
              certInfo.officialSeal ? previewFile(certInfo.officialSeal).catch(() => '') : Promise.resolve('')
            ]);
            let issueDate = certInfo.unifyTime || certInfo.createTime || cert.createTime || '';
            if (issueDate && issueDate.includes('-')) {
              const [year, month] = issueDate.split('-');
              issueDate = `${year}年${parseInt(month, 10)}月`;
            }
            return {
              id: cert.id,
              name: certInfo.name,
              intro: certInfo.intro,
              unit: certInfo.unit,
              issueDate: issueDate,
              userName: cert.userName,
              backgroundUrl: backgroundUrl,
              sealUrl: sealUrl,
              url: backgroundUrl
            };
          })
      );
      myCertificates.value = processedCerts;
    } else { ElMessage.error(res.msg || '获取证书列表失败'); }
  } catch (error) { 
    console.error('加载证书数据失败:', error);
    ElMessage.error('加载证书数据失败'); 
  } finally { loading.myCertificates = false; }
};

// 仅用于首页顶部徽章：轻量获取证书名称（最多4个）
const fetchUserBadges = async () => {
  try {
    const res = await getMyCertificates();
    if (res.code === 200 && Array.isArray(res.data)) {
      const certs = res.data.filter(c => c?.certificate?.name).slice(0, 4);
      userBadges.value = certs.map(c => c.certificate.name);
    }
  } catch (e) {
    // 忽略错误，不影响其他功能
  }
};

// 获取个人资料用于横幅
const fetchUserProfile = async () => {
  try {
    let res = await getProfile().catch(() => null);
    if (!res || res.code !== 200) {
      res = await getUserInfo().catch(() => null);
    }
    const data = res?.data || {};
    userProfile.name = data.name || data.nickName || data.realName || data.username || '';
    userProfile.orgName = data.orgName || data.organization || data.deptName || '';
    const avatar = data.avatar || data.headImg || data.avatarUrl || '';
    if (avatar) {
      // 如果是完整URL直接用；否则可能是文件ID，尝试预览
      if (/^https?:\/\//.test(avatar) || avatar.startsWith('/')) {
        userProfile.avatar = avatar;
      } else {
        try { userProfile.avatar = await previewFile(avatar); } catch { userProfile.avatar = ''; }
      }
    }
  } catch (e) {
    // 静默失败，保留占位
  }
};

// 我开的课：仅加载当前登录讲师创建的课程
const fetchMyTaughtCourses = async () => {
  if (myTaughtCourses.value.length > 0) return;
  loading.myTaughtCourses = true;
  try {
    const res = await getCourseList({ page: 1, size: 12, isMe: true });
    if (res.code === 200 && res.data?.records) {
      const records = res.data.records;
      // 预览封面
      const coverPromises = records.map(item => item.cover ? previewFile(item.cover).catch(() => '') : Promise.resolve(''));
      const covers = await Promise.all(coverPromises);
      myTaughtCourses.value = records.map((item, idx) => ({
        id: item.id,
        name: item.name,
        summary: item.summary,
        coverUrl: covers[idx],
        status: item.status, // 0未发布 1已发布
      }));
    } else {
      ElMessage.error(res.msg || '获取我开的课失败');
    }
  } catch (e) {
    console.error('加载我开的课失败:', e);
    ElMessage.error('加载我开的课失败');
  } finally {
    loading.myTaughtCourses = false;
  }
};

const viewCertificate = (cert) => {
  Object.assign(currentCertificate, cert);
  certificateDialogVisible.value = true;
};

const downloadCertificate = () => {
  if (!currentCertificate.url) return;
  const link = document.createElement('a');
  link.href = currentCertificate.url;
  const fileName = currentCertificate.url.split('/').pop() || `${currentCertificate.name}.jpg`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleTabClick = (tab) => {
  const tabName = tab.props.name;
    if (tabName === 'personalHome') {
      fetchPersonalHomeData();
    } else if (tabName === 'myClasses') {
    fetchMyClasses();
  } else if (tabName === 'myCertificates') {
    fetchMyCertificates();
  } else if (tabName === 'myTaughtCourses') {
    fetchMyTaughtCourses();
  }
};

onMounted(() => {
  const tabFromQuery = route.query.tab;
  const validTabs = ['personalHome', 'myClasses', 'myCertificates', 'myTaughtCourses'];
  if (tabFromQuery && validTabs.includes(tabFromQuery)) {
    activeTab.value = tabFromQuery;
  }
  if (activeTab.value === 'myClasses') {
    fetchMyClasses();
  } else if (activeTab.value === 'myCertificates') {
    fetchMyCertificates();
  } else if (activeTab.value === 'myTaughtCourses') {
    fetchMyTaughtCourses();
  } else {
    fetchPersonalHomeData();
  }
  // 全局加载个人资料与徽章（用于顶部横幅）
  fetchUserProfile();
  fetchUserBadges();
});
</script>

<style scoped>
.my-page {
  padding: 20px;
  background-color: #f5f7fa;
}
:deep(.el-tabs__header) {
  background-color: #fff;
  padding: 0 20px;
  margin-bottom: 20px;
}
:deep(.el-tabs__nav-wrap::after) {
  height: 0;
}
.page-section {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h3 {
  font-size: 20px;
  font-weight: 600;
}
/* 顶部个人信息横幅 */
.profile-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 40%, #7dd3fc 100%);
  color: #fff;
  margin-bottom: 18px;
}
.avatar-wrap { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; }
.avatar { width: 72px; height: 72px; object-fit: cover; border-radius: 50%; }
.profile-info { display: flex; flex-direction: column; gap: 6px; }
.profile-name-row { display: flex; align-items: center; gap: 8px; }
.profile-name { margin: 0; font-size: 22px; font-weight: 700; color: #fff; }
.profile-org { opacity: 0.9; }
.badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
.badge-chip { background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; font-size: 12px; }
.progress-list {
  display: flex;
  gap: 20px;
  padding-bottom: 10px;
}
.progress-item {
  flex-shrink: 0;
  width: 250px;
  cursor: pointer;
}
.progress-card {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  color: #fff;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  margin-bottom: 8px;
}
.progress-card h4 {
  font-size: 16px;
  margin: 0 0 5px 0;
  font-weight: 500;
}
.progress-card p {
  font-size: 13px;
  opacity: 0.8;
  margin: 0;
}
.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background-color: #fff;
  border-radius: 4px;
}
.progress-bar-wrapper :deep(.el-progress) {
  flex: 1;
}
.progress-text {
  font-size: 13px;
  color: #606266;
  min-width: 40px;
  text-align: right;
  font-weight: 500;
}
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
}
.class-card {
  cursor: pointer;
}
.class-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}
.class-card .class-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.class-card .class-period {
  font-size: 13px;
  color: #909399;
  margin: 0 20px 10px;
}
.class-card .class-stats {
  display: flex;
  gap: 10px;
  margin: 0 20px 10px;
}
.class-card .class-members {
  font-size: 13px;
  color: #909399;
  margin: 0 20px 16px;
}
:deep(.class-card .el-card__body) {
  padding: 0;
}
.course-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}
.course-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}
.course-info {
  padding: 16px;
}
.course-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}
.course-summary {
  font-size: 13px;
  color: #909399;
  margin: 0;
  height: 38px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.certificate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.certificate-item-card {
  cursor: pointer;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}
.certificate-item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}
.certificate-name-label {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
.certificate-frame-small {
  width: 100%;
  aspect-ratio: 0.7;
  background: #f0f0f0;
  padding: 6px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.certificate-content-small {
  width: 100%;
  height: 100%;
  border: 1px solid #ccc;
  position: relative;
  display: flex;
  background-size: cover;
  background-position: center;
}
.certificate-overlay-small {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  position: relative;
}
.badge-small { width: 24px; height: 24px; margin-bottom: 6px; }
.certificate-title-small { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 6px; text-align: center; }
.certificate-recipient-small { font-size: 10px; color: #555; margin-bottom: 6px; }
.certificate-body-small { flex: 1; font-size: 9px; line-height: 1.3; color: #444; text-align: justify; overflow: hidden; }
.certificate-footer-small { width: 100%; margin-top: auto; }
.footer-content-small { display: flex; align-items: flex-end; justify-content: flex-end; }
.unit-date-info-small { text-align: right; }
.unit-name-small { font-size: 9px; font-weight: bold; }
.issue-date-small { font-size: 8px; }
.seal-container-small { position: absolute; right: 10px; bottom: 10px; }
.seal-image-small { width: 50px; height: 50px; object-fit: contain; opacity: 0.8; }
.certificate-preview-dialog { 
  display: flex; 
  justify-content: center; 
}

/* 【完整复制】证书预览对话框样式 - 从 CertificateSettings.vue */
.certificate-frame {
  width: 450px;
  height: 650px;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 0 3px rgba(139, 69, 19, 0.2);
  position: relative;
}

.certificate-frame::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  pointer-events: none;
}

.certificate-content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
}

.certificate-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 8px dashed #4a90a4;
  pointer-events: none;
  z-index: 1;
  opacity: 0.8;
}

.certificate-overlay {
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 15px 10px 15px;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(2px);
}

.certificate-header {
  margin-bottom: 15px;
  position: relative;
}

.certificate-header::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(to right, transparent, #d4af37, transparent);
}

.badge {
  width: 50px;
  height: 50px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  animation: badge-shine 3s ease-in-out infinite;
}

@keyframes badge-shine {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.certificate-title {
  font-size: 40px;
  font-weight: bold;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: 3px;
  position: relative;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.certificate-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, transparent, #d4af37, transparent);
}

.certificate-recipient {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 8px 20px;
  background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.1), transparent);
  border-left: 3px solid #d4af37;
  border-right: 3px solid #d4af37;
}

.certificate-body {
  flex: 0 0 auto;
  height: auto;
  max-height: 180px;
  font-size: 15px;
  line-height: 1.8;
  color: #34495e;
  text-align: justify;
  padding: 20px 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-indent: 2em;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  margin: 0 10px 15px 10px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.certificate-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: auto;
  padding: 0 15px 55px 15px; /* 增加底部内边距以整体上移 */
  position: relative;
  min-height: 80px;
}
  
.footer-content {
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: flex-end;
  position: relative;
}

.footer-content::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.5), transparent);
}

.unit-date-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  position: relative;
  z-index: 1; /* 低于公章，使其被覆盖 */
  padding-right: 0;
}

.unit-name {
  font-size: 14px;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 4px;
  margin-left: 0;
  letter-spacing: 1px;
  position: relative;
  padding-left: 12px;
}

.unit-name::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #d4af37, #f4d03f);
  border-radius: 2px;
}

.issue-date {
  margin-left: 0;
  margin-bottom: 0;
  font-size: 13px;
  color: #5a6c7d;
  font-weight: 500;
  letter-spacing: 0.5px;
  padding-left: 12px;
}

.seal-container {
  position: absolute;
  right: 24px;         /* 贴近右侧 */
  bottom: 22px;        /* 上移公章并覆盖文字 */
  transform: none;
  z-index: 10;         /* 高于文字 */
  pointer-events: none;/* 避免遮挡点击 */
  filter: drop-shadow(0 4px 8px rgba(231, 76, 60, 0.3));
}

.seal-image {
  width: 84px;
  height: 84px;
  object-fit: contain;
  border-radius: 50%;
  animation: seal-float 4s ease-in-out infinite;
}

@keyframes seal-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
</style>