<template>
  <el-dialog
    :model-value="visible"
    title="资料"
    width="600px"
    @update:model-value="closeDialog"
    :close-on-click-modal="false"
  >
    <div style="text-align: center; padding: 20px;" v-loading="loading">
      <el-upload
        ref="uploadRef"
        drag
        action="#"
        :limit="1"
        :http-request="handleUpload"
        :on-exceed="handleExceed"
        :on-error="handleUploadError"
        :on-remove="handleRemove"
        :before-remove="beforeRemove"
        :file-list="fileList"
      >
        <div style="padding: 40px 0;">
          <el-button type="primary" link>上传附件</el-button>
          <div class="el-upload__tip">
            只支持单个文件上传，小于50M，支持rar、pdf、doc、docx、xls、xlsx格式
          </div>
        </div>
      </el-upload>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm" :disabled="!uploadedFile">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { genFileId } from 'element-plus';
import { uploadFiles } from '../../../api/common/UploadFiles';
import { getSectionMaterials, saveSectionMaterials } from '../../../api/teaching-center/CourseManagement';

const props = defineProps({
  visible: Boolean,
  sectionData: Object,
});
const emit = defineEmits(['update:visible', 'update-material']);

const loading = ref(false);
const uploadRef = ref(null);
const fileList = ref([]);
const uploadedFile = ref(null);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchExistingMaterials();
  }
});

const fetchExistingMaterials = async () => {
  loading.value = true;
  fileList.value = [];
  uploadedFile.value = null;
  uploadRef.value?.clearFiles();

  try {
    const res = await getSectionMaterials(props.sectionData.id);
    if (res.code === 200 && res.data && res.data.length > 0) {
      const material = res.data[0];
      uploadedFile.value = {
        materialPath: material.filePath,
        materialName: material.fileName,
      };
      fileList.value = [{ name: material.fileName }];
    }
  } catch (error) {
    ElMessage.error('获取已有资料失败');
  } finally {
    loading.value = false;
  }
};

const handleExceed = (files) => {
  uploadRef.value.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  uploadRef.value.handleStart(file);
};

// 【核心修改】所有成功逻辑都在此函数内完成，不再需要 handleUploadSuccess
const handleUpload = async (options) => {
  const { file } = options;
  uploadedFile.value = null; // 先清空状态

  try {
    const res = await uploadFiles([file]); // 调用上传接口

    // 直接在这里处理返回结果
    if (res.code === 200 && res.data && typeof res.data === 'string') {
      ElMessage.success(`文件 ${file.name} 上传成功!`);
      // 直接给 uploadedFile 赋值
      uploadedFile.value = {
        materialPath: res.data,
        materialName: file.name,
        uid: file.uid,
      };
      // 手动调用 el-upload 内部的成功钩子，让它显示UI状态
      options.onSuccess(res, file);
    } else {
      // 如果 code 不为 200 或 data 为空，则抛出错误
      throw new Error(res.msg || '上传成功，但服务器未返回文件路径');
    }
  } catch (error) {
    // 捕获到任何错误，都调用 el-upload 内部的失败钩子
    options.onError(error);
  }
};

// 【已移除】handleUploadSuccess 函数已不再需要

const handleUploadError = (error) => {
  ElMessage.error(error.message || '文件上传失败');
  fetchExistingMaterials(); // 上传失败时，恢复到初始状态
};

const beforeRemove = (file) => {
  return ElMessageBox.confirm(`确定要移除文件 ${file.name} 吗?`).then(
    () => true,
    () => false
  );
};

const handleRemove = async () => {
  loading.value = true;
  try {
    await saveSectionMaterials(props.sectionData.id, []);
    ElMessage.success('资料移除成功！');
    uploadedFile.value = null;
    fileList.value = [];
    emit('update-material', { 
      sectionId: props.sectionData.id,
      materialName: null 
    });
  } catch(e) {
    ElMessage.error('移除失败');
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  emit('update:visible', false);
};

const submitForm = async () => {
  if (!uploadedFile.value || !uploadedFile.value.materialPath) {
    ElMessage.warning('没有有效的资料文件可供保存');
    return;
  }
  
  const payload = [{
    fileName: uploadedFile.value.materialName,
    filePath: uploadedFile.value.materialPath
  }];

  loading.value = true;
  try {
    await saveSectionMaterials(props.sectionData.id, payload);
    ElMessage.success('资料保存成功！');
    emit('update-material', { 
      sectionId: props.sectionData.id,
      materialName: uploadedFile.value.materialName 
    });
    closeDialog();
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
};
</script>