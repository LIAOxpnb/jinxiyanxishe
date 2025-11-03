<template>
  <el-dialog
    :model-value="visible"
    title="添加学习"
    :width="activeTab === 'upload' ? '800px' : '1000px'"
    @close="closeDialog"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
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
          <ExistingCoursewareList 
  ref="existingListRef"
  :categories="categories"
  :groups="groups"
  :current-course-id="props.courseId" />
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
import { ref, reactive, watch, onMounted, nextTick } from 'vue';
// 【已修改】 引入 ElMessageBox
import { ElMessage, ElMessageBox } from 'element-plus';
import { uploadFiles } from '../../../api/common/UploadFiles';
import { batchAddCourseware, getCoursewareGroupList } from '../../../api/teaching-center/CoursewareManagement';
import { getDictByType } from '@/api/system-management/dictionary.js';
import ExistingCoursewareList from './ExistingCoursewareList.vue';

const props = defineProps({
  visible: Boolean,
  courseCategory: String,
  courseId: [String, Number]
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

// 【已添加】用于存储中止控制器
const uploadAbortController = ref(null);

const handleFileChange = () => {};
const existingListRef = ref(null);

// 【添加这个新函数】
const handleTabChange = (tabName) => {
  // 当用户切换到“已有课件”标签页时
  if (tabName === 'existing' && existingListRef.value) {
    // 立即调用子组件的 fetchData 方法刷新列表
    existingListRef.value.fetchData();
  }
};
// 【已修改】重写 closeDialog 逻辑
const closeDialog = () => {
    if (isUploading.value) {
        // 如果正在上传，则弹窗确认
        ElMessageBox.confirm('文件正在上传中，确定要取消上传吗？', '提示', {
            confirmButtonText: '确定取消',
            cancelButtonText: '继续上传',
            type: 'warning',
        }).then(() => {
            // 用户确认取消
            uploadAbortController.value?.abort(); // 发送中止信号
            isUploading.value = false; // 手动重置状态
            fileList.value = [];
            uploadProgress.value = 0;
            formRef.value?.resetFields();
            emit('update:visible', false);
        }).catch(() => {
            // 用户点击“继续上传”
            ElMessage.info('上传将继续');
        });
        return; // 阻止后续代码执行
    }

    // 如果没有在上传，执行原始的关闭逻辑
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

            // 【已添加】创建中止控制器
            uploadAbortController.value = new AbortController();

            isUploading.value = true;
            uploadProgress.value = 0;
            try {
                const onProgress = (progressEvent) => {
                    if (progressEvent.total) {
                        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                };
                const rawFiles = fileList.value.map(f => f.raw);
                
                // 【已修改】传递中止信号
                const uploadRes = await uploadFiles(rawFiles, onProgress, uploadAbortController.value.signal);
                
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
                // 【已修改】捕获中止错误，不显示为“上传失败”
                if (error.name === 'AbortError' || error.message === 'canceled') {
                    ElMessage.info('上传已取消');
                } else {
                    ElMessage.error(error.message || '上传失败');
                }
            } finally {
                isUploading.value = false;
                // 【已添加】重置中止控制器
                uploadAbortController.value = null;
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
    
    if (groupRes.code === 200 && groupRes.data) {
      groups.value = groupRes.data || [];
    }
    if (categoryRes.code === 200 && categoryRes.data) {
      categories.value = categoryRes.data.map(d => ({ 
        label: d.dictLabel, 
        value: d.dictValue 
      }));
    }
  } catch(e) {
    console.error('获取分类或分组数据失败:', e);
    ElMessage.error('获取分类或分组数据失败');
  }
};

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // 确保数据已加载
    if (categories.value.length === 0 || groups.value.length === 0) {
      await fetchInitialData();
    }
    formModel.coursewareCategory = ''; //
    formModel.groupId = 0; //
    
    // 直接使用传入的分类值（现在是正确的 dictValue 格式）
    // if (props.courseCategory) {
    //   formModel.coursewareCategory = props.courseCategory;
    // }
    
    // 等待DOM渲染后，刷新已有课件列表
    // 多次尝试确保组件已经渲染
    await nextTick();
    await nextTick();
    
    console.log('existingListRef.value:', existingListRef.value);
    console.log('props.courseId:', props.courseId);
    
    if (existingListRef.value && existingListRef.value.fetchData) {
      console.log('调用 fetchData');
      existingListRef.value.fetchData();
    } else {
      console.warn('existingListRef 未就绪');
    }
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