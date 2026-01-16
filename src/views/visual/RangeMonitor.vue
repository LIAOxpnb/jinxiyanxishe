<template>
  <div class="range-monitor-page">
    <div class="monitor-header">
      <h1>靶场实战监控大屏</h1>
      <div class="monitor-info">
        <span>实时数据更新中...</span>
      </div>
    </div>
    
    <div class="monitor-content">
      <!-- 监控内容区域 -->
      <div class="monitor-grid">
        <div class="monitor-card">
          <div class="card-title">在线学员</div>
          <div class="card-value">0</div>
        </div>
        <div class="monitor-card">
          <div class="card-title">已完成</div>
          <div class="card-value">0</div>
        </div>
        <div class="monitor-card">
          <div class="card-title">进行中</div>
          <div class="card-value">0</div>
        </div>
        <div class="monitor-card">
          <div class="card-title">未开始</div>
          <div class="card-value">0</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 靶场实战监控组件
</script>

<style scoped>
.range-monitor-page {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.monitor-header {
  padding: 40px 60px;
  color: white;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.monitor-header h1 {
  margin: 0;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
}

.monitor-info {
  margin-top: 20px;
  font-size: 18px;
  opacity: 0.9;
}

.monitor-content {
  flex: 1;
  padding: 60px;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  width: 100%;
  max-width: 1600px;
}

.monitor-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  color: white;
  transition: all 0.3s ease;
}

.monitor-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-10px);
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  opacity: 0.9;
}

.card-value {
  font-size: 64px;
  font-weight: 700;
  letter-spacing: 2px;
}
</style>
