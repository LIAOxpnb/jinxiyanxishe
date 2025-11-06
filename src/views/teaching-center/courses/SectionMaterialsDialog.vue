<template>
  <el-dialog
    :model-value="visible"
    title="资料"
    width="600px"
    @update:model-value="closeDialog"
    :close-on-click-modal="false"
  >
    <!-- 已有资料展示 -->
    <div v-if="hasExistingMaterial && existingMaterialData" class="existing-material">
      <el-table :data="[existingMaterialData]" style="width: 100%">
        <el-table-column prop="fileName" label="资料名称" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="downloadMaterial(scope.row)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button link type="danger" @click="deleteMaterial(scope.row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 上传新资料 -->
    <div v-else style="text-align: center; padding: 20px;">
      <el-upload
        ref="uploadRef"
        drag
        action="#"
        :limit="1"
        :auto-upload="false"
        v-model:file-list="fileList"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
      >
        <div style="padding: 40px 0;">
          <el-button type="primary" link>上传附件</el-button>
          <div class="el-upload__tip">
            只支持单个文件上传，小于50M，支持rar、pdf、doc、docx、xls、xlsx、jpeg、png、jpg、格式
          </div>
        </div>
      </el-upload>
    </div>
    
    <div v-if="isUploading" class="progress-container">
      <el-progress :percentage="uploadProgress" />
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">{{ hasExistingMaterial ? '关闭' : '取消' }}</el-button>
        <el-button 
          v-if="!hasExistingMaterial"
          type="primary" 
          @click="submitForm" 
          :loading="isUploading"
          :disabled="fileList.length === 0"
        >
          {{ isUploading ? `上传中... ${uploadProgress}%` : '确定' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { genFileId } from 'element-plus';
import { Download, Delete } from '@element-plus/icons-vue';
import { uploadFiles } from '../../../api/common/UploadFiles';
import { previewFile } from '../../../api/common/PreviewFile';
import { getSectionMaterials, saveSectionMaterials, deleteSectionMaterial } from '../../../api/teaching-center/CourseManagement';

const props = defineProps({
  visible: Boolean,
  sectionData: Object,
});
const emit = defineEmits(['update:visible', 'update-material']);

const uploadRef = ref(null);
const fileList = ref([]);
const isUploading = ref(false);
const uploadProgress = ref(0);
const hasExistingMaterial = ref(false);
const existingMaterialData = ref(null);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchExistingMaterials();
  }
});

const fetchExistingMaterials = async () => {
  fileList.value = [];
  hasExistingMaterial.value = false;
  existingMaterialData.value = null;
  uploadRef.value?.clearFiles();

  try {
    const res = await getSectionMaterials(props.sectionData.id);
    if (res.code === 200 && res.data && res.data.length > 0) {
      const material = res.data[0];
      hasExistingMaterial.value = true;
      existingMaterialData.value = material;
    }
  } catch (error) {
    console.error('获取已有资料失败:', error);
  }
};

// 下载资料
const downloadMaterial = async (material) => {
  try {
    ElMessage.info('正在获取下载链接...');
    const downloadUrl = await previewFile(material.filePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = material.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('开始下载');
  } catch (error) {
    console.error("下载资料失败:", error);
    ElMessage.error("获取下载链接失败，请重试");
  }
};

// 删除资料
const deleteMaterial = async (material) => {
  try {
    await ElMessageBox.confirm('确定要删除该资料吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const res = await deleteSectionMaterial(material.id);
    if (res.code === 200) {
      ElMessage.success('删除成功');
      hasExistingMaterial.value = false;
      existingMaterialData.value = null;
      emit('update-material', { 
        sectionId: props.sectionData.id,
        materialName: null
      });
    } else {
      ElMessage.error(res.msg || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除资料失败:', error);
      ElMessage.error('删除失败，请重试');
    }
  }
};

const handleFileChange = (uploadFile, uploadFiles) => {
  console.log('文件改变:', uploadFile.name);
  
  // 验证文件格式
  const fileName = uploadFile.name.toLowerCase();
  const validExtension = 
    fileName.endsWith('.rar') || 
    fileName.endsWith('.pdf') || 
    fileName.endsWith('.doc') || 
    fileName.endsWith('.docx') || 
    fileName.endsWith('.xls') || 
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.png');
  
  if (!validExtension) {
    ElMessage.error('只支持 rar、pdf、doc、docx、xls、xlsx、jpeg、png、jpg 格式的文件！');
    // 移除不合格的文件
    fileList.value = fileList.value.filter(f => f.uid !== uploadFile.uid);
    return;
  }
  
  // 验证文件大小（50MB）
  const fileSize = uploadFile.size || uploadFile.raw?.size || 0;
  const isLt50M = fileSize / 1024 / 1024 < 50;
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB！');
    // 移除不合格的文件
    fileList.value = fileList.value.filter(f => f.uid !== uploadFile.uid);
    return;
  }
};

const handleExceed = (files) => {
  ElMessage.warning('只能上传一个文件，将替换当前文件');
  uploadRef.value.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  uploadRef.value.handleStart(file);
};

const closeDialog = () => {
  if (!isUploading.value) {
    fileList.value = [];
    uploadProgress.value = 0;
  }
  emit('update:visible', false);
};

const submitForm = async () => {
  // 如果是已存在的资料（从服务器加载的），直接关闭
  if (hasExistingMaterial.value && fileList.value.length === 1 && fileList.value[0].url) {
    closeDialog();
    return;
  }
  
  // 如果没有选择文件
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }
  
  isUploading.value = true;
  uploadProgress.value = 0;
  
  try {
    const onProgress = (progressEvent) => {
      if (progressEvent.total) {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    };
    
    const file = fileList.value[0];
    const rawFile = file.raw;
    
    console.log('开始上传文件:', rawFile.name, '大小:', (rawFile.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // 调用上传接口
    const uploadRes = await uploadFiles([rawFile], onProgress);
    
    if (uploadRes.code !== 200 || !uploadRes.data) {
      throw new Error(uploadRes.msg || '文件上传失败');
    }
    
    const filePath = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;
    
    if (typeof filePath !== 'string' || !filePath) {
      throw new Error('服务器未返回有效的文件路径');
    }
    
    console.log('文件上传成功，路径:', filePath);
    
    // 保存到服务器
    const payload = [{
      fileName: rawFile.name,
      filePath: filePath
    }];
    
    const saveRes = await saveSectionMaterials(props.sectionData.id, payload);
    
    if (saveRes.code !== 200) {
      throw new Error(saveRes.msg || '资料保存失败');
    }
    
    ElMessage.success('资料上传成功！');
    emit('update-material', { 
      sectionId: props.sectionData.id,
      materialName: rawFile.name 
    });
    
    fileList.value = [];
    closeDialog();
    
  } catch (error) {
    console.error('上传失败:', error);
    const errorMsg = error.message || '上传失败，请重试';
    ElMessage.error(errorMsg);
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};
</script>

<style scoped>
.progress-container {
  margin-top: 16px;
  padding: 0 20px;
}

.existing-material {
  padding: 0 20px;
}

.existing-material :deep(.el-table) {
  margin-bottom: 0;
}
</style>