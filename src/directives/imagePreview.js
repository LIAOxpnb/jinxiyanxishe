/**
 * 图片双击预览全局指令
 * 使用方法: v-image-preview
 */

export const imagePreviewDirective = {
  mounted(el) {
    // 存储事件处理函数的引用，以便后续清理
    el._imagePreviewHandlers = {
      dblclick: null,
      mouseenter: null,
      mouseleave: null
    };

    // 处理图片双击事件
    el._imagePreviewHandlers.dblclick = (event) => {
      if (event.target.tagName === 'IMG') {
        event.preventDefault();
        event.stopPropagation();
        
        const imageUrl = event.target.src;
        const allImages = Array.from(el.querySelectorAll('img')).map(img => img.src);
        
        // 触发自定义事件，由 ImagePreview 组件监听
        const customEvent = new CustomEvent('open-image-preview', {
          detail: { imageUrl, allImages },
          bubbles: true
        });
        el.dispatchEvent(customEvent);
      }
    };

    // 添加鼠标悬停样式
    el._imagePreviewHandlers.mouseenter = (event) => {
      if (event.target.tagName === 'IMG') {
        event.target.style.cursor = 'zoom-in';
        event.target.title = '双击查看大图';
      }
    };

    el._imagePreviewHandlers.mouseleave = (event) => {
      if (event.target.tagName === 'IMG') {
        event.target.style.cursor = '';
      }
    };

    // 绑定事件
    el.addEventListener('dblclick', el._imagePreviewHandlers.dblclick);
    el.addEventListener('mouseenter', el._imagePreviewHandlers.mouseenter, true);
    el.addEventListener('mouseleave', el._imagePreviewHandlers.mouseleave, true);
  },

  unmounted(el) {
    // 清理事件监听
    if (el._imagePreviewHandlers) {
      el.removeEventListener('dblclick', el._imagePreviewHandlers.dblclick);
      el.removeEventListener('mouseenter', el._imagePreviewHandlers.mouseenter, true);
      el.removeEventListener('mouseleave', el._imagePreviewHandlers.mouseleave, true);
      delete el._imagePreviewHandlers;
    }
  }
};
