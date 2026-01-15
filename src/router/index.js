// 路由配置文件
// 说明：此文件已转换为“懒加载”模式，以提升应用首屏加载性能。
import { createRouter, createWebHistory } from 'vue-router'

// 布局组件和首页通常可以保持静态导入，因为它们是应用的核心骨架
import Home from '../views/HomePage.vue'
import TeachingCenterLayout from '../views/teaching-center/Layout.vue'
import SystemLayout from '../views/system-management/Layout.vue'
import StudentLayout from '../views/student-test/Layout.vue';
import Login from '../views/Login.vue';

const routes = [
  // 根路径重定向
  {
    path: '/',
    redirect: (to) => {
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null
      return token ? '/home' : '/login'
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login', 
    component: Login
   },

  // 教学中心模块 (懒加载)
  {
    path: '/teaching-center',
    name: 'TeachingCenter',
    component: TeachingCenterLayout,
    children: [
      { path: 'classes', name: 'TeachingCenter-Classes', component: () => import('../views/teaching-center/classes/Classes.vue') },
      { path: 'courses', name: 'TeachingCenter-Courses', component: () => import('../views/teaching-center/courses/Courses.vue') },
      { path: 'practice', name: 'TeachingCenter-Practice', component: () => import('../views/teaching-center/practice/Practice.vue') },
      { path: 'exams', name: 'TeachingCenter-Exams', component: () => import('../views/teaching-center/exams/Exams.vue') },
      { path: 'question-bank', name: 'TeachingCenter-QuestionBank', component: () => import('../views/teaching-center/question_bank/QuestionBank.vue') },
      { path: 'range', name: 'TeachingCenter-ShootingRange', component: () => import('../views/teaching-center/range/ShootingRange.vue') },
      { path: 'adjustment-data', name: 'TeachingCenter-AdjustmentData', component: () => import('../views/teaching-center/adjustment-data/AdjustmentData.vue') },
      { path: 'courseware', name: 'TeachingCenter-Courseware', component: () => import('../views/teaching-center/courseware/CoursewareManagement.vue') },
      { path: 'help', name: 'TeachingCenter-Help', component: () => import('../views/teaching-center/Help.vue') }
    ]
  },

  // 系统管理模块 (懒加载)
  {
    path: '/system-management',
    name: 'SystemManagement',
    component: SystemLayout,
    redirect: '/system-management/dashboard',
    children: [
      { path: 'dashboard', name: 'System-Dashboard', component: () => import('../views/system-management/Dashboard.vue') },
      { path: 'knowledge-base', name: 'System-KnowledgeBase', component: () => import('../views/system-management/KnowledgeBase.vue') },
      { path: 'model-management', name: 'System-ModelManagement', component: () => import('../views/system-management/ModelManagement.vue') },
      { path: 'organization', name: 'System-Organization', component: () => import('../views/system-management/Organization.vue') },
      { path: 'user-management', name: 'System-UserManagement', component: () => import('../views/system-management/UserManagement.vue') },
      { path: 'lecturer-management', name: 'System-LecturerManagement', component: () => import('../views/system-management/LecturerManagement.vue') },
      { path: 'certificate-management', name: 'System-CertificateManagement', component: () => import('../views/system-management/CertificateManagement/CertificateManagement.vue') },
      { path: 'message-management', name: 'System-MessageManagement', component: () => import('../views/system-management/MessageManagement.vue') },
      { path: 'message-templates', name: 'System-MessageTemplates', component: () => import('../views/system-management/MessageTemplates.vue') },
      { path: 'global-settings', name: 'System-GlobalSettings', component: () => import('../views/system-management/GlobalSettings.vue') },
      { path: 'tool-management', name: 'System-ToolManagement', component: () => import('../views/system-management/ToolManagement.vue') },
      { path: 'dictionary-management', name: 'System-DictionaryManagement', component: () => import('../views/system-management/DictionaryManagement.vue') },
      { path: 'operation-logs', name: 'System-OperationLogs', component: () => import('../views/system-management/OperationLogs.vue') },
      { path: 'back-end-permissions', name: 'System-BackEndPermissions', component: () => import('../views/system-management/Back-end-permissions.vue') }
    ]
  },

  // 学生端模块 (懒加载)
  {
    path: '/student',
    name: 'Student',
    component: StudentLayout,
    redirect: '/student/exams',
    children: [
      { path: 'exams', name: 'Student-Exams', component: () => import('../views/student-test/ExamsPage.vue') },
      { path: 'exam/start/:id', name: 'Student-ExamStart', component: () => import('../views/student-test/ExamStart.vue') },
      { path: 'exam/take/:id', name: 'Student-TakeExam', component: () => import('../views/student-test/TakeExam.vue') },
      { path: 'exam/result/:id', name: 'Student-ExamResult', component: () => import('../views/student-test/ExamResult.vue') }
    ]
  },

  // 顶级页面 (懒加载)
  { path: '/ClassRoomPage', name: 'Courses', component: () => import('../views/class-room/ClassRoomPage.vue') },
  { path: '/classroom/details/:id', name: 'ClassRoomDetails', component: () => import('../views/class-room/ClassRoomDetails.vue') },
  { path: '/PracticePage', name: 'Practice', component: () => import('../views/practice/PracticePage.vue') },
  { path: '/PracticePage/take/:id', name: 'TakePractice', component: () => import('../views/practice/TakePractice.vue') },
  { path: '/practice/result/:recordId',name: 'StudentPracticeResult',component: () => import('@/views/practice/PracticeResult.vue'), meta: { title: '练习结果' }
},
  { path: '/ShootingRangePage', name: 'ShootingRange', component: () => import('../views/shooting-rangePage/ShootingRangePage.vue') },
  { path: '/shooting-range/detail/:id', name: 'ShootingRangeDetail', component: () => import('../views/shooting-rangePage/ShootingRangeDetail.vue') },
  { path: '/shooting-range/take/:id', name: 'TakeShootingRange', component: () => import('../views/shooting-rangePage/TakeShootingRange.vue') },
  { path: '/shooting-range/result/:id', name: 'ShootingRangeResult', component: () => import('../views/shooting-rangePage/ShootingRangeResult.vue') },
  
  // 教学中心 - 全屏独立页面（设置、配置、阅卷等，不显示左侧导航栏）
  { path: '/teaching-center/classes/settings/:id', name: 'TeachingCenter-ClassSettings', component: () => import('../views/teaching-center/classes/ClassSettings.vue') },
  { path: '/teaching-center/classes/members/:id', name: 'TeachingCenter-MemberManagement', component: () => import('../views/teaching-center/classes/MemberManagement.vue') },
  { path: '/teaching-center/courses/provision/:id', name: 'TeachingCenter-CourseProvision', component: () => import('../views/teaching-center/courses/CurriculumProvision.vue') },
  { path: '/teaching-center/courses/statistics/:id', name: 'TeachingCenter-CourseStatistics', component: () => import('../views/teaching-center/courses/CourseStatistics.vue') },
  { path: '/teaching-center/practice/settings/:id', name: 'TeachingCenter-PracticeSettings', component: () => import('../views/teaching-center/practice/PracticeSettings.vue') },
  { path: '/teaching-center/exam-settings/:id', name: 'TeachingCenter-ExamSettings', component: () => import('../views/teaching-center/exams/ExamSettings.vue') },
  { path: '/teaching-center/exam-marking/:id', name: 'TeachingCenter-ExamMarking', component: () => import('../views/teaching-center/exams/ExamMarking.vue') },
  { path: '/teaching-center/grade-paper/:id', name: 'TeachingCenter-GradePaper', component: () => import('../views/teaching-center/exams/GradePaper.vue') },
  { path: '/teaching-center/question/manual-add', name: 'TeachingCenter-ManualAddQuestion', component: () => import('../views/teaching-center/question_bank/ManualAddQuestion.vue') },
  { path: '/teaching-center/question/ai-generate', name: 'TeachingCenter-AiGenerateQuestion', component: () => import('../views/teaching-center/question_bank/AiGenerateQuestion.vue') },
  { path: '/teaching-center/range/rangesetup/:id', name: 'TeachingCenter-ShootingRangeSetup', component: () => import('../views/teaching-center/range/RangeSetup.vue') },
  { path: '/teaching-center/range/rangemarking/:id', name: 'TeachingCenter-ShootingRangeMarking', component: () => import('../views/teaching-center/range/RangeMarking.vue') },
  { path: '/teaching-center/range/rangegradepaper/:id', name: 'TeachingCenter-ShootingRangeGradePaper', component: () => import('../views/teaching-center/range/RangeGradePaper.vue') },
  { path: '/teaching-center/adjustment-data/manage/:id', name: 'TeachingCenter-DataManagement', component: () => import('../views/teaching-center/adjustment-data/DataManagement.vue') },
  
  // 系统管理 - 全屏独立页面（证书设置等，不显示左侧导航栏）
  { path: '/system-management/certificate-settings', name: 'System-CertificateSettings', component: () => import('../views/system-management/CertificateManagement/CertificateSettings.vue') },
  { path: '/system-management/certificate-settings/:id', name: 'System-CertificateEdit', component: () => import('../views/system-management/CertificateManagement/CertificateSettings.vue') },
  
  // 全局账户/消息 (懒加载)
  { path: '/my-page', name: 'MyPage', component: () => import('../views/my-page/MyPage.vue') },
  { 
    path: '/messages', 
    name: 'Messages', 
    component: () => import('../views/message/Messages.vue'),
    // 添加重定向，默认显示系统通知
    redirect: '/messages/announcements',
    // 添加子路由
    children: [
      {
        path: 'announcements',
        name: 'SystemAnnouncements',
        component: () => import('../views/message/SystemAnnouncements.vue')
      },
      {
        path: 'private',
        name: 'PrivateLetter',
        component: () => import('../views/message/PrivateLetter.vue')
      }
    ]
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：登录校验 + 模块权限校验（系统管理/教学中心）
router.beforeEach((to, from, next) => {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null
  const isLoggedIn = !!token

  // 未登录：仅允许进入登录页，其余跳登录并带上 redirect
  if (!isLoggedIn && to.name !== 'Login') {
    const redirectPath = to.fullPath !== '/' ? to.fullPath : '/home'
    return next({ name: 'Login', query: { redirect: redirectPath } })
  }

  // 已登录或目标为登录页
  if (to.name === 'Login') {
    return isLoggedIn ? next({ name: 'Home' }) : next()
  }

  // 权限来源需与 Header.vue 一致：sessionStorage.userPermissions
  let permissions = []
  try {
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userPermissions') : null
    permissions = raw ? JSON.parse(raw) : []
  } catch (e) {
    permissions = []
  }

  const hasAll = permissions.includes('*')
  const needSystem = to.path.startsWith('/system-management')
  const needTeaching = to.path.startsWith('/teaching-center')

  // 无系统管理权限，禁止访问 /system-management/**
  if (needSystem && !(hasAll || permissions.includes('system:setting'))) {
    return next({ name: 'Home' })
  }

  // 无教学中心权限，禁止访问 /teaching-center/**
  if (needTeaching && !(hasAll || permissions.includes('teacher:setting'))) {
    return next({ name: 'Home' })
  }

  return next()
})

export default router