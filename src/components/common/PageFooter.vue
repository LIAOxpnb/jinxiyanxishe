<template>
  <footer class="page-footer">
    <div class="footer-content">
    <img class="footer-badge" :src="badge" alt="badge" />
      <span>重庆市公安局信通总队</span>
      <span class="separator">|</span>
     <img class="footer-badge" :src="badge1" alt="badge1" />
      <span>产品说明文档</span>
    </div>
  </footer>
</template>
.script-placeholder
<script setup>
// 相对导入资源，避免使用绝对 '/assets/..' 导致 Vite 无法解析
import badge from '@/assets/img/u42.png'
import badge1 from '@/assets/img/u45.svg'

</script>

<style scoped>
.page-footer {
  width: 100%;
  padding: 20px 0;
  /* --- 已按要求修改背景颜色 --- */
  background-color: #202c3e; 
  /* --- 为搭配新背景，微调文字颜色 --- */
  color: #a5b0c1; 
  font-size: 14px;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.separator {
  margin: 0 12px;
  /* --- 微调分隔符颜色 --- */
  color: #5a667a;
}

.footer-badge {
  display: inline-block;
  width: 20px; /* 合理的徽章尺寸，按需调整 */
  height: auto;
  margin: 0 12px;
}
</style>