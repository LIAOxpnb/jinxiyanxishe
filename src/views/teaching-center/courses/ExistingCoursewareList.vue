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
      <el-table-column prop="creatorName" label="创建人" />
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
import { getCoursewareList, getCoursewareGroupList } from '../../../api/teaching-center/CoursewareManagement';
import { getDictByType } from '../../../api/system-management/dictionary.js';

const props = defineProps({
  currentCourseId: [String, Number]
});

const loading = ref(true);
const tableData = ref([]);
const pagination = reactive({ page: 1, size: 10, total: 0 });
const filters = ref({});
// 【已添加】用于存储勾选的行
const selectedItems = ref([]);

const categoryOptions = ref([]);
const groupOptions = ref([]);
const fileTypeOptions = ref([]);
// 用于存储分类和课件组的映射关系
const categoryMap = ref({});
const groupMap = ref({});
const coursewareFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '课件名称' },
  { type: 'input', model: 'creatorName', placeholder: '创建人' },
  { type: 'select', model: 'coursewareCategory', placeholder: '分类', options: categoryOptions },
  { type: 'select', model: 'groupId', placeholder: '课件组', options: groupOptions },
  { type: 'select', model: 'fileType', placeholder: '文件类型', options: fileTypeOptions },
]);

// 定义 fetchData 函数
const fetchData = async () => {
  loading.value = true;
  try {
    const params = { 
        ...filters.value, 
        page: pagination.page, 
        size: pagination.size,
        currentCourseId: props.currentCourseId // 传入当前课程ID用于过滤已添加的课件
    };
    const res = await getCoursewareList(params);
    if (res.code === 200) {
      // 处理数据，将ID转换为名称
      tableData.value = (res.data.records || []).map(item => ({
        ...item,
        category: categoryMap.value[item.coursewareCategory] || item.coursewareCategory || '-',
        group: groupMap.value[item.groupId] || '-'
      }));
      pagination.total = res.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

// 【已添加】处理勾选变化的函数
const handleSelectionChange = (selection) => {
  selectedItems.value = selection;
};

const handleFilter = (data) => {
  filters.value = data;
  pagination.page = 1;
  fetchData();
};

// 【已添加】将 selectedItems 和 fetchData 暴露给父组件
defineExpose({
  selectedItems,
  fetchData
});

onMounted(async () => {
  // 加载字典和分组数据
  try {
    const [categoryRes, fileTypeRes, groupRes] = await Promise.all([
      getDictByType('courseware_category'),
      getDictByType('file_type'),
      getCoursewareGroupList()
    ]);
    
    if (categoryRes.data) {
      categoryOptions.value = categoryRes.data.map(d => ({ label: d.dictLabel, value: d.dictValue }));
      categoryMap.value = categoryRes.data.reduce((map, d) => {
        map[d.dictValue] = d.dictLabel;
        return map;
      }, {});
    }
    
    if (fileTypeRes.data) {
      fileTypeOptions.value = fileTypeRes.data.map(d => ({ label: d.dictLabel, value: d.dictValue }));
    }
    
    if (groupRes.code === 200 && groupRes.data) {
      groupOptions.value = groupRes.data.map(group => ({ label: group.name, value: group.id }));
      groupMap.value = groupRes.data.reduce((map, group) => {
        map[group.id] = group.name;
        return map;
      }, {});
    }
  } catch (error) {
    console.error('加载字典数据失败:', error);
  }
  
  // 不在这里自动调用 fetchData，等待父组件主动调用
  // fetchData();
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