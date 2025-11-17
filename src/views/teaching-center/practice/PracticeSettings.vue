<template>
  <div class="practice-settings-page" v-loading="loading">
    <div v-if="practiceDetails">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">{{ practiceDetails.name || '练习设置' }}</span>
        </template>
      </el-page-header>

      <div class="main-layout">
        <div class="left-panel">
          <el-card>
            <template #header>
              <div class="left-panel-header">
                <div class="stats-bar">
                  <el-dropdown @command="addQuestion">
                    <el-button type="primary">
                      新增试题<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="manual_select">手动选题</el-dropdown-item>
                        <!-- <el-dropdown-item command="manual_add">新建试题</el-dropdown-item> -->
                        <!-- <el-dropdown-item command="draw_questions">抽取试题</el-dropdown-item> -->
                        <el-dropdown-item command="import_questions">试题导入</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <span>试题数量 <span class="stat-value">{{ totalQuestions }}</span> 道</span>
                  <div class="header-remark">【练习备注】左侧区域操作后自动保存</div>
                </div>
              </div>
            </template>
            <div class="question-list-container">
              <el-empty v-if="!questionList || questionList.length === 0" description="暂无试题，请新增"></el-empty>
              <div v-else>
                <div v-for="(item, index) in questionList" :key="item.id" class="question-card">
                  <div class="card-header">
                    <span class="question-index">{{ index + 1 }}.</span>
                    <div class="question-tags">
                      <el-tag size="small">{{ item.question?.questionType }}</el-tag>
                      <el-tag type="info" size="small">{{ getQuestionCategoryLabel(item.question?.questionCategory) }}</el-tag>
                      <el-tag type="warning" size="small">{{ getDifficultyText(item.question?.difficulty) }}</el-tag>
                    </div>
                    <div class="question-actions">
                      <el-button :icon="Top" circle plain size="small" @click="handleMoveUp(index)"
                        :disabled="index === 0" />
                      <el-button :icon="Bottom" circle plain size="small" @click="handleMoveDown(index)"
                        :disabled="index === questionList.length - 1" />
                      <!-- <el-button :icon="Edit" circle plain size="small" @click="handleEditQuestion(item.question)" /> -->
                      <el-button :icon="Delete" circle plain type="danger" size="small"
                        @click="handleDeleteQuestion(index)" />
                    </div>
                  </div>
<div class="card-body">
    <div class="question-title" v-html="item.question?.title"></div>
    
    <div class="question-options" v-if="item.question?.options && item.question.options.length > 0">
      <div v-for="opt in item.question.options" :key="opt.value" class="option">
        <el-radio 
          v-if="item.question.questionType === '单选' || item.question.questionType === '判断'"
          :model-value="item.question.answer"
          :label="opt.value"
          disabled
        >
          {{ opt.value }}. <span v-html="opt.text"></span>
        </el-radio>
        <el-checkbox
          v-else-if="item.question.questionType === '多选'"
          :model-value="(item.question.answer || '').includes(opt.value)"
          disabled
        >
          {{ opt.value }}. <span v-html="opt.text"></span>
        </el-checkbox>
        <div v-else>
          <span class="option-label">{{ opt.value }}.</span>
          <span v-html="opt.text"></span>
        </div>
      </div>
    </div>

    <div class="question-analysis">
      <strong>解析：</strong> <span v-html="item.question?.analysis || '暂无解析'"></span>
    </div>
  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="right-panel">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
                <el-button type="primary" link :icon="Edit" @click="openBasicInfoDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="练习名称">{{ practiceDetails.name }}</el-descriptions-item>
              <el-descriptions-item label="课程">{{ practiceDetails.courseName }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ practiceDetails.creatorName }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ practiceDetails.createTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span>练习设置</span>
                <el-button type="primary" link :icon="Edit" @click="openPracticeSettingsDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="试题乱序">{{ practiceDetails.disorder === 1 ? '开启' : '关闭'
                }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="未找到该练习的相关信息"></el-empty>
    
    <el-dialog v-model="basicInfoDialogVisible" title="编辑练习基本信息" width="700px" :close-on-click-modal="false">
      <el-form v-if="editForm" ref="formRef" :model="editForm" :rules="rules" label-width="80px">
        <el-form-item label="练习名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入练习名称" />
        </el-form-item>
        <el-form-item label="课程" prop="courseId">
           <el-select v-model="editForm.courseId" placeholder="请选择课程" style="width: 100%" filterable>
            <el-option v-for="course in courseOptions" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="章节" prop="chapterId">
          <el-select v-model="editForm.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!editForm.courseId || chapterOptions.length === 0">
            <el-option v-for="chapter in chapterOptions" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="小节" prop="sectionId">
          <el-select v-model="editForm.sectionId" placeholder="请选择小节" style="width: 100%" :disabled="!editForm.chapterId || sectionOptions.length === 0">
            <el-option v-for="section in sectionOptions" :key="section.id" :label="section.name" :value="section.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="basicInfoDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpdate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="practiceSettingsDialogVisible" title="练习设置" width="500px">
      <el-form v-if="editForm" :model="editForm" label-width="90px">
        <el-form-item label="试题乱序">
          <el-radio-group v-model="editForm.disorder">
            <el-radio :value="1">开启</el-radio>
            <el-radio :value="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="practiceSettingsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>

    <QuestionSelector v-if="selectorVisible" v-model:visible="selectorVisible" :existing-questions="questionList"
      :only-return-selection="true" @success="handleSelectionSuccess" />

    <QuestionEditDialog v-model:visible="editDialogVisible" :question-id="editQuestionId"
      @success="fetchPracticeDetails" />

    <!-- 抽取试题对话框 -->
    <el-dialog v-model="drawQuestionsDialogVisible" title="抽取试题" width="800px" :close-on-click-modal="false">
      <div class="draw-questions-dialog">
        <div v-for="(rule, ruleIndex) in drawQuestionsRules" :key="rule.id" class="draw-rule-section">
          <div class="rule-header">
            <span class="rule-title">规则 {{ ruleIndex + 1 }}</span>
            <el-button 
              v-if="drawQuestionsRules.length > 1" 
              type="danger" 
              link 
              @click="removeRule(ruleIndex)"
            >
              删除此规则
            </el-button>
          </div>

          <FilterBar 
            :fields="getDrawQuestionsFilterFields(ruleIndex)"
            :show-create-button="false"
            :model-value="rule.filterData"
            @filter="(data) => handleDrawQuestionsFilter(data, ruleIndex)"
            @reset="() => handleDrawQuestionsReset(ruleIndex)"
          />

          <div class="question-stats">
            <span>筛选出 {{ rule.availableCount }} 道试题</span>
            <span class="note">【备注】根据条件查询符合条件的试题数量，筛选后重新填写与分</span>
          </div>

          <div class="difficulty-section">
            <div class="difficulty-row">
              <span class="difficulty-label">难度高 ({{ rule.highCount }}道) ，抽取</span>
              <el-input-number v-model="rule.difficulty0" :min="0" :max="rule.highCount" controls-position="right" style="width: 80px;" />
              <span class="difficulty-label">道</span>
            </div>
            
            <div class="difficulty-row">
              <span class="difficulty-label">难度中 ({{ rule.mediumCount }}道) ，抽取</span>
              <el-input-number v-model="rule.difficulty1" :min="0" :max="rule.mediumCount" controls-position="right" style="width: 80px;" />
              <span class="difficulty-label">道</span>
            </div>
            
            <div class="difficulty-row">
              <span class="difficulty-label">难度低 ({{ rule.lowCount }}道) ，抽取</span>
              <el-input-number v-model="rule.difficulty2" :min="0" :max="rule.lowCount" controls-position="right" style="width: 80px;" />
              <span class="difficulty-label">道</span>
            </div>

            <div class="total-section">
              <span class="total-label">每题</span>
              <el-input-number v-model="rule.score" :min="0" controls-position="right" style="width: 80px;" />
              <span class="total-label">分，共 {{ rule.difficulty0 + rule.difficulty1 + rule.difficulty2 }} 题 {{ (rule.difficulty0 + rule.difficulty1 + rule.difficulty2) * rule.score }} 分</span>
            </div>
          </div>

          <el-divider v-if="ruleIndex < drawQuestionsRules.length - 1" />
        </div>

        <div class="total-summary">
          <span class="summary-label">总计：</span>
          <span class="summary-value">{{ totalDrawQuestions }} 题</span>
          <span class="summary-value">{{ totalDrawScore }} 分</span>
        </div>

        <div class="add-rule-section">
          <el-button type="primary" link @click="addNewRule">+ 增加规则</el-button>
        </div>

        <div class="error-message" v-if="errorMessage">
          <span class="error-text">【备注】0题或0分时，不能提交；</span>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="drawQuestionsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDrawQuestions" :disabled="!canSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="batchImportDialogVisible" title="导入试题" width="800px" :before-close="handleBatchImportDialogClose">
      <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 20px;">
          第一步：上传前请先下载模板，按照模板标准要求内容填入到模板中
        </div>
        
        <div style="margin-bottom: 20px;">
          <el-button type="primary" @click="downloadTemplate">下载模板</el-button>
        </div>

        <div style="margin-bottom: 10px;">
          第二步：上传文件
        </div>

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :limit="1"
          accept=".xlsx,.xls"
          drag
          style="width: 100%;"
        >
          <div class="upload-content">
            <el-icon class="upload-icon" style="font-size: 67px; color: #c0c4cc; margin: 40px 0 16px;">
              <Upload />
            </el-icon>
            <div class="upload-text" style="color: #606266; font-size: 14px;">点击或拖拽文件到此处上传</div>
          </div>
        </el-upload>

        <div v-if="importResult" style="margin-top: 10px; color: #f56c6c; font-size: 14px;">
          正确数 {{ importResult.successCount }}，错误数 {{ importResult.errorCount }}，
          <a 
            v-if="importResult.errorCount > 0 && importResult.errorFileUrl" 
            href="#" 
            @click.prevent="downloadErrorResult" 
            style="color: #409eff; text-decoration: underline;"
          >
            下载结果
          </a>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleBatchImportDialogClose">取消</el-button>
        <el-button type="primary" @click="handleBatchImportSubmit" :loading="batchImportLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPracticeDetail, updatePractice, setPracticeQuestionList } from '@/api/teaching-center/PracticeManagement';
import { previewFile } from '@/api/common/PreviewFile.js';
import { Edit, ArrowDown, Top, Bottom, Delete, Upload } from '@element-plus/icons-vue';
import QuestionSelector from '@/components/question/QuestionSelector.vue';
import QuestionEditDialog from '@/components/question/QuestionEditDialog.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import { getCourseList, getCourseDetail } from '@/api/teaching-center/courseManagement';
import { drawQuestions, getQuestionCount } from '@/api/teaching-center/Exams.js';
import { getQuestionGroupList, downloadQuestionTemplate, uploadQuestionTemplate } from '@/api/teaching-center/QuestionBank.js';
import { getDictData } from '@/api/system-management/dictionary';
import { getUserList } from '@/api/system-management/User.js';


const route = useRoute();
const router = useRouter();

const loading = ref(true);
const practiceId = ref(null);
const practiceDetails = ref(null);
const questionList = ref([]);
// [新增] 为表单增加ref
const formRef = ref(null); 

// [新增] 联动选择相关状态
const courseOptions = ref([]);
const chapterOptions = ref([]);
const sectionOptions = ref([]);
const currentCourseDetail = ref(null); // 用于缓存当前选中课程的完整数据

// [修改] 为 rules 增加章、节的校验
const rules = reactive({
  name: [{ required: true, message: '请输入练习名称', trigger: 'blur' }],
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  chapterId: [{ required: true, message: '请选择章节', trigger: 'change' }],
  sectionId: [{ required: true, message: '请选择小节', trigger: 'change' }],
});

const dialogTitle = computed(() => isEdit.value ? '編輯練習' : '新增練習');
const basicInfoDialogVisible = ref(false);
const practiceSettingsDialogVisible = ref(false);
const selectorVisible = ref(false);
const editDialogVisible = ref(false);
const editQuestionId = ref(null);
const editForm = ref(null);

// 抽取试题相关
const drawQuestionsDialogVisible = ref(false);
const drawQuestionsRules = ref([{
  id: Date.now(),
  filterData: {
    questionType: '',
    questionCategory: '',
    groupId: '',
    creator: ''
  },
  difficulty0: 0,
  difficulty1: 0,
  difficulty2: 0,
  score: 5,
  availableCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0
}]);
const creatorOptions = ref([]);
const errorMessage = ref('');
const questionCategoryOptions = ref([]);
const groupList = ref([]);

// 题型选项
const questionTypeOptions = ref([
  { label: '单选', value: '单选' },
  { label: '多选', value: '多选' },
  { label: '判断', value: '判断' },
  { label: '论述', value: '论述' },
]);

// 批量导入相关
const batchImportDialogVisible = ref(false);
const uploadRef = ref();
const batchImportLoading = ref(false);
const importFile = ref(null);
const importResult = ref(null);

// [新增] 获取课程列表（用于下拉框）
const fetchAllCourses = async () => {
  try {
    const res = await getCourseList({ page: 1, size: 1000 }); // 获取所有课程
    if (res.code === 200) {
      courseOptions.value = res.data.records;
    }
  } catch (error) {
    ElMessage.error('获取课程选项失败');
  }
};

// [新增] 监听课程选择的变化
watch(() => editForm.value?.courseId, async (newCourseId, oldCourseId) => {
  if (!editForm.value) return;
  // 只有在用户手动切换时才清空后续选项
  if (newCourseId !== oldCourseId) {
    editForm.value.chapterId = null;
    editForm.value.sectionId = null;
    chapterOptions.value = [];
    sectionOptions.value = [];
  }
  
  if (newCourseId) {
    try {
      const res = await getCourseDetail({ id: newCourseId });
      if (res.code === 200 && res.data) {
        currentCourseDetail.value = res.data; // 缓存整个课程数据
        chapterOptions.value = res.data.courseChapterList || [];
      }
    } catch (error) {
      ElMessage.error('获取章节列表失败');
    }
  }
});

// [新增] 监听章节选择的变化
watch(() => editForm.value?.chapterId, (newChapterId, oldChapterId) => {
  if (!editForm.value) return;
   if (newChapterId !== oldChapterId) {
    editForm.value.sectionId = null;
    sectionOptions.value = [];
  }

  if (newChapterId && currentCourseDetail.value) {
    const selectedChapter = currentCourseDetail.value.courseChapterList.find(
      chapter => chapter.id === newChapterId
    );
    if (selectedChapter) {
      sectionOptions.value = selectedChapter.courseSectionList || [];
    }
  }
});

const totalQuestions = computed(() => questionList.value.length);
const courseInfo = computed(() => {
  if (!practiceDetails.value) return '';
  const { course, courseChapter, courseSection } = practiceDetails.value;
  return `${course?.name || ''}-${courseChapter?.name || ''}-${courseSection?.name || ''}`;
});

// 获取题目分类标签
const getQuestionCategoryLabel = (categoryValue) => {
  if (!categoryValue) return '未分类';
  const found = questionCategoryOptions.value.find(opt => opt.value === categoryValue);
  return found ? found.label : categoryValue;
};

// 获取难度文本
const difficultyMap = { 0: '困难', 1: '中等', 2: '简单' };
const getDifficultyText = (difficulty) => {
  return difficultyMap[difficulty] || '未知';
};

// 抽取试题相关计算属性
const totalDrawQuestions = computed(() => {
  return drawQuestionsRules.value.reduce((sum, rule) => {
    return sum + rule.difficulty0 + rule.difficulty1 + rule.difficulty2;
  }, 0);
});

const totalDrawScore = computed(() => {
  return drawQuestionsRules.value.reduce((sum, rule) => {
    const ruleTotal = rule.difficulty0 + rule.difficulty1 + rule.difficulty2;
    return sum + (ruleTotal * rule.score);
  }, 0);
});

const canSubmit = computed(() => {
  return drawQuestionsRules.value.every(rule => {
    const hasQuestions = rule.difficulty0 > 0 || rule.difficulty1 > 0 || rule.difficulty2 > 0;
    return hasQuestions && rule.score > 0;
  }) && totalDrawQuestions.value > 0;
});

// FilterBar配置函数
const getDrawQuestionsFilterFields = (ruleIndex) => [
  {
    model: 'questionType',
    type: 'select',
    placeholder: '题型',
    options: questionTypeOptions.value
  },
  {
    model: 'questionCategory',
    type: 'select',
    placeholder: '分类',
    options: questionCategoryOptions.value
  },
  {
    model: 'groupId',
    type: 'select',
    placeholder: '试题组',
    options: groupList.value.map(item => ({ label: item.name, value: item.id }))
  },
  {
    model: 'creator',
    type: 'select',
    placeholder: '创建人',
    options: creatorOptions.value.map(item => ({ label: item.name, value: item.id }))
  }
];

const goBack = () => router.back();

// 将HTML内容中的图片路径转换为预览URL
const convertImagesToPreviewUrls = async (htmlContent) => {
  if (!htmlContent) return '';
  
  // 使用DOMParser解析HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  
  // 收集所有需要转换的图片
  const imagePromises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src) return;
    
    // 跳过base64图片
    if (src.startsWith('data:')) return;
    
    try {
      // 如果是完整的URL（MinIO临时URL），需要提取相对路径
      let relativePath = src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        // 从完整URL中提取路径部分
        // 例如: http://183.230.195.24:7028/joyas/20251104/u4436%282%29.png?X-Amr-... 
        // 需要提取出: /20251104/u4436(2).png (去掉bucket名称 joyas)
        const url = new URL(src);
        let pathname = decodeURIComponent(url.pathname); // 得到 /joyas/20251104/u4436(2).png
        
        // 去掉第一个路径段（bucket名称）
        // /joyas/20251104/u4436(2).png => /20251104/u4436(2).png
        const pathParts = pathname.split('/').filter(p => p); // ['joyas', '20251104', 'u4436(2).png']
        if (pathParts.length > 1) {
          relativePath = '/' + pathParts.slice(1).join('/'); // /20251104/u4436(2).png
        } else {
          relativePath = pathname;
        }
      }
      
      // 调用预览接口获取新的临时URL
      const previewUrl = await previewFile(relativePath);
      img.setAttribute('src', previewUrl);
    } catch (error) {
      console.error('预览图片失败:', src, error);
    }
  });
  
  // 等待所有图片路径转换完成
  await Promise.all(imagePromises);
  
  // 返回转换后的HTML
  return doc.body.innerHTML;
};

const fetchPracticeDetails = async () => {
  loading.value = true;
  try {
    const res = await getPracticeDetail({ id: practiceId.value });
    if (res.code === 200 && res.data) {
      practiceDetails.value = res.data;
      
      // 处理题目列表并转换图片URL
      const processedQuestions = await Promise.all(
        (res.data.practiceQuestionList || []).map(async (item) => {
          if (item.question && typeof item.question.details === 'string' && item.question.details.trim().startsWith('[')) {
            try {
              const optionsArray = JSON.parse(item.question.details);
              item.question.options = await Promise.all(
                optionsArray.map(async (opt) => ({
                  value: opt.option,
                  text: await convertImagesToPreviewUrls(opt.value) // 转换选项中的图片
                }))
              );
            } catch (e) {
              console.error('解析题目options JSON失败:', e, item.question.details);
              item.question.options = [];
            }
          } else if (item.question) {
            item.question.options = [];
          }
          
          // 转换题目标题中的图片
          if (item.question && item.question.title) {
            item.question.title = await convertImagesToPreviewUrls(item.question.title);
          }
          
          // 转换解析内容中的图片
          if (item.question && item.question.analysis) {
            item.question.analysis = await convertImagesToPreviewUrls(item.question.analysis);
          }
          
          return item;
        })
      );
      
      questionList.value = processedQuestions;
    } else {
      ElMessage.error(res.msg || '获取练习详情失败');
    }
  } catch (error) {
    ElMessage.error('获取练习详情失败');
  } finally {
    loading.value = false;
  }
};

const openBasicInfoDialog = async () => {
  editForm.value = JSON.parse(JSON.stringify(practiceDetails.value));
  await fetchAllCourses();
  formRef.value?.clearValidate();

  if (editForm.value.courseId) {
    const tempCourseId = editForm.value.courseId;
    const tempChapterId = editForm.value.chapterId;
    
    editForm.value.courseId = null; 
    await nextTick();
    editForm.value.courseId = tempCourseId;
    
    // 等待章節載入後，再設置章節ID以觸發小節載入
    const unsubscribe = watch(chapterOptions, (newChapters) => {
      if (newChapters && newChapters.length > 0) {
        editForm.value.chapterId = tempChapterId;
        unsubscribe(); // 執行一次後註銷監聽
      }
    });
  }
  
  basicInfoDialogVisible.value = true;
};

const openPracticeSettingsDialog = () => {
  // 深拷贝一份数据到表单模型，避免直接修改原始数据
  editForm.value = JSON.parse(JSON.stringify(practiceDetails.value));
  practiceSettingsDialogVisible.value = true;
};
const submitUpdate = async () => {
    try {
        // 直接使用 editForm 的数据调用 updatePractice 接口
        await updatePractice(editForm.value);
        ElMessage.success('更新成功！');
        
        // 更新成功后，重新获取最新数据
        await fetchPracticeDetails();

        // 关闭所有可能打开的编辑弹窗
        basicInfoDialogVisible.value = false;
        practiceSettingsDialogVisible.value = false;
    } catch (error) {
        ElMessage.error('更新失败');
    }
};

const addQuestion = (command) => {
  if (command === 'manual_select') {
    selectorVisible.value = true;
  } else if (command === 'manual_add') {
    router.push({ name: 'TeachingCenter-ManualAddQuestion', query: { practiceId: practiceId.value } });
  } else if (command === 'draw_questions') {
    openDrawQuestionsDialog();
  } else if (command === 'import_questions') {
    batchImportDialogVisible.value = true;
    importResult.value = null;
  }
};

const handleSelectionSuccess = async (selectedIds) => {
  const newQuestions = selectedIds.map((id, index) => ({ 
    questionId: id, 
    sort: questionList.value.length + index + 1 
  }));
  const currentQuestions = questionList.value.map(q => ({ questionId: q.questionId, sort: q.sort }));
  const payload = {
    id: practiceId.value,
    practiceQuestionList: [...currentQuestions, ...newQuestions],
  };
  try {
    await setPracticeQuestionList(payload);
    ElMessage.success('添加题目成功！');
    fetchPracticeDetails();
  } catch (error) {
    ElMessage.error('添加题目失败');
  }
};

const updateQuestionListOnServer = async () => {
  const payload = {
    id: practiceId.value,
    practiceQuestionList: questionList.value.map((q, index) => ({
      questionId: q.questionId,
      sort: index + 1,
    })),
  };
  try {
    await setPracticeQuestionList(payload);
    ElMessage.success('操作成功！');
    fetchPracticeDetails();
  } catch (error) {
    ElMessage.error('操作失败');
    fetchPracticeDetails();
  }
};

const handleMoveUp = (index) => {
  if (index > 0) {
    [questionList.value[index - 1], questionList.value[index]] = [questionList.value[index], questionList.value[index - 1]];
    updateQuestionListOnServer();
  }
};
const handleMoveDown = (index) => {
  if (index < questionList.value.length - 1) {
    [questionList.value[index + 1], questionList.value[index]] = [questionList.value[index], questionList.value[index + 1]];
    updateQuestionListOnServer();
  }
};
const handleEditQuestion = (question) => {
  editQuestionId.value = question.id;
  editDialogVisible.value = true;
};
const handleDeleteQuestion = (index) => {
  ElMessageBox.confirm('确定要从练习中移除这道题目吗？', '提示', { type: 'warning' })
    .then(() => {
      questionList.value.splice(index, 1);
      updateQuestionListOnServer();
    }).catch(() => { });
};

// 抽取试题相关方法
const fetchQuestionCategories = async () => {
  try {
    const res = await getDictData('question_category');
    if (res.code === 200) {
      questionCategoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue,
      }));
    }
  } catch (error) { 
    console.error("获取题目分类失败", error); 
  }
};

const fetchGroupList = async () => {
  try {
    const res = await getQuestionGroupList();
    if (res.code === 200) {
      groupList.value = res.data;
    }
  } catch (error) {
    console.error("获取题库分组失败", error);
  }
};

const fetchCreatorOptions = async () => {
  try {
    const res = await getUserList({ pageNum: 1, pageSize: 100, teacher: 1 });
    if (res.code === 200) {
      creatorOptions.value = res.data.records.map(user => ({
        id: user.id,
        name: user.name || user.username
      }));
    }
  } catch (error) {
    console.error('获取创建人列表失败:', error);
  }
};

const openDrawQuestionsDialog = async () => {
  drawQuestionsRules.value = [{
    id: Date.now(),
    filterData: {
      questionType: '',
      questionCategory: '',
      groupId: '',
      creator: ''
    },
    difficulty0: 0,
    difficulty1: 0,
    difficulty2: 0,
    score: 5,
    availableCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0
  }];
  
  errorMessage.value = '';
  
  await fetchQuestionCategories();
  await fetchCreatorOptions();
  await fetchGroupList();
  
  drawQuestionsDialogVisible.value = true;
};

const handleDrawQuestionsFilter = (filterData, ruleIndex) => {
  console.log('筛选条件：', filterData, '规则索引：', ruleIndex);
  drawQuestionsRules.value[ruleIndex].filterData = { ...filterData };
  updateQuestionCount(ruleIndex);
};

const handleDrawQuestionsReset = (ruleIndex) => {
  console.log('重置筛选条件，规则索引：', ruleIndex);
  drawQuestionsRules.value[ruleIndex].filterData = {
    questionType: '',
    questionCategory: '',
    groupId: '',
    creator: ''
  };
  drawQuestionsRules.value[ruleIndex].availableCount = 0;
  drawQuestionsRules.value[ruleIndex].highCount = 0;
  drawQuestionsRules.value[ruleIndex].mediumCount = 0;
  drawQuestionsRules.value[ruleIndex].lowCount = 0;
};

const updateQuestionCount = async (ruleIndex) => {
  const rule = drawQuestionsRules.value[ruleIndex];
  const filterData = rule.filterData;
  
  if (!filterData.groupId && 
      !filterData.questionCategory && 
      !filterData.questionType && 
      !filterData.creator) {
    rule.availableCount = 0;
    rule.highCount = 0;
    rule.mediumCount = 0;
    rule.lowCount = 0;
    return;
  }

  try {
    const queryData = {
      groupId: filterData.groupId || null,
      questionCategory: filterData.questionCategory || '',
      title: '',
      questionType: filterData.questionType || '',
      creator: filterData.creator || null
    };

    const res = await getQuestionCount(queryData);
    
    if (res.code === 200) {
      if (res.data && typeof res.data === 'object') {
        rule.highCount = Number(res.data['0']) || 0;
        rule.mediumCount = Number(res.data['1']) || 0;
        rule.lowCount = Number(res.data['2']) || 0;
        rule.availableCount = rule.highCount + rule.mediumCount + rule.lowCount;
      } else {
        rule.availableCount = 0;
        rule.highCount = 0;
        rule.mediumCount = 0;
        rule.lowCount = 0;
      }
    } else {
      ElMessage.warning(res.msg || '查询题目数量失败');
      rule.availableCount = 0;
      rule.highCount = 0;
      rule.mediumCount = 0;
      rule.lowCount = 0;
    }
  } catch (error) {
    console.error('获取题目数量失败:', error);
    ElMessage.error('获取题目数量失败，请检查网络连接');
    rule.availableCount = 0;
    rule.highCount = 0;
    rule.mediumCount = 0;
    rule.lowCount = 0;
  }
};

const addNewRule = () => {
  drawQuestionsRules.value.push({
    id: Date.now(),
    filterData: {
      questionType: '',
      questionCategory: '',
      groupId: '',
      creator: ''
    },
    difficulty0: 0,
    difficulty1: 0,
    difficulty2: 0,
    score: 5,
    availableCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0
  });
  ElMessage.success('已添加新规则');
};

const removeRule = (ruleIndex) => {
  if (drawQuestionsRules.value.length === 1) {
    ElMessage.warning('至少需要保留一个规则');
    return;
  }
  drawQuestionsRules.value.splice(ruleIndex, 1);
  ElMessage.success('已删除规则');
};

const confirmDrawQuestions = async () => {
  if (!canSubmit.value) {
    errorMessage.value = '请确保题目数量和分数都大于0';
    return;
  }

  try {
    const drawData = {
      practiceId: practiceId.value,
      questionList: drawQuestionsRules.value.map(rule => ({
        groupId: rule.filterData.groupId || null,
        questionCategory: rule.filterData.questionCategory || '',
        questionType: rule.filterData.questionType || '',
        creator: rule.filterData.creator || null,
        difficulty0: rule.difficulty0,
        difficulty1: rule.difficulty1,
        difficulty2: rule.difficulty2,
        score: rule.score.toString()
      }))
    };

    const res = await drawQuestions(drawData);
    if (res.code === 200) {
      ElMessage.success('抽取试题成功！');
      drawQuestionsDialogVisible.value = false;
      fetchPracticeDetails();
    } else {
      ElMessage.error(res.msg || '抽取试题失败');
    }
  } catch (error) {
    console.error('抽取试题失败:', error);
    ElMessage.error('抽取试题失败');
  }
};

// 批量导入相关方法
const handleFileChange = (uploadFile) => {
  importFile.value = uploadFile.raw;
  ElMessage.success('文件上传成功！');
};

const handleFileRemove = () => {
  importFile.value = null;
};

const handleBatchImportSubmit = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件');
    return;
  }

  batchImportLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', importFile.value);
    formData.append('practiceId', practiceId.value);
    
    const response = await uploadQuestionTemplate(formData);

    if (response.code === 200) {
      importResult.value = {
        successCount: response.data?.successCount || 0,
        errorCount: response.data?.errorCount || 0,
        errorFileUrl: response.data?.errorFileUrl || null
      };
      
      ElMessage.success(`批量导入成功！`);
      
      if (importResult.value.errorCount === 0) {
        setTimeout(() => {
          handleBatchImportDialogClose();
          fetchPracticeDetails();
        }, 1500);
      } else {
        fetchPracticeDetails();
      }
    } else {
      ElMessage.error(response.msg || '导入失败');
    }
  } catch (error) {
    console.error('批量导入错误:', error);
    ElMessage.error('批量导入失败');
  } finally {
    batchImportLoading.value = false;
  }
};

const downloadTemplate = async () => {
  try {
    const response = await downloadQuestionTemplate();
    
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '试题导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('模板下载成功');
  } catch (error) {
    console.error('下载模板失败:', error);
    ElMessage.error('下载模板失败');
  }
};

const handleBatchImportDialogClose = () => {
  batchImportDialogVisible.value = false;
  importFile.value = null;
  importResult.value = null;
  uploadRef.value?.clearFiles();
};

const downloadErrorResult = () => {
  if (importResult.value?.errorFileUrl) {
    window.open(importResult.value.errorFileUrl, '_blank');
  } else {
    ElMessage.warning('暂无错误结果可下载');
  }
};

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    practiceId.value = id;
    // 先加载字典数据
    await fetchQuestionCategories();
    // 再加载练习详情
    await fetchPracticeDetails();
  } else {
    ElMessage.error('无效的练习ID');
    loading.value = false;
  }
});
</script>


<style scoped>
.practice-settings-page {
  height: 100%;
  padding: 20px;
  background-color: #f0f2f5;
  box-sizing: border-box;
  /* [核心修改] 让页面自身可以滚动，而不是内部的某个div滚动 */
  overflow-y: auto;
}

.page-header-title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}

.main-layout {
  display: flex;
  margin-top: 20px;
  gap: 20px;
}

.left-panel {
  flex: 3;
  min-width: 0;
}

.right-panel {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
  /* 右侧面板会随着页面滚动而固定在顶部 */
  align-self: flex-start;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

.stat-value {
  color: #303133;
  font-weight: bold;
}

.header-remark {
  font-size: 12px;
  color: #909399;
}

.question-list-container {
  /* 既然是页面滚动，内部容器就不再需要 overflow 和 flex:1 了 */
  padding: 0 8px;
}

.question-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 16px;
}

.question-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-index {
  font-weight: bold;
}

.question-tags {
  flex-grow: 1;
  display: flex;
  gap: 8px;
}

.question-title {
  margin-bottom: 12px;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}

.question-options .option {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.question-options .option-label {
  font-weight: 500;
  margin-right: 8px;
}

.question-analysis {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  font-size: 14px;
  color: #909399;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}

/* 限制题目和解析中图片的宽度 */
.question-title :deep(img),
.question-analysis :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}

.practice-settings-page {
  height: 100%;
  padding: 20px;
  background-color: #f0f2f5;
  box-sizing: border-box;
  overflow-y: auto; 
}
.page-header-title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}
.main-layout {
  display: flex;
  margin-top: 20px;
  gap: 20px;
}
.left-panel {
  flex: 3;
  min-width: 0;
}
.right-panel {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
  align-self: flex-start;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}
.stat-value {
  color: #303133;
  font-weight: bold;
}
.header-remark {
  font-size: 12px;
  color: #909399;
}
.question-list-container {
  padding: 0 8px;
}
.question-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 16px;
}
.question-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.question-index {
  font-weight: bold;
}
.question-tags {
  flex-grow: 1;
  display: flex;
  gap: 8px;
}
.question-title {
  margin-bottom: 12px;
}
.question-options .option {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}
.question-options .option-label {
  font-weight: 500;
  margin-right: 8px;
}
.question-analysis {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  font-size: 14px;
  color: #909399;
}

/* 抽取试题弹窗样式 */
.draw-questions-dialog {
  padding: 20px 0;
}

.draw-rule-section {
  margin-bottom: 20px;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.rule-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.question-stats {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
}

.question-stats .note {
  color: #f56c6c;
  margin-left: 20px;
}

.difficulty-section {
  margin-bottom: 20px;
}

.difficulty-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.difficulty-label {
  margin-right: 8px;
  color: #606266;
}

.total-section {
  display: flex;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 14px;
}

.total-label {
  margin-right: 8px;
  color: #606266;
}

.total-summary {
  padding: 16px;
  background-color: #ecf5ff;
  border-radius: 4px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.summary-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.summary-value {
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
}

.add-rule-section {
  margin-bottom: 20px;
}

.error-message {
  padding: 8px 12px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  margin-bottom: 20px;
}

.error-text {
  color: #f56c6c;
  font-size: 12px;
}
</style>