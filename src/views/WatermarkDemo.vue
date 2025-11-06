<template>
  <div class="watermark-demo-page">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>水印功能演示</span>
        </div>
      </template>

      <el-space direction="vertical" :size="20" style="width: 100%">
        <!-- 说明 -->
        <el-alert
          title="水印已全局启用"
          type="info"
          description="登录后页面会自动显示用户水印，无需手动配置。本页面仅用于演示水印效果。"
          :closable="false"
        />

        <!-- 水印配置 -->
        <el-card shadow="never">
          <template #header>
            <span>自定义水印配置</span>
          </template>

          <el-form :model="watermarkConfig" label-width="100px">
            <el-form-item label="水印文本">
              <el-input
                v-model="watermarkConfig.text"
                placeholder="支持使用 \n 换行"
                type="textarea"
                :rows="2"
              />
              <el-text size="small" type="info">
                提示：使用 \n 可以换行，例如：用户名\n组织名称
              </el-text>
            </el-form-item>

            <el-form-item label="字体大小">
              <el-slider
                v-model="watermarkConfig.fontSize"
                :min="12"
                :max="30"
                show-input
              />
            </el-form-item>

            <el-form-item label="旋转角度">
              <el-slider
                v-model="watermarkConfig.rotate"
                :min="-45"
                :max="45"
                show-input
              />
            </el-form-item>

            <el-form-item label="颜色透明度">
              <el-slider
                v-model="watermarkConfig.opacity"
                :min="1"
                :max="20"
                :step="1"
                show-input
              />
              <el-text size="small" type="info">
                当前值：{{ watermarkConfig.opacity }}%
              </el-text>
            </el-form-item>

            <el-form-item label="预设样式">
              <el-radio-group v-model="presetStyle" @change="applyPreset">
                <el-radio label="default">默认</el-radio>
                <el-radio label="light">浅色</el-radio>
                <el-radio label="deep">深色</el-radio>
                <el-radio label="brand">品牌色</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 效果预览 -->
        <el-card shadow="never">
          <template #header>
            <span>效果预览</span>
          </template>

          <div class="preview-area">
            <el-text>这是一个预览区域，水印效果会叠加在此区域上方</el-text>
            <div class="preview-content">
              <h3>示例内容</h3>
              <p>这里是一些示例文本内容...</p>
              <p>您可以看到水印效果覆盖在内容上方</p>
              <el-button type="primary">示例按钮</el-button>
            </div>
          </div>
        </el-card>

        <!-- 使用说明 -->
        <el-card shadow="never">
          <template #header>
            <span>使用说明</span>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="全局启用">
              水印已在 App.vue 中全局集成，登录后自动显示
            </el-descriptions-item>
            <el-descriptions-item label="显示内容">
              默认显示：用户名 + 组织名称
            </el-descriptions-item>
            <el-descriptions-item label="显示位置">
              全屏铺满，不影响页面操作
            </el-descriptions-item>
            <el-descriptions-item label="防护机制">
              具备防删除、防修改机制
            </el-descriptions-item>
            <el-descriptions-item label="自定义使用">
              可在特定页面单独引入 Watermark 组件
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="code-example">
            <el-text tag="b">代码示例：</el-text>
            <pre><code>&lt;template&gt;
  &lt;Watermark 
    text="用户名\n组织名称"
    :fontSize="16"
    color="rgba(0, 0, 0, 0.08)"
    :rotate="-20"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import Watermark from '@/components/common/Watermark.vue'
&lt;/script&gt;</code></pre>
          </div>
        </el-card>
      </el-space>
    </el-card>

    <!-- 临时水印用于演示 -->
    <Watermark
      v-if="showDemoWatermark"
      :text="watermarkConfig.text"
      :fontSize="watermarkConfig.fontSize"
      :rotate="watermarkConfig.rotate"
      :color="computedColor"
      :zIndex="10000"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Watermark from '@/components/common/Watermark.vue'

const showDemoWatermark = ref(true)

const watermarkConfig = ref({
  text: '张三\n金析研习社',
  fontSize: 16,
  rotate: -20,
  opacity: 8
})

const presetStyle = ref('default')

const computedColor = computed(() => {
  const opacity = watermarkConfig.value.opacity / 100
  return `rgba(0, 0, 0, ${opacity})`
})

const applyPreset = (style) => {
  switch (style) {
    case 'light':
      watermarkConfig.value.opacity = 5
      watermarkConfig.value.fontSize = 14
      watermarkConfig.value.rotate = -15
      break
    case 'deep':
      watermarkConfig.value.opacity = 15
      watermarkConfig.value.fontSize = 18
      watermarkConfig.value.rotate = -25
      break
    case 'brand':
      watermarkConfig.value.opacity = 10
      watermarkConfig.value.fontSize = 16
      watermarkConfig.value.rotate = -20
      break
    default:
      watermarkConfig.value.opacity = 8
      watermarkConfig.value.fontSize = 16
      watermarkConfig.value.rotate = -20
  }
}
</script>

<style scoped>
.watermark-demo-page {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.demo-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.preview-area {
  min-height: 300px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  position: relative;
}

.preview-content {
  margin-top: 20px;
}

.preview-content h3 {
  margin-bottom: 10px;
  color: #303133;
}

.preview-content p {
  margin-bottom: 10px;
  color: #606266;
}

.code-example {
  margin-top: 20px;
}

.code-example pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  overflow-x: auto;
  margin-top: 10px;
}

.code-example code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
}
</style>

