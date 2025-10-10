<template>
  <el-dialog
    :model-value="visible"
    title="创建课程"
    width="700px"
    @close="closeDialog"
  >
    <el-form
      ref="formRef"
      :model="formModel"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="课程名称" prop="name">
        <el-input
          v-model="formModel.name"
          placeholder="请输入"
          maxlength="50"
          show-word-limit
        />
        <div class="form-item-remark">【备注】课程名称重复性校验</div>
      </el-form-item>
      
      <el-form-item label="分类" prop="courseCategory">
        <el-select v-model="formModel.courseCategory" placeholder="选择分类" style="width: 100%;">
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
<el-form-item label="封面图片" prop="cover">
  <el-upload
    class="cover-uploader"
    :show-file-list="false"
    :before-upload="beforeCoverUpload"
    :http-request="handleUploadCover"
  >
    <img v-if="coverPreviewUrl" :src="coverPreviewUrl" class="cover-image" />
    <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
  </el-upload>
  <div class="form-item-hint">建议上传300px*200px (3:2) 的图片，未上传则展示默认图</div>
</el-form-item>
      <!-- <el-form-item label="课程讲师" prop="instructorId">
        <el-select
          v-model="formModel.instructorId"
          placeholder="请搜索或选择讲师"
          filterable
          style="width: 100%;"
        >
          <el-option
            v-for="item in lecturerOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="form-item-remark">【备注】默认选择创建人, 可修改, 单选, 支持搜索</div>
      </el-form-item> -->
      
      <el-form-item label="课程摘要" prop="summary">
        <el-input
          v-model="formModel.summary"
          type="textarea"
          placeholder="请输入"
          :rows="3"
        />
      </el-form-item>

      <el-form-item label="课程介绍" prop="intro">
        <el-input
          v-model="formModel.intro"
          type="textarea"
          placeholder="请输入课程详细介绍..."
          :rows="6"
        />
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
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

import { createCourse } from '../../../api/teaching-center/CourseManagement.js';
import { getDictByType } from '@/api/system-management/dictionary.js';
import { uploadFiles } from '../../../api/common/UploadFiles.js';
import { previewFile } from '../../../api/common/PreviewFile.js';


const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['update:visible', 'success']);

const formRef = ref(null);
const categoryOptions = ref([]);
const lecturerOptions = ref([]);
const coverPreviewUrl = ref(''); 

const getInitialFormModel = () => ({
  name: '',
  courseCategory: '',
  cover: '',
  instructorId: null,
  summary: '',
  intro: '',
});
const formModel = reactive(getInitialFormModel());

const formRules = reactive({
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  courseCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
  cover: [{ required: true, message: '请上传封面图片', trigger: 'change' }],
  instructorId: [{ required: true, message: '请选择课程讲师', trigger: 'change' }],
});

// --- API和逻辑 ---

const fetchCategories = async () => {
    try {
        // 1. 调用API，传入'course_category'作为参数，这会请求 /api/admin/dict/get?dictType=course_category
        const res = await getDictByType('course_category'); 
        if (res.code === 200) {
            // 2. 遍历返回的 data 数组
            categoryOptions.value = res.data.map(item => ({
                // 3. 使用 'dictLabel' 作为显示文本
                label: item.dictLabel,
                // 4. 使用 'dictValue' 作为选项的值
                value: item.dictValue,
            }));
        }
    } catch (error) { 
      console.error("获取课程分类失败", error);
      ElMessage.error('获取分类选项失败'); 
    }
};

// const fetchLecturers = async () => {
//     // 模拟数据
//     lecturerOptions.value = [
//         { label: '张教授', value: 1 },
//         { label: '李老师', value: 2 },
//         { label: '王助教', value: 3 },
//     ];
// };

watch(() => props.visible, (newVal) => {
  if (newVal) {
    Object.assign(formModel, getInitialFormModel());
    coverPreviewUrl.value = ''; 
    formRef.value?.clearValidate();
    fetchCategories();
    // fetchLecturers();
    formModel.instructorId = 1; // 假设当前登录用户ID是1
  }
});

/**
 * [核心修改] 自定义上传逻辑，参考 LecturerManagement.vue
 */
const handleUploadCover = async (options) => {
  const { file } = options;
  try {
    const uploadRes = await uploadFiles([file]);

    // 假设单个文件上传时，后端返回的 data 是一个字符串路径
    if (uploadRes.code !== 200 || typeof uploadRes.data !== 'string') {
      // 如果data是数组，则取第一个
      if (Array.isArray(uploadRes.data) && uploadRes.data.length > 0) {
         uploadRes.data = uploadRes.data[0];
      } else {
         throw new Error(uploadRes.msg || '上传接口返回格式错误');
      }
    }
    const relativePath = uploadRes.data;
    
    formModel.cover = relativePath; // 保存相对路径
    ElMessage.success('封面上传成功！');

    // 上传成功后立即获取预览地址
    const previewUrl = await previewFile(relativePath);
    coverPreviewUrl.value = previewUrl;
    formRef.value?.clearValidate('cover');

  } catch (error) {
    console.error('上传或预览过程中出错:', error);
    ElMessage.error(error.message || '操作失败');
    // 失败时清空数据
    formModel.cover = '';
    coverPreviewUrl.value = '';
  }
};


const beforeCoverUpload = (rawFile) => {
  const isJPGOrPNG = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png';
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
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
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const payload = {
        name: formModel.name,
        courseCategory: formModel.courseCategory,
        cover: formModel.cover,
        summary: formModel.summary,
        intro: formModel.intro,
        // instructorId: formModel.instructorId, // 如果后端需要，取消此行注释
      };
      
      const res = await createCourse(payload);
      if (res.code === 200) {
        ElMessage.success('创建成功！');
        emit('success');
        closeDialog();
      } else {
        ElMessage.error(res.msg || '创建失败');
      }
    }
  });
};
</script>

<style scoped>
.form-item-remark {
  color: #F56C6C;
  font-size: 12px;
  line-height: 1.5;
}
.form-item-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 150px;
  height: 100px;
  background-color: #fafafa;
  
  /* [优化] 直接将 el-upload 组件本身设置为 flex 容器来实现居中 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 40px;
  color: #8c939d;
}

.cover-image {
  max-width: 100%;
  max-height: 100%;
  display: block;
}
</style>