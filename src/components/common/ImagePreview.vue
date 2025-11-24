<template>
  <div ref="containerRef">
    <!-- Element Plus 图片预览组件 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="imageList"
      :initial-index="currentIndex"
      :hide-on-click-modal="true"
      :teleported="true"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const containerRef = ref(null);
const showViewer = ref(false);
const imageList = ref([]);
const currentIndex = ref(0);

/**
 * 打开图片预览
 * @param {string} imageUrl - 当前点击的图片URL
 * @param {Array<string>} allImages - 所有图片URL列表（可选）
 */
const open = (imageUrl, allImages = []) => {
  if (allImages.length > 0) {
    imageList.value = allImages;
    currentIndex.value = allImages.indexOf(imageUrl);
  } else {
    imageList.value = [imageUrl];
    currentIndex.value = 0;
  }
  showViewer.value = true;
};

/**
 * 关闭图片预览
 */
const handleClose = () => {
  showViewer.value = false;
  imageList.value = [];
  currentIndex.value = 0;
};

/**
 * 监听自定义事件（从指令触发）
 */
const handleOpenImagePreview = (event) => {
  const { imageUrl, allImages } = event.detail;
  open(imageUrl, allImages);
};

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('open-image-preview', handleOpenImagePreview);
});

// 组件卸载前移除事件监听
onUnmounted(() => {
  document.removeEventListener('open-image-preview', handleOpenImagePreview);
});

// 暴露方法给父组件使用
defineExpose({
  open,
  handleClose
});
</script>

<style scoped>
/* Element Plus 的 ImageViewer 已经有完整的样式，无需额外定义 */
</style>
