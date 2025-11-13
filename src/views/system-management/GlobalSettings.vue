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
          <el-form-item label="平台名称" class="setting-item">
            <el-input v-model="formData.sysName" placeholder="请输入平台名称" maxlength="50" />
          </el-form-item>

          <el-form-item label="平台图标" class="setting-item">
            <div class="icon-upload-wrapper">
              <el-upload
                class="icon-uploader"
                :show-file-list="false"
                :http-request="handleUploadIcon"
                :before-upload="beforeUpload"
                accept="image/jpeg,image/png"
              >
                <img v-if="iconPreviewUrl" :src="iconPreviewUrl" class="icon-image" />
                <div v-else class="icon-uploader-placeholder">
                  <span>点击上传</span>
                </div>
              </el-upload>
              <div class="form-item-hint">建议上传正方形 PNG/JPG，小于2MB</div>
            </div>
          </el-form-item>

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
import { uploadFiles } from '../../api/common/UploadFiles'
import { previewFile } from '../../api/common/PreviewFile'

const loading = ref(false)
const saving = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  watermark: 1, // 默认开启
  sysName: '',
  icon: ''
})

// 原始数据，用于重置
const originalData = reactive({
  watermark: 1,
  sysName: '',
  icon: ''
})

const iconPreviewUrl = ref('')

// 获取全局配置
const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await getGlobalSettings()
    if (res.code === 200 && res.data) {
      const watermark = res.data.watermark !== undefined ? res.data.watermark : 1
      formData.watermark = watermark
      originalData.watermark = watermark

      // 平台名称/图标（兼容后端未返回时）
      formData.sysName = res.data.sysName || ''
      originalData.sysName = formData.sysName
      formData.icon = res.data.icon || ''
      originalData.icon = formData.icon

      if (formData.icon) {
        try {
          iconPreviewUrl.value = await previewFile(formData.icon)
        } catch (e) {
          iconPreviewUrl.value = ''
        }
      } else {
        iconPreviewUrl.value = ''
      }
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
      watermark: formData.watermark,
      sysName: formData.sysName,
      icon: formData.icon
    }
    
    const res = await updateGlobalSettings(submitData)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      // 更新原始数据
      originalData.watermark = formData.watermark
      originalData.sysName = formData.sysName
      originalData.icon = formData.icon
      
      // 提示用户刷新页面使水印配置生效
      ElMessage({
        message: '配置已更新，建议刷新页面使其在所有页面生效',
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
  formData.sysName = originalData.sysName
  formData.icon = originalData.icon
  if (formData.icon) {
    previewFile(formData.icon).then(url => iconPreviewUrl.value = url).catch(() => iconPreviewUrl.value = '')
  } else {
    iconPreviewUrl.value = ''
  }
  ElMessage.info('已重置')
}

onMounted(() => {
  fetchSettings()
})

// 上传平台图标
const handleUploadIcon = async (options) => {
  const { file } = options
  try {
    const res = await uploadFiles([file])
    const path = Array.isArray(res.data) ? res.data[0] : res.data
    if (typeof path !== 'string') throw new Error('上传接口返回格式错误')
    formData.icon = path
    iconPreviewUrl.value = await previewFile(path)
    ElMessage.success('图标上传成功')
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || '图标上传失败')
  }
}

const beforeUpload = (file) => {
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJPGOrPNG) ElMessage.error('图标仅支持 JPG/PNG 格式')
  if (!isLt2M) ElMessage.error('图片大小不能超过 2MB')
  return isJPGOrPNG && isLt2M
}
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

.icon-upload-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fafafa;
  overflow: hidden;
}
.icon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.icon-uploader-placeholder {
  color: #8c939d;
  font-size: 12px;
}
.form-item-hint {
  color: #909399;
  font-size: 12px;
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
