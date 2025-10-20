<template>
  <el-dialog
    :model-value="visible"
    title="编辑课程基本信息"
    width="800px"
    @close="closeDialog"
  >
    <el-form
      ref="formRef"
      :model="formModel"
      :rules="formRules"
      label-width="100px"
      v-loading="loading"
    >
      <el-form-item label="课程名称" prop="name">
        <el-input v-model="formModel.name" placeholder="请输入课程名称" />
      </el-form-item>
      
      <el-form-item label="分类" prop="courseCategory">
        <el-select v-model="formModel.courseCategory" placeholder="请选择分类" style="width: 100%;">
        </el-select>
      </el-form-item>

      <el-form-item label="封面图片" prop="cover">
        <div class="cover-upload-container">
          <el-upload
            ref="uploadRef"
            class="cover-uploader"
            :show-file-list="false"
            :http-request="handleUploadCover"
            :before-upload="beforeUpload"
            accept="image/jpeg,image/png"
          >
            <img v-if="coverPreviewUrl" :src="coverPreviewUrl" class="cover-image" />
            <div v-else class="cover-uploader-placeholder">
              <el-icon><Plus /></el-icon>
              <span class="upload-text">点击上传</span>
            </div>
          </el-upload>
          <div class="form-item-hint">建议上传300px*200px (3:2) 的图片</div>
        </div>
      </el-form-item>
      
      <!-- <el-form-item label="课程讲师" prop="instructorId">
        <el-select v-model="formModel.instructorId" placeholder="请选择讲师" style="width: 100%;">
          <el-option label="张教授" :value="1"></el-option>
        </el-select>
      </el-form-item> -->

      <el-form-item label="课程介绍" prop="intro">
        <div style="border: 1px solid #ccc; z-index: 100">
          <Toolbar
            style="border-bottom: 1px solid #ccc"
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            mode="default"
          />
          <Editor
            style="height: 300px; overflow-y: hidden;"
            v-model="formModel.intro"
            :defaultConfig="editorConfig"
            mode="default"
            @onCreated="handleCreated"
          />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, shallowRef, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// 引入 WangEditor
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

import { updateCourse } from '../../../api/teaching-center/CourseManagement';
import { uploadFiles } from '../../../api/common/UploadFiles';
import { previewFile } from '../../../api/common/PreviewFile';

const props = defineProps({
  visible: Boolean,
  courseData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:visible', 'success']);

// --- 富文本编辑器相关 ---
const editorRef = shallowRef();
const toolbarConfig = {};
const editorConfig = { placeholder: '请输入内容...' };

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
});

const handleCreated = (editor) => {
  editorRef.value = editor
};
// --- 富文本编辑器相关结束 ---

const formRef = ref(null);
const loading = ref(false);
const coverPreviewUrl = ref('');
const originalCover = reactive({ path: '', previewUrl: '' });
const uploadRef = ref(null);

const formModel = reactive({
  id: null,
  name: '',
  courseCategory: '',
  cover: '',
  instructorId: null,
  intro: '',
  summary: '',
});

const formRules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  courseCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
  cover: [
    { 
      required: true, 
      message: '请上传封面图片', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        // 编辑时如果原本有封面，即使当前值为空也通过验证
        if (!value && !originalCover.path) {
          callback(new Error('请上传封面图片'));
        } else {
          callback();
        }
      }
    }
  ],
  instructorId: [{ required: true, message: '请选择课程讲师', trigger: 'change' }],
};

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    loading.value = true;
    Object.assign(formModel, props.courseData);
    coverPreviewUrl.value = '';
    
    originalCover.path = props.courseData.cover || '';
    
    if (props.courseData.cover) {
      try {
        coverPreviewUrl.value = await previewFile(props.courseData.cover);
        originalCover.previewUrl = coverPreviewUrl.value;
      } catch (error) {
        console.error("获取封面预览失败，将显示上传图标", error);
        coverPreviewUrl.value = '';
        originalCover.previewUrl = '';
      }
    } else {
      originalCover.previewUrl = '';
    }
    
    loading.value = false;
  }
});

const handleUploadCover = async (options) => {
  const { file } = options;
  loading.value = true;
  try {
    const res = await uploadFiles([file]);
    const path = Array.isArray(res.data) ? res.data[0] : res.data;
    if (typeof path !== 'string') {
      throw new Error('上传接口返回格式错误');
    }
    formModel.cover = path;
    coverPreviewUrl.value = await previewFile(path);
    
    // 更新原始封面信息
    originalCover.path = path;
    originalCover.previewUrl = coverPreviewUrl.value;
    
    ElMessage.success('封面上传成功！');
    formRef.value?.clearValidate('cover');
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error(error.message || '上传失败');
    // 上传失败不恢复，保持用户选择前的状态
  } finally {
    loading.value = false;
  }
};

const beforeUpload = (file) => {
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isJPGOrPNG) {
    ElMessage.error('封面图片只能是 JPG/PNG 格式!');
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!');
  }
  return isJPGOrPNG && isLt2M;
};

const closeDialog = () => {
  emit('update:visible', false);
};

const submitForm = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const payload = {
        ...formModel,
        scope: props.courseData.scope,
        status: props.courseData.status,
      };
      const res = await updateCourse(payload);
      if (res.code === 200) {
        ElMessage.success('更新成功！');
        emit('success');
        closeDialog();
      } else {
        ElMessage.error(res.msg || '更新失败');
      }
    }
  });
};
</script>

<style scoped>
.cover-upload-container {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 150px;
  height: 100px;
  background-color: #fafafa;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.cover-uploader:hover {
  border-color: var(--el-color-primary);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-uploader-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 28px;
  color: #8c939d;
}

.upload-text {
  font-size: 12px;
  margin-top: 8px;
  color: #8c939d;
}

.form-item-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  align-self: center;
}
</style>