<template>
  <div class="shooting-range-page">
    <div class="banner">
      <h1><el-icon><Aim /></el-icon> 实战靶场</h1>
    </div>

    <div class="main-content">
      <div class="filter-bar">
        <div class="tabs">
          <span 
            class="tab-item" 
            :class="{ active: filters.shootingRangeType === null }" 
            @click="selectTab(null)"
          >全部</span>
          <span 
            class="tab-item" 
            :class="{ active: filters.shootingRangeType === 0 }" 
            @click="selectTab(0)"
          >训练</span>
          <span 
            class="tab-item" 
            :class="{ active: filters.shootingRangeType === 1 }" 
            @click="selectTab(1)"
          >比武</span>
          <span class="tab-item">我的比赛</span>
        </div>
        <div class="search-and-filter">
          <el-input v-model="filters.name" placeholder="搜索" class="search-input" @keyup.enter="handleSearch">
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
          <el-select v-model="filters.shootingRangeCategory" placeholder="分类" @change="handleSearch">
            <el-option label="全部分类" value=""></el-option>
            <el-option label="财税" value="1"></el-option>
            <el-option label="实战" value="2"></el-option>
          </el-select>
        </div>
      </div>

      <div v-loading="loading">
        <div v-if="rangeList.length > 0" class="range-grid">
          <el-card v-for="range in rangeList" :key="range.id" class="range-card" shadow="hover" @click="goToDetail(range.id)">
            <div class="card-header">
              <el-icon class="card-icon"><Opportunity /></el-icon>
              <h3 class="range-title">{{ range.name }}</h3>
            </div>
            <p class="range-description">{{ range.introduction }}</p>
            <div class="card-footer">
              <el-tag>{{ range.shootingRangeCategoryName || '财税' }}</el-tag>
              <el-tag :type="range.shootingRangeType === 0 ? 'success' : 'warning'">
                {{ range.shootingRangeType === 0 ? '训练' : '比武' }}
              </el-tag>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无相关靶场"></el-empty>
      </div>

      <div v-if="pagination.total > 0" class="pagination-container">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          @current-change="fetchRangeList"
        />
      </div>
    </div>
    
    <el-dialog v-model="resultDialogVisible" :title="resultDialogTitle" width="500px">
        </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Aim, Search, Opportunity } from '@element-plus/icons-vue';
import { getShootingRangeList } from '@/api/shooting-range.js';

const router = useRouter();
const loading = ref(true);
const rangeList = ref([]);
const pagination = reactive({ page: 1, size: 10, total: 0 });
const filters = reactive({
  name: '',
  shootingRangeType: null, // null for all
  shootingRangeCategory: '',
});

// 结果弹窗相关
const resultDialogVisible = ref(false);
const resultDialogTitle = ref('');
const resultData = ref(null);

const fetchRangeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      name: filters.name,
      shootingRangeType: filters.shootingRangeType,
      shootingRangeCategory: filters.shootingRangeCategory,
    };
    const res = await getShootingRangeList(params);
    if (res.code === 200 && res.data) {
      rangeList.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取靶场列表失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，获取靶场列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchRangeList();
};

const selectTab = (type) => {
  filters.shootingRangeType = type;
  handleSearch();
};

const goToDetail = (id) => {
  router.push({ name: 'ShootingRangeDetail', params: { id } });
};

onMounted(() => {
  fetchRangeList();
});
</script>

<style scoped>
.shooting-range-page { background-color: #f5f7fa; min-height: 100%; }
.banner { height: 150px; background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%); display: flex; align-items: center; padding: 0 5%; }
.banner h1 { color: white; font-size: 32px; display: flex; align-items: center; gap: 12px; }
.main-content { padding: 24px; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 16px; border-radius: 4px; margin-bottom: 20px; }
.tabs .tab-item { font-size: 16px; margin-right: 24px; color: #606266; cursor: pointer; padding-bottom: 4px; }
.tabs .tab-item.active { color: #409eff; font-weight: 600; border-bottom: 2px solid #409eff; }
.search-and-filter { display: flex; gap: 16px; }
.search-input { width: 240px; }
.range-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.range-card { cursor: pointer; }
.range-card .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.card-icon { color: #409eff; font-size: 20px; }
.range-title { margin: 0; font-size: 16px; font-weight: 600; }
.range-description { font-size: 14px; color: #909399; margin: 0 0 16px 0; height: 40px; overflow: hidden; }
.card-footer { display: flex; gap: 8px; }
.pagination-container { display: flex; justify-content: center; margin-top: 32px; }
</style>