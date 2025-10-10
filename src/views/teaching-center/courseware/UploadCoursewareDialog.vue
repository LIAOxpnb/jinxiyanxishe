<template>
    <el-dialog title="上传课件" :model-value="visible" width="800px" @close="closeDialog" :close-on-click-modal="false">
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
                            <template #append>
                                <el-button :icon="Plus" @click.stop="$emit('create-group')" />
                            </template>
                            <!-- <el-option label="未分组" :value="0" /> -->
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

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="closeDialog">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="isUploading">
                    {{ isUploading ? `上传中... ${uploadProgress}%` : '确定' }}
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { uploadFiles } from '@/api/common/UploadFiles'; // 确保路径正确
import { batchAddCourseware } from '@/api/teaching-center/CoursewareManagement';

const props = defineProps({
    visible: Boolean,
    groups: Array,
    categories: Array,
});

const emit = defineEmits(['update:visible', 'success', 'create-group']);

const formRef = ref(null);
const uploadRef = ref(null);
const fileList = ref([]);
const isUploading = ref(false);
const uploadProgress = ref(0); // [新增] 用于存储上传百分比

const formModel = reactive({
    coursewareCategory: '',
    groupId: 0,
});

const rules = reactive({
    coursewareCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
});

const handleFileChange = () => {
    // 可以在这里添加对文件类型和大小的客户端校验
};

const closeDialog = () => {
    if (isUploading.value) {
        ElMessage.warning('文件正在上传中，请稍候');
        return;
    }
    fileList.value = [];
    uploadProgress.value = 0; // [新增] 关闭时重置进度
    formRef.value?.resetFields();
    emit('update:visible', false);
};


// 在 UploadCoursewareDialog.vue 的 <script setup> 中
// 找到 handleSubmit 函数，并用下面的代码完整替换它

const handleSubmit = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
        if (valid) {
            if (fileList.value.length === 0) {
                ElMessage.warning('请至少选择一个文件进行上传');
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

                const rawFiles = fileList.value.map(f => f.raw);
                const uploadRes = await uploadFiles(rawFiles, onProgress);

                if (uploadRes.code !== 200 || !uploadRes.data) {
                    throw new Error(uploadRes.msg || '文件上传失败，未返回有效的文件路径');
                }

                // [核心修改] 正确处理后端返回的逗号分隔的字符串
                let filePaths = [];
                if (typeof uploadRes.data === 'string') {
                    filePaths = uploadRes.data.split(','); // 按逗号拆分成数组
                } else if (Array.isArray(uploadRes.data)) {
                    filePaths = uploadRes.data; // 如果已经是数组，直接使用
                }

                // [新增] 校验文件返回数量是否匹配
                if (filePaths.length !== rawFiles.length) {
                    throw new Error('上传成功，但返回的文件数量与上传数量不匹配！');
                }

                const coursewarePayload = fileList.value.map((fileInfo, index) => ({
                    name: fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.')),
                    fileName : filePaths[index], // 现在这里是正确的单个路径
                    groupId: formModel.groupId,
                    coursewareCategory: formModel.coursewareCategory,
                    fileType: fileInfo.name.substring(fileInfo.name.lastIndexOf('.') + 1)
                }));

                const batchAddRes = await batchAddCourseware(coursewarePayload);

                if (batchAddRes.code !== 200) {
                    throw new Error(batchAddRes.msg || '课件信息注册失败');
                }

                ElMessage.success('上传成功！');
                emit('success');

                fileList.value = [];
                formRef.value?.resetFields();
                emit('update:visible', false);

            } catch (error) {
                ElMessage.error(error.message || '上传失败');
            } finally {
                isUploading.value = false;
            }
        }
    });
};
</script>

<style scoped>
.upload-dragger {
    padding: 24px;
    margin-top: 16px;
}

.upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.upload-tips {
    color: #909399;
    font-size: 12px;
    line-height: 1.8;
    text-align: left;
    margin-top: 16px;
}

.progress-container {
    margin-top: 16px;
}
</style>