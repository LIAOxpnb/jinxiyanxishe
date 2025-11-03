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
                    1.视频: .mp4 (AVC (H264) 格式)，单个视频小于等于2GB<br />
                    2.音频: .mp3，单个音频小于等于100MB<br />
                    3.文档: .doc、.docx、.xls、.xlsx、.ppt、.pptx、.pdf，单个文档小于等于500MB<br />
                    <span style="color: #f56c6c;">注意：上传大文件可能需要较长时间，请耐心等待</span>
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
import { ref, reactive, watch } from 'vue';
// 【已修改】 引入 ElMessageBox
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { uploadFiles } from '@/api/common/UploadFiles'; // 确保路径正确
import { batchAddCourseware } from '@/api/teaching-center/CoursewareManagement';

const props = defineProps({
    visible: Boolean,
    groups: Array,
    categories: Array,
    currentGroupId: String, // 当前选中的分组ID
});

const emit = defineEmits(['update:visible', 'success', 'create-group']);

const formRef = ref(null);
const uploadRef = ref(null);
const fileList = ref([]);
const isUploading = ref(false);
const uploadProgress = ref(0);
// 【已添加】用于存储中止控制器
const uploadAbortController = ref(null);

const formModel = reactive({
    coursewareCategory: '',
    groupId: 0,
});

const rules = reactive({
    coursewareCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
});

// 监听对话框打开和当前分组变化，自动选择对应的课件组
watch([() => props.visible, () => props.currentGroupId], ([visible, currentGroupId]) => {
    if (visible && currentGroupId) {
        if (currentGroupId !== 'all' && currentGroupId !== 'none') {
            const groupId = parseInt(currentGroupId);
            const targetGroup = props.groups?.find(group => group.id === groupId);
            if (targetGroup) {
                formModel.groupId = groupId;
            }
        } else {
            formModel.groupId = 0;
        }
    }
});

const handleFileChange = (uploadFile, uploadFiles) => {
    // 检查重复文件
    const duplicateFiles = [];
    const fileNames = new Set();
    
    uploadFiles.forEach((file, index) => {
        if (fileNames.has(file.name)) {
            duplicateFiles.push(file.name);
        } else {
            fileNames.add(file.name);
        }
    });
    
    if (duplicateFiles.length > 0) {
        ElMessage.warning(`检测到重复文件：${duplicateFiles.join(', ')}，已自动移除重复文件`);
        
        const uniqueFiles = [];
        const seenNames = new Set();
        
        uploadFiles.forEach(file => {
            if (!seenNames.has(file.name)) {
                seenNames.add(file.name);
                uniqueFiles.push(file);
            }
        });
        
        fileList.value = uniqueFiles;
    }
    
    // 添加文件类型和大小的客户端校验
    const invalidFiles = [];
    
    uploadFiles.forEach(file => {
        const fileName = file.name.toLowerCase();
        const fileSize = file.size || file.raw?.size || 0;
        
        if (fileName.endsWith('.mp4')) {
            if (fileSize > 2 * 1024 * 1024 * 1024) {
                invalidFiles.push(`${file.name}（视频文件超过2GB限制）`);
            }
        } else if (fileName.endsWith('.mp3')) {
            if (fileSize > 100 * 1024 * 1024) {
                invalidFiles.push(`${file.name}（音频文件超过100MB限制）`);
            }
        } else if (fileName.match(/\.(doc|docx|xls|xlsx|ppt|pptx|pdf)$/)) {
            if (fileSize > 500 * 1024 * 1024) {
                invalidFiles.push(`${file.name}（文档文件超过500MB限制）`);
            }
        } else {
            invalidFiles.push(`${file.name}（不支持的文件类型）`);
        }
    });
    
    if (invalidFiles.length > 0) {
        ElMessage.error(`以下文件不符合规格要求，已移除：\n${invalidFiles.join('\n')}`);
        
        const validFiles = uploadFiles.filter(file => {
            const fileName = file.name.toLowerCase();
            const fileSize = file.size || file.raw?.size || 0;
            
            let isValid = false;
            if (fileName.endsWith('.mp4') && fileSize <= 2 * 1024 * 1024 * 1024) {
                isValid = true;
            } else if (fileName.endsWith('.mp3') && fileSize <= 100 * 1024 * 1024) {
                isValid = true;
            } else if (fileName.match(/\.(doc|docx|xls|xlsx|ppt|pptx|pdf)$/) && fileSize <= 500 * 1024 * 1024) {
                isValid = true;
            }
            
            return isValid;
        });
        
        fileList.value = validFiles;
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


// 【已修改】handleSubmit 函数，增加了中止逻辑
const handleSubmit = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
        if (valid) {
            if (fileList.value.length === 0) {
                ElMessage.warning('请至少选择一个文件进行上传');
                return;
            }

            // 【已添加】创建中止控制器
            uploadAbortController.value = new AbortController();

            isUploading.value = true;
            uploadProgress.value = 0;
            
            const totalSize = fileList.value.reduce((sum, file) => {
                return sum + (file.size || file.raw?.size || 0);
            }, 0);
            
            if (totalSize > 100 * 1024 * 1024) {
                ElMessage.info('检测到大文件，上传可能需要较长时间，请耐心等待...');
            }
            
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
                    throw new Error(uploadRes.msg || '文件上传失败，未返回有效的文件路径');
                }

                let filePaths = [];
                if (typeof uploadRes.data === 'string') {
                    filePaths = uploadRes.data.split(',');
                } else if (Array.isArray(uploadRes.data)) {
                    filePaths = uploadRes.data;
                }

                if (filePaths.length !== rawFiles.length) {
                    throw new Error('上传成功，但返回的文件数量与上传数量不匹配！');
                }

                const coursewarePayload = fileList.value.map((fileInfo, index) => ({
                    name: fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.')),
                    fileName : filePaths[index],
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
                // 【已修改】增加对中止错误的捕获
                if (error.name === 'AbortError' || error.message === 'canceled') {
                    ElMessage.info('上传已取消');
                } else {
                    // 保留您原有的详细错误处理
                    let errorMessage = '上传失败';
                    if (error.message.includes('timeout')) {
                        errorMessage = '上传超时，请检查网络连接或尝试上传更小的文件';
                    } else if (error.message.includes('413') || error.message.includes('Request Entity Too Large')) {
                        errorMessage = '文件过大，超过服务器限制。请上传更小的文件';
                    } else if (error.message.includes('400')) {
                        errorMessage = '请求格式错误，可能是文件格式不支持或文件损坏';
                    } else if (error.message.includes('500')) {
                        errorMessage = '服务器内部错误，请稍后重试或联系管理员';
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    ElMessage.error(errorMessage);
                    console.error('Upload error:', error);
                }
            } finally {
                isUploading.value = false;
                uploadProgress.value = 0;
                // 【已添加】重置中止控制器
                uploadAbortController.value = null;
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