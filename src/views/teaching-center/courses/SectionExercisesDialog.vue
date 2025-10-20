<template>
  <el-dialog
    :model-value="visible"
    title="已加练习"
    width="900px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="dialog-content">
      <FilterBar
        create-button-text="新建练习"
        :fields="exerciseFilterFields"
        @create="handleCreate"
        @filter="handleFilter"
      />

      <el-table 
        :data="tableData" 
        v-loading="loading" 
        style="width: 100%; margin-top: 20px;"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="练习名称" />
        <el-table-column prop="questionCount" label="习题数" />
        <el-table-column prop="creator" label="创建人" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button link type="primary" size="small" style="color: #F56C6C;" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="dialog-footer-bar">
        <div>
          <el-checkbox />
          <el-dropdown>
            <el-button size="small" style="margin-left: 8px;">
              批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleBatchDelete">批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-pagination
          v-if="pagination.total > 0"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          @current-change="fetchExercises"
          @size-change="fetchExercises"
        />
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
// 【已添加】导入 ElMessageBox
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import FilterBar from '../../../components/common/FilterBar.vue';
// 【已添加】导入 getPracticeList 和 deletePractice
import { getPracticeList, deletePractice } from '@/api/teaching-center/PracticeManagement';

const router = useRouter();

const props = defineProps({
  visible: Boolean,
  sectionData: Object,
});
defineEmits(['update:visible']);

const loading = ref(false);
const tableData = ref([]);
const pagination = reactive({ page: 1, size: 10, total: 0 });
const filters = ref({});
// 【已添加】用于管理表格勾选项的状态
const selectedItems = ref([]);

const exerciseFilterFields = ref([
  { type: 'input', model: 'name', placeholder: '练习名称' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { type: 'select', model: 'category', placeholder: '分类', options: [
    { label: '分类一', value: '1' },
    { label: '分类二', value: '2' },
  ]},
]);

const fetchExercises = async () => {
  loading.value = true;
  const cleanFilters = Object.fromEntries(Object.entries(filters.value).filter(([_, v]) => v != null && v !== ''));
  
  const params = {
    sectionId: props.sectionData?.id,
    ...cleanFilters,
    page: pagination.page,
    size: pagination.size,
  };
  
  try {
    const res = await getPracticeList(params);
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records;
      pagination.total = res.data.total;
    } else {
      ElMessage.error(res.msg || '获取练习列表失败');
      tableData.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取练习列表异常:', error);
    ElMessage.error('获取练习列表接口异常');
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleFilter = (data) => {
  filters.value = data;
  pagination.page = 1;
  fetchExercises();
};

const handleCreate = () => {
  router.push({ name: 'TeachingCenter-Practice' });
};

// 【已添加】处理表格勾选项变化的方法
const handleSelectionChange = (selection) => {
  selectedItems.value = selection;
};

// 【已添加】处理单项删除的方法
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除练习 “${row.name}” 吗？`, '删除确认', {
    type: 'warning',
  }).then(async () => {
    try {
      await deletePractice([row.id]);
      ElMessage.success('删除成功！');
      fetchExercises(); // 刷新列表
    } catch (error) {
      ElMessage.error('删除失败');
    }
  }).catch(() => {});
};

// 【已添加】处理批量删除的方法
const handleBatchDelete = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一项进行删除');
    return;
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedItems.value.length} 项练习吗？`, '批量删除确认', {
    type: 'warning',
  }).then(async () => {
    try {
      const ids = selectedItems.value.map(item => item.id);
      await deletePractice(ids);
      ElMessage.success('批量删除成功！');
      fetchExercises(); // 刷新列表
    } catch (error) {
      ElMessage.error('批量删除失败');
    }
  }).catch(() => {});
};


onMounted(() => {
  if (props.sectionData) {
    fetchExercises();
  }
});

watch(() => props.sectionData, (newVal) => {
  if (newVal && props.visible) {
    handleFilter({});
  }
});
</script>

<style scoped>
.dialog-content {
  padding: 0 20px;
}
.dialog-footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}
</style>