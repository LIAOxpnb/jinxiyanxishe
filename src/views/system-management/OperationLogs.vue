<template>
  <div class="operation-logs">
    <!-- 搜索条件 -->
    <div class="search-section">
      <div class="search-title">
        <span class="title-text">操作统计</span>
        <span class="title-desc">【备注】仅显示数字中心、系统管理操作日志，保留时间为6个月</span>
      </div>
      
      <div class="search-form">
        <el-form :model="searchForm" inline class="search-filters">
          <el-form-item>
            <el-input
              v-model="searchForm.title"
              placeholder="事件名称"
              clearable
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="searchForm.businessType"
              placeholder="业务类型"
              clearable
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="searchForm.operName"
              placeholder="操作人"
              clearable
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="searchForm.timeRange"
              placeholder="操作时间"
              clearable
              style="width: 180px"
            >
              <el-option label="今天" value="today" />
              <el-option label="本周" value="week" />
              <el-option label="本月" value="month" />
              <el-option label="最近3个月" value="3months" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">筛选</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 日志列表 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        class="logs-table"
        :header-cell-style="{ backgroundColor: '#fafafa', color: '#262626', fontWeight: '500' }"
      >
        <el-table-column prop="title" label="操作事件" min-width="120" align="left" />
        <el-table-column prop="businessType" label="业务类型" min-width="100" align="center">
          <template #default="scope">
            {{ scope.row.businessType || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="operName" label="操作者" min-width="120" align="center" />
        <el-table-column prop="requestMethod" label="请求方式" min-width="80" align="center">
          <template #default="scope">
            <el-tag 
              :type="scope.row.requestMethod === 'GET' ? 'success' : 
                    scope.row.requestMethod === 'POST' ? 'primary' : 
                    scope.row.requestMethod === 'PUT' ? 'warning' : 'danger'"
              size="small"
            >
              {{ scope.row.requestMethod || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operIp" label="操作IP" min-width="130" align="center" />
        <el-table-column prop="status" label="状态" min-width="80" align="center">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 0 ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.status === 0 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="executeTime" label="执行时间" min-width="100" align="center">
          <template #default="scope">
            {{ scope.row.executeTime ? scope.row.executeTime + 'ms' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="operTime" label="操作时间" min-width="160" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.operTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-count">总共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOperationLogsList } from '../../api/system-management/Operation-Logs.js'

const loading = ref(false)
const tableData = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const searchForm = reactive({
  title: '',
  businessType: '',
  operName: '',
  timeRange: ''
})

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  try {
    // 如果已经是格式化的字符串，直接返回
    if (typeof time === 'string' && time.includes('-') && time.includes(':')) {
      return time
    }
    const date = new Date(time)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-')
  } catch (error) {
    console.error('时间格式化错误:', error)
    return '-'
  }
}

// 获取时间范围
const getTimeRange = (range) => {
  if (!range) return null
  
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // 安全的日期格式化函数
    const formatDate = (date) => {
      if (!date || isNaN(date.getTime())) return null
      const isoString = date.toISOString()
      if (!isoString) return null
      const parts = isoString.split('T')
      return parts && parts.length > 0 ? parts[0] : null
    }
    
    const todayStr = formatDate(today)
    const nowStr = formatDate(now)
    
    if (!todayStr || !nowStr) return ''
    
    switch (range) {
      case 'today':
        return `${todayStr} 00:00:00 - ${nowStr} 23:59:59`
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekStartStr = formatDate(weekStart)
        if (!weekStartStr) return null
        return `${weekStartStr} 00:00:00 - ${nowStr} 23:59:59`
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthStartStr = formatDate(monthStart)
        if (!monthStartStr) return null
        return `${monthStartStr} 00:00:00 - ${nowStr} 23:59:59`
      case '3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        const threeMonthsAgoStr = formatDate(threeMonthsAgo)
        if (!threeMonthsAgoStr) return null
        return `${threeMonthsAgoStr} 00:00:00 - ${nowStr} 23:59:59`
      default:
        return null
    }
  } catch (error) {
    console.error('时间范围获取错误:', error)
    return null
  }
}

// 获取操作日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }

    // 只添加非空的搜索参数
    if (searchForm.title && searchForm.title.trim()) {
      params.title = searchForm.title.trim()
    }
    
    if (searchForm.operName && searchForm.operName.trim()) {
      params.operName = searchForm.operName.trim()
    }
    
    if (searchForm.timeRange) {
      const timeRange = getTimeRange(searchForm.timeRange)
      if (timeRange && typeof timeRange === 'string' && timeRange.trim()) {
        params.time = timeRange.trim()
      }
    }
    
    const res = await getOperationLogsList(params)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取操作日志失败:', error)
    ElMessage.error('获取操作日志失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchLogs()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.operation-logs {
  padding: 20px;
}

.search-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.search-title {
  margin-bottom: 16px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-right: 12px;
}

.title-desc {
  font-size: 13px;
  color: #f56c6c;
}

.search-form {
  margin-top: 16px;
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.search-filters .el-form-item {
  margin-bottom: 0;
  margin-right: 0;
}

.table-container {
  background: white;
  border-radius: 8px;
  margin-top: 16px;
}

.logs-table {
  border-radius: 8px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.total-count {
  font-size: 14px;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .search-filters {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-filters .el-form-item {
    width: 100%;
  }
  
  .search-filters .el-input,
  .search-filters .el-select {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .operation-logs {
    padding: 10px;
  }
  
  .search-section {
    padding: 15px;
  }
  
  .title-text {
    font-size: 14px;
  }
  
  .title-desc {
    font-size: 12px;
    display: block;
    margin-top: 4px;
  }
}
</style>
