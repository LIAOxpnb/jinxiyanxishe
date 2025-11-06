<template>
  <div class="watermark-settings-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>水印设置</span>
          <el-button type="primary" @click="saveSettings" :loading="saving">
            保存设置
          </el-button>
        </div>
      </template>

      <el-form :model="settings" label-width="120px" :rules="rules" ref="formRef">
        <!-- 基础设置 -->
        <el-divider content-position="left">基础设置</el-divider>

        <el-form-item label="启用水印" prop="enabled">
          <el-switch v-model="settings.enabled" />
          <el-text size="small" type="info" style="margin-left: 10px">
            关闭后全站将不显示水印
          </el-text>
        </el-form-item>

        <el-form-item label="水印内容" prop="contentType">
          <el-radio-group v-model="settings.contentType">
            <el-radio value="user">用户信息（用户名+组织）</el-radio>
            <el-radio value="custom">自定义文本</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          v-if="settings.contentType === 'custom'" 
          label="自定义文本" 
          prop="customText"
        >
          <el-input
            v-model="settings.customText"
            placeholder="输入水印文本，支持 \n 换行"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <!-- 样式设置 -->
        <el-divider content-position="left">样式设置</el-divider>

        <el-form-item label="字体大小" prop="fontSize">
          <el-input-number
            v-model="settings.fontSize"
            :min="12"
            :max="30"
            controls-position="right"
          />
          <span style="margin-left: 10px">px</span>
        </el-form-item>

        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="settings.color" />
          <el-text size="small" type="info" style="margin-left: 10px">
            建议使用浅色半透明颜色
          </el-text>
        </el-form-item>

        <el-form-item label="透明度" prop="opacity">
          <el-slider
            v-model="settings.opacity"
            :min="0"
            :max="100"
            :step="5"
            style="width: 300px"
          />
          <span style="margin-left: 10px">{{ settings.opacity }}%</span>
        </el-form-item>

        <el-form-item label="旋转角度" prop="rotate">
          <el-slider
            v-model="settings.rotate"
            :min="-45"
            :max="45"
            :step="5"
            style="width: 300px"
          />
          <span style="margin-left: 10px">{{ settings.rotate }}°</span>
        </el-form-item>

        <!-- 高级设置 -->
        <el-divider content-position="left">高级设置</el-divider>

        <el-form-item label="显示页面" prop="showPages">
          <el-checkbox-group v-model="settings.showPages">
            <el-checkbox value="home">首页</el-checkbox>
            <el-checkbox value="classroom">教室</el-checkbox>
            <el-checkbox value="exam">考试</el-checkbox>
            <el-checkbox value="practice">练习</el-checkbox>
            <el-checkbox value="range">靶场</el-checkbox>
            <el-checkbox value="management">管理后台</el-checkbox>
          </el-checkbox-group>
          <div>
            <el-text size="small" type="info">
              未选中的页面将不显示水印
            </el-text>
          </div>
        </el-form-item>

        <el-form-item label="层级" prop="zIndex">
          <el-input-number
            v-model="settings.zIndex"
            :min="1000"
            :max="10000"
            :step="100"
            controls-position="right"
          />
          <el-text size="small" type="info" style="margin-left: 10px">
            设置水印显示层级，建议保持默认值
          </el-text>
        </el-form-item>

        <!-- 预览 -->
        <el-divider content-position="left">效果预览</el-divider>

        <el-form-item>
          <div class="preview-box">
            <div class="preview-content">
              <h3>预览区域</h3>
              <p>这里展示水印效果</p>
              <p>水印会覆盖在内容上方，但不影响操作</p>
              <el-button type="primary" size="small">可点击按钮</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览水印 -->
    <Watermark
      v-if="settings.enabled"
      :text="previewText"
      :fontSize="settings.fontSize"
      :rotate="settings.rotate"
      :color="previewColor"
      :zIndex="settings.zIndex + 1"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Watermark from '@/components/common/Watermark.vue'

const formRef = ref()
const saving = ref(false)

const settings = ref({
  enabled: true,
  contentType: 'user', // 'user' | 'custom'
  customText: '金析研习社',
  fontSize: 16,
  color: '#000000',
  opacity: 8,
  rotate: -20,
  showPages: ['home', 'classroom', 'exam', 'practice', 'range', 'management'],
  zIndex: 9999
})

const rules = {
  customText: [
    { required: true, message: '请输入自定义文本', trigger: 'blur' }
  ],
  fontSize: [
    { required: true, message: '请设置字体大小', trigger: 'blur' }
  ]
}

// 预览文本
const previewText = computed(() => {
  if (settings.value.contentType === 'custom') {
    return settings.value.customText
  }
  return '张三\n金析研习社'
})

// 预览颜色（包含透明度）
const previewColor = computed(() => {
  const color = settings.value.color
  const opacity = settings.value.opacity / 100
  
  // 将十六进制颜色转换为 rgba
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
})

// 加载设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('watermarkSettings')
    if (saved) {
      Object.assign(settings.value, JSON.parse(saved))
    }
  } catch (error) {
    console.error('加载水印设置失败:', error)
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    await formRef.value.validate()
    
    saving.value = true
    
    // 保存到 localStorage
    localStorage.setItem('watermarkSettings', JSON.stringify(settings.value))
    
    // 模拟保存延迟
    setTimeout(() => {
      ElMessage.success('水印设置已保存')
      saving.value = false
    }, 500)
  } catch (error) {
    console.error('保存失败:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.watermark-settings-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.preview-box {
  width: 100%;
  min-height: 300px;
  background: #f9f9f9;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  position: relative;
}

.preview-content h3 {
  margin-bottom: 15px;
  color: #303133;
}

.preview-content p {
  margin-bottom: 10px;
  color: #606266;
  line-height: 1.6;
}

:deep(.el-form-item__content) {
  align-items: center;
}
</style>


