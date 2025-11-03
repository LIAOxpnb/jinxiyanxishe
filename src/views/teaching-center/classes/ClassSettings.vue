<template>
  <div class="class-settings">
    <div class="page-header">
      <el-button type="text" @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <div class="page-title">{{ clazzName }}</div>
    </div>
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
              {{ item.name }}
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
              <el-link type="primary" @click="editItem(item)">设置</el-link>
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
      <div class="bottom-actions">
        <el-button @click="cancelSelection">取消</el-button>
        <el-button type="primary" @click="confirmAction">确定</el-button>
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
        <div class="dialog-tip">
          可选择指定了当前班级可用，且发布了的考试
          <span class="tip-warning">【备注】只查询已发布，且未选择当前班级的考试</span>
        </div>

        <div class="dialog-filters">
          <FilterBar
            :fields="examFilterFields"
            create-button-text="新建考试"
            @create="createNewExam"
            @filter="onExamFilter"
          />
          <span class="filter-note">【备注】创建后自动拉起创建题库</span>
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
            <span class="total-count">总共102条</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import FilterBar from '@/components/common/FilterBar.vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getClazzBind, 
  addClazzBind, 
  delClazzBind, 
  getCanJoinExamList,
  getClassList
} from '@/api/teaching-center/ClassManagement.js'

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
const addExamDialogVisible = ref(false)
const examList = ref([])
const examSelectAll = ref(false)
const examSelectAllPages = ref(false)

// 分页数据
const examPagination = reactive({
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
        // 拼接考试时间（后端返回 startTime, endTime）
        const examTime = [exam.startTime, exam.endTime].filter(Boolean).join(' 至 ')

        // 合格分后端字段 qualified
        const passScore = typeof exam.qualified !== 'undefined' && exam.qualified !== null ? exam.qualified : (exam.passScore || null)

        // 创建人：优先使用 creatorName，否则使用 creator（id）并保持为字符串
        const creatorName = exam.creatorName || (typeof exam.creator !== 'undefined' ? String(exam.creator) : '')

        // 总分：如果后端有 score 或 totalScore 字段，使用之
        const totalScore = typeof exam.totalScore !== 'undefined' ? exam.totalScore : (exam.score || null)

        return {
          id: exam.id,
          name: exam.name,
          selected: false,
          examTime,
          totalScore,
          passScore,
          creatorName,
          createTime: exam.createTime || '',
          // 保留原始对象以备后续操作
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

// 获取项目样式类名
const getItemClass = (type) => {
  const classMap = {
    course: 'item-course',
    exam: 'item-exam', 
    shooting: 'item-shooting'
  }
  return classMap[type] || ''
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

// 组件挂载
onMounted(() => {
  console.log('班级ID:', classId)
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

// 通过 getClassList 查找班级名称，返回是否找到
const loadClazzName = async () => {
  if (!classId) return false
  try {
    const resp = await getClassList({ page: 1, size: 1000, name: '' , isMe: false, clazzStatus: '' })
    if (resp && resp.code === 200 && resp.data && Array.isArray(resp.data.records)) {
      const matched = resp.data.records.find(r => String(r.id) === String(classId) || String(r.id) === String(classId))
      if (matched && matched.name) {
        clazzName.value = matched.name
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
  margin-bottom: 12px;
}
.back-btn {
  padding: 4px 8px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
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

.item-course .el-checkbox__label {
  color: #1890ff;
}

.item-exam .el-checkbox__label {
  color: #f5222d;
}

.item-shooting .el-checkbox__label {
  color: #fa8c16;
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

/* 添加考试弹窗样式 */
.add-exam-dialog {
  padding: 0;
}

.dialog-tip {
  background: #f6f6f6;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
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
</style>
