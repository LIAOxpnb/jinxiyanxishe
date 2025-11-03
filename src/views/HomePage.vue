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
        <h2>经办人都在学的热门课程</h2>
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
        <h2>金析轩讲师</h2>
        <p>来自各业界专家，提供丰富的经验，帮助您提升专业知识能力</p>
      </div>
      <div v-if="loadingLecturers" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
      <el-carousel v-else :interval="4000" type="card" height="300px" indicator-position="none" class="lecturer-carousel">
        <el-carousel-item v-for="lecturer in lecturers" :key="lecturer.id">
          <div class="lecturer-card">
            <el-avatar :size="100" :src="lecturer.avatar" />
            <h3 class="lecturer-name">{{ lecturer.name }}</h3>
            <p class="lecturer-title">{{ lecturer.title }}</p>
            <p class="lecturer-intro">{{ lecturer.intro }}</p>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { School, Edit, Reading, TrendCharts, User, VideoCamera, ArrowRight } from '@element-plus/icons-vue';

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
    // 跳转到我的页面，并选中"我的班级"标签页
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

const fetchLecturers = async () => {
  loadingLecturers.value = true;
  try {
    const params = {
      pageNum: 1,
      pageSize: 5,
      teacher: 1,
      pagination: true
    };
    const res = await getUserList(params);
    
    if (res.code === 200 && res.data) {
      const userList = res.data.records || [];
      
      // 【核心修正】并行获取所有讲师的头像URL
      const avatarPromises = userList.map(user => 
        user.teacherObj?.avatar ? previewFile(user.teacherObj.avatar) : Promise.resolve('')
      );
      const avatarUrls = await Promise.all(avatarPromises);

      // 【核心修正】使用新的数据结构(teacherObj)进行数据映射
      lecturers.value = userList.map((user, index) => ({
        id: user.id,
        name: user.name || '匿名讲师',
        avatar: avatarUrls[index], // 使用解析后的头像URL
        title: '认证讲师', // API中无此字段，使用默认值
        intro: user.teacherObj?.introduction || user.teacherObj?.intro || '暂无简介'
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
/* 样式与之前保持一致 */
.home-page {
  text-align: center;
  background-color: #fff; 
}
.hero-section {
  background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('@/assets/img/123.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  padding: 60px 40px;
  text-align: left;
  max-width: 100%;
  height: 490px;
  margin: 0px auto 0 auto;
  /* border-radius: 8px; */
}
.hero-content {
  max-width: 500px;
}
.main-title {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #8DACFB
}
.sub-title {
  font-size: 36px;
  margin-bottom: 20px;
  color: #DDDBFF;
}
.description {
  font-size: 14px;
  line-height: 1.6;
}
.features-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color:#F1F6FF ;
}
.features-section1 {
 
  max-width: 100%;

  background-color:#F1F6FF ;
}
.feature-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
}
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.feature-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.feature-icon {
  color: #409eff;
}
.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.feature-description {
  font-size: 12px;
  color: #909399;
  margin: 0;
}
.section-header {
  margin-bottom: 30px;
}
.section-header h2 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}
.section-header p {
  font-size: 14px;
  color: #909399;
}
.courses-section {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #F1F6FF;
}
.courses-section1 {
  max-width: 100%;
  background-color: #F1F6FF;
}
.course-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 16px;
}
.filter-tag {
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 4px;
  color: #606266;
  transition: all 0.2s;
  font-size: 15px;
}
.filter-tag:hover {
  color: #409eff;
}
.filter-tag.active {
  color: #409eff;
  background-color: #ecf5ff;
  font-weight: 600;
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
  background-color: white;
}
.lecturer-carousel {
  max-width: 1000px;
  margin: 0 auto;
}
.lecturer-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #e4e7ed;
}
.lecturer-name {
  margin: 15px 0 5px 0;
  font-size: 18px;
  color: #303133;
}
.lecturer-title {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #909399;
}
.lecturer-intro {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.loading-state, .empty-state {
  margin-top: 24px;
}
</style>