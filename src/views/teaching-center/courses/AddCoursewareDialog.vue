<template>
  <el-dialog
    :model-value="visible"
    title="添加学习"
    :width="activeTab === 'upload' ? '800px' : '1000px'"
    @close="closeDialog"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="上传课件" name="upload">
        <div class="dialog-content">
          <el-form :model="formModel" label-width="80px" ref="formRef" :rules="rules">
              <el-row :gutter="20">
                  <el-col :span="12">
                      <el-form-item label="分类" prop="coursewareCategory">
                          <el-select v-model="formModel.coursewareCategory" placeholder="选择分类" style="width: 100%;">
                              <el-option v-for="item in categories" :key="item.value" :label="item.label"
                                  :value="item.value" />
                          </el-select>
                      </el-form-item>
                  </el-col>
                  <el-col :span="12">
                      <el-form-item label="课件组" prop="groupId">
                          <el-select v-model="formModel.groupId" placeholder="未分组" style="width: 100%;">
                              <el-option label="不分组" :value="0" />
                              <el-option v-for="item in groups" :key="item.id" :label="item.name" :value="item.id" />
                          </el-select>
                      </el-form-item>
                  </el-col>
              </el-row>
          </el-form>

          <el-upload ref="uploadRef" class="upload-dragger" drag multiple :auto-upload="false"
              v-model:file-list="fileList" :on-change="handleFileChange">
              <div class="upload-content">
                  <el-button type="primary">选择附件</el-button>
                  <div class="el-upload__text">【备注】支持批量上传</div>
                  <div class="upload-tips">
                      1.视频: .mp4 (AVC (H264) 格式)，单个视频小于2G<br />
                      2.音频: .mp3，单个音频小于100MB<br />
                      3.文档: .doc、.docx、.xls、.xlsx、.ppt、.pptx、.pdf，单个文档小于500MB
                  </div>
              </div>
          </el-upload>
          <div v-if="isUploading" class="progress-container">
              <el-progress :percentage="uploadProgress" />
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="已有课件" name="existing">
        <div class="dialog-content">
          <ExistingCoursewareList ref="existingListRef" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="isUploading">
          {{ isUploading ? `上传中... ${uploadProgress}%` : '确定' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadFiles } from '../../../api/common/UploadFiles';
import { batchAddCourseware, getCoursewareGroupList } from '../../../api/teaching-center/CoursewareManagement';
import { getDictByType } from '@/api/system-management/dictionary.js';
import ExistingCoursewareList from './ExistingCoursewareList.vue';

const props = defineProps({
  visible: Boolean,
  courseCategory: String,
});
const emit = defineEmits(['update:visible', 'success']);

const activeTab = ref('upload');

const formRef = ref(null);
const uploadRef = ref(null);
const fileList = ref([]);
const isUploading = ref(false);
const uploadProgress = ref(0);
const groups = ref([]);
const categories = ref([]);
const formModel = reactive({
    coursewareCategory: '',
    groupId: 0,
});
const rules = reactive({
    coursewareCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
});

const handleFileChange = () => {};
const existingListRef = ref(null);

const closeDialog = () => {
    if (isUploading.value) {
        ElMessage.warning('文件正在上传中，请稍候');
        return;
    }
    fileList.value = [];
    uploadProgress.value = 0;
    formRef.value?.resetFields();
    emit('update:visible', false);
};

const submitForm = () => {
  if (activeTab.value === 'upload') {
    submitUploadTab();
  } else {
    submitExistingTab();
  }
};

const submitUploadTab = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (valid) {
            if (fileList.value.length === 0) {
                ElMessage.warning('请至少选择一个文件进行上传'); return;
            }
            isUploading.value = true;
            uploadProgress.value = 0;
            try {
                const onProgress = (progressEvent) => {
                    if (progressEvent.total) {
                        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                };
                const rawFiles = fileList.value.map(f => f.raw);
                const uploadRes = await uploadFiles(rawFiles, onProgress);
                if (uploadRes.code !== 200 || !uploadRes.data) {
                    throw new Error(uploadRes.msg || '文件上传失败');
                }
                
                let filePaths = typeof uploadRes.data === 'string' ? uploadRes.data.split(',') : uploadRes.data;
                if (filePaths.length !== rawFiles.length) {
                    throw new Error('返回的文件数量与上传数量不匹配');
                }

                const coursewarePayload = fileList.value.map((fileInfo, index) => ({
                    name: fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.')),
                    fileName : filePaths[index],
                    groupId: formModel.groupId,
                    coursewareCategory: formModel.coursewareCategory,
                    fileType: fileInfo.name.substring(fileInfo.name.lastIndexOf('.') + 1)
                }));
                const batchAddRes = await batchAddCourseware(coursewarePayload);
                if (batchAddRes.code !== 200) { throw new Error(batchAddRes.msg || '课件注册失败'); }

                let newSections = [];
                if (Array.isArray(batchAddRes.data)) {
                  // 【核心修正】创建新小节对象时，显式地将小节本身的id设为null
                  newSections = batchAddRes.data.map(cw => ({
                      id: null, // 告诉后端这是一个新小节
                      name: cw.name,
                      coursewareName: cw.fileName,
                      coursewareId: cw.id // 这是课件的ID
                  }));
                }
                
                ElMessage.success('上传并注册课件成功！');
                emit('success', newSections);
                closeDialog();

            } catch (error) {
                ElMessage.error(error.message || '上传失败');
            } finally {
                isUploading.value = false;
            }
        }
    });
};

const submitExistingTab = () => {
  const selectedItems = existingListRef.value?.selectedItems;
  if (!selectedItems || selectedItems.length === 0) {
    ElMessage.warning('请至少选择一个已有课件');
    return;
  }
  // 【核心修正】创建新小节对象时，显式地将小节本身的id设为null
  const newSections = selectedItems.map(item => ({
    id: null, // 告诉后端这是一个新小节
    name: item.name,
    coursewareName: item.fileName,
    coursewareId: item.id // 这是课件的ID
  }));
  emit('success', newSections);
  closeDialog();
};

const fetchInitialData = async () => {
  try {
    const [groupRes, categoryRes] = await Promise.all([
      getCoursewareGroupList(),
      getDictByType('courseware_category')
    ]);
    if (groupRes.code === 200) groups.value = groupRes.data;
    if (categoryRes.code === 200) {
      categories.value = categoryRes.data.map(d => ({ label: d.dictLabel, value: d.dictValue }));
    }
  } catch(e) {
    ElMessage.error('获取分类或分组数据失败');
  }
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    formModel.coursewareCategory = props.courseCategory;
  }
});

onMounted(() => {
  fetchInitialData();
});

</script>

<style scoped>
.dialog-content { padding: 10px 20px; }
.upload-dragger { padding: 24px; margin-top: 16px; }
.upload-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.upload-tips { color: #909399; font-size: 12px; line-height: 1.8; text-align: left; margin-top: 16px; }
.progress-container { margin-top: 16px; }
</style>