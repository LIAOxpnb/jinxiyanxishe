<template>
  <el-container class="page-container">
    <el-main class="main-content">
      <div class="page-header">
        <el-button link @click="goBack">
          <el-icon style="margin-right: 5px;"><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">AI新增试题</h1>
      </div>

      <el-card class="form-card">
        <el-form ref="aiFormRef" :model="aiForm" :rules="aiFormRules" label-width="100px">
          <el-form-item label="题型" prop="questionType" required>
            <el-select v-model="aiForm.questionType" placeholder="请选择">
              <el-option label="单选题" value="单选" />
              <el-option label="多选题" value="多选" />
              <el-option label="填空题" value="填空" />
              <el-option label="判断题" value="判断" />
              <el-option label="论述题" value="论述" />
            </el-select>
          </el-form-item>

          <el-form-item label="归属分类" prop="questionCategory" required>
            <el-select v-model="aiForm.questionCategory" placeholder="资金分析">
              <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="试题分组" prop="groupId">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-select v-model="aiForm.groupId" placeholder="未分组" style="flex: 1;">
                <el-option v-for="group in groupList" :key="group.id" :label="group.name" :value="group.id" />
              </el-select>
              <el-button type="primary" link @click="handleCreateGroup">
                创建分组
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="题目数量" prop="questionCount" required>
            <el-input-number v-model="aiForm.questionCount" :min="1" :max="20" />
            <span style="margin-left: 10px; color: #909399;">* 每次最多20道题</span>
          </el-form-item>

          <el-form-item label="提示词" prop="prompt" required>
            <el-input 
              v-model="aiForm.prompt" 
              type="textarea" 
              :rows="8" 
              placeholder="输入详细的提示词可以更好的帮您生成试题"
              maxlength="5000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="上传附件">
            <el-upload
              ref="aiUploadRef"
              :auto-upload="false"
              :on-change="handleAiFileChange"
              :on-remove="handleAiFileRemove"
              :limit="1"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              action="#"
              :file-list="aiFileList"
            >
              <el-button type="primary" link>
                <el-icon style="margin-right: 5px;"><Upload /></el-icon>
                上传附件
              </el-button>
              <template #tip>
                <div style="color: #909399; font-size: 12px; margin-top: 5px;">
                  单个文件上传且小于20M，支持pdf、doc、docx、xls、xlsx格式
                </div>
              </template>
            </el-upload>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleAiGenerate" :loading="aiGenerating" size="large">
              AI生成
            </el-button>
            <el-button @click="goBack" size="large">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- AI生成结果展示 -->
      <el-card v-if="aiGeneratedQuestions.length > 0" class="result-card" style="margin-top: 20px;">
        <template #header>
          <div class="result-header">
            <span>AI生成结果</span>
            <el-button type="primary" @click="handleSaveAiQuestions" :loading="savingAiQuestions">
              保存到题库 ({{ aiGeneratedQuestions.length }})
            </el-button>
          </div>
        </template>

        <div v-loading="aiGenerating" element-loading-text="AI正在生成题目，请稍候...">
          <div v-if="!aiGenerating">
            <div style="margin-bottom: 15px; color: #606266;">
              已生成 {{ aiGeneratedQuestions.length }} 道题目，请检查后保存
            </div>
            
            <div 
              v-for="(question, index) in aiGeneratedQuestions" 
              :key="index" 
              class="ai-question-item"
            >
              <div class="question-header">
                <span class="question-number">题目 {{ index + 1 }}</span>
                <el-tag :type="getQuestionTypeTag(question.questionType)" size="small">
                  {{ question.questionType }}
                </el-tag>
              </div>
              
              <div class="question-content">
                <div class="question-title">{{ question.title }}</div>
                
                <div v-if="question.options && question.options.length > 0" class="question-options">
                  <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-line">
                    <span :class="{ 'correct-option': option.isCorrect }">
                      {{ option.value }}. {{ option.text }}
                      <el-icon v-if="option.isCorrect" color="#67c23a" style="margin-left: 5px;">
                        <Check />
                      </el-icon>
                    </span>
                  </div>
                </div>
                
                <div v-if="question.answer && question.questionType === '填空'" class="question-answer">
                  <strong>答案：</strong>{{ question.answer }}
                </div>
                
                <div v-if="question.analysis" class="question-analysis">
                  <strong>解析：</strong>
                  <div v-html="question.analysis"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Upload, Check } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getDictByType } from '@/api/system-management/dictionary';
import { getQuestionGroupList, addQuestionGroup } from '@/api/teaching-center/QuestionBank';

const router = useRouter();
const route = useRoute();

// 状态管理
const aiFormRef = ref(null);
const aiUploadRef = ref(null);
const aiGenerating = ref(false);
const savingAiQuestions = ref(false);
const aiFileList = ref([]);
const aiGeneratedQuestions = ref([]);
const categoryOptions = ref([]);
const groupList = ref([]);

const aiForm = reactive({
  questionType: '',
  questionCategory: '',
  groupId: null,
  questionCount: 5,
  prompt: '',
  attachmentFile: null
});

const aiFormRules = reactive({
  questionType: [{ required: true, message: '请选择题型', trigger: 'change' }],
  questionCategory: [{ required: true, message: '请选择归属分类', trigger: 'change' }],
  questionCount: [{ required: true, message: '请输入题目数量', trigger: 'blur' }],
  prompt: [{ required: true, message: '请输入提示词', trigger: 'blur' }]
});

// 返回上一页
const goBack = () => {
  router.back();
};

// 获取分类选项
const fetchCategoryOptions = async () => {
  try {
    const res = await getDictByType('question_category');
    if (res.code === 200 && res.data) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue
      }));
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

// 获取分组列表
const fetchGroups = async () => {
  try {
    const res = await getQuestionGroupList();
    if (res.code === 200 && res.data) {
      groupList.value = res.data;
    }
  } catch (error) {
    console.error('获取分组列表失败:', error);
  }
};

// 创建分组
const handleCreateGroup = () => {
  ElMessageBox.prompt('请输入新分组的名称', '新增分组', { 
    confirmButtonText: '确定', 
    cancelButtonText: '取消' 
  }).then(async ({ value }) => {
    if (!value || value.trim() === '') {
      ElMessage.warning('分组名称不能为空');
      return;
    }
    try {
      await addQuestionGroup(value.trim());
      ElMessage.success('新增分组成功！');
      await fetchGroups();
    } catch (error) {
      ElMessage.error('新增分组失败');
    }
  }).catch(() => {});
};

// 文件上传处理
const handleAiFileChange = (file) => {
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过20MB');
    aiUploadRef.value.clearFiles();
    return;
  }
  aiForm.attachmentFile = file.raw;
  aiFileList.value = [file];
};

const handleAiFileRemove = () => {
  aiForm.attachmentFile = null;
  aiFileList.value = [];
};

// 获取题型标签类型
const getQuestionTypeTag = (type) => {
  const tagMap = {
    '单选': 'primary',
    '多选': 'success',
    '填空': 'warning',
    '判断': 'info',
    '论述': 'danger'
  };
  return tagMap[type] || 'info';
};

// AI生成题目
const handleAiGenerate = async () => {
  if (!aiFormRef.value) return;
  
  await aiFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    aiGenerating.value = true;
    
    try {
      // TODO: 实际调用AI API
      // const formData = new FormData();
      // formData.append('questionType', aiForm.questionType);
      // formData.append('questionCategory', aiForm.questionCategory);
      // formData.append('groupId', aiForm.groupId);
      // formData.append('questionCount', aiForm.questionCount);
      // formData.append('prompt', aiForm.prompt);
      // if (aiForm.attachmentFile) {
      //   formData.append('file', aiForm.attachmentFile);
      // }
      // const response = await generateQuestionsWithAI(formData);
      
      // 模拟AI生成过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟生成的题目数据
      aiGeneratedQuestions.value = Array.from({ length: aiForm.questionCount }, (_, i) => ({
        questionType: aiForm.questionType,
        questionCategory: aiForm.questionCategory,
        groupId: aiForm.groupId,
        title: `这是AI生成的第${i + 1}道${aiForm.questionType}题，提示词：${aiForm.prompt.substring(0, 20)}...`,
        options: aiForm.questionType !== '填空' && aiForm.questionType !== '论述' ? [
          { value: 'A', text: '选项A的内容', isCorrect: i % 4 === 0 },
          { value: 'B', text: '选项B的内容', isCorrect: i % 4 === 1 },
          { value: 'C', text: '选项C的内容', isCorrect: i % 4 === 2 },
          { value: 'D', text: '选项D的内容', isCorrect: i % 4 === 3 }
        ] : [],
        answer: aiForm.questionType === '填空' ? '答案示例' : '',
        difficulty: 1,
        analysis: '<p>这是AI生成的题目解析内容</p>'
      }));
      
      ElMessage.success('AI生成完成！请检查后保存到题库');
      
      // 滚动到结果区域
      setTimeout(() => {
        const resultCard = document.querySelector('.result-card');
        if (resultCard) {
          resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      console.error('AI生成失败:', error);
      ElMessage.error('AI生成失败，请重试');
    } finally {
      aiGenerating.value = false;
    }
  });
};

// 保存题目到题库
const handleSaveAiQuestions = async () => {
  if (aiGeneratedQuestions.value.length === 0) {
    ElMessage.warning('没有可保存的题目');
    return;
  }
  
  savingAiQuestions.value = true;
  
  try {
    // TODO: 批量保存题目到题库
    // 这里需要调用批量添加题目的API
    // for (const question of aiGeneratedQuestions.value) {
    //   await addQuestion(question);
    // }
    
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success(`成功保存${aiGeneratedQuestions.value.length}道题目到题库！`);
    
    // 返回题库页面
    router.push('/teaching-center/question-bank');
  } catch (error) {
    console.error('保存题目失败:', error);
    ElMessage.error('保存题目失败，请重试');
  } finally {
    savingAiQuestions.value = false;
  }
};

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchCategoryOptions(),
    fetchGroups()
  ]);
  
  // 从路由参数中获取分组ID
  if (route.query.groupId) {
    aiForm.groupId = parseInt(route.query.groupId);
  }
});
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 64px);
  background-color: #f5f7fa;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 10px 0 0 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.form-card {
  background-color: #ffffff;
}

.result-card {
  background-color: #ffffff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* AI生成题目样式 */
.ai-question-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.ai-question-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.question-number {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.question-content {
  color: #606266;
}

.question-title {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 15px;
  color: #303133;
  font-weight: 500;
}

.question-options {
  margin: 15px 0;
  padding-left: 10px;
}

.option-line {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: #f5f7fa;
  transition: all 0.2s;
}

.option-line:hover {
  background-color: #ecf5ff;
}

.correct-option {
  color: #67c23a;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.question-answer {
  margin: 15px 0;
  padding: 10px;
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  color: #606266;
}

.question-answer strong {
  color: #303133;
}

.question-analysis {
  margin-top: 15px;
  padding: 12px;
  background-color: #fef0f0;
  border-left: 3px solid #f56c6c;
  border-radius: 4px;
  color: #606266;
}

.question-analysis strong {
  color: #303133;
  display: block;
  margin-bottom: 8px;
}
</style>
