<template>
  <div class="classroom-page">
    <div 
      class="banner" 
      :style="{ backgroundImage: `linear-gradient(to right, #4facfe 0%, #00f2fe 100%), url(${jinxiketang})` }"
    >
      <div class="banner-content">
        <h1 class="banner-title">
          <el-icon><Compass /></el-icon>
          <span>金析课堂</span>
        </h1>
      </div>
    </div>

    <div class="main-content">
      <div class="content-card">
        <div class="filter-container">
          <div class="filter-row">
            <span 
              class="filter-tag all-courses-btn"
              :class="{ active: filters.categoryId === null }"
              @click="selectAllCourses"
            >
              所有课程
            </span>
            <span 
              v-for="category in categories" 
              :key="category.id" 
              class="filter-tag"
              :class="{ active: filters.categoryId === category.id }"
              @click="selectCategory(category.id)"
            >
              {{ category.name }}
            </span>
          </div>
          </div>

        <div class="tab-bar">
          <div class="tabs">
            <span 
              class="tab-item" 
              :class="{ active: activeTab === 'all' }"
              @click="selectTab('all')"
            >全部</span>
            <span 
              class="tab-item"
              :class="{ active: activeTab === 'mustLearn' }"
              @click="selectTab('mustLearn')"
            >必学</span>
          </div>
          <!-- <div class="remark">
            【备注】列表只显示已上架的课程，时间过期的课程会自动下架不显示
          </div> -->
        </div>

        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="courseList.length === 0" class="empty-state">
          <el-empty description="暂无相关课程"></el-empty>
        </div>
        <div v-else class="course-grid">
          <el-card v-for="course in courseList" :key="course.id" class="course-card" shadow="hover" :body-style="{ padding: '0px' }" @click="goToCourseDetail(course)">
            <img :src="course.coverUrl || 'https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png'" class="course-image" alt="课程封面"/>
            <div class="course-info">
              <div class="course-tags">
                <el-tag v-if="course.mustLearn" size="small" type="danger" style="margin-right: 5px;">必学</el-tag>
                <!-- <el-tag v-if="course.type === '录播课'" size="small" type="success">{{ course.type }}</el-tag> -->
                <!-- <el-tag v-if="course.isNew" size="small" type="warning">知识扩充</el-tag> -->
              </div>
              <h3 class="course-title">{{ course.name }}</h3>
              <div class="course-meta">
                <span><el-icon><VideoCamera /></el-icon> 共{{ course.sectionCount || 0 }}节</span>
                <span><el-icon><User /></el-icon> {{ course.lecturer || '金榜社' }}</span>
              </div>
            </div>
          </el-card>
        </div>

        <div v-if="total > 0" class="pagination-container">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :total="total"
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            @current-change="fetchCourseList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { VideoCamera, User, Compass } from '@element-plus/icons-vue';
import jinxiketang from '@/assets/img/jinxiketang.png';
import { getStudentCourseList } from '@/api/classroom.js'; 
import { previewFile } from '@/api/common/PreviewFile.js';
// 【已添加】导入获取字典的API
import { getDictByType } from '@/api/system-management/dictionary.js';

const router = useRouter();
const loading = ref(true);
const courseList = ref([]);
const total = ref(0);
const activeTab = ref('all');

// 【已修改】分类数据现在从API动态获取
const categories = ref([]);

// 【已修改】筛选状态简化
const filters = reactive({
  categoryId: null,
  mustLearn: false,
});
const pagination = reactive({
  page: 1,
  size: 8,
});

// --- API 调用 ---

// 【已添加】获取课程分类的函数
const fetchCategories = async () => {
  try {
    const res = await getDictByType('course_category'); //
    if (res.code === 200) {
      // 将返回的数据转换为模板需要的格式
      categories.value = res.data.map(item => ({
        id: item.dictValue,   // 使用 dictValue 作为ID
        name: item.dictLabel, // 使用 dictLabel 作为名称
      }));
    }
  } catch (error) {
    console.error("获取课程分类失败:", error);
    ElMessage.error('获取课程分类失败');
  }
};

const fetchCourseList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      mustLearn: filters.mustLearn,
      // 【已修改】使用简化的 categoryId
      course_category: filters.categoryId || undefined,
    };
    const res = await getStudentCourseList(params);
    if (res.code === 200) {
      const courses = res.data.records || [];
      
      const coursesWithCover = courses.filter(c => c.cover);
      if (coursesWithCover.length > 0) {
        const previewPromises = coursesWithCover.map(c => previewFile(c.cover));
        const previewUrls = await Promise.all(previewPromises);
        const urlMap = new Map();
        coursesWithCover.forEach((course, index) => {
          urlMap.set(course.id, previewUrls[index]);
        });
        courseList.value = courses.map(item => ({
          ...item,
          coverUrl: urlMap.get(item.id) || '',
          type: '录播课',
          isNew: Math.random() > 0.7,
        }));
      } else {
        courseList.value = courses.map(item => ({ ...item, coverUrl: '', type: '录播课', isNew: Math.random() > 0.7, }));
      }
      total.value = res.data.total;
    } else {
      ElMessage.error(res.msg || '获取课程列表失败');
    }
  } catch (error) {
    console.error("获取课程列表异常:", error);
    ElMessage.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// --- 事件处理 ---

// 选择所有课程
const selectAllCourses = () => {
  filters.categoryId = null;
  pagination.page = 1;
  fetchCourseList();
};

// 【已修改】简化分类选择逻辑
const selectCategory = (categoryId) => {
  filters.categoryId = filters.categoryId === categoryId ? null : categoryId;
  pagination.page = 1;
  fetchCourseList();
};

const selectTab = (tabName) => {
  activeTab.value = tabName;
  filters.mustLearn = tabName === 'mustLearn';
  pagination.page = 1;
  fetchCourseList();
};

const goToCourseDetail = (course) => {
  router.push({ name: 'ClassRoomDetails', params: { id: course.id } });
};

// --- 生命周期 ---
onMounted(() => {
  fetchCategories(); // 【已添加】页面加载时获取分类
  fetchCourseList();
});

</script>

<style scoped>
.classroom-page {
  background-color: #f5f7fa;
}
.banner {
  height: 200px;
  background-blend-mode: overlay;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  padding: 0 5%;
}
.banner-title {
  color: #3370FF;
  font-size: 32px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
}

.banner-title .el-icon {
  margin-right: 10px;
  font-size: 36px;
  color:  blue;
}
.main-content {
  padding: 0 0;
  background-color: #f5f7fa;
}
.content-card {
  background-color: #fff;
  padding: 24px;
}
.filter-container {
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}
.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.filter-row:last-child {
  margin-bottom: 0;
}
.filter-label {
  font-weight: 600;
  color: #303133;
  margin-right: 24px;
  flex-shrink: 0;
}
.filter-tag {
  cursor: pointer;
  padding: 4px 12px;
  margin-right: 12px;
  border-radius: 4px;
  color: #606266;
  transition: all 0.2s;
}
.filter-tag:hover {
  color: #409eff;
  background-color: #ecf5ff;
}
.filter-tag.active {
  color: #fff;
  background-color: #409eff;
  font-weight: 500;
}

.all-courses-btn {
  font-weight: 600;
  border: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.all-courses-btn:hover {
  border-color: #409eff;
}

.all-courses-btn.active {
  border-color: #409eff;
  background-color: #409eff;
}
.tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}
.tabs .tab-item {
  font-size: 16px;
  margin-right: 24px;
  color: #606266;
  cursor: pointer;
  padding-bottom: 4px;
}
.tabs .tab-item.active {
  color: #409eff;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
}
.remark {
  font-size: 14px;
  color: #F56C6C;
}
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 24px;
}
.course-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
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
.course-tags {
  margin-bottom: 8px;
  height: 24px;
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
  line-clamp: 2;
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
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
.loading-state, .empty-state {
  margin-top: 24px;
}
</style>