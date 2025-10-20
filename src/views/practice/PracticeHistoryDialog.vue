<template>
  <el-dialog
    :model-value="visible"
    title="练习记录"
    width="900px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="dialog-content" v-loading="loading">
      <el-table :data="historyData" style="width: 100%;">
        <el-table-column prop="title" label="练习标题" />
        <el-table-column prop="totalCount" label="总题数" align="center" />
        <el-table-column prop="wrongCount" label="错题数" align="center" />
        <el-table-column label="未答数" align="center">
            <template #default="scope">
                {{ scope.row.totalCount - scope.row.wrongCount - scope.row.rightCount }}
            </template>
        </el-table-column>
        <el-table-column prop="rightCount" label="正确数" align="center" />
        <el-table-column prop="submitTime" label="提交时间" />
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="viewRecordDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="dialog-footer-bar">
        <el-pagination
          v-if="pagination.total > 0"
          background
          layout="total, prev, pager, next, ->, sizes"
          :total="pagination.total"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          @current-change="fetchHistory"
          @size-change="fetchHistory"
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
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getPracticeHistory } from '@/api/practice.js';

const props = defineProps({
  visible: Boolean,
  practiceData: Object,
});
const emit = defineEmits(['update:visible']);
const router = useRouter();

const loading = ref(false);
const historyData = ref([]);
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const fetchHistory = async () => {
  if (!props.practiceData?.id) return;
  
  loading.value = true;
  try {
    const params = {
      id: props.practiceData.id,
      page: pagination.page,
      size: pagination.size,
    };
    const res = await getPracticeHistory(params);
    if (res.code === 200 && res.data) {
      historyData.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取练习历史失败');
      historyData.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取练习历史异常:', error);
    ElMessage.error('获取练习历史失败，请稍后重试');
    historyData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 【修复】使用 watch 监听 visible 变化，确保每次打开弹窗都能立即调用 API
watch(() => props.visible, (newVal) => {
  if (newVal) {
    pagination.page = 1;
    fetchHistory();
  }
}, { immediate: false });

// 点击"查看"按钮，跳转到专门的结果详情页
const viewRecordDetail = (record) => {
  router.push({ name: 'StudentPracticeResult', params: { recordId: record.id } });
};
</script>

<style scoped>
.dialog-content {
  padding: 0 20px 20px;
}
.dialog-footer-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
}
</style>