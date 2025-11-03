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
      <router-link 
        :to="{ name: 'MyPage', query: { tab: 'myClasses' } }" 
        :class="['nav-item', { 'active': isClassesActive }]"
        custom
        v-slot="{ navigate }"
      >
        <a @click="navigate" :class="['nav-item', { 'active': isClassesActive }]">班级</a>
      </router-link>
    </div>
    <div class="search-bar">
        <el-input placeholder="搜索" v-model="searchQuery">
            <template #append>
                <el-button :icon="Search"></el-button>
            </template>
        </el-input>
    </div>
    <div class="user-info">
      <router-link 
        v-if="hasSystemManagementPermission" 
        to="/system-management" 
        class="user-action"
      >
        <el-icon><Setting /></el-icon>
        <span>系统管理</span>
      </router-link>
      <router-link 
        v-if="hasTeachingCenterPermission" 
        to="/teaching-center/classes" 
        :class="['user-action', { 'active': isTeachingCenterActive }]"
        custom
        v-slot="{ navigate }"
      >
        <div @click="navigate" :class="['user-action', { 'active': isTeachingCenterActive }]">
          <el-icon><School /></el-icon>
          <span>教学中心</span>
        </div>
      </router-link>
      <router-link 
        :to="{ name: 'MyPage', query: { tab: 'personalHome' } }" 
        :class="['user-action', { 'active': isMyPageActive }]"
        custom
        v-slot="{ navigate }"
      >
        <div @click="navigate" :class="['user-action', { 'active': isMyPageActive }]">
          <el-icon><User /></el-icon>
          <span>我的主页</span>
        </div>
      </router-link>
      <router-link to="/messages" class="user-action">
        <el-icon><Bell /></el-icon>
        <span>消息</span>
      </router-link>
      <div class="user-action" @click="handleLogout">
        <span>{{ userName }}</span>
        <img src="@/assets/img/u84.svg" alt="">
        <span>退出登录</span>
      </div>
    </div>
  </el-header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Setting, School, User, Bell } from '@element-plus/icons-vue'
import { getInfo } from '@/api/common/info'

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const userPermissions = ref([])
const userName = ref('')

// 判断当前页面是否为班级页面（MyPage with tab=myClasses）
const isClassesActive = computed(() => {
  return route.name === 'MyPage' && route.query.tab === 'myClasses'
})

// 判断当前页面是否为我的主页（MyPage with tab=personalHome或无tab）
const isMyPageActive = computed(() => {
  return route.name === 'MyPage' && (route.query.tab === 'personalHome' || !route.query.tab)
})

// 判断当前页面是否在教学中心模块下
const isTeachingCenterActive = computed(() => {
  return route.path.startsWith('/teaching-center')
})

// 检查是否有系统管理权限
const hasSystemManagementPermission = computed(() => {
  // 如果有通配符权限 "*" 表示拥有所有权限
  if (userPermissions.value.includes('*')) {
    return true
  }
  // 检查是否有具体的系统管理权限
  return userPermissions.value.includes('system:setting')
})

// 检查是否有教学中心权限
const hasTeachingCenterPermission = computed(() => {
  // 如果有通配符权限 "*" 表示拥有所有权限
  if (userPermissions.value.includes('*')) {
    return true
  }
  // 检查是否有具体的教学中心权限
  return userPermissions.value.includes('teacher:setting')
})

// 获取用户权限
const loadUserPermissions = () => {
  try {
    const permissions = sessionStorage.getItem('userPermissions')
    if (permissions) {
      userPermissions.value = JSON.parse(permissions)
      console.log('Header组件加载的权限:', userPermissions.value)
    } else {
      userPermissions.value = []
    }
  } catch (error) {
    console.error('解析用户权限失败:', error)
    userPermissions.value = []
  }
}

// 获取用户信息
const loadUserInfo = async () => {
  try {
    const res = await getInfo()
    if (res.code === 200 && res.data) {
      userName.value = res.data.name || ''
      console.log('用户姓名:', userName.value)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  loadUserPermissions()
  loadUserInfo()
})

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
      sessionStorage.removeItem('userPermissions') // 清除权限信息
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
.nav-item:hover, .router-link-active, .nav-item.active {
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
.user-action:hover, .user-action.active, .user-action.router-link-active {
  color: #409EFF;
}

/* 当 router-link 自动添加 router-link-active 时，也高亮图标与文字 */
.user-action.router-link-active el-icon,
.user-action.router-link-active img {
  color: #409EFF;
  filter: none;
}
</style>
