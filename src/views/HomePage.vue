<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="main-title">进阶》资金分析师</h1>
        <h2 class="sub-title">360°洞穿经济犯罪</h2>
        <p class="description">源源不断提供优质的课程通过AI能力提升业务能力，有效帮助您提供经济犯罪破案率，期待您的加入</p>
      </div>
    </div>
    <div class="features-section1">
      <div class="features-section">
        <el-card 
          v-for="feature in features" 
          :key="feature.title" 
          class="feature-card" 
          shadow="hover"
          :body-style="{ padding: '0px' }"
          @click="navigateTo(feature.routeName)"
        >
          <div class="feature-content">
            <el-icon :size="32" class="feature-icon"><component :is="feature.icon" /></el-icon>
            <span class="feature-title">{{ feature.title }}</span>
            <p class="feature-description">点击功能描述可功能跳转功能描述</p>
          </div>
        </el-card>
      </div>
    </div>
    <div class="courses-section1">
      <div class="courses-section">
        <div class="section-header">
          <h2>经侦人都在学的热门课程</h2>
          <p>业务所需技能课程，从资分析、大数据到信息技术，丰富的课程供您学习</p>
        </div>
        
        <div class="course-filter-bar">
          <span 
            class="filter-tag"
            :class="{ active: activeCategory === null }"
            @click="selectCategory(null)"
          >
            全部课程
          </span>
          <span 
            v-for="category in categories" 
            :key="category.id" 
            class="filter-tag"
            :class="{ active: activeCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </span>
        </div>

        <div v-if="loadingCourses" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="hotCourses.length === 0" class="empty-state">
          <el-empty description="暂无相关课程"></el-empty>
        </div>
        <div v-else class="course-grid">
          <el-card v-for="course in hotCourses" :key="course.id" class="course-card" shadow="hover" :body-style="{ padding: '0px' }" @click="goToCourseDetail(course)">
            <img :src="course.coverUrl || 'https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png'" class="course-image" alt="课程封面"/>
            <div class="course-info">
              <h3 class="course-title">{{ course.name }}</h3>
              <div class="course-meta">
                <span><el-icon><VideoCamera /></el-icon> 共{{ course.sectionCount || 0 }}节</span>
                <span><el-icon><User /></el-icon> {{ course.lecturerName || '金析研习社' }}</span>
              </div>
            </div>
          </el-card>
        </div>
        <div class="more-link-wrapper">
          <el-link type="primary" @click="navigateTo('Courses')">全部课程 <el-icon><ArrowRight /></el-icon></el-link>
        </div>
      </div>
    </div>
      
    <div class="lecturer-section">
      <div class="section-header">
        <div>
          <h2>金析轩讲师</h2>
          <p>来自各业界专家，提供丰富的经验，帮助您提升专业知识能力</p>
        </div>
        <div class="carousel-controls">
          <el-button :icon="ArrowLeft" circle @click="prevSlide" />
          <el-button :icon="ArrowRight" circle @click="nextSlide" />
        </div>
      </div>

      <div v-if="loadingLecturers" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <el-carousel 
        v-else 
        :interval="4000" 
        height="320px" 
        indicator-position="none" 
        arrow="never"
        ref="carouselRef"
        class="lecturer-carousel-flat"
        >
        <el-carousel-item v-for="(group, index) in groupedLecturers" :key="index">
          <div class="lecturer-slide-group has-large-card">
            
            <div 
              v-if="group.length > 0" 
              class="lecturer-card-large"
            >
              <!-- 背景渐变层 -->
              <div class="card-bg"></div>
              
              <!-- 人物照片 -->
              <div class="lecturer-photo">
                <img :src="group[0].avatar" alt="讲师照片" />
              </div>
              
              <!-- 文字信息区域 -->
              <div class="lecturer-info-area">
                <div class="info-top">
                  <h3 class="lecturer-name">{{ group[0].name }}</h3>
                  <p class="lecturer-title">{{ group[0].title }}</p>
                </div>
                
                <div class="info-bottom">
                  <p class="lecturer-intro">{{ group[0].intro }}</p>
                </div>
              </div>
            </div>

            <div 
              class="lecturer-card-small"
              v-for="lecturer in group.slice(1)" 
              :key="lecturer.id"
            >
              <img :src="lecturer.avatar" class="lecturer-avatar-bg" alt="讲师头像" />
              <div class="lecturer-info-box">
                <h3 class="lecturer-name">{{ lecturer.name }}</h3>
                <p class="lecturer-title">{{ lecturer.title }}</p>
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { School, Edit, Reading, TrendCharts, User, VideoCamera, ArrowRight, ArrowLeft } from '@element-plus/icons-vue';

// --- API 导入 ---
import { getStudentCourseList } from '@/api/classroom.js'; 
import { previewFile } from '@/api/common/PreviewFile.js';
import { getUserList } from '@/api/system-management/User.js'; 
import { getDictByType } from '@/api/system-management/dictionary.js';

// --- 基础配置和路由 ---
const router = useRouter();

const features = ref([
  { title: '金析课堂', icon: School, routeName: 'Courses' },
  { title: '随堂练习', icon: Edit, routeName: 'Practice' },
  { title: '正式考试', icon: Reading, routeName: 'Student-Exams' },
  { title: '实战靶场', icon: TrendCharts, routeName: 'ShootingRange' },
  { title: '我的班级', icon: User, routeName: 'MyClasses' }
]);

const navigateTo = (routeName) => {
  if (routeName === 'MyClasses') {
    router.push({ path: '/my-page', query: { tab: 'myClasses' } });
  } else if (routeName) {
    router.push({ name: routeName });
  } else {
    ElMessage.warning('功能正在开发中');
  }
};

const goToCourseDetail = (course) => {
  router.push({ name: 'ClassRoomDetails', params: { id: course.id } });
};


// --- 热门课程逻辑 ---
const hotCourses = ref([]);
const loadingCourses = ref(true);
const categories = ref([]);
const activeCategory = ref(null);

const fetchCategories = async () => {
  try {
    const res = await getDictByType('course_category');
    if (res.code === 200 && res.data) {
      categories.value = res.data.map(item => ({
        id: item.dictValue,
        name: item.dictLabel,
      }));
    }
  } catch (error) {
    console.error("获取课程分类失败:", error);
    ElMessage.error('获取课程分类失败');
  }
};

const fetchHotCourses = async () => {
  loadingCourses.value = true;
  try {
    const params = { 
      page: 1, 
      size: 8,
      course_category: activeCategory.value || undefined,
    };
    const res = await getStudentCourseList(params);
    if (res.code === 200 && res.data) {
      const courses = res.data.records || [];
      const previewPromises = courses.map(c => c.cover ? previewFile(c.cover) : Promise.resolve(''));
      const previewUrls = await Promise.all(previewPromises);
      
      hotCourses.value = courses.map((course, index) => ({
        ...course,
        coverUrl: previewUrls[index] || '',
      }));
    } else {
      ElMessage.error(res.msg || '获取热门课程失败');
      hotCourses.value = [];
    }
  } catch (error) {
    console.error("获取热门课程异常:", error);
    ElMessage.error('网络错误，请稍后重试');
    hotCourses.value = [];
  } finally {
    loadingCourses.value = false;
  }
};

const selectCategory = (categoryId) => {
  if (activeCategory.value === categoryId) return;
  activeCategory.value = categoryId;
  fetchHotCourses();
};


// --- 讲师模块逻辑 ---
const lecturers = ref([]);
const loadingLecturers = ref(true);

const carouselRef = ref(null);
const itemsPerSlide = 4; // 1大 + 3小

const prevSlide = () => {
  carouselRef.value?.prev();
};

const nextSlide = () => {
  carouselRef.value?.next();
};

const groupedLecturers = computed(() => {
  const groups = [];
  const allLecturers = lecturers.value;
  const total = allLecturers.length;

  if (total === 0) {
    return [];
  }

  if (total <= itemsPerSlide) {
    return [allLecturers];
  }

  for (let i = 0; i < total; i++) {
    const currentGroup = [];
    for (let j = 0; j < itemsPerSlide; j++) {
      const index = (i + j) % total;
      currentGroup.push(allLecturers[index]);
    }
    groups.push(currentGroup);
  }
  
  return groups;
});


const fetchLecturers = async () => {
  loadingLecturers.value = true;
  try {
    const params = {
      pageNum: 1,
      pageSize: 8,
      teacher: 1,
      pagination: true
    };
    const res = await getUserList(params);
    
    if (res.code === 200 && res.data) {
      const userList = res.data.records || [];
      
      const avatarPromises = userList.map(user => 
        user.teacherObj?.avatar ? previewFile(user.teacherObj.avatar) : Promise.resolve('')
      );
      const bgImagePromises = userList.map(user => 
        user.teacherObj?.bgImage ? previewFile(user.teacherObj.bgImage) : Promise.resolve('https://picsum.photos/seed/' + user.id + '/800/600')
      );

      const [avatarUrls, bgImageUrls] = await Promise.all([
          Promise.all(avatarPromises), 
          Promise.all(bgImagePromises)
      ]);

      lecturers.value = userList.map((user, index) => ({
        id: user.id,
        name: user.name || '匿名讲师',
        avatar: avatarUrls[index],
        title: user.teacherObj?.title || '认证讲师',
        intro: user.teacherObj?.introduction || user.teacherObj?.intro || '暂无简介，这是一个默认的讲师介绍文字，用于填充内容以展示效果。如果实际数据中没有，这里会显示此默认文本。',
        bgImage: bgImageUrls[index]
      }));

    } else {
      ElMessage.error(res.msg || '获取讲师列表失败');
    }
    
  } catch (error) {
     console.error("获取讲师列表异常:", error);
     ElMessage.error('获取讲师列表失败');
  } finally {
    loadingLecturers.value = false;
  }
};


// --- 生命周期 ---
onMounted(() => {
  fetchCategories();
  fetchHotCourses();
  fetchLecturers();
});

</script>

<style scoped>
/* 整体页面背景 */
.home-page {
  text-align: center;
  /* 更明显的浅紫灰背景，与导航栏紫色主题搭配 */
  background: linear-gradient(180deg, #f0f2f8 0%, #f5f7fa 50%, #e8eaf6 100%);
  min-height: 100vh;
}

/* Hero 横幅区域 - 保留原图颜色 + 响应式优化 */
.hero-section {
  background-image: url('@/assets/img/123.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: white;
  padding: clamp(40px, 6vw, 80px) clamp(20px, 4vw, 40px); /* 响应式padding */
  text-align: left;
  max-width: 100%;
  min-height: clamp(400px, 40vh, 520px); /* 响应式高度 */
  height: auto; /* 允许内容自适应 */
  margin: 0px auto 0 auto;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

@keyframes rotateGlow {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.hero-content {
  max-width: clamp(400px, 80%, 600px); /* 响应式最大宽度 */
  position: relative;
  z-index: 2;
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-title {
  font-size: clamp(28px, 4vw + 1rem, 52px); /* 响应式字体 */
  font-weight: 800;
  margin-bottom: clamp(12px, 1.5vw, 16px);
  color: #ffffff;
  text-shadow: 2px 2px 12px rgba(0, 0, 0, 0.5),
               0 0 30px rgba(102, 126, 234, 0.5);
  letter-spacing: clamp(1px, 0.15vw, 2px);
  line-height: 1.2;
}

.sub-title {
  font-size: clamp(24px, 3vw + 0.5rem, 40px); /* 响应式字体 */
  margin-bottom: clamp(16px, 2vw, 24px);
  color: #ffffff;
  font-weight: 700;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5),
               0 0 25px rgba(102, 126, 234, 0.4);
  letter-spacing: clamp(0.5px, 0.1vw, 1px);
}

.description {
  font-size: clamp(14px, 1.2vw, 16px); /* 响应式字体 */
  line-height: 1.8;
  color: #ffffff;
  text-shadow: 1px 1px 8px rgba(0, 0, 0, 0.6),
               0 0 20px rgba(0, 0, 0, 0.4);
  font-weight: 500;
  max-width: clamp(320px, 85%, 560px); /* 响应式宽度 */
  background: rgba(0, 0, 0, 0.15);
  padding: clamp(10px, 1.5vw, 12px) clamp(16px, 2vw, 20px);
  border-radius: 8px;
  backdrop-filter: blur(5px);
  border-left: 4px solid rgba(255, 255, 255, 0.6);
}
/* 功能卡片区域 */
.features-section {
  display: flex;
  justify-content: center;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  background: transparent;
}

.features-section1 {
  max-width: 100%;
  background: rgba(248, 249, 252, 0.5);
  padding: 20px 0;
}

.feature-card {
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.08);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
  background: linear-gradient(135deg, #ffffff 0%, #f0f3ff 100%);
}

.feature-content {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  color: #5B6FD8;
  font-size: 48px;
  transition: all 0.4s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.15) rotate(5deg);
  color: #7CB3E8;
}

.feature-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  transition: color 0.3s ease;
  letter-spacing: 0.5px;
}

.feature-card:hover .feature-title {
  color: #5B6FD8;
}

.feature-description {
  font-size: 13px;
  color: #909399;
  margin: 0;
  transition: color 0.3s ease;
  text-align: center;
}

.feature-card:hover .feature-description {
  color: #606266;
}

/* 课程区域 */
.courses-section {
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: transparent;
}

.courses-section1 {
  max-width: 100%;
  background: rgba(248, 249, 252, 0.5);
  padding: 20px 0;
}

/* 筛选标签栏 */
.course-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.08);
}

.filter-tag {
  cursor: pointer;
  padding: 10px 24px;
  border-radius: 50px;
  color: #606266;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 15px;
  font-weight: 500;
  border: 2px solid transparent;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.filter-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.filter-tag:hover {
  color: #5B6FD8;
  border-color: #5B6FD8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 111, 216, 0.2);
}

.filter-tag.active {
  color: #ffffff;
  background: linear-gradient(135deg, #5B6FD8 0%, #7CB3E8 100%);
  border-color: transparent;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(91, 111, 216, 0.3);
  transform: scale(1.05);
}

.filter-tag.active::before {
  opacity: 1;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  text-align: left;
}
.course-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}
.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
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
  margin: 0 0 12px 0;
  height: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.course-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}
.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.more-link-wrapper {
  margin-top: 30px;
  text-align: center;
}

.lecturer-section {
  padding: 60px 20px;
  background-color: transparent;
  max-width: 1200px;
  margin: 0 auto;
}

/* 区块标题样式 */
.section-header {
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.section-header h2 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #303133;
  position: relative;
  display: inline-block;
  letter-spacing: 0.5px;
}

.section-header h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #5B6FD8 0%, #7CB3E8 100%);
  border-radius: 2px;
}

.section-header p {
  font-size: 15px;
  color: #909399;
  margin: 0;
  line-height: 1.6;
}

.carousel-controls {
  display: flex;
  gap: 12px;
}

.lecturer-carousel-flat {
  max-width: 100%;
  margin: 0 auto;
}

.lecturer-slide-group {
  display: grid;
  grid-template-columns: 2fr repeat(3, 0.9fr); /* 优化比例 */
  gap: 20px;
  width: 100%;
  height: 100%;
}


.lecturer-card-large {
  position: relative;
  border-radius: 12px;
  display: flex;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

/* 背景渐变层 - 左侧浅蓝色区域 */
.lecturer-card-large .card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 55%;
  height: 100%;
  /* background: linear-gradient(135deg, #D6E9F8 0%, #C1DEF1 100%); */
  background-color: #E0EDFF;
  z-index: 1;
}

/* 人物照片 - 右侧45%区域，接近裁剪比例避免留白 */
.lecturer-card-large .lecturer-photo {
  position: absolute;
  right: 0;
  top: 0;
  width: 45%;
  height: 100%;
  z-index: 2;
  overflow: hidden;
  background-color: #E0EDFF;  /* 改为和背景一致的颜色 */
}

.lecturer-card-large .lecturer-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;  /* 改回 cover */
  object-position: center center;
}

/* 文字信息区域 */
.lecturer-card-large .lecturer-info-area {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* 上半部分 - 姓名和职位 */
.lecturer-card-large .info-top {
  flex: 1;
  padding: 35px 30px 20px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.lecturer-card-large .lecturer-name {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #1a1a1a;
  letter-spacing: 1px;
}

.lecturer-card-large .lecturer-title {
  font-size: 14px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

/* 下半部分 - 简介 */
.lecturer-card-large .info-bottom {
  background-color: rgba(255, 255, 255, 0.95);
  padding: 18px 25px;
  backdrop-filter: blur(10px);
}

.lecturer-card-large .lecturer-intro {
  font-size: 12px;
  line-height: 1.6;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 48px;
}


/* 2. CSS 修改：.lecturer-card-small */
.lecturer-card-small {
  background-color: #F2F2F2;
  border-radius: 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #E8E8E8;
  text-align: center;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.lecturer-card-small:hover {
   transform: translateY(-8px);
   box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

/* 头像背景图片 - 铺满整个卡片 */
.lecturer-avatar-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;  /* 改回 cover，因为已按卡片比例裁剪 */
  object-position: center center;
  z-index: 1;
}

/* 3. 新增：.lecturer-info-box 样式 */
.lecturer-info-box {
  background: linear-gradient(to top, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  border-radius: 0;
  padding: 18px 16px;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  position: relative;
  z-index: 2;
  border-top: 1px solid rgba(0,0,0,0.05);
  
}

.lecturer-card-small .lecturer-name {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}
.lecturer-card-small .lecturer-title {
  margin: 0;
  font-size: 13px;
  color: #909399;
}


.loading-state, .empty-state {
  margin-top: 24px;
}
</style>