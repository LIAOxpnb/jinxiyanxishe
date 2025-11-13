<template>
  <div class="certificate-settings">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button @click="goBack" type="text" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        证书设置
      </el-button>
    </div>

    <div class="settings-container">
      <!-- 左侧证书预览 -->
      <div class="certificate-preview">
        <div class="certificate-frame">
          <div 
            class="certificate-content" 
            :style="{ 
              backgroundImage: form.backgroundUrl ? `url(${form.backgroundUrl})` : 'linear-gradient(45deg, #e8f4f8 0%, #f0f8ff 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }"
          >
            <div class="certificate-overlay">
              <div class="certificate-header">
                <img src="@/assets/img/u42.png" alt="徽章" class="badge" />
              </div>
              
              <div class="certificate-title">
                {{ previewData.name || '证书名称' }}
              </div>
              
              <div class="certificate-recipient">
                {{ userName || '用户姓名' }} 同志
              </div>
              
              <div class="certificate-body">
                {{ previewData.intro || '证书介绍内容' }}
              </div>
              
              <div class="certificate-footer">
                <div class="footer-content">
                  <div class="unit-date-info">
                    <div class="unit-name">{{ previewData.unit || '重庆市经侦局' }}</div>
                    <div class="issue-date">{{ previewData.issueDate || '2025年10月' }}</div>
                  </div>
                  <div class="seal-container">
                    <div class="seal" v-if="!form.sealUrl">
                      <!-- 默认公章样式，不显示文字，因为文字已经在左侧显示 -->
                    </div>
                    <img 
                      v-else 
                      :src="form.sealUrl" 
                      alt="公章" 
                      class="seal-image"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="certificate-form">
        <div class="form-container">
          <h3>证书编辑</h3>
          
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
            class="certificate-form-content"
          >
            <el-form-item label="证书名称" prop="name" required>
              <el-input
                v-model="form.name"
                placeholder="请输入"
                maxlength="10"
                show-word-limit
                @input="updatePreview"
              />
            </el-form-item>

            <el-form-item label="证书详情" prop="intro" required>
              <el-input
                v-model="form.intro"
                type="textarea"
                :rows="3"
                placeholder="请输入"
                maxlength="200"
                show-word-limit
                @input="updatePreview"
              />
            </el-form-item>

            <el-form-item label="单位" prop="unit" required>
              <el-input
                v-model="form.unit"
                placeholder="请输入"
                maxlength="100"
                show-word-limit
                @input="updatePreview"
              />
            </el-form-item>

            <el-form-item label="证书颁发日期" required>
              <el-radio-group v-model="form.issueDateType" @change="updatePreview">
                <el-radio :label="0">获证时自动生成</el-radio>
                <el-radio :label="1">统一时间</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item 
              v-if="form.issueDateType === 1" 
              label="统一时间"
            >
              <el-input
                v-model="form.unifyTime"
                placeholder="2025年12月"
                maxlength="20"
                show-word-limit
                @input="updatePreview"
              />
            </el-form-item>

            <el-form-item label="证书样式">
              <div class="image-upload-container">
                <div class="upload-item">
                  <label>证书背景</label>
                  <div class="upload-tips">建议尺寸：450x650px，浅色背景</div>
                  <div class="upload-area" :class="{ 'uploading': uploadingBackground }" @click="!form.backgroundUrl && triggerBackgroundUpload()">
                    <div v-if="form.backgroundUrl" class="image-preview">
                      <img :src="form.backgroundUrl" class="uploaded-image" />
                      <div class="image-remove" @click.stop="removeBackgroundImage">
                        <el-icon><Close /></el-icon>
                      </div>
                    </div>
                    <div v-else class="upload-placeholder">
                      <el-icon v-if="!uploadingBackground"><Plus /></el-icon>
                      <el-icon v-else class="is-loading"><Loading /></el-icon>
                    </div>
                    <input 
                      type="file" 
                      @change="handleBackgroundUpload" 
                      accept="image/*" 
                      :disabled="uploadingBackground"
                      style="display: none;"
                      ref="backgroundFileInput"
                    />
                  </div>
                  <div v-if="form.backgroundUrl" class="reupload-btn" @click="triggerBackgroundUpload">
                    重新上传
                  </div>
                </div>
                
                <div class="upload-item">
                  <label>公章</label>
                  <div class="upload-tips">建议尺寸：100x100px，透明背景</div>
                  <div class="upload-area" :class="{ 'uploading': uploadingSeal }" @click="!form.sealUrl && triggerSealUpload()">
                    <div v-if="form.sealUrl" class="image-preview">
                      <img :src="form.sealUrl" class="uploaded-image" />
                      <div class="image-remove" @click.stop="removeSealImage">
                        <el-icon><Close /></el-icon>
                      </div>
                    </div>
                    <div v-else class="upload-placeholder">
                      <el-icon v-if="!uploadingSeal"><Plus /></el-icon>
                      <el-icon v-else class="is-loading"><Loading /></el-icon>
                    </div>
                    <input 
                      type="file" 
                      @change="handleSealUpload" 
                      accept="image/*" 
                      :disabled="uploadingSeal"
                      style="display: none;"
                      ref="sealFileInput"
                    />
                  </div>
                  <div v-if="form.sealUrl" class="reupload-btn" @click="triggerSealUpload">
                    重新上传
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form>

          <div class="form-notes">
            <p><strong>【备注】</strong></p>
            <p>1. 用户姓名自动生成；</p>
            <p>2. 自动生成时间格式为 YYYY年MM月DD日</p>
          </div>

          <div class="form-actions">
            <el-button type="primary" @click="handleSave" :loading="saving">
              确定
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Loading, Close } from '@element-plus/icons-vue'
import { addCertificate, updateCertificate, getCertificateById } from '@/api/system-management/Certificate-Management.js'
import { uploadFiles } from '@/api/common/UploadFiles.js'
import { previewFile } from '@/api/common/PreviewFile.js'
import { getInfo } from '@/api/common/info.js'

const router = useRouter()
const route = useRoute()

// 表单引用
const formRef = ref(null)
const backgroundFileInput = ref(null)
const sealFileInput = ref(null)

// 是否为编辑模式
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const uploadingBackground = ref(false)
const uploadingSeal = ref(false)

// 表单数据
const form = reactive({
  name: '',
  intro: '',
  unit: '',
  issueDateType: 0, // 0: 自动生成, 1: 统一时间
  unifyTime: '',
  backgroundUrl: '',
  backgroundFileName: '', // 背景图片文件名
  sealUrl: '',
  sealFileName: '' // 公章图片文件名
})

// 预览数据
const previewData = reactive({
  name: '',
  intro: '',
  unit: '',
  issueDate: '',
  recipientName: '用户姓名'
})

// 用户姓名
const userName = ref('用户姓名')

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入证书名称', trigger: 'blur' }
  ],
  intro: [
    { required: true, message: '请输入证书详情', trigger: 'blur' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' }
  ]
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 更新预览
const updatePreview = () => {
  previewData.name = form.name
  previewData.intro = form.intro
  previewData.unit = form.unit
  
  if (form.issueDateType === 1 && form.unifyTime) {
    previewData.issueDate = form.unifyTime
  } else {
    previewData.issueDate = '2025年10月'
  }
}

// 处理背景图片上传
const handleBackgroundUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  uploadingBackground.value = true
  
  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }
    
    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过5MB')
      return
    }
    
    // 提示最佳实践
    ElMessage.info('建议使用浅色背景图片，确保文字清晰可见')
    
    // 上传文件
    const uploadResponse = await uploadFiles([file])
    
    if (uploadResponse.code === 200 && typeof uploadResponse.data === 'string') {
      const fileName = uploadResponse.data // 直接使用返回的文件名字符串
      
      // 获取预览URL
      const previewUrl = await previewFile(fileName)
      
      // 更新表单数据
      form.backgroundUrl = previewUrl
      form.backgroundFileName = fileName // 保存文件名用于提交
      
      ElMessage.success('背景图片上传成功')
    } else {
      throw new Error(uploadResponse.msg || '上传失败')
    }
  } catch (error) {
    console.error('背景图片上传失败:', error)
    ElMessage.error(error.message || '背景图片上传失败')
  } finally {
    uploadingBackground.value = false
    // 清空input的value，以便可以重新选择同一个文件
    event.target.value = ''
  }
}

// 处理公章上传
const handleSealUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  uploadingSeal.value = true
  
  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }
    
    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过5MB')
      return
    }
    
    // 上传文件
    const uploadResponse = await uploadFiles([file])
    
    if (uploadResponse.code === 200 && typeof uploadResponse.data === 'string') {
      const fileName = uploadResponse.data // 直接使用返回的文件名字符串
      
      // 获取预览URL
      const previewUrl = await previewFile(fileName)
      
      // 更新表单数据
      form.sealUrl = previewUrl
      form.sealFileName = fileName // 保存文件名用于提交
      
      ElMessage.success('公章图片上传成功')
    } else {
      throw new Error(uploadResponse.msg || '上传失败')
    }
  } catch (error) {
    console.error('公章图片上传失败:', error)
    ElMessage.error(error.message || '公章图片上传失败')
  } finally {
    uploadingSeal.value = false
    // 清空input的value，以便可以重新选择同一个文件
    event.target.value = ''
  }
}

// 删除背景图片
const removeBackgroundImage = () => {
  form.backgroundUrl = ''
  form.backgroundFileName = ''
  ElMessage.success('背景图片已删除')
}

// 删除公章图片
const removeSealImage = () => {
  form.sealUrl = ''
  form.sealFileName = ''
  ElMessage.success('公章图片已删除')
}

// 触发背景图片上传
const triggerBackgroundUpload = () => {
  backgroundFileInput.value?.click()
}

// 触发公章图片上传
const triggerSealUpload = () => {
  sealFileInput.value?.click()
}

// 保存证书
const handleSave = async () => {
  console.log('=== 开始保存证书 ===')
  console.log('当前表单数据:', form)
  
  // 基础验证
  if (!form.name) {
    ElMessage.error('请输入证书名称')
    return
  }
  
  if (!form.intro) {
    ElMessage.error('请输入证书详情')
    return
  }
  
  if (!form.unit) {
    ElMessage.error('请输入单位')
    return
  }
  
  // 验证统一时间
  if (form.issueDateType === 1 && !form.unifyTime) {
    ElMessage.error('请输入统一时间')
    return
  }
  
  // 验证图片
  if (!form.backgroundFileName && !form.backgroundUrl) {
    ElMessage.error('请上传证书背景图片')
    return
  }
  
  if (!form.sealFileName && !form.sealUrl) {
    ElMessage.error('请上传公章图片')
    return
  }
  
  console.log('所有验证通过，准备提交数据')
  
  try {
    saving.value = true
    
    // 构建提交数据，确保数据类型正确
    const formData = {
      name: String(form.name),
      intro: String(form.intro),
      unit: String(form.unit),
      issueDate: Number(form.issueDateType), // 确保是数字
      unifyTime: form.issueDateType === 1 ? String(form.unifyTime) : '',
      background: String(form.backgroundFileName || form.backgroundUrl),
      officialSeal: String(form.sealFileName || form.sealUrl)
    }

    console.log('最终提交数据:', formData)
    console.log('数据类型检查:', {
      name: typeof formData.name,
      intro: typeof formData.intro,
      unit: typeof formData.unit,
      issueDate: typeof formData.issueDate,
      unifyTime: typeof formData.unifyTime,
      background: typeof formData.background,
      officialSeal: typeof formData.officialSeal
    })

    if (isEdit.value) {
      console.log('=== 调用 updateCertificate API ===')
      const result = await updateCertificate(route.params.id, formData)
      console.log('updateCertificate 响应:', result)
      ElMessage.success('证书更新成功')
    } else {
      console.log('=== 调用 addCertificate API ===')
      const result = await addCertificate(formData)
      console.log('addCertificate 响应:', result)
      ElMessage.success('证书创建成功')
    }
    
    // 跳转回列表页
    router.push({ name: 'System-CertificateManagement' })
    
  } catch (error) {
    console.error('=== API调用失败 ===')
    console.error('错误对象:', error)
    console.error('错误消息:', error.message)
    console.error('错误响应:', error.response)
    console.error('错误状态:', error.status)
    
    if (error.response) {
      console.error('响应数据:', error.response.data)
      console.error('响应状态:', error.response.status)
      console.error('响应头:', error.response.headers)
    }
    
    ElMessage.error(`保存失败: ${error.message || '请重试'}`)
  } finally {
    saving.value = false
    console.log('=== 保存流程结束 ===')
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getInfo()
    if (response.code === 200 && response.data?.name) {
      userName.value = response.data.name
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 静默失败，使用默认值
  }
}

// 加载证书数据（编辑模式）
const loadCertificateData = async () => {
  if (!isEdit.value) {
    console.log('不是编辑模式，跳过数据加载')
    return
  }
  
  console.log('=== 开始加载证书数据 ===')
  console.log('证书ID:', route.params.id)
  
  try {
    const response = await getCertificateById(route.params.id)
    console.log('获取证书详情响应:', response)
    
    if (response.code !== 200) {
      throw new Error(response.msg || '获取证书详情失败')
    }
    
    const data = response.data
    console.log('证书详情数据:', data)
    
    // 基本信息
    Object.assign(form, {
      name: data.name || '',
      intro: data.intro || '',
      unit: data.unit || '',
      issueDateType: data.issueDate || 0,
      unifyTime: data.unifyTime || '',
      backgroundFileName: data.background || '',
      sealFileName: data.officialSeal || ''
    })
    
    console.log('表单数据更新后:', form)
    
    // 加载图片预览
    if (data.background) {
      console.log('加载背景图片:', data.background)
      try {
        form.backgroundUrl = await previewFile(data.background)
        console.log('背景图片预览URL:', form.backgroundUrl)
      } catch (error) {
        console.error('加载背景图片预览失败:', error)
      }
    }
    
    if (data.officialSeal) {
      console.log('加载公章图片:', data.officialSeal)
      try {
        form.sealUrl = await previewFile(data.officialSeal)
        console.log('公章图片预览URL:', form.sealUrl)
      } catch (error) {
        console.error('加载公章图片预览失败:', error)
      }
    }
    
    updatePreview()
    console.log('=== 证书数据加载完成 ===')
  } catch (error) {
    console.error('=== 加载证书数据失败 ===')
    console.error('错误详情:', error)
    ElMessage.error(`加载证书数据失败: ${error.message || '请重试'}`)
  }
}

onMounted(async () => {
  console.log('=== 组件挂载 ===')
  console.log('路由参数:', route.params)
  console.log('是否编辑模式:', isEdit.value)
  
  // 获取用户信息
  await fetchUserInfo()
  await loadCertificateData()
  updatePreview()
  
  console.log('=== 组件挂载完成 ===')
})
</script>

<style scoped>
.certificate-settings {
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.back-btn {
  font-size: 16px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-container {
  display: flex;
  flex: 1;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.certificate-preview {
  flex: 0 0 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  padding: 15px;
}

.certificate-frame {
  width: 450px;
  height: 650px;
  background: #8B4513;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.certificate-content {
 width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
}

.certificate-overlay {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 10px;
  position: relative;
}

.certificate-header {
  margin-bottom: 12px;
}

.badge {
  width: 40px;
  height: 40px;
}

.certificate-title {
  font-size: 40px !important;
  /* 覆盖全局响应式字体设置 */
  font-weight: bold;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: 3px;
  position: relative;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.certificate-recipient {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 50px;
  text-align: center;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 8px 20px;
  background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.1), transparent);
  border-left: 3px solid #d4af37;
  border-right: 3px solid #d4af37;
}

.certificate-body {
  /* flex: 1; */
  font-size: 15px;
  line-height: 1.8;
  color: #2c3e50;
  text-align: center;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  padding-bottom: 120px;
  padding-top: 40px;
  max-width: 380px;
  margin: 0 auto;
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

.certificate-footer {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: -40px;
}

.footer-content {
  display: flex;
  align-items: center;
  width: 100%;
  /* justify-content: space-between; */
  flex-direction: column-reverse
}

.unit-date-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -40px; /* 3. 新增：使用负外边距让文字上移，与公章重叠 (您可以调整-50px这个值) */
  margin-left: -40px;
  position: relative;   /* 4. 新增：为 z-index 生效 */
  z-index: 1; 
            /* 5. 新增：文字图层为 1 */
}

.unit-name {
  font-size: 17px;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8px;
  /* margin-left: 150px; */
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.issue-date {
    /* margin-left: 150px;
    margin-bottom: 20px; */

  font-size: 13px;
  color: #2c3e50;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.seal-container {
  position: relative;
  flex-shrink: 0;
  z-index: 2
}

.seal {
  width: 100px;
  height: 100px;
  border: 2px solid #e74c3c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(231, 76, 60, 0.1);
  position: relative;
}

.seal::before {
  content: '★';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: #e74c3c;
  z-index: 1;
}

.seal::after {
  content: '公章';
  position: absolute;
  bottom: 25%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #e74c3c;
  font-weight: bold;
  z-index: 2;
}

.seal-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 50%;
}

.certificate-form {
  flex: 0 0 50%;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-container {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.form-container h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #2c3e50;
}

.certificate-form-content {
  flex: 1;
}

.certificate-form-content .el-form-item {
  margin-bottom: 16px;
}

/* 覆盖全局响应式字体大小，保持固定大小 */
.certificate-form-content :deep(.el-input__inner),
.certificate-form-content :deep(.el-textarea__inner) {
  font-size: 14px !important;
}

.image-upload-container {
  display: flex;
  gap: 15px;
}

.upload-item {
  flex: 1;
}

.upload-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.upload-tips {
  font-size: 11px;
  color: #909399;
  margin-bottom: 6px;
  line-height: 1.3;
}

.upload-area {
  width: 90px;
  height: 60px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-area.uploading {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.upload-area input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-area input:disabled {
  cursor: not-allowed;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 20px;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 12px;
  transition: background-color 0.3s;
}

.image-remove:hover {
  background: rgba(0, 0, 0, 0.8);
}

.reupload-btn {
  margin-top: 8px;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  text-align: center;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.reupload-btn:hover {
  background-color: #f0f9ff;
}

.form-notes {
  margin: 12px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 11px;
  color: #666;
}

.form-notes p {
  margin: 2px 0;
}

.form-actions {
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.form-actions .el-button {
  width: 100%;
}

/* 确保没有额外的滚动条 */
* {
  box-sizing: border-box;
}

.certificate-settings {
  overflow: hidden;
}

.settings-container {
  overflow: hidden;
}

.certificate-preview {
  overflow: hidden;
}
</style>
