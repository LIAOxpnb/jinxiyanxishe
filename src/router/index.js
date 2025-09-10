// 路由配置文件
// 说明：此文件集中管理应用的路由配置。
// 约定：模块内部的子路由使用模块前缀（例如 TeachingCenter- 或 System-）来避免与顶级路由重名。
// 建议：顶部导航使用路由 name 进行跳转（<router-link :to="{ name: '...' }">），便于后续调整 path。
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomePage.vue'
// 教学中心布局与页面（使用 TC- 前缀以避免路由名冲突）
import TeachingCenterLayout from '../views/teaching-center/Layout.vue'
import TC_Courses from '../views/teaching-center/Courses.vue'
import TC_Practice from '../views/teaching-center/Practice.vue'
import TC_Exams from '../views/teaching-center/Exams.vue'
import TC_Classes from '../views/teaching-center/Classes.vue'
import TC_QuestionBank from '../views/teaching-center/QuestionBank.vue'
import TC_ShootingRange from '../views/teaching-center/ShootingRange.vue'
import Handouts from '../views/teaching-center/Handouts.vue'
import Help from '../views/teaching-center/Help.vue'
// 顶部导航使用的顶级页面组件
import CoursesPage from '../views/CoursesPage.vue'
import PracticePage from '../views/PracticePage.vue'
import ExamsPage from '../views/ExamsPage.vue'
import ShootingRangePage from '../views/ShootingRangePage.vue'
import ClassesPage from '../views/ClassesPage.vue'
// 系统管理模块
import SystemLayout from '../views/system-management/Layout.vue'
import Dashboard from '../views/system-management/Dashboard.vue'
import KnowledgeBase from '../views/system-management/KnowledgeBase.vue'
import ModelManagement from '../views/system-management/ModelManagement.vue'
import Organization from '../views/system-management/Organization.vue'
import UserManagement from '../views/system-management/UserManagement.vue'
import LecturerManagement from '../views/system-management/LecturerManagement.vue'
import CertificateManagement from '../views/system-management/CertificateManagement.vue'
import MessageManagement from '../views/system-management/MessageManagement.vue'
import MessageTemplates from '../views/system-management/MessageTemplates.vue'
import GlobalSettings from '../views/system-management/GlobalSettings.vue'
import DictionaryManagement from '../views/system-management/DictionaryManagement.vue'
import OperationLogs from '../views/system-management/OperationLogs.vue'
import MyPage from '../views/MyPage.vue'
import Messages from '../views/Messages.vue'
import Login from '../views/Login.vue'

// 路由列表
// 说明：
// - 顶级页面（如 Home、Courses）注册为顶级路由，便于 Header 做全局导航。
// - 模块页面（如教学中心、系统管理）使用 `Layout.vue` 作为父级 layout，并在其 children 中注册子页面。
// - 子页面的 name 建议加模块前缀（例如：TeachingCenter-Classes、System-Dashboard），避免同名冲突。
const routes = [
  // 根路径重定向：如果用户已登录则进入首页，否则进入登录页
  { 
    path: '/', 
    redirect: (to) => {
      const token = localStorage.getItem('token')
      return token ? '/home' : '/login'
    }
  },
  { path: '/home', name: 'Home', component: Home },
  {
    path: '/teaching-center',
    name: 'TeachingCenter',
    component: TeachingCenterLayout,
    children: [
      { path: 'classes', name: 'TeachingCenter-Classes', component: TC_Classes },
      { path: 'courses', name: 'TeachingCenter-Courses', component: TC_Courses },
      { path: 'practice', name: 'TeachingCenter-Practice', component: TC_Practice },
      { path: 'exams', name: 'TeachingCenter-Exams', component: TC_Exams },
      { path: 'question-bank', name: 'TeachingCenter-QuestionBank', component: TC_QuestionBank },
      { path: 'shooting-range', name: 'TeachingCenter-ShootingRange', component: TC_ShootingRange },
      { path: 'handouts', name: 'TeachingCenter-Handouts', component: Handouts },
      { path: 'help', name: 'TeachingCenter-Help', component: Help }
    ]
  },
  // 顶级页面（顶部导航使用）— 这些页面作为独立路由，便于 Header 做全局跳转
  { path: '/CoursesPage', name: 'Courses', component: CoursesPage },
  { path: '/PracticePage', name: 'Practice', component: PracticePage },
  { path: '/ExamsPage', name: 'Exams', component: ExamsPage },
  { path: '/ShootingRangePage', name: 'ShootingRange', component: ShootingRangePage },
  { path: '/ClassesPage', name: 'Classes', component: ClassesPage },
  // 系统管理模块路由（使用模块 Layout）：
  // - 默认重定向到 /system-management/dashboard
  // - 子路由命名建议使用 System- 前缀，便于与其他模块区分
  {
    path: '/system-management',
    name: 'SystemManagement',
    component: SystemLayout,
    redirect: '/system-management/dashboard',
    children: [
      { path: 'dashboard', name: 'System-Dashboard', component: Dashboard },
      { path: 'knowledge-base', name: 'System-KnowledgeBase', component: KnowledgeBase },
      { path: 'model-management', name: 'System-ModelManagement', component: ModelManagement },
      { path: 'organization', name: 'System-Organization', component: Organization },
      { path: 'user-management', name: 'System-UserManagement', component: UserManagement },
      { path: 'lecturer-management', name: 'System-LecturerManagement', component: LecturerManagement },
      { path: 'certificate-management', name: 'System-CertificateManagement', component: CertificateManagement },
      { path: 'message-management', name: 'System-MessageManagement', component: MessageManagement },
      { path: 'message-templates', name: 'System-MessageTemplates', component: MessageTemplates },
      { path: 'global-settings', name: 'System-GlobalSettings', component: GlobalSettings },
      { path: 'dictionary-management', name: 'System-DictionaryManagement', component: DictionaryManagement },
      { path: 'operation-logs', name: 'System-OperationLogs', component: OperationLogs }
    ]
  },
  // 全局账户/消息/登录页面
  { path: '/my-page', name: 'MyPage', component: MyPage },
  { path: '/messages', name: 'Messages', component: Messages },
  { path: '/login', name: 'Login', component: Login }
]

// 创建路由实例并导出
// 注意：这里使用 HTML5 history 模式（createWebHistory），在某些部署环境下需配置后端重写规则以保证刷新不返回 404。
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查用户登录状态
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录（通过localStorage中的token判断）
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token
  
  // 如果访问登录页面
  if (to.name === 'Login') {
    // 如果已经登录，重定向到首页
    if (isLoggedIn) {
      next({ name: 'Home' })
    } else {
      next()
    }
  } else {
    // 访问其他页面时，检查是否已登录
    if (isLoggedIn) {
      next()
    } else {
      // 未登录，重定向到登录页面
      // 保存用户想要访问的页面，登录后可以跳转回去
      const redirectPath = to.fullPath !== '/' ? to.fullPath : '/home'
      next({ 
        name: 'Login', 
        query: { redirect: redirectPath }
      })
    }
  }
})

export default router
