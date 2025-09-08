<template>
  <div class="home">
    <div class="hero-section">
      <div class="hero-content">
        <h1>进阶》资分析师</h1>
        <h2>360°洞穿经济犯罪</h2>
        <p>源源不断提供优质的课程通过AI能力提升业务能力，有效帮助您提供经济犯罪破案率，期待您的加入</p>
      </div>
    </div>
    <div class="features-section">
      <el-card v-for="feature in features" :key="feature.title">
        <template #header>
          <div class="card-header">
            <el-icon><component :is="feature.icon" /></el-icon>
            <span>{{ feature.title }}</span>
          </div>
        </template>
        <p>{{ feature.description }}</p>
      </el-card>
    </div>
    <div class="courses-section">
      <h2>经办人都在学的热门课程</h2>
      <p>业务所需技能课程，从资分析、大数据到信息技术，丰厚的课程供您学习</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { School, Edit, Reading, TrendCharts, Collection } from '@element-plus/icons-vue';

const features = ref([
  { title: '金析课堂', description: '功能描述示例', icon: 'School' },
  { title: '随堂练习', description: '功能描述示例', icon: 'Edit' },
  { title: '实战靶场', description: '功能描述示例', icon: 'TrendCharts' },
  { title: '正式考试', description: '功能描述示例', icon: 'Reading' },
  { title: '我的班级', description: '功能描述示例', icon: 'Collection' }
]);
</script>

<style scoped>
.home { text-align: center }
.hero-section { background-size: cover; background-position: center; color: white; padding: 100px 20px }
.features-section { display:flex; justify-content:center; gap:20px; padding:40px 20px; background:#f5f7fa }
.el-card { width:200px }
.card-header { display:flex; align-items:center; gap:10px }
.courses-section { padding:60px 20px }
</style>
