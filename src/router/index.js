// 路由配置文件
// 说明：此文件集中管理应用的路由配置。
// 约定：模块内部的子路由使用模块前缀（例如 TeachingCenter- 或 System-）来避免与顶级路由重名。
// 建议：顶部导航使用路由 name 进行跳转（<router-link :to="{ name: '...' }">），便于后续调整 path。
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomePage.vue'

// [修改] 导入学生端相关页面和布局，路径更新为 student-test
import StudentLayout from '../views/student-test/Layout.vue'; // 假设学生端布局文件
import ExamsPage from '../views/student-test/ExamsPage.vue';   // 已移动到 student-test 目录
import ExamStart from '../views/student-test/ExamStart.vue';   // 新增
import TakeExam from '../views/student-test/TakeExam.vue';     // 新增
import ExamResult from '../views/student-test/ExamResult.vue';

// 教学中心布局与页面
import TeachingCenterLayout from '../views/teaching-center/Layout.vue'
import TC_Courses from '../views/teaching-center/Courses.vue'
import TC_Practice from '../views/teaching-center/Practice.vue'
import TC_Exams from '../views/teaching-center/Exams.vue'
import TC_Classes from '../views/teaching-center/Classes.vue'
import TC_QuestionBank from '../views/teaching-center/QuestionBank.vue'
import ManualAddQuestion from '../views/teaching-center/ManualAddQuestion.vue'
import TC_ShootingRange from '../views/teaching-center/ShootingRange.vue'
import Handouts from '../views/teaching-center/Handouts.vue'
import Help from '../views/teaching-center/Help.vue'
import TC_ExamSettings from '../views/teaching-center/ExamSettings.vue'
import ExamMarking from '@/views/teaching-center/ExamMarking.vue';
import GradePaper from '@/views/teaching-center/GradePaper.vue';

// 顶部导航使用的顶级页面组件
import CoursesPage from '../views/CoursesPage.vue'
import PracticePage from '../views/PracticePage.vue'
// import ExamsPage from '../views/ExamsPage.vue' // 此行已移至学生端模块
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

// 其他页面
import MyPage from '../views/MyPage.vue'
import Messages from '../views/Messages.vue'
import Login from '../views/Login.vue'

const routes = [
  // 根路径重定向
  {
    path: '/',
    redirect: (to) => {
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null
      return token ? '/home' : '/login'
    }
  },
  { path: '/home', name: 'Home', component: Home },

  // 教学中心模块
  {
    path: '/teaching-center',
    name: 'TeachingCenter',
    component: TeachingCenterLayout,
    children: [
      { path: 'classes', name: 'TeachingCenter-Classes', component: TC_Classes },
      { path: 'courses', name: 'TeachingCenter-Courses', component: TC_Courses },
      { path: 'practice', name: 'TeachingCenter-Practice', component: TC_Practice },
      { path: 'exams', name: 'TeachingCenter-Exams', component: TC_Exams },
      { path: 'exam-settings/:id', name: 'TeachingCenter-ExamSettings', component: TC_ExamSettings },
      { path: 'exam-marking/:id', name: 'TeachingCenter-ExamMarking', component: ExamMarking },
      { path: 'grade-paper/:id', name: 'TeachingCenter-GradePaper', component: GradePaper },
      { path: 'question-bank', name: 'TeachingCenter-QuestionBank', component: TC_QuestionBank },
      { path: 'question/manual-add', name: 'TeachingCenter-ManualAddQuestion', component: ManualAddQuestion },
      { path: 'shooting-range', name: 'TeachingCenter-ShootingRange', component: TC_ShootingRange },
      { path: 'handouts', name: 'TeachingCenter-Handouts', component: Handouts },
      { path: 'help', name: 'TeachingCenter-Help', component: Help }
    ]
  },

  // 系统管理模块
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

  // 学生端模块
  {
    path: '/student',
    name: 'Student',
    component: StudentLayout,
    redirect: '/student/exams',
    children: [
      {
        path: 'exams',
        name: 'Student-Exams',
        component: ExamsPage
      },
      {
        path: 'exam/start/:id',
        name: 'Student-ExamStart',
        component: ExamStart
      },
      {
        path: 'exam/take/:id',
        name: 'Student-TakeExam',
        component: TakeExam
      },
      // 在 /student 路由的 children 数组中
      {
        path: 'exam/result/:id', // :id 是考试记录的ID
        name: 'Student-ExamResult',
        component: ExamResult
        
      }


    ]
  },

  // 顶级页面（用于顶部全局导航）
  { path: '/CoursesPage', name: 'Courses', component: CoursesPage },
  { path: '/PracticePage', name: 'Practice', component: PracticePage },
  { path: '/ShootingRangePage', name: 'ShootingRange', component: ShootingRangePage },
  { path: '/ClassesPage', name: 'Classes', component: ClassesPage },

  // 全局账户/消息/登录页面
  { path: '/my-page', name: 'MyPage', component: MyPage },
  { path: '/messages', name: 'Messages', component: Messages },
  { path: '/login', name: 'Login', component: Login }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null
  const isLoggedIn = !!token

  if (to.name === 'Login') {
    if (isLoggedIn) {
      next({ name: 'Home' })
    } else {
      next()
    }
  } else {
    if (isLoggedIn) {
      next()
    } else {
      const redirectPath = to.fullPath !== '/' ? to.fullPath : '/home'
      next({
        name: 'Login',
        query: { redirect: redirectPath }
      })
    }
  }
})

export default router