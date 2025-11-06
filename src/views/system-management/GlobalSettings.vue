<template>
  <div class="global-settings">
    <div class="settings-container">
      <div class="settings-content">
        <el-form
          ref="formRef"
          :model="formData"
          label-width="120px"
          class="settings-form"
        >
          <el-form-item label="页面水印" class="setting-item">
            <div class="setting-control">
              <el-radio-group v-model="formData.watermark" class="watermark-radio">
                <el-radio :label="1" class="radio-item">开启</el-radio>
                <el-radio :label="0" class="radio-item">关闭</el-radio>
              </el-radio-group>
            </div>
          </el-form-item>
        </el-form>

        <div class="action-buttons">
          <el-button @click="handleReset" class="reset-btn">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSave" 
            :loading="saving"
            class="save-btn"
          >
            保存
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getGlobalSettings, updateGlobalSettings } from '../../api/system-management/Global-Settings.js'

const loading = ref(false)
const saving = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  watermark: 1 // 默认开启
})

// 原始数据，用于重置
const originalData = reactive({
  watermark: 1
})

// 获取全局配置
const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await getGlobalSettings()
    if (res.code === 200 && res.data) {
      const watermark = res.data.watermark !== undefined ? res.data.watermark : 1
      formData.watermark = watermark
      originalData.watermark = watermark
    }
  } catch (error) {
    console.error('获取全局配置失败:', error)
    ElMessage.error('获取全局配置失败')
  } finally {
    loading.value = false
  }
}

// 保存配置
const handleSave = async () => {
  saving.value = true
  try {
    const submitData = {
      watermark: formData.watermark
    }
    
    const res = await updateGlobalSettings(submitData)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      // 更新原始数据
      originalData.watermark = formData.watermark
      
      // 提示用户刷新页面使水印配置生效
      ElMessage({
        message: '水印配置已更新，建议刷新页面使其在所有页面生效',
        type: 'info',
        duration: 3000
      })
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 重置/取消
const handleReset = () => {
  formData.watermark = originalData.watermark
  ElMessage.info('已重置')
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.global-settings {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.settings-container {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.settings-content {
  width: 100%;
}

.settings-form {
  margin-bottom: 40px;
}

.setting-item {
  margin-bottom: 30px;
}

.setting-item :deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.setting-control {
  display: flex;
  align-items: center;
}

.watermark-radio {
  display: flex;
  gap: 20px;
}

.radio-item {
  margin-right: 0;
}

.radio-item :deep(.el-radio__label) {
  font-size: 14px;
  color: #262626;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.reset-btn {
  padding: 8px 20px;
  font-size: 14px;
}

.save-btn {
  padding: 8px 20px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .global-settings {
    padding: 10px;
  }
  
  .settings-container {
    padding: 20px;
  }
  
  .settings-form :deep(.el-form-item) {
    flex-direction: column;
  }
  
  .settings-form :deep(.el-form-item__label) {
    text-align: left;
    margin-bottom: 8px;
  }
}
</style>
