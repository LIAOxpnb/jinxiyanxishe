<template>
  <div>
    <FilterBar
      :fields="coursewareFilterFields"
      @filter="handleFilter"
      create-button-text="" 
    />
    <el-table 
      :data="tableData" 
      v-loading="loading" 
      style="width: 100%; margin-top: 20px;"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="文件名称" />
      <el-table-column prop="fileType" label="文件类型" />
      <el-table-column prop="duration" label="时长" />
      <el-table-column prop="category" label="分类" />
      <el-table-column prop="group" label="课件分组" />
      <el-table-column prop="creator" label="创建人" />
      <el-table-column prop="createTime" label="创建时间" />
    </el-table>
    <div class="dialog-footer-bar">
      <div>
      </div>
      <el-pagination
        v-if="pagination.total > 0"
        background
        layout="total, sizes, prev, pager, next"
        :total="pagination.total"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import FilterBar from '@/components/common/FilterBar.vue';
import { getCoursewareList } from '../../../api/teaching-center/CoursewareManagement';
import { getDictByType } from '../../../api/system-management/dictionary.js';

const loading = ref(true);
const tableData = ref([]);
const pagination = reactive({ page: 1, size: 10, total: 0 });
const filters = ref({});
// 【已添加】用于存储勾选的行
const selectedItems = ref([]);

// 【已添加】处理勾选变化的函数
const handleSelectionChange = (selection) => {
  selectedItems.value = selection;
};

// 【已添加】将 selectedItems 暴露给父组件
defineExpose({
  selectedItems,
});


const categoryOptions = ref([]);
const groupOptions = ref([]);
const fileTypeOptions = ref([]);
const coursewareFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '课件名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { type: 'select', model: 'coursewareCategory', placeholder: '分类', options: categoryOptions },
  { type: 'select', model: 'groupId', placeholder: '课件组', options: groupOptions },
  { type: 'select', model: 'fileType', placeholder: '文件类型', options: fileTypeOptions },
]);

const handleFilter = (data) => {
  filters.value = data;
  pagination.page = 1;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = { 
        ...filters.value, 
        page: pagination.page, 
        size: pagination.size 
    };
    const res = await getCoursewareList(params);
    if (res.code === 200) {
      tableData.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getDictByType('courseware_category').then(res => {
    categoryOptions.value = res.data.map(d => ({ label: d.dictLabel, value: d.dictValue }));
  });
  getDictByType('file_type').then(res => {
    fileTypeOptions.value = res.data.map(d => ({ label: d.dictLabel, value: d.dictValue }));
  });
  fetchData();
});
</script>

<style scoped>
.dialog-footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}
</style>