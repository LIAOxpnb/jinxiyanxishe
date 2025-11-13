<template>
  <el-header class="header">
    <div class="logo-title">
      <img v-if="logoUrl" :src="logoUrl" alt="平台图标" class="logo-img"/>
      <router-link to="/" class="title-link">{{ sysName || '金析研习社' }}</router-link>
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
import { getGlobalConfig } from '@/utils/globalConfig'

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const userPermissions = ref([])
const userName = ref('')
const sysName = ref('')
const logoUrl = ref('')

// 判断当前页面是否为班级页面(MyPage with tab=myClasses)
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
    // 检查是否有 token，没有则不调用接口
    const token = sessionStorage.getItem('token')
    if (!token) {
      console.warn('未登录，跳过获取用户信息')
      return
    }
    
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
  
  // 只在已登录状态下加载平台名称与图标
  const token = sessionStorage.getItem('token')
  if (token) {
    // 从缓存加载平台名称与图标
    getGlobalConfig().then((config) => {
      if (config) {
        sysName.value = config.sysName || ''
        logoUrl.value = config.iconUrl || ''
      }
    }).catch(() => {
      // 静默处理错误，不显示弹窗
      console.log('获取平台配置失败')
    })
  }
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
/* 重置浏览器默认样式，确保跨浏览器一致性 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 渐变色：从深蓝紫色到浅蓝色 */
  background: linear-gradient(90deg, #5B6FD8 0%, #7CB3E8 100%);
  box-shadow: 0 2px 12px rgba(91, 111, 216, 0.15);
  height: 64px;
  padding: 0 clamp(12px, 2.5vw, 40px); /* 使用 clamp 实现流式 padding */
  position: relative;
  z-index: 100;
  width: 100%;
  min-width: 320px; /* 最小宽度保护 */
  max-width: 100vw; /* 防止超出视口 */
  box-sizing: border-box;
  flex-wrap: nowrap; /* 防止换行 */
  gap: clamp(8px, 1.5vw, 20px); /* 子元素间距也使用流式 */
  overflow-x: hidden; /* Edge 125% 缩放优化：防止横向溢出 */
}

/* Logo 区域 */
.logo-title {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1vw, 12px);
  flex-shrink: 0; /* 防止 logo 被挤压 */
  min-width: 0; /* 允许内部元素收缩 */
}

.logo-img {
  height: clamp(32px, 3vw, 42px); /* 流式高度 */
  flex-shrink: 0;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
  transition: transform 0.3s ease;
}

.logo-img:hover {
  transform: scale(1.05) rotate(5deg);
}

.title-link {
  font-size: clamp(0.95rem, 1.2vw + 0.5rem, 1.4rem); /* 流式字体 */
  font-weight: 700;
  color: #ffffff;
  text-decoration: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-link:hover {
  transform: translateY(-2px);
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
}

/* 导航链接区域 - 现代化设计 */
.nav-links {
  display: flex;
  gap: clamp(2px, 0.5vw, 8px); /* 流式间距 */
  align-items: center;
  flex: 1; /* 占据可用空间 */
  justify-content: center;
  flex-shrink: 1; /* 允许收缩 */
  min-width: 0; /* 重要：允许 flex 子元素收缩 */
  overflow: hidden; /* 防止溢出 */
}

.nav-item {
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(11px, 0.8vw + 0.3rem, 15px); /* 流式字体 */
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  padding: clamp(6px, 0.5vw, 8px) clamp(8px, 1.2vw, 20px); /* 流式 padding */
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  letter-spacing: 0.5px;
  white-space: nowrap; /* 防止文字换行 */
  flex-shrink: 1; /* 允许收缩 */
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.nav-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-item:hover::before {
  opacity: 1;
}

/* 激活状态 */
.router-link-active, 
.nav-item.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.router-link-active::after,
.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 用户操作区域的激活状态也添加下划线 */
.user-action.active::after,
.user-action.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
/* 搜索框样式 */
.search-bar {
  width: clamp(120px, 15vw, 280px); /* 流式宽度 */
  flex-shrink: 1; /* 允许收缩 */
  min-width: 120px; /* 最小宽度保护 */
}

.search-bar :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.search-bar :deep(.el-input__wrapper):hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
}

.search-bar :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.search-bar :deep(.el-input__inner) {
  color: #333;
  font-size: 14px;
}

.search-bar :deep(.el-input__inner)::placeholder {
  color: #999;
}

.search-bar :deep(.el-input-group__append) {
  background: transparent;
  border: none;
  box-shadow: none;
}

.search-bar :deep(.el-button) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  color: #ffffff;
  border-radius: 0 24px 24px 0;
  transition: all 0.3s ease;
}

.search-bar :deep(.el-button):hover {
  background: linear-gradient(135deg, #764ba2, #667eea);
  transform: scale(1.05);
}

/* 用户操作区域 */
.user-info {
  display: flex;
  align-items: center;
  gap: clamp(2px, 0.5vw, 8px); /* 流式间距 */
  flex-shrink: 0; /* 防止用户区域被挤压 */
}

.user-action {
  position: relative; /* 添加相对定位，以便支持下划线的绝对定位 */
  display: flex;
  align-items: center;
  gap: clamp(4px, 0.4vw, 6px);
  color: rgba(255, 255, 255, 0.95);
  font-size: clamp(11px, 0.8vw + 0.2rem, 14px); /* 流式字体 */
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  padding: clamp(6px, 0.5vw, 8px) clamp(10px, 1vw, 16px); /* 流式 padding */
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  white-space: nowrap; /* 防止换行 */
}

.user-action:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.user-action.active,
.user-action.router-link-active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

/* 图标样式优化 */
.user-action :deep(.el-icon) {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.user-action:hover :deep(.el-icon) {
  transform: scale(1.1);
}

.user-action.router-link-active :deep(.el-icon),
.user-action.active :deep(.el-icon) {
  color: #ffffff;
}

.user-action img {
  width: 18px;
  height: 18px;
  /* 移除滤镜，显示图片原色 */
  /* 添加白色发光效果让图标更清晰 */
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
  transition: transform 0.3s ease;
}

.user-action:hover img {
  transform: rotate(180deg);
}

/* ========== Edge 浏览器兼容性优化 ========== */

/* Edge 浏览器特定修复 - 防止高 DPI 缩放下的布局问题 */
@supports (-ms-ime-align: auto) {
  .header {
    /* Edge 专用：使用更稳定的 flex 布局 */
    display: -ms-flexbox;
    display: flex;
    -ms-flex-pack: justify;
  }
  
  .nav-links,
  .user-info {
    /* Edge 专用：防止元素压缩 */
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  
  .search-bar {
    /* Edge 专用：强制最小宽度 */
    min-width: 180px;
  }
}

/* ========== 响应式设计 ========== */

/* 大屏幕（1600px 以上）- 默认样式，无需调整 */

/* 超大笔记本（1440px - 1600px）*/
@media (max-width: 1600px) {
  .header {
    padding: 0 32px;
  }

  .nav-item {
    padding: 8px 18px;
  }

  .search-bar {
    width: 260px;
  }
}

/* 大笔记本（1366px - 1440px）- 最常见的笔记本分辨率 */
@media (max-width: 1440px) {
  .header {
    padding: 0 20px;
  }

  .title-link {
    font-size: 1.25rem;
  }

  .nav-links {
    gap: 4px;
  }

  .nav-item {
    font-size: 14px;
    padding: 8px 14px;
  }

  .search-bar {
    width: 200px;
  }

  .user-action {
    font-size: 13px;
    padding: 8px 10px;
    gap: 4px;
  }
}

/* 标准笔记本（1280px - 1366px）*/
@media (max-width: 1366px) {
  .header {
    padding: 0 16px;
  }

  .logo-img {
    height: 38px;
  }

  .title-link {
    font-size: 1.15rem;
  }

  .nav-links {
    gap: 3px;
  }

  .nav-item {
    font-size: 13px;
    padding: 7px 12px;
  }

  .search-bar {
    width: 180px;
  }

  .user-action {
    font-size: 12px;
    padding: 7px 8px;
  }

  .user-action :deep(.el-icon) {
    font-size: 16px;
  }
}

/* 小笔记本（1200px - 1280px）*/
@media (max-width: 1280px) {
  .header {
    padding: 0 12px;
  }

  .logo-img {
    height: 36px;
  }

  .title-link {
    font-size: 1.1rem;
  }

  .nav-links {
    gap: 2px;
  }

  .nav-item {
    font-size: 13px;
    padding: 6px 10px;
  }

  .search-bar {
    width: 160px;
  }

  .user-info {
    gap: 2px;
  }

  .user-action {
    font-size: 12px;
    padding: 6px 8px;
  }
}

/* 大笔记本（1400px - 1600px）- 轻微压缩 */
@media (max-width: 1600px) {
  .header {
    padding: 0 24px;
  }

  .logo-img {
    height: 38px;
  }

  .title-link {
    font-size: 1.15rem;
  }

  .nav-links {
    gap: 6px;
  }

  .nav-item {
    font-size: 13px;
    padding: 8px 12px;
  }

  .search-bar {
    width: 180px;
  }

  .user-info {
    gap: 6px;
  }

  .user-action {
    font-size: 12px;
    padding: 8px 10px;
  }
}

/* 标准笔记本（1300px - 1400px）- 中度压缩 */
@media (max-width: 1400px) {
  .header {
    padding: 0 16px;
  }

  .logo-img {
    height: 36px;
  }

  .title-link {
    font-size: 1.1rem;
  }

  .nav-links {
    gap: 4px;
  }

  .nav-item {
    font-size: 12px;
    padding: 7px 10px;
  }

  .search-bar {
    width: 160px;
  }

  .user-info {
    gap: 4px;
  }

  .user-action {
    font-size: 11px;
    padding: 7px 8px;
  }
}

/* 小笔记本（1200px - 1300px）- 高度压缩 */
@media (max-width: 1300px) {
  .header {
    padding: 0 12px;
  }

  .logo-img {
    height: 34px;
  }

  .title-link {
    font-size: 1rem;
  }

  .nav-links {
    gap: 3px;
  }

  .nav-item {
    font-size: 11px;
    padding: 6px 8px;
  }

  .search-bar {
    width: 140px;
  }

  .user-info {
    gap: 3px;
  }

  .user-action {
    font-size: 10px;
    padding: 6px 6px;
  }

  /* 缩短按钮文字 */
  .user-action span {
    max-width: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* Edge 浏览器 125% 缩放优化 (1536px 实际宽度 = 1920 × 125%) */
@media (max-width: 1550px) {
  .header {
    padding: 0 20px;
  }

  .logo-img {
    height: 38px;
  }

  .title-link {
    font-size: 1.1rem;
  }

  .nav-links {
    gap: 5px;
  }

  .nav-item {
    font-size: 12px;
    padding: 7px 10px;
  }

  .search-bar {
    width: 170px;
  }

  .user-info {
    gap: 5px;
  }

  .user-action {
    font-size: 11px;
    padding: 7px 9px;
  }
}

/* 小笔记本 + 125% 缩放 (1228px = 1536 × 80%) */
@media (max-width: 1400px) {
  .header {
    padding: 0 16px;
  }

  .logo-img {
    height: 36px;
  }

  .title-link {
    font-size: 1.05rem;
  }

  .nav-links {
    gap: 4px;
  }

  .nav-item {
    font-size: 11px;
    padding: 6px 9px;
  }

  .search-bar {
    width: 150px;
  }

  .user-info {
    gap: 4px;
  }

  .user-action {
    font-size: 11px;
    padding: 6px 8px;
  }
}

/* 小屏幕（1100px - 1200px）- 极度压缩，隐藏文字 */
@media (max-width: 1200px) {
  .header {
    padding: 0 10px;
  }

  .logo-img {
    height: 32px;
  }

  .title-link {
    font-size: 0.95rem;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-links {
    gap: 2px;
  }

  .nav-item {
    font-size: 11px;
    padding: 5px 6px;
  }

  .search-bar {
    width: 120px;
  }

  .user-info {
    gap: 2px;
  }

  .user-action {
    font-size: 11px;
    padding: 5px 5px;
  }

  /* 隐藏较长的文字，只保留图标 */
  .user-action span {
    display: none;
  }

  .user-action :deep(.el-icon) {
    font-size: 16px;
  }

  .user-action img {
    width: 16px;
    height: 16px;
  }
}

/* 平板（768px - 1024px）*/
@media (max-width: 1024px) {
  .header {
    padding: 0 12px;
    height: 56px;
  }

  .logo-img {
    height: 32px;
  }

  .title-link {
    font-size: 1rem;
  }

  .nav-links {
    gap: 2px;
  }

  .nav-item {
    font-size: 12px;
    padding: 6px 10px;
  }

  .search-bar {
    width: 150px;
  }

  .search-bar :deep(.el-input__inner) {
    font-size: 12px;
  }

  .user-action {
    padding: 6px 8px;
  }
}

/* 手机（小于 768px）- 移动端优先 */
@media (max-width: 768px) {
  .header {
    padding: 0 8px;
    height: 50px;
    gap: 8px;
  }

  .logo-img {
    height: 28px;
  }

  .title-link {
    display: none; /* 隐藏标题文字 */
  }

  .nav-links {
    display: none; /* 隐藏导航链接，需要实现汉堡菜单 */
  }

  .search-bar {
    flex: 1;
    width: auto;
    max-width: 200px;
  }

  .user-info {
    gap: 4px;
  }

  .user-action {
    padding: 4px 6px;
  }

  .user-action :deep(.el-icon) {
    font-size: 18px;
  }
}

/* ========== 台式机大屏幕适配 ========== */

/* 2K 台式机显示器 (2560×1440) */
@media (min-width: 2000px) and (max-width: 2600px) {
  .header {
    height: 72px;
    padding: 0 clamp(40px, 3vw, 60px);
    gap: clamp(16px, 2vw, 24px);
  }
  
  .logo-img {
    height: clamp(42px, 3.5vw, 52px);
  }
  
  .title-link {
    font-size: clamp(1.3rem, 1.4vw + 0.5rem, 1.6rem);
  }
  
  .nav-item {
    font-size: clamp(14px, 0.9vw + 0.3rem, 16px);
    padding: clamp(8px, 0.6vw, 10px) clamp(16px, 1.4vw, 24px);
  }
  
  .search-bar {
    width: clamp(240px, 18vw, 320px);
  }
  
  .user-action {
    font-size: clamp(14px, 0.9vw + 0.2rem, 16px);
    padding: clamp(8px, 0.6vw, 10px) clamp(14px, 1.2vw, 18px);
  }
  
  .user-action :deep(.el-icon) {
    font-size: 22px;
  }
}

/* 4K 台式机显示器 (3840×2160) */
@media (min-width: 2601px) and (max-width: 4000px) {
  .header {
    height: 88px;
    padding: 0 clamp(60px, 3.5vw, 100px);
    gap: clamp(20px, 2.5vw, 32px);
  }
  
  .logo-img {
    height: clamp(52px, 4vw, 64px);
  }
  
  .title-link {
    font-size: clamp(1.6rem, 1.6vw + 0.5rem, 2rem);
  }
  
  .nav-item {
    font-size: clamp(16px, 1vw + 0.3rem, 18px);
    padding: clamp(10px, 0.7vw, 12px) clamp(20px, 1.5vw, 28px);
  }
  
  .search-bar {
    width: clamp(300px, 20vw, 400px);
  }
  
  .search-bar :deep(.el-input__inner) {
    font-size: 16px;
    height: 44px;
  }
  
  .user-action {
    font-size: clamp(16px, 1vw + 0.2rem, 18px);
    padding: clamp(10px, 0.7vw, 12px) clamp(16px, 1.3vw, 20px);
  }
  
  .user-action :deep(.el-icon) {
    font-size: 26px;
  }
  
  .user-avatar {
    width: 44px;
    height: 44px;
  }
}

/* 5K 及以上显示器 (5120×2880+) */
@media (min-width: 4001px) {
  .header {
    height: 104px;
    padding: 0 clamp(80px, 4vw, 120px);
    gap: clamp(24px, 3vw, 40px);
  }
  
  .logo-img {
    height: clamp(64px, 4.5vw, 80px);
  }
  
  .title-link {
    font-size: clamp(2rem, 1.8vw + 0.5rem, 2.4rem);
  }
  
  .nav-item {
    font-size: clamp(18px, 1.1vw + 0.3rem, 20px);
    padding: clamp(12px, 0.8vw, 14px) clamp(24px, 1.6vw, 32px);
  }
  
  .search-bar {
    width: clamp(360px, 22vw, 480px);
  }
  
  .search-bar :deep(.el-input__inner) {
    font-size: 18px;
    height: 52px;
  }
  
  .user-action {
    font-size: clamp(18px, 1.1vw + 0.2rem, 20px);
    padding: clamp(12px, 0.8vw, 14px) clamp(18px, 1.4vw, 24px);
  }
  
  .user-action :deep(.el-icon) {
    font-size: 30px;
  }
  
  .user-avatar {
    width: 52px;
    height: 52px;
  }
}
</style>
