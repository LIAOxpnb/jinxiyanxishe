<template>
  <div class="announcements-page" v-loading="loading">
    <div v-if="announcements.length > 0" class="announcement-list">
      <div v-for="item in announcements" :key="item.id" class="announcement-item">
        <div class="item-icon">
          <el-icon :size="24" color="#409EFC"><BellFilled /></el-icon>
        </div>
        <div class="item-content">
          <div class="item-header">
            <span class="item-title">系统通知</span>
          </div>
          <div class="item-body" v-html="item.content"></div>
          <div class="item-footer">
            <span class="item-time">{{ item.createTime }}</span>
          </div>
        </div>
      </div>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          @current-change="fetchAnnouncements"
        />
      </div>
    </div>
    <el-empty v-else description="暂无系统通知"></el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { BellFilled } from '@element-plus/icons-vue';
import { getAnnouncementList } from '@/api/message.js';

const loading = ref(true);
const announcements = ref([]);
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      content: '' // 搜索内容，暂时为空
    };
    const res = await getAnnouncementList(params);
    if (res.code === 200 && res.data) {
      announcements.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || '获取通知列表失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，获取通知列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped>
.announcement-list {
  background-color: #fff;
  border-radius: 4px;
}
.announcement-item {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
}
.announcement-item:last-child {
  border-bottom: none;
}
.item-icon {
  margin-right: 20px;
}
.item-content {
  flex-grow: 1;
}
.item-title {
  font-weight: 600;
  color: #303133;
}
.item-body {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}
.item-time {
  font-size: 12px;
  color: #909399;
}
.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}
</style>