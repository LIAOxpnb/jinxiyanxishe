<template>
  <div class="exam-settings-page" v-loading="loading">
    <div v-if="examDetails">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">{{ examDetails.name || '考试设置' }}</span>
          <el-tag v-if="examDetails.status === 1" type="success" size="small">已发布</el-tag>
          <el-tag v-else type="info" size="small">未发布</el-tag>
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
                        <el-dropdown-item command="manual_add">新增试题</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <span>试题数 <span class="stat-value">{{ totalQuestions }}</span> 道</span>
                  <span>总分 <span class="stat-value">{{ totalScore }}</span> 分</span>
                  <span>合格分 <span class="stat-value">{{ examDetails.qualified }}</span> 分</span>
                  <el-button type="primary" link @click="openBatchSetScoreDialog">批量设置分数</el-button>
                  <el-dropdown @command="handleScoreCommands">
                    <el-button type="primary" link>
                      设置合格分<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="setPassingScore">设置合格分</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </template>
            <div class="question-list-container">
              <el-empty v-if="!questionList || questionList.length === 0" description="暂无试题，请新增"></el-empty>
              <div v-else>
                <ExamQuestionCard v-for="(item, index) in questionList" :key="item.id" :item-data="item" :index="index"
                  @score-change="handleScoreChange" @move-up="handleMoveUp" @move-down="handleMoveDown"
                  @preview="handlePreview" @edit="handleEditQuestion" @delete="handleDeleteQuestion" />
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
              <el-descriptions-item label="考试名称">{{ examDetails.name }}</el-descriptions-item>
              <el-descriptions-item label="分类">{{ examDetails.examCategory  }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ examDetails.creator }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ examDetails.createTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span>考试设置</span>
                <el-button type="primary" link :icon="Edit" @click="openExamSettingsDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="考试时间">{{ examDetails.examDate === 0 ? '不限时' : `指定时间 (${examDetails.startTime}
                ~
                ${examDetails.endTime})` }}</el-descriptions-item>
              <el-descriptions-item label="考试时长">{{ examDetails.duration === -1 ? '不限制' : `${examDetails.duration}分钟`
                }}</el-descriptions-item>
              <el-descriptions-item label="考试次数">{{ examDetails.attempts === -1 ? '不限制' : `${examDetails.attempts}次`
                }}</el-descriptions-item>
              <el-descriptions-item label="参考人员">{{ ['未指定', '指定人员', '指定班级'][examDetails.scope] || '未知'
                }}</el-descriptions-item>
              <el-descriptions-item label="试题乱序">{{ examDetails.disorder === 1 ? '开启' : '关闭' }}</el-descriptions-item>
              <el-descriptions-item label="查看考卷">{{ examDetails.viewPaper === 1 ? '开启' : '关闭' }}</el-descriptions-item>
              <el-descriptions-item label="禁止复制">{{ examDetails.disableCopy === 1 ? '开启' : '关闭'
                }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <div class="action-buttons">
            <el-button :type="examDetails.status === 1 ? 'danger' : 'primary'" @click="handleTogglePublishStatus">
              {{ examDetails.status === 1 ? '取消发布' : '发布' }}
            </el-button>
          </div>

        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="未找到该考试的相关信息"></el-empty>

    <el-dialog v-model="basicInfoDialogVisible" title="编辑考试基本信息" width="500px">
      <el-form v-if="editForm" :model="editForm" label-width="80px" ref="basicInfoFormRef">
        <el-form-item label="考试名称" prop="name" required>
          <el-input v-model="editForm.name" maxlength="20" show-word-limit />
          <div class="form-hint">【备注】考试名称重复性校验</div>
        </el-form-item>
        <el-form-item label="分类" prop="examCategory" required>
          <el-select v-model="editForm.examCategory" placeholder="选择分类" style="width:100%;">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="basicInfoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="examSettingsDialogVisible" title="考试设置" width="600px">
      <el-form v-if="editForm" :model="editForm" label-width="90px" ref="examSettingsFormRef">
        <el-form-item label="考试时间">
          <el-radio-group v-model="editForm.examDate">
            <el-radio :label="0">不限制</el-radio>
            <el-radio :label="1">指定时间</el-radio>
          </el-radio-group>
          <div v-if="editForm.examDate === 1" style="margin-top: 10px;">
            <el-date-picker v-model="timeRange" type="datetimerange" range-separator="至" start-placeholder="选择开始时间"
              end-placeholder="选择结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
          </div>
        </el-form-item>
        <el-form-item label="考试时长">
          <el-radio-group v-model="editForm.duration" @change="(val) => { if (val !== -1) isDurationLimited = true }">
            <el-radio :label="-1">不限制</el-radio>
            <el-radio :label="customDuration > 0 ? customDuration : 60" @change="isDurationLimited = true">限制时长</el-radio>
          </el-radio-group>
          <el-input-number v-if="isDurationLimited" v-model="customDuration" :min="1"
            @change="(val) => editForm.duration = val" controls-position="right" style="margin-left: 10px;" />
          <span v-if="isDurationLimited" style="margin-left: 5px;">分钟</span>
        </el-form-item>
        <el-form-item label="考试次数">
          <el-radio-group v-model="editForm.attempts">
            <el-radio :label="-1">不限制</el-radio>
            <el-radio :label="1">限制次数</el-radio>
          </el-radio-group>
          <template v-if="editForm.attempts !== -1">
            <el-input-number v-model="editForm.attempts" :min="1" controls-position="right"
              style="margin-left: 10px;" />
            <span style="margin-left: 5px;">次</span>
          </template>
        </el-form-item>
        <el-form-item label="人员范围">
          <el-radio-group v-model="editForm.scope" @change="handleScopeChange">
            <el-radio :label="1">指定人员</el-radio>
            <el-radio :label="2">指定班级</el-radio>
          </el-radio-group>
          <div v-if="editForm.scope === 1" style="margin-top: 10px; width: 100%;">
            <div class="selected-users-display">
              <div v-if="selectedScopeUsers.length === 0" class="no-users-selected">
                未选择人员
              </div>
              <div v-else class="users-summary">
                已选择 {{ selectedScopeUsers.length }} 人
                <div class="selected-users-list">
                  <el-tag v-for="user in selectedScopeUsers.slice(0, 5)" :key="user.id" closable
                    @close="removeSelectedUser(user)" style="margin: 2px;">
                    {{ user.name }}
                  </el-tag>
                  <span v-if="selectedScopeUsers.length > 5" class="more-users">
                    等{{ selectedScopeUsers.length }}人
                  </span>
                </div>
              </div>
              <el-button type="primary" @click="openUserSelectionDialog">
                {{ selectedScopeUsers.length > 0 ? '修改人员' : '选择人员' }}
              </el-button>
            </div>
            <div class="form-hint">【备注】指定人员后，自动添加到班级设置中</div>
          </div>
          <div v-if="editForm.scope === 2" style="margin-top: 10px; width: 100%;">
            <div class="selected-classes-display">
              <div v-if="selectedScopeClasses.length === 0" class="no-classes-selected">
                未选择班级
              </div>
              <div v-else class="classes-summary">
                已选择 {{ selectedScopeClasses.length }} 个班级
                <div class="selected-classes-list">
                  <el-tag v-for="clazz in selectedScopeClasses.slice(0, 5)" :key="clazz.id" closable
                    @close="removeSelectedClass(clazz)" style="margin: 2px;">
                    {{ clazz.name }} ({{ clazz.userCount }}人)
                  </el-tag>
                  <span v-if="selectedScopeClasses.length > 5" class="more-classes">
                    等{{ selectedScopeClasses.length }}个班级
                  </span>
                </div>
              </div>
              <el-button type="primary" @click="openClassSelectionDialog">
                {{ selectedScopeClasses.length > 0 ? '修改班级' : '选择班级' }}
              </el-button>
            </div>
            <div class="form-hint">【备注】指定班级后，自动添加到班级设置中</div>
          </div>
        </el-form-item>
        <el-form-item label="试题乱序">
          <el-radio-group v-model="editForm.disorder">
            <el-radio :label="1">开启</el-radio>
            <el-radio :label="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="查看考卷">
          <el-radio-group v-model="editForm.viewPaper">
            <el-radio :label="1">开启</el-radio>
            <el-radio :label="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="禁止复制">
          <el-radio-group v-model="editForm.disableCopy">
            <el-radio :label="1">开启</el-radio>
            <el-radio :label="0">关闭</el-radio>
          </el-radio-group>
          <div class="form-hint">【备注】1. 试题乱序默认开启; 2. 查看考卷、禁止复制...</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="examSettingsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchSetScoreDialogVisible" title="批量设置分数" width="500px">
      <el-form :model="batchScoreForm" label-width="80px">
        <el-form-item v-for="item in questionTypesForBatchScore" :key="item.type">
          <template #label>{{ item.name }}</template>
          <span class="dialog-stat-text">共{{ questionCountsByType[item.type] || 0 }}题</span>
          <span class="dialog-stat-text">单题</span>
          <el-input-number v-model="batchScoreForm[item.type]" :min="0" controls-position="right"
            style="width: 100px;" />
          <span class="dialog-stat-text">分, 共{{ (questionCountsByType[item.type] || 0) * (batchScoreForm[item.type] ||
            0)
            }}分</span>
        </el-form-item>
        <el-divider />
        <el-form-item label="总共">
          <span class="dialog-stat-text">共{{ totalQuestions }}题</span>
          <span style="margin-left: 20px;">总分 <span class="stat-value">{{ totalScore }}</span> 分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSetScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchScores">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="setPassingScoreDialogVisible" title="合格分设置" width="500px">
      <el-form :model="passingScoreForm" label-width="80px">
        <el-form-item label="总共">
          <span class="dialog-stat-text">共{{ totalQuestions }}题</span>
          <span class="dialog-stat-text">合格</span>
          <el-input-number v-model="passingScoreForm.qualified" :min="0" :max="totalScore" controls-position="right"
            style="width: 100px;" />
          <span class="dialog-stat-text">分, 共{{ totalScore }}分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="setPassingScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassingScore">确定</el-button>
      </template>
    </el-dialog>

    <QuestionSelector v-if="selectorVisible" v-model:visible="selectorVisible" :exam-id="examId"
      :existing-questions="questionList" @success="handleSelectionSuccess" />

    <!-- 试题编辑弹窗 -->
    <QuestionEditDialog v-model:visible="editDialogVisible" :question-id="editQuestionId" :group-list="groupList"
      @success="handleEditSuccess" />

    <!-- 人员选择弹窗 -->
    <el-dialog v-model="userSelectionDialogVisible" title="选择人员" width="1000px" :close-on-click-modal="false">
      <div class="add-member-dialog">
        <!-- 左侧：用户树形选择 -->
        <div class="user-tree-section">
          <!-- 搜索框 -->
          <div class="search-section">
            <el-input v-model="userSearchKeyword" placeholder="姓名、手机号、警号、身份证号" @input="handleUserSearch" clearable>
              <template #append>
                <el-button @click="handleUserSearch">
                  <el-icon>
                    <Search />
                  </el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- 用户树 -->
          <div class="user-tree-container">
            <!-- 搜索结果 -->
            <div v-if="userSearchKeyword" class="search-results">
              <div class="search-tip">
                包含 "{{ userSearchKeyword }}" 的搜索结果
              </div>
              <div v-for="user in searchedUsers" :key="user.id" class="user-item search-result">
                <el-checkbox v-model="user.checked" @change="handleUserCheck(user)">
                  <div class="user-info">
                    <el-avatar :size="24" :src="user.avatar">
                      <el-icon>
                        <User />
                      </el-icon>
                    </el-avatar>
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-dept">{{ user.department }}</span>
                  </div>
                </el-checkbox>
              </div>
            </div>

            <!-- 组织树 -->
            <div v-else class="org-tree">
              <el-tree ref="orgTreeRef" :data="orgTreeData" :props="{ children: 'children', label: 'name' }"
                show-checkbox node-key="id" :default-expand-all="true" @check="handleOrgTreeCheck">
                <template #default="{ node, data }">
                  <div class="tree-node">
                    <el-icon v-if="data.type === 'org'" class="org-icon">
                      <OfficeBuilding />
                    </el-icon>
                    <el-avatar v-else :size="20" :src="data.avatar">
                      <el-icon>
                        <User />
                      </el-icon>
                    </el-avatar>
                    <span class="node-label">{{ data.name }}</span>
                    <span v-if="data.type === 'user'" class="user-dept">{{ data.department }}</span>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
        </div>

        <!-- 右侧：已选用户 -->
        <div class="selected-users-section">
          <div class="section-header">
            <span>已选：{{ selectedScopeUsers.length }} 名用户</span>
            <el-button type="text" @click="clearSelectedUsers">清空</el-button>
          </div>

          <div class="selected-users-list-dialog">
            <div v-for="user in selectedScopeUsers" :key="user.id" class="selected-user-item">
              <el-avatar :size="32" :src="user.avatar">
                <el-icon>
                  <User />
                </el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-dept">{{ user.department }}</div>
              </div>
              <el-button type="text" class="remove-btn" @click="removeSelectedUser(user)">
                <el-icon>
                  <Close />
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userSelectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelectedUsers">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 班级选择对话框 -->
    <el-dialog v-model="classSelectionDialogVisible" title="添加班级" width="1000px" :close-on-click-modal="false">
      <div class="add-class-dialog">
        <!-- 左侧：班级列表 -->
        <div class="class-list-section">
          <!-- 搜索框 -->
          <div class="search-section">
            <el-input v-model="classSearchKeyword" placeholder="班级名称" @input="handleClassSearch" clearable>
              <template #append>
                <el-button @click="handleClassSearch">
                  <el-icon>
                    <Search />
                  </el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- 班级列表 -->
          <div class="class-list-container">
            <div v-for="clazz in classListData" :key="clazz.id" class="class-item">
              <el-checkbox v-model="clazz.checked" @change="handleClassCheck(clazz)">
                <div class="class-info">
                  <el-icon class="class-icon">
                    <OfficeBuilding />
                  </el-icon>
                  <div class="class-details">
                    <span class="class-name">{{ clazz.name }}</span>
                    <span class="class-members">({{ clazz.userCount }}人)</span>
                  </div>
                </div>
              </el-checkbox>
            </div>
          </div>

          <!-- 分页 -->
          <div class="class-pagination">
            <span class="pagination-info">共{{ classTotal }}条</span>
            <el-pagination v-model:current-page="classCurrentPage" v-model:page-size="classPageSize" :total="classTotal"
              layout="prev, pager, next" @current-change="handleClassPageChange" size="small" />
          </div>
        </div>

        <!-- 右侧：已选班级 -->
        <div class="selected-classes-section">
          <div class="section-header">
            <span>已选：{{ selectedScopeClasses.length }} 个班级</span>
            <el-button type="text" @click="clearSelectedClasses">清空</el-button>
          </div>

          <div class="selected-classes-list-dialog">
            <div v-for="clazz in selectedScopeClasses" :key="clazz.id" class="selected-class-item">
              <el-icon class="class-icon">
                <OfficeBuilding />
              </el-icon>
              <div class="class-details">
                <div class="class-name">{{ clazz.name }}</div>
                <div class="class-members">{{ clazz.userCount }}人</div>
              </div>
              <el-button type="text" class="remove-btn" @click="removeSelectedClass(clazz)">
                <el-icon>
                  <Close />
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="classSelectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelectedClasses">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getExamDetail, updateExam, setExamQuestions, setPassingScore, updateExamStatus } from '../../../api/teaching-center/Exams.js';
import { getQuestionGroupList } from '@/api/teaching-center/QuestionBank.js';
import { getDictData } from '@/api/system-management/dictionary';
import { getUserList } from '@/api/system-management/User.js';
import { getOrgTree } from '@/api/system-management/Org.js';
import { getClassList } from '@/api/teaching-center/ClassManagement.js';
import { Edit, ArrowDown, Search, User, OfficeBuilding, Close } from '@element-plus/icons-vue';
import ExamQuestionCard from '@/components/exam/ExamQuestionCard.vue';
import QuestionSelector from '@/components/question/QuestionSelector.vue';
import QuestionEditDialog from '@/components/question/QuestionEditDialog.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const examId = ref(null);
const examDetails = ref(null);
const questionList = ref([]);
const categoryOptions = ref([]);

const basicInfoDialogVisible = ref(false);
const examSettingsDialogVisible = ref(false);
const batchSetScoreDialogVisible = ref(false);
const setPassingScoreDialogVisible = ref(false);
const selectorVisible = ref(false);
const editDialogVisible = ref(false);
const editQuestionId = ref(null);
const groupList = ref([]);

const editForm = ref(null);
const batchScoreForm = ref({});
const passingScoreForm = ref({ qualified: 0 });
const isDurationLimited = ref(false);
const customDuration = ref(60);

const userList = ref([]);
const classList = ref([]);
const selectedScopeItems = ref([]);
const userSearchLoading = ref(false);

// 人员选择弹窗相关
const userSelectionDialogVisible = ref(false);
const userSearchKeyword = ref('');
const searchedUsers = ref([]);
const selectedScopeUsers = ref([]);
const orgTreeData = ref([]);
const orgTreeRef = ref(null);

// 班级选择弹窗相关
const classSelectionDialogVisible = ref(false);
const classSearchKeyword = ref('');
const classListData = ref([]);
const selectedScopeClasses = ref([]);
const classCurrentPage = ref(1);
const classPageSize = ref(10);
const classTotal = ref(0);

watch(() => editForm.value?.duration, (newVal) => {
  isDurationLimited.value = newVal !== -1;
  if (newVal !== -1) {
    customDuration.value = newVal;
  }
});

const timeRange = computed({
  get() {
    if (editForm.value && editForm.value.startTime && editForm.value.endTime) {
      return [editForm.value.startTime, editForm.value.endTime];
    }
    return [];
  },
  set(val) {
    if (editForm.value) {
      editForm.value.startTime = val ? val[0] : null;
      editForm.value.endTime = val ? val[1] : null;
    }
  }
});

const questionCountsByType = computed(() => {
  return questionList.value.reduce((acc, item) => {
    const type = item.question?.questionType;
    if (!type) return acc;
    const typeKeyMap = { '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE', '填空': 'FILL_IN_BLANK', '论述': 'ESSAY', '简答': 'ESSAY' };
    const key = typeKeyMap[type];
    if (key) {
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
    }
    return acc;
  }, {});
});

const totalQuestions = computed(() => questionList.value.length);

const totalScore = computed(() => {
  return questionList.value.reduce((sum, item) => sum + (item.score || 0), 0);
});

const questionTypesForBatchScore = ref([
  { type: 'SINGLE_CHOICE', name: '单选' },
  { type: 'MULTIPLE_CHOICE', name: '多选' },
  { type: 'FILL_IN_BLANK', name: '填空' },
  { type: 'TRUE_FALSE', name: '判断' },
  { type: 'ESSAY', name: '简答' },
]);

const scopeOptions = computed(() => {
  if (!editForm.value) return [];
  return editForm.value.scope === 1 ? userList.value : classList.value;
});

const scopePlaceholder = computed(() => {
  if (!editForm.value) return '';
  return editForm.value.scope === 1 ? '请输入用户姓名、手机号等搜索' : '请选择指定班级';
});

const goBack = () => {
  router.back();
};

const fetchExamDetails = async () => {
  loading.value = true;
  try {
    const res = await getExamDetail(examId.value);
    if (res.code === 200) {
      examDetails.value = res.data;
      questionList.value = res.data.examQuestionList || [];
    } else {
      ElMessage.error(res.msg || '获取考试详情失败');
    }
  } catch (error) {
    ElMessage.error('获取考试详情失败');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await getDictData('exam_category');
    if (res.code === 200) {
      categoryOptions.value = res.data.map(item => ({
        label: item.dictLabel,
        value: item.dictValue,
      }));
    }
  } catch (error) { console.error("获取考试分类失败", error); }
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

const searchUsers = async (query) => {
  if (!query) {
    userList.value = [];
    return;
  }
  userSearchLoading.value = true;
  try {
    const res = await getUserList({ pageNum: 1, pageSize: 50, param: query, teacher: 1 });
    if (res.code === 200) {
      userList.value = res.data.records.map(u => ({ id: u.id, name: u.name || u.username }));
    }
  } catch (error) {
    console.error("搜索用户失败:", error);
  } finally {
    userSearchLoading.value = false;
  }
};

const openBasicInfoDialog = () => {
  editForm.value = JSON.parse(JSON.stringify(examDetails.value));
  basicInfoDialogVisible.value = true;
};

const openExamSettingsDialog = async () => {
  editForm.value = JSON.parse(JSON.stringify(examDetails.value));
  selectedScopeItems.value = [];
  selectedScopeUsers.value = [];
  selectedScopeClasses.value = [];

  console.log('打开考试设置对话框，examDetails:', examDetails.value);
  console.log('editForm.value.clazzUserBindList:', editForm.value.clazzUserBindList);

  if (editForm.value.clazzUserBindList && editForm.value.scope === 1) {
    // 需要通过用户ID获取真实的用户信息
    const userIds = editForm.value.clazzUserBindList.map(item => item.userId).filter(Boolean);
    console.log('需要查询的用户IDs:', userIds);

    if (userIds.length > 0) {
      try {
        // 调用用户列表API获取所有用户信息
        const response = await getUserList({
          pageNum: 1,
          pageSize: 100, // 获取足够多的用户
          param: '' // 空参数获取所有用户
        });

        console.log('用户列表API响应:', response);

        if (response.code === 200 && response.data.records) {
          const allUsers = response.data.records;

          // 获取组织树信息以便正确显示部门
          let orgTreeMap = {};
          try {
            const orgResponse = await getOrgTree();
            if (orgResponse.code === 200) {
              const buildOrgMap = (nodes) => {
                for (const node of nodes) {
                  orgTreeMap[node.id] = node.orgName;
                  if (node.children && node.children.length > 0) {
                    buildOrgMap(node.children);
                  }
                }
              };
              buildOrgMap(orgResponse.data);
            }
          } catch (error) {
            console.error('获取组织树失败:', error);
          }

          // 根据用户ID匹配用户信息
          selectedScopeUsers.value = userIds.map(userId => {
            const userInfo = allUsers.find(user => user.id === userId);
            console.log(`查找用户ID ${userId}:`, userInfo);

            if (userInfo) {
              // 优先使用API返回的orgName，然后查找组织树，最后使用备选
              let department = userInfo.orgName;
              if (!department && userInfo.orgId && orgTreeMap[userInfo.orgId]) {
                department = orgTreeMap[userInfo.orgId];
              }
              if (!department) {
                department = userInfo.organizationName || userInfo.deptName || userInfo.department || '未知部门';
              }

              return {
                id: userInfo.id,
                name: userInfo.name || `用户ID:${userInfo.id}`,
                department: department,
                avatar: userInfo.avatar || '',
                policeNumber: userInfo.policeNumber || '',
                phone: userInfo.username || ''
              };
            } else {
              // 如果在用户列表中找不到，使用原始数据
              const originalItem = editForm.value.clazzUserBindList.find(item => item.userId === userId);
              return {
                id: userId,
                name: originalItem?.userName || originalItem?.name || `用户ID:${userId}`,
                department: originalItem?.userDept || originalItem?.department || '未知部门',
                avatar: originalItem?.userAvatar || originalItem?.avatar || '',
                policeNumber: originalItem?.userPoliceNumber || originalItem?.policeNumber || '',
                phone: originalItem?.userPhone || originalItem?.phone || ''
              };
            }
          });
        } else {
          // API调用失败，使用原始数据
          selectedScopeUsers.value = editForm.value.clazzUserBindList.map(item => ({
            id: item.userId,
            name: item.userName || item.name || `用户ID:${item.userId}`,
            department: item.userDept || item.department || '未知部门',
            avatar: item.userAvatar || item.avatar || '',
            policeNumber: item.userPoliceNumber || item.policeNumber || '',
            phone: item.userPhone || item.phone || item.username || ''
          }));
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 发生错误时使用原始数据
        selectedScopeUsers.value = editForm.value.clazzUserBindList.map(item => ({
          id: item.userId,
          name: item.userName || item.name || `用户ID:${item.userId}`,
          department: item.userDept || item.department || '未知部门',
          avatar: item.userAvatar || item.avatar || '',
          policeNumber: item.userPoliceNumber || item.policeNumber || '',
          phone: item.userPhone || item.phone || item.username || ''
        }));
      }
    }

    console.log('设置selectedScopeUsers:', selectedScopeUsers.value);
    selectedScopeItems.value = editForm.value.clazzUserBindList.map(item => item.userId).filter(Boolean);
  } else if (editForm.value.clazzUserBindList && editForm.value.scope === 2) {
    // 处理班级选择逻辑
    const classIds = editForm.value.clazzUserBindList.map(item => item.clazzId).filter(Boolean);
    console.log('需要查询的班级IDs:', classIds);

    if (classIds.length > 0) {
      try {
        // 调用班级列表API获取班级信息
        const response = await getClassList({
          page: 1,
          size: 100,
          name: '',
          isMe: true,
          clazzStatus: ''
        });

        console.log('班级列表API响应:', response);

        if (response.code === 200 && response.data.records) {
          const allClasses = response.data.records;

          // 根据班级ID匹配班级信息
          selectedScopeClasses.value = classIds.map(classId => {
            const classInfo = allClasses.find(clazz => clazz.id === classId);
            console.log(`查找班级ID ${classId}:`, classInfo);

            if (classInfo) {
              return {
                id: classInfo.id,
                name: classInfo.name || `班级ID:${classInfo.id}`,
                userCount: classInfo.userCount || 0
              };
            } else {
              // 如果找不到，使用原始数据
              const originalItem = editForm.value.clazzUserBindList.find(item => item.clazzId === classId);
              return {
                id: classId,
                name: originalItem?.clazzName || `班级ID:${classId}`,
                userCount: originalItem?.userCount || 0
              };
            }
          });
        } else {
          // API调用失败，使用原始数据
          selectedScopeClasses.value = editForm.value.clazzUserBindList.map(item => ({
            id: item.clazzId,
            name: item.clazzName || `班级ID:${item.clazzId}`,
            userCount: item.userCount || 0
          }));
        }
      } catch (error) {
        console.error('获取班级信息失败:', error);
        // 发生错误时使用原始数据
        selectedScopeClasses.value = editForm.value.clazzUserBindList.map(item => ({
          id: item.clazzId,
          name: item.clazzName || `班级ID:${item.clazzId}`,
          userCount: item.userCount || 0
        }));
      }
    }

    console.log('设置selectedScopeClasses:', selectedScopeClasses.value);
    selectedScopeItems.value = editForm.value.clazzUserBindList.map(item => item.clazzId).filter(Boolean);
  }
  examSettingsDialogVisible.value = true;
};

const submitUpdate = async () => {
  if (editForm.value.scope === 1) {
    editForm.value.clazzUserBindList = selectedScopeUsers.value.map(user => ({
      userId: user.id,
      userName: user.name,
      name: user.name, // 添加 name 字段以确保兼容性
      userDept: user.department,
      department: user.department, // 添加 department 字段以确保兼容性
      userAvatar: user.avatar,
      avatar: user.avatar, // 添加 avatar 字段以确保兼容性
      userPoliceNumber: user.policeNumber,
      policeNumber: user.policeNumber, // 添加 policeNumber 字段以确保兼容性
      userPhone: user.phone,
      phone: user.phone, // 添加 phone 字段以确保兼容性
      username: user.phone // 添加 username 字段以确保兼容性
    }));
  } else if (editForm.value.scope === 2) {
    editForm.value.clazzUserBindList = selectedScopeClasses.value.map(clazz => ({
      clazzId: clazz.id,
      clazzName: clazz.name,
      userCount: clazz.userCount
    }));
  } else {
    editForm.value.clazzUserBindList = [];
  }

  if (editForm.value.scope !== 0 && editForm.value.clazzUserBindList.length === 0) {
    const scopeText = editForm.value.scope === 1 ? '指定人员' : '指定班级';
    ElMessage.warning(`请至少选择一个${scopeText}`);
    return;
  }

  try {
    loading.value = true;
    const res = await updateExam(editForm.value);
    if (res.code === 200) {
      ElMessage.success('更新成功！');
      await fetchExamDetails();
      basicInfoDialogVisible.value = false;
      examSettingsDialogVisible.value = false;
    } else {
      ElMessage.error(res.msg || '更新失败');
    }
  } catch (error) {
    ElMessage.error('更新失败');
  } finally {
    loading.value = false;
  }
};

const openBatchSetScoreDialog = () => {
  const defaultScores = {};
  questionTypesForBatchScore.value.forEach(item => { defaultScores[item.type] = 5; });
  questionList.value.forEach(item => {
    const typeKeyMap = { '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE', '填空': 'FILL_IN_BLANK', '论述': 'ESSAY', '简答': 'ESSAY' };
    const key = typeKeyMap[item.question.questionType];
    if (key) { defaultScores[key] = item.score; }
  });
  batchScoreForm.value = defaultScores;
  batchSetScoreDialogVisible.value = true;
};

const handleScoreCommands = (command) => {
  if (command === 'setPassingScore') {
    openSetPassingScoreDialog();
  }
};

const openSetPassingScoreDialog = () => {
  passingScoreForm.value.qualified = examDetails.value.qualified || 0;
  setPassingScoreDialogVisible.value = true;
};

const submitBatchScores = async () => {
  const typeKeyMap = { '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE', '填空': 'FILL_IN_BLANK', '论述': 'ESSAY', '简答': 'ESSAY' };
  const examQuestionListPayload = questionList.value.map(q => ({
    questionId: q.questionId,
    score: batchScoreForm.value[typeKeyMap[q.question.questionType]] || 0,
    sort: q.sort
  }));
  try {
    const res = await setExamQuestions({ id: examId.value, examQuestionList: examQuestionListPayload });
    if (res.code === 200) {
      ElMessage.success('批量设置分数成功！');
      batchSetScoreDialogVisible.value = false;
      await fetchExamDetails();
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (error) { ElMessage.error('操作失败'); }
};

const submitPassingScore = async () => {
  try {
    const res = await setPassingScore({ id: examId.value, qualified: passingScoreForm.value.qualified });
    if (res.code === 200) {
      ElMessage.success('设置合格分成功！');
      setPassingScoreDialogVisible.value = false;
      await fetchExamDetails();
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (error) { ElMessage.error('操作失败'); }
};

// 人员选择相关方法
const openUserSelectionDialog = async () => {
  userSelectionDialogVisible.value = true;
  await fetchOrgTree();
  // 同步已选用户的状态到组织树
  syncSelectedUsersToTree();
};

// 新增方法：同步已选用户状态到组织树
const syncSelectedUsersToTree = () => {
  if (!orgTreeRef.value || selectedScopeUsers.value.length === 0) return;

  // 收集已选用户的树节点ID
  const checkedKeys = [];
  const collectUserNodeIds = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'user') {
        // 检查这个用户是否已被选中
        if (selectedScopeUsers.value.some(user => user.id === node.originalId)) {
          checkedKeys.push(node.id); // 使用树节点的ID（user_xxx格式）
        }
      }
      if (node.children && node.children.length > 0) {
        collectUserNodeIds(node.children);
      }
    }
  };

  collectUserNodeIds(orgTreeData.value);

  // 使用树组件的API设置选中状态
  setTimeout(() => {
    if (orgTreeRef.value && checkedKeys.length > 0) {
      orgTreeRef.value.setCheckedKeys(checkedKeys);
      console.log('设置树选中状态:', checkedKeys);
    }
  }, 100); // 给一点延迟确保DOM已渲染
};

const handleUserSearch = async () => {
  if (!userSearchKeyword.value.trim()) {
    searchedUsers.value = [];
    return;
  }

  try {
    const response = await getUserList({
      pageNum: 1,
      pageSize: 50,
      param: userSearchKeyword.value.trim(),
      pagination: true
    });

    if (response.code === 200) {
      searchedUsers.value = response.data.records.map(user => {
        let department = user.orgName || user.organizationName || user.deptName || user.department;

        if (!department && orgTreeData.value.length > 0) {
          const findUserInTree = (nodes) => {
            for (const node of nodes) {
              if (node.type === 'user' && node.originalId === user.id) {
                return node.department;
              }
              if (node.children && node.children.length > 0) {
                const found = findUserInTree(node.children);
                if (found) return found;
              }
            }
            return null;
          };

          department = findUserInTree(orgTreeData.value);
        }

        return {
          id: user.id,
          name: user.name,
          department: department || '未知部门',
          avatar: user.avatar || '',
          policeNumber: user.policeNumber || '',
          phone: user.username || '',
          checked: selectedScopeUsers.value.some(u => u.id === user.id)
        };
      });
    }
  } catch (error) {
    ElMessage.error('搜索用户失败');
  }
};

const fetchOrgTree = async () => {
  try {
    const response = await getOrgTree({ personnel: true });
    if (response.code === 200) {
      orgTreeData.value = transformOrgTreeData(response.data);
      // 在组织树加载完成后同步选中状态
      setTimeout(() => {
        syncSelectedUsersToTree();
      }, 200);
    } else {
      ElMessage.error(response.msg || '获取组织树失败');
    }
  } catch (error) {
    ElMessage.error('获取组织树失败');
  }
};

// [新增] 简化的、可复用的组织树数据转换函数
const transformOrgTreeData = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];

  return nodes.map(orgNode => {
    // 转换组织节点
    const transformedOrg = {
      id: `org_${orgNode.id}`,
      name: orgNode.orgName,
      type: 'org',
      children: []
    };

    // 转换该组织下的用户
    const users = (orgNode.users || []).map(userNode => ({
      id: `user_${userNode.id}`,
      originalId: userNode.id,
      name: userNode.name,
      type: 'user',
      department: orgNode.orgName,
      avatar: userNode.avatar || '',
      policeNumber: userNode.policeNumber || '',
      phone: userNode.username || ''
    }));

    // 递归转换子组织
    const subOrgs = transformOrgTreeData(orgNode.children || []);

    // 将转换后的子组织和用户合并到 children 数组中
    transformedOrg.children = [...subOrgs, ...users];

    return transformedOrg;
  });
};

// const processOrgTreeWithUsers = async (orgTree) => {
//   try {
//     const processTreeNode = async (node) => {
//       const processedNode = {
//         id: `org_${node.id}`,
//         name: node.orgName,
//         type: 'org',
//         children: []
//       };

//       const childOrgs = [];
//       if (node.children && node.children.length > 0) {
//         const childNodes = await Promise.all(
//           node.children.map(child => processTreeNode(child))
//         );
//         childOrgs.push(...childNodes);
//       }

//       const orgUsers = [];
//       try {
//         // 尝试不同的参数组合
//         const userParams1 = {
//           pageNum: 1,
//           pageSize: 1000,
//           orgId: node.id,
//           pagination: false
//         };

//         const userParams2 = {
//           pageNum: 1,
//           pageSize: 1000,
//           orgId: node.id,
//           teacher: 0,
//           pagination: false
//         };

//         const userParams3 = {
//           pageNum: 1,
//           pageSize: 1000,
//           orgId: node.id
//         };

//         let userResponse = await getUserList(userParams1);

//         // 如果第一种方式没有用户，尝试第二种
//         if (!userResponse.data || !userResponse.data.records || userResponse.data.records.length === 0) {
//           userResponse = await getUserList(userParams2);
//         }

//         // 如果还是没有，尝试第三种
//         if (!userResponse.data || !userResponse.data.records || userResponse.data.records.length === 0) {
//           userResponse = await getUserList(userParams3);
//         }

//         if (userResponse.code === 200) {
//           if (userResponse.data && userResponse.data.records) {
//             const users = userResponse.data.records.map(user => ({
//               id: `user_${user.id}`,
//               originalId: user.id,
//               name: user.name,
//               type: 'user',
//               department: user.orgName || node.orgName,
//               avatar: user.avatar || '',
//               policeNumber: user.policeNumber || '',
//               phone: user.username || ''
//             }));
//             orgUsers.push(...users);
//           } else if (userResponse.data && Array.isArray(userResponse.data)) {
//             const users = userResponse.data.map(user => ({
//               id: `user_${user.id}`,
//               originalId: user.id,
//               name: user.name,
//               type: 'user',
//               department: user.orgName || node.orgName,
//               avatar: user.avatar || '',
//               policeNumber: user.policeNumber || '',
//               phone: user.username || ''
//             }));
//             orgUsers.push(...users);
//           }
//         }
//       } catch (error) {
//         // 获取组织用户失败，忽略错误
//       }

//       processedNode.children = [...childOrgs, ...orgUsers];
//       return processedNode;
//     };

//     const processedTree = await Promise.all(
//       orgTree.map(node => processTreeNode(node))
//     );

//     orgTreeData.value = processedTree;
//   } catch (error) {
//     ElMessage.error('处理组织树数据失败');
//   }
// };

const handleUserCheck = (user) => {
  if (user.checked) {
    if (!selectedScopeUsers.value.some(u => u.id === user.id)) {
      selectedScopeUsers.value.push({
        id: user.id,
        name: user.name,
        department: user.department,
        avatar: user.avatar,
        policeNumber: user.policeNumber,
        phone: user.phone
      });
    }
  } else {
    const index = selectedScopeUsers.value.findIndex(u => u.id === user.id);
    if (index > -1) {
      selectedScopeUsers.value.splice(index, 1);
    }
  }
};

const handleOrgTreeCheck = (data, checkedInfo) => {
  const { checkedNodes } = checkedInfo;
  const users = checkedNodes.filter(node => node.type === 'user');

  selectedScopeUsers.value = users.map(user => ({
    id: user.originalId || user.id,
    name: user.name,
    department: user.department,
    avatar: user.avatar,
    policeNumber: user.policeNumber,
    phone: user.phone
  }));
};

const clearSelectedUsers = () => {
  selectedScopeUsers.value = [];
  searchedUsers.value.forEach(user => {
    user.checked = false;
  });
};

const removeSelectedUser = (user) => {
  const index = selectedScopeUsers.value.findIndex(u => u.id === user.id);
  if (index > -1) {
    selectedScopeUsers.value.splice(index, 1);
  }

  const searchUser = searchedUsers.value.find(u => u.id === user.id);
  if (searchUser) {
    searchUser.checked = false;
  }
};

const confirmSelectedUsers = () => {
  userSelectionDialogVisible.value = false;
  userSearchKeyword.value = '';
  searchedUsers.value = [];
};

const handleScopeChange = (value) => {
  if (value === 1) {
    selectedScopeUsers.value = [];
  }
};

const handleTogglePublishStatus = async () => {
  if (!examDetails.value) return;
  if ((!examDetails.value.clazzUserBindList || examDetails.value.clazzUserBindList.length === 0) && examDetails.value.scope !== 0) {
    ElMessage.error('发布失败：请先在“考试设置”中指定参考人员或班级！');
    return;
  }
  const currentStatus = examDetails.value.status;
  const targetStatus = currentStatus === 1 ? 0 : 1;
  const actionText = targetStatus === 1 ? '发布' : '取消发布';
  try {
    await ElMessageBox.confirm(`您确定要“${actionText}”这场考试吗?`, '操作确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
    loading.value = true;
    const res = await updateExamStatus({ id: examId.value, status: targetStatus });
    if (res.code === 200) { ElMessage.success(`${actionText}成功！`); await fetchExamDetails(); }
    else { ElMessage.error(res.msg || `${actionText}失败`); }
  } catch (error) {
    if (error !== 'cancel') { ElMessage.error(`${actionText}失败`); }
  } finally {
    loading.value = false;
  }
};

const addQuestion = (command) => {
  if (command === 'manual_select') {
    selectorVisible.value = true;
  } else if (command === 'manual_add') {
    router.push({ name: 'TeachingCenter-ManualAddQuestion', query: { examId: examId.value } });
  }
};

const handleSelectionSuccess = () => {
  fetchExamDetails();
};

// 题目操作相关方法
const handleScoreChange = async ({ questionId, newScore }) => {
  try {
    // 更新本地数据
    const questionIndex = questionList.value.findIndex(q => q.questionId === questionId);
    if (questionIndex !== -1) {
      questionList.value[questionIndex].score = newScore;
    }

    // 构建完整的题目列表并发送到服务器
    const examQuestionList = questionList.value.map(q => ({
      questionId: q.questionId,
      score: q.score,
      sort: q.sort
    }));

    const res = await setExamQuestions({ id: examId.value, examQuestionList });
    if (res.code === 200) {
      ElMessage.success('分数修改成功！');
    } else {
      ElMessage.error(res.msg || '分数修改失败');
    }
  } catch (error) {
    ElMessage.error('分数修改失败');
  }
};

const handleMoveUp = async (index) => {
  if (index <= 0) {
    ElMessage.warning('已经是第一题，无法上移');
    return;
  }

  try {
    // 交换位置
    const temp = questionList.value[index];
    questionList.value[index] = questionList.value[index - 1];
    questionList.value[index - 1] = temp;

    // 更新排序值
    questionList.value.forEach((q, i) => {
      q.sort = i;
    });

    // 发送到服务器
    const examQuestionList = questionList.value.map(q => ({
      questionId: q.questionId,
      score: q.score,
      sort: q.sort
    }));

    const res = await setExamQuestions({ id: examId.value, examQuestionList });
    if (res.code === 200) {
      ElMessage.success('题目上移成功！');
    } else {
      ElMessage.error(res.msg || '题目移动失败');
    }
  } catch (error) {
    ElMessage.error('题目移动失败');
  }
};

const handleMoveDown = async (index) => {
  if (index >= questionList.value.length - 1) {
    ElMessage.warning('已经是最后一题，无法下移');
    return;
  }

  try {
    // 交换位置
    const temp = questionList.value[index];
    questionList.value[index] = questionList.value[index + 1];
    questionList.value[index + 1] = temp;

    // 更新排序值
    questionList.value.forEach((q, i) => {
      q.sort = i;
    });

    // 发送到服务器
    const examQuestionList = questionList.value.map(q => ({
      questionId: q.questionId,
      score: q.score,
      sort: q.sort
    }));

    const res = await setExamQuestions({ id: examId.value, examQuestionList });
    if (res.code === 200) {
      ElMessage.success('题目下移成功！');
    } else {
      ElMessage.error(res.msg || '题目移动失败');
    }
  } catch (error) {
    ElMessage.error('题目移动失败');
  }
};

const handlePreview = (question) => {
  // 题目预览功能 - 可以后续实现
  ElMessage.info('预览功能待实现');
};

const handleDeleteQuestion = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除这道题目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 从列表中移除
    questionList.value.splice(index, 1);

    // 更新排序值
    questionList.value.forEach((q, i) => {
      q.sort = i;
    });

    // 发送到服务器
    const examQuestionList = questionList.value.map(q => ({
      questionId: q.questionId,
      score: q.score,
      sort: q.sort
    }));

    const res = await setExamQuestions({ id: examId.value, examQuestionList });
    if (res.code === 200) {
      ElMessage.success('题目删除成功！');
    } else {
      ElMessage.error(res.msg || '题目删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('题目删除失败');
    }
  }
};

const handleEditQuestion = (questionData) => {
  console.log('编辑题目数据:', questionData);
  console.log('使用题目ID:', questionData.id);
  editQuestionId.value = questionData.id;
  editDialogVisible.value = true;
};

const handleEditSuccess = () => {
  // 编辑成功后重新加载考试详情
  loadExamDetail();
  ElMessage.success('题目编辑成功！');
};

// 班级选择相关方法
const openClassSelectionDialog = async () => {
  classSelectionDialogVisible.value = true;
  await fetchClassList();
};

const fetchClassList = async () => {
  try {
    const response = await getClassList({
      page: classCurrentPage.value,
      size: classPageSize.value,
      name: classSearchKeyword.value || '',
      isMe: true,
      clazzStatus: ''
    });

    if (response.code === 200) {
      classListData.value = response.data.records.map(clazz => ({
        id: clazz.id,
        name: clazz.name,
        userCount: clazz.userCount || 0,
        checked: selectedScopeClasses.value.some(selected => selected.id === clazz.id)
      }));
      classTotal.value = response.data.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取班级列表失败');
  }
};

const handleClassSearch = () => {
  classCurrentPage.value = 1;
  fetchClassList();
};

const handleClassPageChange = (page) => {
  classCurrentPage.value = page;
  fetchClassList();
};

const handleClassCheck = (clazz) => {
  if (clazz.checked) {
    // 添加到已选列表
    if (!selectedScopeClasses.value.some(selected => selected.id === clazz.id)) {
      selectedScopeClasses.value.push({
        id: clazz.id,
        name: clazz.name,
        userCount: clazz.userCount
      });
    }
  } else {
    // 从已选列表中移除
    const index = selectedScopeClasses.value.findIndex(selected => selected.id === clazz.id);
    if (index > -1) {
      selectedScopeClasses.value.splice(index, 1);
    }
  }
};

const removeSelectedClass = (clazz) => {
  // 从已选列表中移除
  const index = selectedScopeClasses.value.findIndex(selected => selected.id === clazz.id);
  if (index > -1) {
    selectedScopeClasses.value.splice(index, 1);
  }

  // 更新列表中的选中状态
  const listItem = classListData.value.find(item => item.id === clazz.id);
  if (listItem) {
    listItem.checked = false;
  }
};

const clearSelectedClasses = () => {
  selectedScopeClasses.value = [];
  // 更新列表中的选中状态
  classListData.value.forEach(item => {
    item.checked = false;
  });
};

const confirmSelectedClasses = () => {
  classSelectionDialogVisible.value = false;
  ElMessage.success(`已选择 ${selectedScopeClasses.value.length} 个班级`);
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    examId.value = id;
    fetchExamDetails();
    fetchCategories();
    fetchGroupList();
  } else {
    ElMessage.error('无效的考试ID');
    loading.value = false;
  }
});
</script>

<style scoped>
.exam-settings-page {
  padding: 20px;
  background-color: #f0f2f5;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
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
  height: calc(100% - 80px);
  /* 减去页头的高度 */
}

.left-panel {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.right-panel {
  /* flex: 1; */
  /* min-width: 470px; */
   width: fit-content; /* <-- 新增：让宽度由内容决定 */
  max-width: 500px;   /* <-- 新增：但不能超过500px，防止布局破坏 */
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 进一步减少卡片之间的间距 */
  height: fit-content;
  /* 让右侧面板高度根据内容适配 */
  position: sticky;
  /* 让右侧面板保持在顶部位置 */
  top: 0;
  /* 粘性定位的偏移量 */
  align-self: flex-start;
  /* 确保面板从容器顶部开始 */
}

.question-list-container {
  flex: 1;
  /* 让容器占据剩余的所有空间 */
  overflow-y: auto;
  /* 允许垂直滚动 */
  padding: 0 8px;
  min-height: 0;
  /* 允许 flex 子项收缩 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-card {
  border-radius: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.el-card :deep(.el-card__header) {
  flex-shrink: 0;
  /* 防止头部被压缩 */
}

.el-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.form-hint {
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.5;
}

.left-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.stats-bar .stat-value {
  color: #303133;
  font-weight: bold;
  margin: 0 4px;
}

.dialog-stat-text {
  margin: 0 10px;
  color: #606266;
  font-size: 14px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
}

.action-buttons .el-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

/* 调整描述列表的行高和间距 */
.el-descriptions :deep(.el-descriptions__body) {
  background: #fff;
}

.el-descriptions :deep(.el-descriptions-item__cell) {
  padding: 8px 12px;
  /* 减少内边距，默认通常是 12px 16px */
}

.el-descriptions :deep(.el-descriptions-item__label) {
  width: 80px;
  /* 固定标签宽度 */
  font-weight: 500;
}

.el-descriptions :deep(.el-descriptions-item__content) {
  word-break: break-all;
}

/* 人员选择相关样式 */
.selected-users-display {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}

.no-users-selected {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}

.users-summary {
  margin-bottom: 12px;
}

.selected-users-list {
  margin-top: 8px;
}

.more-users {
  color: #909399;
  font-size: 12px;
}

/* 人员选择弹窗样式 */
.add-member-dialog {
  display: flex;
  gap: 20px;
  height: 500px;
}

.user-tree-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-section {
  margin-bottom: 16px;
}

.user-tree-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.search-results {
  height: 100%;
}

.search-tip {
  color: #909399;
  font-size: 12px;
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.user-item {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 500;
}

.user-dept {
  color: #909399;
  font-size: 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-icon {
  color: #409eff;
}

.node-label {
  font-size: 14px;
}

.selected-users-section {
  width: 300px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e4e7ed;
  padding-left: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.selected-users-list-dialog {
  flex: 1;
  overflow: auto;
}

.selected-user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.user-details {
  flex: 1;
}

.user-details .user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-details .user-dept {
  font-size: 12px;
  color: #909399;
}

.remove-btn {
  color: #f56c6c;
}

.remove-btn:hover {
  background-color: #fef0f0;
}

/* 班级选择对话框样式 */
.add-class-dialog {
  display: flex;
  height: 400px;
  gap: 20px;
}

.class-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.class-list-container {
  flex: 1;
  overflow-y: auto;
  margin: 10px 0;
}

.class-item {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.class-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.class-icon {
  color: #409eff;
}

.class-details {
  flex: 1;
}

.class-name {
  font-size: 14px;
  font-weight: 500;
}

.class-members {
  font-size: 12px;
  color: #909399;
  margin-left: 5px;
}

.class-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #e4e7ed;
}

.pagination-info {
  font-size: 14px;
  color: #606266;
}

.selected-classes-section {
  flex: 1;
  padding-left: 20px;
}

.selected-classes-display {
  margin-top: 10px;
}

.no-classes-selected {
  color: #909399;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

.classes-summary {
  margin-bottom: 10px;
}

.selected-classes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.more-classes {
  color: #909399;
  font-size: 12px;
}

.selected-classes-list-dialog {
  max-height: 300px;
  overflow-y: auto;
}

.selected-class-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.selected-class-item .class-details {
  flex: 1;
}

.selected-class-item .class-name {
  font-size: 14px;
  font-weight: 500;
}

.selected-class-item .class-members {
  font-size: 12px;
  color: #909399;
}
</style>