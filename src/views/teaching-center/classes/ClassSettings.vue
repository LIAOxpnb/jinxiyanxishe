<template>
  <div class="class-settings">
    <div class="page-header">
      <el-button type="text" @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <div class="page-title">{{ clazzName }}</div>
    </div>
    <!-- 主体布局 -->
    <div class="main-layout">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- 学习内容选择 -->
        <div class="content-selector">
          <el-select v-model="activeContentType" placeholder="选择学习内容类型" @change="handleContentTypeChange">
            <el-option label="学习内容" value="all" />
            <el-option label="课程" value="course" />
            <el-option label="考试" value="exam" />
            <el-option label="靶场" value="shooting" />
          </el-select>
        </div>

        <!-- 内容列表 -->
        <div class="content-list">
      <div class="list-header">
        <div class="header-left">
          <el-checkbox v-model="selectAll" @change="handleSelectAll">节名称</el-checkbox>
        </div> 
        <div class="header-right">
          <span>排序</span>
          <span>操作</span>
        </div>
      </div>

      <div class="list-items">
        <div 
          v-for="(item, index) in displayList" 
          :key="item.id"
          class="list-item"
        >
          <div class="item-left">
            <el-checkbox 
              v-model="item.selected" 
              @change="updateSelectAll"
              :class="getItemClass(item.type)"
            >
              <span class="item-content">
                <span :class="getItemIconClass(item.type)" class="item-type-tag">{{ getItemTypeLabel(item.type) }}</span>
                <span class="item-name">{{ item.name }}</span>
              </span>
            </el-checkbox>
          </div>
          <div class="item-right">
            <div class="sort-buttons">
              <el-button 
                size="small" 
                :disabled="index === 0"
                @click="moveUp(index)"
              >
                ↑
              </el-button>
              <el-button 
                size="small" 
                :disabled="index === displayList.length - 1"
                @click="moveDown(index)"
              >
                ↓
              </el-button>
            </div>
            <div class="action-buttons">
              <!-- <el-link type="primary" @click="editItem(item)">设置</el-link> -->
              <el-link type="danger" @click="removeItem(item)">移除</el-link>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="displayList.length === 0" class="empty-state">
          暂无数据
        </div>
      </div>

      <!-- 底部操作区 -->
      <!-- <div class="bottom-actions">
        <el-button @click="cancelSelection">取消</el-button>
        <el-button type="primary" @click="confirmAction">确定</el-button>
      </div> -->
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-button type="primary" link :icon="Edit">编辑</el-button>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="班级名称">{{ classDetails.name || clazzName }}</el-descriptions-item>
            <!-- <el-descriptions-item label="学习时间">{{ classDetails.studyTime || '用户姓名' }}</el-descriptions-item> -->
            <el-descriptions-item label="创建人">{{ classDetails.creatorName || '用户姓名' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ classDetails.createTime || 'YY-MM-DD HH:mm:ss' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="certificate-card">
          <template #header>
            <div class="card-header">
              <span>证书</span>
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </div>
          </template>
          <div class="certificate-content">
            <div class="certificate-empty">暂无证书，请联系管理员配置</div>
            <el-input placeholder="证书名称" disabled />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加考试弹窗 -->
    <el-dialog 
      v-model="addExamDialogVisible" 
      title="添加考试"
      width="1200px"
      :before-close="closeAddExamDialog"
    >
      <div class="add-exam-dialog">
        <!-- <div class="dialog-tip">
          可选择指定了当前班级可用，且发布了的考试
          <span class="tip-warning">【备注】只查询已发布，且未选择当前班级的考试</span>
        </div> -->

        <div class="dialog-filters">
          <FilterBar
            :fields="examFilterFields"
            create-button-text="新建考试"
            @create="createNewExam"
            @filter="onExamFilter"
          />
          <!-- <span class="filter-note">【备注】创建后自动拉起创建题库</span> -->
        </div>

        <div class="exam-list">
          <div class="exam-list-header">
            <el-checkbox v-model="examSelectAll" @change="handleExamSelectAll">考试名称</el-checkbox>
            <span>考试时间</span>
            <span>总分</span>
            <span>合格分</span>
            <span>创建人</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>

          <div class="exam-list-items">
            <div 
              v-for="exam in examList" 
              :key="exam.id"
              class="exam-item"
            >
              <el-checkbox v-model="exam.selected" @change="updateExamSelectAll">
                {{ exam.name }}
              </el-checkbox>
              <span>{{ exam.examTime }}</span>
              <span>{{ exam.totalScore }}</span>
              <span>{{ exam.passScore }}</span>
              <span>{{ exam.creatorName }}</span>
              <span>{{ exam.createTime }}</span>
              <el-link type="primary" @click="editExam(exam)">查看</el-link>
            </div>
          </div>

          <div class="exam-list-pagination">
            <el-checkbox v-model="examSelectAllPages">全选</el-checkbox>
            <span class="total-count">总共{{ examPagination.total }}条</span>
            <el-pagination
              v-model:current-page="examPagination.page"
              v-model:page-size="examPagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="examPagination.total"
              layout="sizes, prev, pager, next"
              @size-change="handleExamSizeChange"
              @current-change="handleExamPageChange"
            />
          </div>
        </div>

        <div class="dialog-actions">
          <el-button @click="cancelAddExam">取消</el-button>
          <el-button type="primary" @click="confirmAddExam">确定</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加课程弹窗 -->
    <el-dialog 
      v-model="addCourseDialogVisible" 
      title="添加课程"
      width="1200px"
      :before-close="closeAddCourseDialog"
    >
      <div class="add-course-dialog">
        <div class="dialog-tip">
          可选择指定了当前班级可用的课程
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <el-button type="primary" style="margin-right: 20px;" @click="createNewCourse">新建课程</el-button>
          <el-input 
            v-model="courseFilters.name" 
            placeholder="课程名称" 
            style="width: 200px; margin-right: 10px;"
            clearable
          />
          <el-input 
            v-model="courseFilters.creatorName" 
            placeholder="创建人" 
            style="width: 150px; margin-right: 10px;"
            clearable
          />
          <el-select 
            v-model="courseFilters.category" 
            placeholder="分类" 
            style="width: 150px; margin-right: 10px;"
            clearable
          >
            <el-option 
              v-for="option in courseCategoryOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value"
            />
          </el-select>
          <el-button @click="onCourseFilter">筛选</el-button>
          <el-button @click="loadCourseList" style="margin-left: auto;">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>

        <div class="course-list">
          <div class="course-list-header">
            <el-checkbox v-model="courseSelectAll" @change="handleCourseSelectAll">课程名称</el-checkbox>
            <span>学习时间</span>
            <span>创建人</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>

          <div class="course-list-items">
            <div 
              v-for="course in courseList" 
              :key="course.id"
              class="course-item"
            >
              <el-checkbox v-model="course.selected" @change="updateCourseSelectAll">
                {{ course.name }}
              </el-checkbox>
              <span>{{ course.studyTime || '不限制' }}</span>
              <span>{{ course.creatorName }}</span>
              <span>{{ course.createTime }}</span>
              <span><el-link type="primary" @click="viewCourse(course)">查看</el-link></span>
            </div>
          </div>

          <div class="course-list-pagination">
            <el-checkbox v-model="courseSelectAllPages">全选</el-checkbox>
            <span class="total-count">总共{{ coursePagination.total }}条</span>
            <el-pagination
              v-model:current-page="coursePagination.page"
              v-model:page-size="coursePagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="coursePagination.total"
              layout="sizes, prev, pager, next"
              @size-change="handleCourseSizeChange"
              @current-change="handleCoursePageChange"
            />
          </div>
        </div>

        <div class="dialog-actions">
          <el-button @click="closeAddCourseDialog">取消</el-button>
          <el-button type="primary" @click="confirmAddCourse">确定</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加靶场弹窗 -->
    <el-dialog 
      v-model="addShootingDialogVisible" 
      title="添加靶场"
      width="1200px"
      :before-close="closeAddShootingDialog"
    >
      <div class="add-shooting-dialog">
        <div class="dialog-tip">
          可选择指定了当前班级可用的靶场【备注】只查询已发布，且未选的指定当前班级可用的靶场；
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <el-button type="primary" style="margin-right: 20px;" @click="createNewShooting">新建靶场</el-button>
          <el-input 
            v-model="shootingFilters.name" 
            placeholder="靶场名称" 
            style="width: 200px; margin-right: 10px;"
            clearable
          />
          <el-input 
            v-model="shootingFilters.creatorName" 
            placeholder="创建人" 
            style="width: 150px; margin-right: 10px;"
            clearable
          />
          <el-select 
            v-model="shootingFilters.category" 
            placeholder="分类" 
            style="width: 150px; margin-right: 10px;"
            clearable
          >
            <el-option 
              v-for="option in shootingRangeCategoryOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value"
            />
          </el-select>
          <el-button @click="onShootingFilter">筛选</el-button>
          <el-button @click="loadShootingList" style="margin-left: auto;">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>

        <div class="shooting-list">
          <div class="shooting-list-header">
            <el-checkbox v-model="shootingSelectAll" @change="handleShootingSelectAll">靶场名称</el-checkbox>
            <span>比武时间</span>
            <span>总分</span>
            <span>合格分</span>
            <span>创建人</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>

          <div class="shooting-list-items">
            <div 
              v-for="shooting in shootingList" 
              :key="shooting.id"
              class="shooting-item"
            >
              <el-checkbox v-model="shooting.selected" @change="updateShootingSelectAll">
                {{ shooting.name }}
              </el-checkbox>
              <span>{{ shooting.competitionTime || '不限制' }}</span>
              <span>{{ shooting.totalScore || 100 }}</span>
              <span>{{ shooting.qualified || 80 }}</span>
              <span>{{ shooting.creatorName }}</span>
              <span>{{ shooting.createTime }}</span>
              <span><el-link type="primary" @click="viewShooting(shooting)">查看</el-link></span>
            </div>
          </div>

          <div class="shooting-list-pagination">
            <el-checkbox v-model="shootingSelectAllPages">全选</el-checkbox>
            <span class="total-count">总共{{ shootingPagination.total }}条</span>
            <el-pagination
              v-model:current-page="shootingPagination.page"
              v-model:page-size="shootingPagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="shootingPagination.total"
              layout="sizes, prev, pager, next"
              @size-change="handleShootingSizeChange"
              @current-change="handleShootingPageChange"
            />
          </div>
        </div>

        <div class="dialog-actions">
          <el-button @click="closeAddShootingDialog">取消</el-button>
          <el-button type="primary" @click="confirmAddShooting">确定</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import FilterBar from '@/components/common/FilterBar.vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit, QuestionFilled, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getClazzBind, 
  addClazzBind, 
  delClazzBind, 
  getCanJoinExamList,
  getClassList
} from '@/api/teaching-center/ClassManagement.js'
import { getCourseList } from '@/api/teaching-center/CourseManagement.js'
import { getShootingRangeList } from '@/api/teaching-center/ShootingRange.js'
import { getDictData } from '@/api/system-management/dictionary'

const route = useRoute()
const router = useRouter()
const classId = route.params.id || route.query.id

// 班级名称优先从路由参数拿，若无则使用回退文本
const clazzName = ref(route.query.name || route.params.name || `班级ID:${classId || ''}`)

const goBack = () => {
  // 优先后退历史
  if (window.history.length > 1) {
    router.back()
    return
  }
  // 无历史则跳回班级列表页（假设路由为 /teaching-center/classes）
  router.push({ path: '/teaching-center/classes' })
}

// 响应式数据
const activeContentType = ref('all')
const selectAll = ref(false)
const bindList = ref([])

// 考试相关
const addExamDialogVisible = ref(false)
const examList = ref([])
const examSelectAll = ref(false)
const examSelectAllPages = ref(false)

// 课程相关
const addCourseDialogVisible = ref(false)
const courseList = ref([])
const courseSelectAll = ref(false)
const courseSelectAllPages = ref(false)

// 靶场相关
const addShootingDialogVisible = ref(false)
const shootingList = ref([])
const shootingSelectAll = ref(false)
const shootingSelectAllPages = ref(false)

const classDetails = ref({
  name: '',
  studyTime: '',
  creatorName: '',
  createTime: ''
})

// 字典数据
const courseCategoryOptions = ref([])
const shootingRangeCategoryOptions = ref([])

// 筛选条件
const courseFilters = reactive({
  name: '',
  creatorName: '',
  category: ''
})

const shootingFilters = reactive({
  name: '',
  creatorName: '',
  category: ''
})

// 获取字典数据
const loadDictionaries = async () => {
  try {
    // 获取课程分类字典
    const courseRes = await getDictData('course_category')
    if (courseRes.code === 200 && courseRes.data) {
      courseCategoryOptions.value = courseRes.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue
      }))
    }
    
    // 获取靶场分类字典
    const shootingRes = await getDictData('shooting_range_category')
    if (shootingRes.code === 200 && shootingRes.data) {
      shootingRangeCategoryOptions.value = shootingRes.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue
      }))
    }
  } catch (error) {
    console.error('加载字典数据失败:', error)
  }
}

// 分页数据
const examPagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const coursePagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const shootingPagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 弹窗顶部筛选字段配置
const examFilterFields = [
  { type: 'input', model: 'name', placeholder: '课程/考试名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  // 如果有分类数据可动态赋值
  { type: 'select', model: 'examCategory', placeholder: '分类', options: [] }
]

// 计算属性
const displayList = computed(() => {
  if (activeContentType.value === 'all') {
    return bindList.value
  }
  return bindList.value.filter(item => item.type === activeContentType.value)
})

// 获取班级绑定的内容
const loadBindList = async () => {
  if (!classId) return
  
  try {
    const response = await getClazzBind(classId)
    console.log('班级绑定数据:', response)
    
    if (response.code === 200 && response.data) {
      const allItems = []
      // 尝试从接口响应中提取班级名称：
      // 接口 selClazzBind?id=xxx 可能返回 data.records，records 中包含 name 字段表示班级名
      try {
        if (Array.isArray(response.data.records) && response.data.records.length > 0) {
          // 取第一个记录的 name 作为班级名称（服务器端接口返回的格式示例）
          const r = response.data.records[0]
          if (r && r.name) {
            clazzName.value = r.name
          }
        } else if (response.data.name) {
          clazzName.value = response.data.name
        }
      } catch (e) {
        // 忽略
      }
      
      // 遍历返回的数组，根据不同的名称字段判断类型和显示内容
      response.data.forEach(item => {
        // 检查是否是课程
        if (item.courseName) {
          allItems.push({
            id: item.id,
            name: item.courseName,
            type: 'course',
            selected: false,
            clazzId: item.clazzId,
            courseId: item.courseId,
            bindId: item.id // 用于删除时使用
          })
        }
        
        // 检查是否是考试
        if (item.examName) {
          allItems.push({
            id: item.id,
            name: item.examName,
            type: 'exam',
            selected: false,
            clazzId: item.clazzId,
            examId: item.examId,
            bindId: item.id // 用于删除时使用
          })
        }
        
        // 检查是否是靶场
        if (item.shootingRangeName) {
          allItems.push({
            id: item.id,
            name: item.shootingRangeName,
            type: 'shooting',
            selected: false,
            clazzId: item.clazzId,
            shootingRangeId: item.shootingRangeId,
            bindId: item.id // 用于删除时使用
          })
        }
      })
      
      bindList.value = allItems
      console.log('处理后的绑定列表:', allItems)
    }
  } catch (error) {
    console.error('加载班级绑定数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

// 处理学习内容类型变化
const handleContentTypeChange = (value) => {
  if (value === 'course') {
    // 打开添加课程弹窗
    addCourseDialogVisible.value = true
    loadCourseList()
    // 重置下拉框为"学习内容"
    activeContentType.value = 'all'
  } else if (value === 'exam') {
    // 打开添加考试弹窗
    addExamDialogVisible.value = true
    loadExamList()
    // 重置下拉框为"学习内容"
    activeContentType.value = 'all'
  } else if (value === 'shooting') {
    // 打开添加靶场弹窗
    addShootingDialogVisible.value = true
    loadShootingList()
    // 重置下拉框为"学习内容"
    activeContentType.value = 'all'
  } else {
    // 如果选择"学习内容"，只是刷新列表
    loadBindList()
  }
}

// 获取可加入的考试列表，可接收筛选条件 filters
const loadExamList = async (filters = {}) => {
  try {
    const response = await getCanJoinExamList({
      page: examPagination.page,
      size: examPagination.size,
      clazzId: classId,
      examCategory: filters.examCategory || '',
      name: filters.name || '',
      creator: filters.creator || ''
    })
    
    console.log('可加入考试列表:', response)
    
    if (response.code === 200 && response.data) {
      examList.value = response.data.records.map(exam => {
        // 处理考试时间
        let examTime = '不限制'
        if (exam.startTime && exam.endTime) {
          examTime = `${exam.startTime} 至 ${exam.endTime}`
        }

        // 合格分：使用 qualified 字段
        const passScore = exam.qualified || 0

        // 创建人
        const creatorName = exam.creatorName || ''

        // 总分：从题目列表计算或使用固定值
        // 如果后端没有返回总分，可能需要从其他地方获取
        const totalScore = exam.score || exam.totalScore || 100

        return {
          id: exam.id,
          name: exam.name,
          selected: false,
          examTime,
          totalScore,
          passScore,
          creatorName,
          createTime: exam.createTime || '',
          raw: exam
        }
      })
      examPagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载考试列表失败:', error)
    ElMessage.error('加载考试列表失败')
  }
}

// 处理 FilterBar 的筛选事件
const onExamFilter = (filterData) => {
  examPagination.page = 1
  loadExamList(filterData)
}

// 获取可加入的课程列表
const loadCourseList = async (filters = {}) => {
  try {
    const response = await getCourseList({
      page: coursePagination.page,
      size: coursePagination.size,
      courseCategory: filters.course_category || '',
      name: filters.name || '',
      creator: filters.creator || '',
      status: 1,  // 只查询已发布的课程
      isMe: true,  // 查询我的课程
      currentClazzId: classId  // 当前班级ID
    })
    
    console.log('可加入课程列表:', response)
    
    if (response.code === 200 && response.data) {
      courseList.value = response.data.records.map(course => {
        const categoryValue = course.courseCategory || course.course_category || ''
        const categoryOption = courseCategoryOptions.value.find(opt => opt.value === categoryValue)
        
        // 处理学习时间
        let studyTime = '不限制'
        if (course.startTime && course.endTime) {
          studyTime = `${course.startTime} - ${course.endTime}`
        }
        
        return {
          id: course.id,
          name: course.name,
          selected: false,
          studyTime: studyTime,
          category: categoryOption ? categoryOption.label : categoryValue,
          creatorName: course.creatorName || course.creator || '',
          createTime: course.createTime || '',
          raw: course
        }
      })
      coursePagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载课程列表失败:', error)
    ElMessage.error('加载课程列表失败')
  }
}

// 课程筛选
const onCourseFilter = () => {
  coursePagination.page = 1
  loadCourseList({
    name: courseFilters.name,
    creator: courseFilters.creatorName,
    course_category: courseFilters.category
  })
}

// 获取可加入的靶场列表
const loadShootingList = async (filters = {}) => {
  try {
    const response = await getShootingRangeList({
      page: shootingPagination.page,
      size: shootingPagination.size,
      shootingRangeCategory: filters.shootingRangeCategory || '',
      shootingRangeType: filters.shootingRangeType !== undefined ? filters.shootingRangeType : '',
      name: filters.name || '',
      status: 1,  // 只查询已发布的靶场
      isMe: true,  // 查询我的靶场
      currentClazzId: classId  // 当前班级ID
    })
    
    console.log('可加入靶场列表:', response)
    
    if (response.code === 200 && response.data) {
      shootingList.value = response.data.records.map(shooting => {
        const categoryValue = shooting.shootingRangeCategory || ''
        const categoryOption = shootingRangeCategoryOptions.value.find(opt => opt.value === categoryValue)
        
        // 处理比武时间
        let competitionTime = '不限制'
        if (shooting.startTime && shooting.endTime) {
          competitionTime = `${shooting.startTime} 至 ${shooting.endTime}`
        }
        
        return {
          id: shooting.id,
          name: shooting.name,
          selected: false,
          competitionTime: competitionTime,
          totalScore: shooting.totalScore || shooting.total_score || 100,
          qualified: shooting.qualified || 80,
          type: shooting.shootingRangeType === 0 ? '训练' : '比武',
          category: categoryOption ? categoryOption.label : categoryValue,
          creatorName: shooting.creatorName || '',
          createTime: shooting.createTime || '',
          raw: shooting
        }
      })
      shootingPagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载靶场列表失败:', error)
    ElMessage.error('加载靶场列表失败')
  }
}

// 靶场筛选
const onShootingFilter = () => {
  shootingPagination.page = 1
  loadShootingList({
    name: shootingFilters.name,
    creatorName: shootingFilters.creatorName,
    shootingRangeCategory: shootingFilters.category
  })
}

// 获取项目样式类名
const getItemClass = (type) => {
  const classMap = {
    course: 'item-course',
    exam: 'item-exam', 
    shooting: 'item-shooting'
  }
  return classMap[type] || ''
}

// 获取项目类型图标样式类名
const getItemIconClass = (type) => {
  const classMap = {
    course: 'tag-course',
    exam: 'tag-exam',
    shooting: 'tag-shooting'
  }
  return classMap[type] || ''
}

// 获取项目类型标签文字
const getItemTypeLabel = (type) => {
  const labelMap = {
    course: '课',
    exam: '考',
    shooting: '靶'
  }
  return labelMap[type] || ''
}

// 全选处理
const handleSelectAll = (value) => {
  displayList.value.forEach(item => {
    item.selected = value
  })
}

const updateSelectAll = () => {
  const selectedCount = displayList.value.filter(item => item.selected).length
  selectAll.value = selectedCount === displayList.value.length
}

// 考试列表全选处理
const handleExamSelectAll = (value) => {
  examList.value.forEach(exam => {
    exam.selected = value
  })
}

const updateExamSelectAll = () => {
  const selectedCount = examList.value.filter(exam => exam.selected).length
  examSelectAll.value = selectedCount === examList.value.length
}

// 排序功能
const moveUp = (index) => {
  if (index > 0) {
    const temp = displayList.value[index]
    displayList.value[index] = displayList.value[index - 1]
    displayList.value[index - 1] = temp
  }
}

const moveDown = (index) => {
  if (index < displayList.value.length - 1) {
    const temp = displayList.value[index]
    displayList.value[index] = displayList.value[index + 1]
    displayList.value[index + 1] = temp
  }
}

// 操作功能
const editItem = (item) => {
  ElMessage.info(`设置 ${item.name}`)
  // TODO: 实现设置功能
}

const removeItem = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要移除 ${item.name} 吗？`, '确认删除', {
      type: 'warning'
    })
    
    // 使用 bindId 进行删除，这是绑定记录的唯一ID
    const response = await delClazzBind({ ids: [item.bindId] })
    if (response.code === 200) {
      ElMessage.success('移除成功')
      loadBindList()
    } else {
      ElMessage.error(response.msg || '移除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除失败:', error)
      ElMessage.error('移除失败')
    }
  }
}

// 底部操作
const cancelSelection = () => {
  displayList.value.forEach(item => {
    item.selected = false
  })
  selectAll.value = false
}

const confirmAction = () => {
  const selectedItems = displayList.value.filter(item => item.selected)
  if (selectedItems.length === 0) {
    ElMessage.warning('请选择要操作的项目')
    return
  }
  
  // 根据选择的内容类型决定操作
  if (activeContentType.value === 'exam' || selectedItems.some(item => item.type === 'exam')) {
    addExamDialogVisible.value = true
    loadExamList()
  } else {
    ElMessage.info('该功能暂未实现')
  }
}

// 考试弹窗操作
const closeAddExamDialog = () => {
  addExamDialogVisible.value = false
  examList.value.forEach(exam => {
    exam.selected = false
  })
  examSelectAll.value = false
}

const createNewExam = () => {
  router.push({ name: 'TeachingCenter-Exams' })
}

const editExam = (exam) => {
  router.push({ 
    name: 'TeachingCenter-ExamSettings', 
    params: { id: exam.id } 
  })
}

// 课程相关方法
const createNewCourse = () => {
  router.push({ name: 'TeachingCenter-Courses' })
}

const viewCourse = (course) => {
  router.push({ 
    name: 'TeachingCenter-CourseProvision', 
    params: { id: course.id } 
  })
}

// 靶场相关方法
const createNewShooting = () => {
  router.push({ name: 'TeachingCenter-ShootingRange' })
}

const viewShooting = (shooting) => {
  router.push({ 
    name: 'TeachingCenter-ShootingRangeSetup', 
    params: { id: shooting.id } 
  })
}

const cancelAddExam = () => {
  closeAddExamDialog()
}

const confirmAddExam = async () => {
  const selectedExams = examList.value.filter(exam => exam.selected)
  if (selectedExams.length === 0) {
    ElMessage.warning('请选择要添加的考试')
    return
  }
  
  try {
    const examIdList = selectedExams.map(exam => exam.id)
    const response = await addClazzBind({
      id: classId,
      examIdList: examIdList,
      courseIdList: [],
      shootingRangeIdList: []
    })
    
    if (response.code === 200) {
      ElMessage.success('添加考试成功')
      closeAddExamDialog()
      loadBindList()
    } else {
      ElMessage.error(response.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加考试失败:', error)
    ElMessage.error('添加考试失败')
  }
}

// 分页处理
const handleExamPageChange = (page) => {
  examPagination.page = page
  loadExamList()
}

const handleExamSizeChange = (size) => {
  examPagination.size = size
  examPagination.page = 1
  loadExamList()
}

// 课程相关操作
const handleCourseSelectAll = (value) => {
  courseList.value.forEach(course => {
    course.selected = value
  })
}

const updateCourseSelectAll = () => {
  const selectedCount = courseList.value.filter(course => course.selected).length
  courseSelectAll.value = selectedCount === courseList.value.length
}

const handleCoursePageChange = (page) => {
  coursePagination.page = page
  loadCourseList()
}

const handleCourseSizeChange = (size) => {
  coursePagination.size = size
  coursePagination.page = 1
  loadCourseList()
}

const closeAddCourseDialog = () => {
  addCourseDialogVisible.value = false
  courseList.value.forEach(course => {
    course.selected = false
  })
  courseSelectAll.value = false
}

const confirmAddCourse = async () => {
  const selectedCourses = courseList.value.filter(course => course.selected)
  if (selectedCourses.length === 0) {
    ElMessage.warning('请选择要添加的课程')
    return
  }
  
  try {
    const courseIdList = selectedCourses.map(course => course.id)
    const response = await addClazzBind({
      id: classId,
      courseIdList: courseIdList,
      examIdList: [],
      shootingRangeIdList: []
    })
    
    if (response.code === 200) {
      ElMessage.success('添加课程成功')
      closeAddCourseDialog()
      loadBindList()
    } else {
      ElMessage.error(response.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加课程失败:', error)
    ElMessage.error('添加课程失败')
  }
}

// 靶场相关操作
const handleShootingSelectAll = (value) => {
  shootingList.value.forEach(shooting => {
    shooting.selected = value
  })
}

const updateShootingSelectAll = () => {
  const selectedCount = shootingList.value.filter(shooting => shooting.selected).length
  shootingSelectAll.value = selectedCount === shootingList.value.length
}

const handleShootingPageChange = (page) => {
  shootingPagination.page = page
  loadShootingList()
}

const handleShootingSizeChange = (size) => {
  shootingPagination.size = size
  shootingPagination.page = 1
  loadShootingList()
}

const closeAddShootingDialog = () => {
  addShootingDialogVisible.value = false
  shootingList.value.forEach(shooting => {
    shooting.selected = false
  })
  shootingSelectAll.value = false
}

const confirmAddShooting = async () => {
  const selectedShootings = shootingList.value.filter(shooting => shooting.selected)
  if (selectedShootings.length === 0) {
    ElMessage.warning('请选择要添加的靶场')
    return
  }
  
  try {
    const shootingRangeIdList = selectedShootings.map(shooting => shooting.id)
    const response = await addClazzBind({
      id: classId,
      shootingRangeIdList: shootingRangeIdList,
      examIdList: [],
      courseIdList: []
    })
    
    if (response.code === 200) {
      ElMessage.success('添加靶场成功')
      closeAddShootingDialog()
      loadBindList()
    } else {
      ElMessage.error(response.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加靶场失败:', error)
    ElMessage.error('添加靶场失败')
  }
}

// 组件挂载
onMounted(() => {
  console.log('班级ID:', classId)
  // 加载字典数据
  loadDictionaries()
  // 先尝试通过 getClassList 获取班级名称
  loadClazzName().then(found => {
    // 若未找到，再用 loadBindList 的解析作为后备
    if (!found) {
      loadBindList()
    } else {
      // 仍然加载绑定列表数据
      loadBindList()
    }
  })
})

// 通过 getClassList 查找班级名称和详细信息，返回是否找到
const loadClazzName = async () => {
  if (!classId) return false
  try {
    const resp = await getClassList({ page: 1, size: 1000, name: '' , isMe: false, clazzStatus: '' })
    if (resp && resp.code === 200 && resp.data && Array.isArray(resp.data.records)) {
      const matched = resp.data.records.find(r => String(r.id) === String(classId) || String(r.id) === String(classId))
      if (matched && matched.name) {
        clazzName.value = matched.name
        // 填充班级详情
        classDetails.value = {
          name: matched.name,
          studyTime: matched.studyTime || matched.studyDate || '不限制',
          creatorName: matched.creatorName || matched.creator || '未知',
          createTime: matched.createTime || ''
        }
        return true
      }
    }
  } catch (e) {
    // 忽略错误
  }
  return false
}
</script>

<style scoped>
.class-settings {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.back-btn {
  padding: 4px 8px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
}

.main-layout {
  display: flex;
  gap: 20px;
}

.left-panel {
  flex: 1;
  min-width: 0;
}

.right-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-selector {
  margin-bottom: 20px;
}

.content-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 16px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  gap: 60px;
}

.header-right span {
  color: #666;
  font-size: 14px;
}

.list-items {
  min-height: 200px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-left {
  flex: 1;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.tag-course {
  background-color: #1890ff;
}

.tag-exam {
  background-color: #f5222d;
}

.tag-shooting {
  background-color: #fa8c16;
}

.item-name {
  font-size: 14px;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 40px;
}

.sort-buttons {
  display: flex;
  gap: 4px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.bottom-actions {
  margin-top: 20px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.bottom-actions .el-button {
  margin: 0 10px;
}

/* 添加考试/课程/靶场弹窗样式 */
.add-exam-dialog,
.add-course-dialog,
.add-shooting-dialog {
  padding: 0;
}

.dialog-tip {
  background: #f6f6f6;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  color: #666;
}

.tip-warning {
  color: #f5222d;
}

.dialog-filters {
  margin-bottom: 20px;
}

.dialog-filters .filter-bar {
  padding: 8px 0;
  background: transparent;
  border: none;
  gap: 8px;
}

.dialog-filters .filter-note {
  display: inline-block;
  margin-left: 8px;
}

.filter-note {
  margin-left: 12px;
  font-size: 12px;
  color: #f5222d;
}

.exam-list-header {
  display: grid;
  grid-template-columns: 2fr 2fr 80px 80px 100px 140px 80px;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 2px solid #e0e0e0;
  font-weight: bold;
  color: #333;
}

.exam-list-items {
  max-height: 300px;
  overflow-y: auto;
}

.exam-item {
  display: grid;
  grid-template-columns: 2fr 2fr 80px 80px 100px 140px 80px;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.exam-item span {
  font-size: 14px;
  color: #666;
}

.exam-list-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.total-count {
  color: #666;
  font-size: 14px;
}

.dialog-actions {
  margin-top: 20px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.dialog-actions .el-button {
  margin: 0 10px;
}

/* 课程列表样式 */
.course-list-header {
  display: grid;
  grid-template-columns: 3fr 2fr 1fr 1.5fr 0.8fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 2px solid #e0e0e0;
  font-weight: bold;
  color: #333;
}

.course-list-items {
  max-height: 300px;
  overflow-y: auto;
}

.course-item {
  display: grid;
  grid-template-columns: 3fr 2fr 1fr 1.5fr 0.8fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.course-item span {
  font-size: 14px;
  color: #666;
}

.course-list-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

/* 靶场列表样式 */
.shooting-list-header {
  display: grid;
  grid-template-columns: 2.5fr 2fr 0.8fr 0.8fr 1fr 1.5fr 0.8fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 2px solid #e0e0e0;
  font-weight: bold;
  color: #333;
}

.shooting-list-items {
  max-height: 300px;
  overflow-y: auto;
}

.shooting-item {
  display: grid;
  grid-template-columns: 2.5fr 2fr 0.8fr 0.8fr 1fr 1.5fr 0.8fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.shooting-item span {
  font-size: 14px;
  color: #666;
}

.shooting-list-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

/* 右侧面板样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-icon {
  color: #909399;
  cursor: help;
  margin-left: 4px;
}

.certificate-card {
  margin-top: 0;
}

.certificate-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.certificate-empty {
  color: #909399;
  font-size: 14px;
  text-align: center;
  padding: 12px 0;
}

/* 调整描述列表样式 */
.el-descriptions :deep(.el-descriptions-item__cell) {
  padding: 12px;
}

.el-descriptions :deep(.el-descriptions-item__label) {
  width: 100px;
  font-weight: 500;
}
</style>
