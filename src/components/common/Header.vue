<template>
  <el-header class="header">
    <div class="logo-title">
      <img src="@/assets/img/u71.png" alt="金分析" class="logo-img"/>
      <router-link to="/" class="title-link">金析研习社</router-link>
    </div>
    <div class="nav-links">
      <router-link :to="{ name: 'Home' }" class="nav-item">首页</router-link>
      <router-link :to="{ name: 'Courses' }" class="nav-item">课堂</router-link>
      <router-link :to="{ name: 'Practice' }" class="nav-item">练习</router-link>
      <router-link :to="{ name: 'Student-Exams' }" class="nav-item">考试</router-link>
      <router-link :to="{ name: 'ShootingRange' }" class="nav-item">靶场</router-link>
      <!-- <router-link :to="{ name: 'Classes' }" class="nav-item">班级</router-link> -->
      <router-link :to="{ name: 'MyPage', query: { tab: 'myClasses' } }" class="nav-item">班级</router-link>
    </div>
    <div class="search-bar">
        <el-input placeholder="搜索" v-model="searchQuery">
            <template #append>
                <el-button :icon="Search"></el-button>
            </template>
        </el-input>
    </div>
    <div class="user-info">
      <router-link to="/system-management" class="user-action">
        <el-icon><Setting /></el-icon>
        <span>系统管理</span>
      </router-link>
      <router-link to="/teaching-center/classes" class="user-action">
        <el-icon><School /></el-icon>
        <span>教学中心</span>
      </router-link>
      <router-link to="/my-page" class="user-action">
        <el-icon><User /></el-icon>
        <span>我的主页</span>
      </router-link>
      <router-link to="/messages" class="user-action">
        <el-icon><Bell /></el-icon>
        <span>消息</span>
      </router-link>
      <div class="user-action" @click="handleLogout">
        <img src="@/assets/img/u84.svg" alt="">
        <span>退出登录</span>
      </div>
    </div>
  </el-header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Setting, School, User, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const searchQuery = ref('')
function goToClasses() {
  router.push({ path: '/my-page', query: { tab: 'myClasses' } });
}
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 清除本地或会话存储中的登录信息
    try {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('tokenName')
    } catch (e) {
      // ignore
    }
    
    ElMessage.success('退出登录成功')
    
    // 跳转到登录页面
    router.push({ name: 'Login' })
  } catch {
    // 用户取消操作，不做任何处理
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 1px solid #444;
  height: 60px;
  padding: 0 20px;
}
.logo-title {
  display: flex;
  align-items: center;
}
.logo-img {
  height: 40px;
  margin-right: 10px;
}
.title-link {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333333;
  text-decoration: none;
  font-family: 'Microsoft YaHei', sans-serif;
}
.nav-links {
  display: flex;
  gap: 20px;
}
.nav-item {
  color: #333333;
  font-size: 13px;
  font-family: 'Microsoft YaHei', sans-serif;
  text-decoration: none;
}
.nav-item:hover, .router-link-active {
  color: #409EFF;
}
.search-bar {
    width: 250px;
}
.search-bar :deep(.el-input__wrapper) {
    background-color: #ffffff;
    box-shadow: none;
    border: 1px solid #dcdfe6;
}
.search-bar :deep(.el-input__inner) {
    color: #606266;
}
.search-bar :deep(.el-input-group__append) {
    background-color: #ffffff;
    border: 1px solid #dcdfe6;
    border-left: none;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}
.user-action {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #333333;
  font-size: 13px;
  font-family: 'Microsoft YaHei', sans-serif;
  text-decoration: none;
}
.user-action:hover {
  color: #409EFF;
}
</style>
