import { onMounted, onUnmounted } from 'vue';

/**
 * 图片双击预览 Composable
 * @param {Object} containerRef - 容器的 ref 引用
 * @param {Function} onImageClick - 图片点击回调函数 (imageUrl, allImageUrls) => void
 */
export function useImagePreview(containerRef, onImageClick) {
  /**
   * 处理图片双击事件
   */
  const handleImageDblClick = (event) => {
    // 检查是否点击的是图片
    if (event.target.tagName === 'IMG') {
      event.preventDefault();
      event.stopPropagation();
      
      const imageUrl = event.target.src;
      
      // 获取容器内所有图片的URL
      const container = containerRef?.value || event.target.closest('.question-card, .exam-question-card, .details-content, .analysis-content');
      const allImages = container ? Array.from(container.querySelectorAll('img')).map(img => img.src) : [imageUrl];
      
      // 触发回调
      if (onImageClick) {
        onImageClick(imageUrl, allImages);
      }
    }
  };

  /**
   * 添加鼠标样式提示
   */
  const handleImageMouseEnter = (event) => {
    if (event.target.tagName === 'IMG') {
      event.target.style.cursor = 'zoom-in';
      event.target.title = '双击查看大图';
    }
  };

  /**
   * 恢复鼠标样式
   */
  const handleImageMouseLeave = (event) => {
    if (event.target.tagName === 'IMG') {
      event.target.style.cursor = '';
    }
  };

  /**
   * 绑定事件监听
   */
  const bindEvents = () => {
    const container = containerRef?.value;
    if (!container) return;

    container.addEventListener('dblclick', handleImageDblClick);
    container.addEventListener('mouseenter', handleImageMouseEnter, true);
    container.addEventListener('mouseleave', handleImageMouseLeave, true);
  };

  /**
   * 解绑事件监听
   */
  const unbindEvents = () => {
    const container = containerRef?.value;
    if (!container) return;

    container.removeEventListener('dblclick', handleImageDblClick);
    container.removeEventListener('mouseenter', handleImageMouseEnter, true);
    container.removeEventListener('mouseleave', handleImageMouseLeave, true);
  };

  // 组件挂载时绑定事件
  onMounted(() => {
    bindEvents();
  });

  // 组件卸载时解绑事件
  onUnmounted(() => {
    unbindEvents();
  });

  return {
    bindEvents,
    unbindEvents
  };
}
