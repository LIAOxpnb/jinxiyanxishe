<template>
  <div class="page-wrapper">
    <div class="main-content">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">靶场阅卷</span>
        </template>
      </el-page-header>
      
      <!-- 使用统计信息 -->
      <div class="statistics-bar">
        <span>已交卷 <strong>{{ stats.submitted }}</strong> 份</span>
        <span class="divider">|</span>
        <span>已评卷 <strong>{{ stats.graded }}</strong> 份</span>
        <span class="divider">|</span>
        <span>待评卷 <strong>{{ stats.pending }}</strong> 份</span>
      </div>

      <!-- 筛选条件 -->
      <FilterBar
        :fields="filterFields"
        :show-create-button="false"
        @filter="handleFilter"
        @reset="handleReset"
      />

      <!-- 提示信息 -->
      <div class="info-bar">
        <span class="info-text">【备注】未完成所有评分的，不展示已得分</span>
        <span class="warning-text">【备注】发布后重次修改</span>
        <el-button type="primary" class="publish-btn" @click="handlePublish">发布结果</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table 
        v-loading="loading"
        :data="tableData" 
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column type="index" label="排序" width="80" />
        <el-table-column prop="studentName" label="学员名称" min-width="120" />
        <el-table-column prop="status" label="评卷状态" min-width="100">
          <template #default="scope">
             <el-tag :type="scope.row.status === 4 ? '' : 'info'" size="small">
              {{ scope.row.status === 4 ? '已评卷' : '未评卷' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" sortable min-width="160" />
        <el-table-column prop="score" label="得分" sortable min-width="110">
          <template #default="scope">
            {{ scope.row.status !== 4 ? '-' : scope.row.score }}
          </template>
        </el-table-column>
        <el-table-column prop="qualified" label="比试结果" min-width="100">
          <template #default="scope">
             <span :style="{ color: scope.row.qualified === 0 ? '#f56c6c' : '' }">
               {{ scope.row.status !== 4 ? '-' : (scope.row.qualified === 1 ? '合格' : '不合格') }}
             </span>
          </template>
        </el-table-column>
        <el-table-column prop="markerName" label="阅卷人" min-width="110">
          <template #default="scope">
            {{ scope.row.markerName || scope.row.graderName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="gradeTime" label="评卷时间" min-width="160">
          <template #default="scope">
            {{ scope.row.gradeTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="startMarking(scope.row)">评卷</el-button>
          </template>
        </el-table-column>
      </el-table>

       <div class="table-footer">
        <span class="total-count">总共{{ pagination.total }}条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';
import { getGradePaperList, updateShootingRangeStatus } from '@/api/teaching-center/ShootingRange.js'; 

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const shootingRangeId = ref(null);
const tableData = ref([]);

// 筛选字段配置
const filterFields = [
  {
    model: 'username',
    type: 'input',
    placeholder: '学员姓名',
    defaultValue: ''
  },
  {
    model: 'qualified',
    type: 'select',
    placeholder: '合格结果',
    defaultValue: '',
    options: [
      { label: '合格', value: 1 },
      { label: '不合格', value: 0 }
    ]
  },
  {
    model: 'status',
    type: 'select',
    placeholder: '评卷状态',
    defaultValue: '',
    options: [
      { label: '已评卷', value: 4 },
      { label: '未评卷', value: 2 }
    ]
  }
];

// 筛选参数
const filterParams = reactive({
  username: '',
  qualified: '',
  status: ''
});

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
});

// 统计信息
const stats = computed(() => {
  const submitted = tableData.value.length;
  const graded = tableData.value.filter(item => item.status === 4).length;
  const pending = submitted - graded;
  return { submitted, graded, pending };
});

// 获取阅卷列表
const fetchSubmissions = async () => {
  loading.value = true;
  try {
    const payload = {
      shootingRangeId: shootingRangeId.value,
      username: filterParams.username,
      qualified: filterParams.qualified,
      status: filterParams.status,
      page: pagination.page,
      size: pagination.size
    };
    
    const res = await getGradePaperList(payload);
    if (res.code === 200) {
      const records = (res.data.records || []).map(r => ({
        ...r,
        studentName: r.userName || r.studentName || '',
        markerName: r.graderName || r.markerName || ''
      }));
      tableData.value = records;
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取阅卷列表失败');
    }
  } catch (error) {
    console.error("获取阅卷列表失败:", error);
    ElMessage.error('获取阅卷列表失败');
  } finally {
    loading.value = false;
  }
};

// 事件处理
const goBack = () => {
  router.back();
};

const handleFilter = (data) => {
  Object.assign(filterParams, data);
  pagination.page = 1;
  fetchSubmissions();
};

const handleReset = () => {
  Object.assign(filterParams, {
    username: '',
    qualified: '',
    status: ''
  });
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  fetchSubmissions();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchSubmissions();
};

const startMarking = (row) => {
  router.push({
    name: 'TeachingCenter-ShootingRangeGradePaper',
    params: { id: row.id }
  });
};

const handlePublish = () => {
  // 检查是否有未完成评卷的
  const hasUngraded = tableData.value.some(item => item.status !== 4);
  
  if (hasUngraded) {
    ElMessageBox.alert('未完成评卷禁止发布', '操作提示', {
      confirmButtonText: '关闭',
      type: 'warning'
    });
    return;
  }
  
  ElMessageBox.confirm('评卷完成，立即发布比试结果', '操作提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await updateShootingRangeStatus({ 
        id: shootingRangeId.value, 
        status: 1 
      });
      if (res.code === 200) {
        ElMessage.success('发布成功！');
        goBack();
      } else {
        ElMessage.error(res.msg || '发布失败');
      }
    } catch (error) {
      ElMessage.error('发布失败');
    }
  }).catch(() => {
    // 用户取消
  });
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    shootingRangeId.value = id;
    fetchSubmissions();
  } else {
    ElMessage.error('无效的靶场ID');
    loading.value = false;
  }
});
</script>

<style scoped>
.page-wrapper {
  padding: 20px;
}
.main-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
}
.page-header-title {
  font-size: 20px;
  font-weight: 600;
}
.statistics-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}
.statistics-bar strong {
  color: #409eff;
  font-size: 16px;
  margin: 0 4px;
}
.statistics-bar .divider {
  color: #dcdfe6;
}
.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fcfcfc;
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 16px;
  font-size: 13px;
}
.info-text {
  color: #f56c6c;
  margin-right: 12px;
}
.warning-text {
  color: #f56c6c;
}
.publish-btn {
  margin-left: auto;
}
.el-table {
  margin-top: 16px;
}
.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-count {
  font-size: 14px;
  color: #606266;
}
</style>
