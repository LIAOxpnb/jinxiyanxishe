<template>
  <div class="curriculum-provision-page" v-loading="loading || isSaving">
    <div class="page-main-content">
      <div class="left-panel">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <div class="card-header-left">
                <el-button type="primary" link @click="goBack" class="back-button">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <span class="course-title">{{ courseDetail.name }}</span>
              </div>
            </div>
          </template>

          <div v-if="courseDetail.chapters && courseDetail.chapters.length > 0">
            <div v-for="(chapter, chapterIndex) in courseDetail.chapters" :key="chapter.id" class="chapter-item">
              <div class="chapter-header">
                <div class="chapter-title-container">
                  <template v-if="editingState.type === 'chapter' && editingState.id === chapter.id">
                    <el-input v-model="editingState.text" size="small" @blur="handleSaveTitle(chapter)"
                      @keyup.enter="handleSaveTitle(chapter)" :ref="el => setInputRef(el, 'chapter', chapter.id)" />
                  </template>
                  <template v-else>
                    <span class="chapter-title">{{ chapter.name }}</span>
                    <el-icon class="edit-icon" @click="handleEditTitle('chapter', chapter)">
                      <Edit />
                    </el-icon>
                    <span class="header-remark">【备注】点击后为输入框，可修改章标题</span>
                  </template>
                </div>
                <div class="chapter-actions">
                  <el-tooltip content="上移" placement="top">
                    <el-icon @click="handleMoveChapter(chapterIndex, 'up')" :class="{ 'disabled': chapterIndex === 0 }">
                      <Top />
                    </el-icon>
                  </el-tooltip>
                  <el-tooltip content="下移" placement="top">
                    <el-icon @click="handleMoveChapter(chapterIndex, 'down')" :class="{ 'disabled': chapterIndex === courseDetail.chapters.length - 1 }">
                      <Bottom />
                    </el-icon>
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-icon class="delete-icon" @click="handleRemoveChapter(chapterIndex)">
                      <Delete />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>

              <div class="section-list">
                <div class="section-table-header">
                  <div class="col-checkbox"></div>
                  <div class="col-name">节名称</div>
                  <div class="col-file">关联文件</div>
                  <div class="col-exercises">练习数</div>
                  <div class="col-materials">资料</div>
                  <div class="col-sort">排序</div>
                  <div class="col-actions">操作</div>
                </div>

                <div v-if="!chapter.children || chapter.children.length === 0" class="no-sections">
                  <el-button type="primary" link @click="openAddCoursewareDialog(chapterIndex)">
                    <el-icon>
                      <Plus />
                    </el-icon>
                    添加课件
                  </el-button>
                  <div class="header-remark">【备注】初始默认文件名为节标题，鼠标移入显示修改，点击输入</div>
                </div>

                <div v-else v-for="(section, sectionIndex) in chapter.children" :key="section.id"
                  class="section-table-row">
                  <div class="col-checkbox">
                    <el-checkbox :model-value="selectionState[chapter.id]?.selectedSectionIds.has(section.id)"
                      @change="() => {
                        const selection = selectionState[chapter.id].selectedSectionIds;
                        selection.has(section.id) ? selection.delete(section.id) : selection.add(section.id);
                        handleSectionSelectionChange(chapter.id);
                      }" />
                  </div>
                  <div class="col-name">
                    <el-tag type="info" size="small" class="type-tag">学</el-tag>
                    <template v-if="editingState.type === 'section' && editingState.id === section.id">
                      <el-input v-model="editingState.text" size="small" @blur="handleSaveTitle(section)"
                        @keyup.enter="handleSaveTitle(section)" :ref="el => setInputRef(el, 'section', section.id)" />
                    </template>
                    <template v-else>
                      <span class="section-name" @click="handleEditTitle('section', section)">{{ section.name }}</span>
                    </template>
                  </div>
                  <div class="col-file">{{ section.coursewareName || '待获取' }}</div>
                  <div class="col-exercises">{{ section.exerciseCount || 0 }}</div>
                  <div class="col-materials">{{ section.materialName || '无' }}</div>
                  <div class="col-sort">
                    <el-icon class="sort-icon" @click="handleMoveSection(chapterIndex, sectionIndex, 'up')" :class="{ 'disabled': sectionIndex === 0 }"><CaretTop /></el-icon>
                    <el-icon class="sort-icon" @click="handleMoveSection(chapterIndex, sectionIndex, 'down')" :class="{ 'disabled': sectionIndex === chapter.children.length - 1 }"><CaretBottom /></el-icon>
                  </div>
                  <div class="col-actions">
                    <el-button link type="primary" size="small" @click="openExercisesDialog(section)">练习</el-button>
                    <el-button link type="primary" size="small" @click="openMaterialsDialog(section)">资料</el-button>
                    <el-button link type="primary" size="small" style="color: #F56C6C;" @click="handleRemoveSection(chapterIndex, sectionIndex)">移除</el-button>
                  </div>
                </div>

                <div class="chapter-footer-actions">
                  <div class="footer-left">
                    <el-checkbox style="margin-right: 8px;"
                      :model-value="selectionState[chapter.id]?.isAllSelected"
                      :indeterminate="selectionState[chapter.id]?.isIndeterminate"
                      @change="handleSelectAllChange($event, chapter.id)"
                    >全选</el-checkbox>
                    <el-dropdown>
                      <el-button size="small">
                        批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="handleBatchDelete(chapter.id)">批量删除</el-dropdown-item>
                        
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                  <div class="footer-right">
                    <el-button type="primary" link @click="openAddCoursewareDialog(chapterIndex)">
                      <el-icon>
                        <Plus />
                      </el-icon>
                      添加课件
                    </el-button>
                    <el-button type="primary" link @click="handleInsertChapter(chapterIndex)">
                      <el-icon>
                        <Plus />
                      </el-icon>
                      插入章
                    </el-button>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无章节，请添加">
            <el-button type="primary" @click="handleInsertChapter(-1)">
              <el-icon><Plus /></el-icon>
              添加新章节
            </el-button>
          </el-empty>

        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="box-card info-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-button link type="primary" @click="editInfoDialogVisible = true"><el-icon>
                  <Edit />
                </el-icon></el-button>
            </div>
          </template>
          <el-image class="course-cover" :src="courseDetail.coverPreviewUrl" fit="cover"></el-image>
          <div class="info-item">
            <span class="info-label">课程名称</span>
            <span class="info-value">{{ courseDetail.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">分类</span>
            <span class="info-value">{{ courseDetail.courseCategory }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">讲师</span>
            <span class="info-value">{{ courseDetail.instructorName || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建人</span>
            <span class="info-value">{{ courseDetail.creator }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ courseDetail.createTime }}</span>
          </div>
        </el-card>
        <el-card class="box-card info-card">
          <template #header>
            <div class="card-header">
              <span>相关设置</span>
              <el-button link type="primary" @click="editScopeDialogVisible = true"><el-icon>
                  <Edit />
                </el-icon></el-button>
            </div>
          </template>
          <div class="info-item">
            <span class="info-label">学习人员</span>
            <span class="info-value">{{ scopeMap[courseDetail.scope] || '未知' }}</span>
          </div>
          <div class="setting-remark">
            <p>说明:</p>
            <p>1. 公开课为所有人可见;</p>
            <p>2. 指定人员...此处省略说明文字</p>
          </div>
        </el-card>
        
        <el-button type="primary" class="publish-btn" @click="handleTogglePublishStatus" :loading="isSaving">
          {{ courseDetail.status === 1 ? '取消发布' : '发布课程' }}
        </el-button>
      </div>
    </div>

    <AddCoursewareDialog v-model:visible="addCoursewareDialogVisible" :course-category="courseDetail.courseCategory"
      @success="handleAddCoursewareSuccess" />

    <EditCourseInfoDialog
      v-model:visible="editInfoDialogVisible"
      :course-data="courseDetail"
      @success="handleEditSuccess"
    />
    <EditScopeDialog
      v-model:visible="editScopeDialogVisible"
      :course-data="courseDetail"
      @success="handleEditSuccess"
    />

    <SectionExercisesDialog
      v-if="activeSection"
      :visible="exercisesDialogVisible"
      @update:visible="exercisesDialogVisible = $event"
      :section-data="activeSection"
    />
    <SectionMaterialsDialog
      v-if="activeSection"
      :visible="materialsDialogVisible"
      @update:visible="materialsDialogVisible = $event"
      :section-data="activeSection"
      @update-material="handleUpdateMaterial"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Top, Bottom, Delete, Edit, Plus, CaretTop, CaretBottom, ArrowDown, ArrowLeft } from '@element-plus/icons-vue';
import { getCourseDetail, updateCourseStatus, getSectionMaterials, saveOrUpdateChaptersAndSections } from '../../../api/teaching-center/CourseManagement';
import { previewFile } from '../../../api/common/PreviewFile';
import AddCoursewareDialog from './AddCoursewareDialog.vue';
import EditCourseInfoDialog from './EditCourseInfoDialog.vue';
import EditScopeDialog from './EditScopeDialog.vue';
import SectionExercisesDialog from './SectionExercisesDialog.vue';
import SectionMaterialsDialog from './SectionMaterialsDialog.vue';

const route = useRoute();
const router = useRouter();

const goBack = () => {
  router.back();
};

const courseId = ref(null);
const loading = ref(true);
const isSaving = ref(false);


// 【仅此处有变动 Part 2】新增章节操作函数
const handleMoveChapter = async (chapterIndex, direction) => {
  const chapters = courseDetail.chapters;
  if (direction === 'up' && chapterIndex > 0) {
    [chapters[chapterIndex], chapters[chapterIndex - 1]] = [chapters[chapterIndex - 1], chapters[chapterIndex]];
  } else if (direction === 'down' && chapterIndex < chapters.length - 1) {
    [chapters[chapterIndex], chapters[chapterIndex + 1]] = [chapters[chapterIndex + 1], chapters[chapterIndex]];
  } else {
    return;
  }
  await handleAutoSave('章节排序');
};

const handleRemoveChapter = (chapterIndex) => {
  const chapterName = courseDetail.chapters[chapterIndex].name;
  ElMessageBox.confirm(`确定要删除整个章节 “${chapterName}” 及其包含的所有小节吗？此操作不可恢复。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
  }).then(async () => {
    courseDetail.chapters.splice(chapterIndex, 1);
    await handleAutoSave('章节删除');
    await fetchCourseData(); // 重新获取数据以同步状态
  }).catch(() => {});
};


const handleMoveSection = async (chapterIndex, sectionIndex, direction) => {
  const sections = courseDetail.chapters[chapterIndex].children;
  if (direction === 'up' && sectionIndex > 0) {
    [sections[sectionIndex], sections[sectionIndex - 1]] = [sections[sectionIndex - 1], sections[sectionIndex]];
  } else if (direction === 'down' && sectionIndex < sections.length - 1) {
    [sections[sectionIndex], sections[sectionIndex + 1]] = [sections[sectionIndex + 1], sections[sectionIndex]];
  } else {
    return;
  }

  isSaving.value = true;
  const success = await saveChapterStructure();
  if (success) {
    ElMessage.success('排序已保存');
  } else {
    ElMessage.error('排序保存失败');
    await fetchCourseData();
  }
  isSaving.value = false;
};

const handleRemoveSection = (chapterIndex, sectionIndex) => {
  const sectionName = courseDetail.chapters[chapterIndex].children[sectionIndex].name;
  ElMessageBox.confirm(`确定要移除小节 “${sectionName}” 吗？`, '移除确认', {
    type: 'warning',
  }).then(async () => {
    courseDetail.chapters[chapterIndex].children.splice(sectionIndex, 1);
    
    isSaving.value = true;
    const success = await saveChapterStructure();
    if (success) {
      ElMessage.success('移除成功并已保存');
      await fetchCourseData();
    } else {
      ElMessage.error('移除失败');
      await fetchCourseData();
    }
    isSaving.value = false;
  }).catch(() => {});
};

const handleInsertChapter = async (chapterIndex) => {
  const newChapter = {
    id: `new-${Date.now()}`,
    name: '新章节',
    children: [],
  };
  courseDetail.chapters.splice(chapterIndex + 1, 0, newChapter);
  
  isSaving.value = true;
  const success = await saveChapterStructure();
  if (success) {
    ElMessage.success('新章节已添加并保存');
    await fetchCourseData();
  } else {
    ElMessage.error('添加章节失败');
    await fetchCourseData();
  }
  isSaving.value = false;
};

const handleAddCoursewareSuccess = async (newSections) => {
  if (!newSections || newSections.length === 0) {
    ElMessage.info('没有选择新的课件');
    return;
  }
  const chapter = courseDetail.chapters[currentChapterIndex.value];
  if (chapter) {
    if (!chapter.children) { chapter.children = []; }
    chapter.children.push(...newSections);
    ElMessage.success('课件已添加到列表！');

    isSaving.value = true;
    const success = await saveChapterStructure();
    if (success) {
      ElMessage.success({ message: '课程结构已自动保存！', type: 'success' });
      await fetchCourseData();
    } else {
      ElMessage.error('自动保存失败，您的修改可能已丢失，请刷新页面后重试。');
      await fetchCourseData();
    }
    isSaving.value = false;
  }
};

const saveChapterStructure = async () => {
  try {
    const chaptersPayload = courseDetail.chapters.map((chapter, chapterIndex) => ({
      id: isNaN(chapter.id) ? null : chapter.id,
      courseId: courseId.value,
      name: chapter.name,
      sort: chapterIndex + 1,
      courseSectionList: chapter.children.map((section, sectionIndex) => ({
        id: isNaN(section.id) ? null : section.id,
        name: section.name,
        sort: sectionIndex + 1,
        coursewareId: section.coursewareId
      }))
    }));

    await saveOrUpdateChaptersAndSections(chaptersPayload);
    return true;
  } catch (error) {
    console.error("保存章节结构失败:", error);
    return false;
  }
};

const hasContent = computed(() => {
  if (!courseDetail.chapters || courseDetail.chapters.length === 0) return false;
  return courseDetail.chapters.some(chapter => chapter.children && chapter.children.length > 0);
});
const handleTogglePublishStatus = () => {
  const isPublished = courseDetail.status === 1;
  const newStatus = isPublished ? 2 : 1;
  const actionText = isPublished ? '取消发布' : '发布';
  if (newStatus === 1 && !hasContent.value) {
    ElMessageBox.alert('课程无学习内容，不能发布！', '发布课程', { confirmButtonText: '知道了' });
    return;
  }
  ElMessageBox.confirm(`课程${isPublished ? '已发布' : '未发布'}，是否立即${actionText}当前课程？`, `${actionText}课程`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    isSaving.value = true;
    try {
      await updateCourseStatus({ id: courseId.value, status: newStatus });
      ElMessage.success(`${actionText}成功！`);
      courseDetail.status = newStatus === 1 ? 1 : 0;
    } catch (error) {
      ElMessage.error(`${actionText}失败`);
    } finally {
      isSaving.value = false;
    }
  }).catch(() => {});
};
const exercisesDialogVisible = ref(false);
const materialsDialogVisible = ref(false);
const activeSection = ref(null);
const openExercisesDialog = (section) => { activeSection.value = section; exercisesDialogVisible.value = true; };
const openMaterialsDialog = (section) => { activeSection.value = section; materialsDialogVisible.value = true; };
const handleUpdateMaterial = ({ sectionId, materialName }) => {
  for (const chapter of courseDetail.chapters) {
    const section = chapter.children.find(s => s.id === sectionId);
    if (section) { section.materialName = materialName; section.materialCount = materialName ? 1 : 0; break; }
  }
};
const selectionState = reactive({});
const handleSectionSelectionChange = (chapterId) => {
  const chapter = courseDetail.chapters.find(c => c.id === chapterId);
  const selection = selectionState[chapterId];
  if (!chapter || !selection) return;
  const allSectionIds = new Set(chapter.children.map(s => s.id));
  const selectedIds = selection.selectedSectionIds;
  if (selectedIds.size === 0) {
    selection.isAllSelected = false;
    selection.isIndeterminate = false;
  } else if (selectedIds.size === allSectionIds.size) {
    selection.isAllSelected = true;
    selection.isIndeterminate = false;
  } else {
    selection.isAllSelected = false;
    selection.isIndeterminate = true;
  }
};
const handleSelectAllChange = (checked, chapterId) => {
  const chapter = courseDetail.chapters.find(c => c.id === chapterId);
  const selection = selectionState[chapterId];
  if (!chapter || !selection) return;
  if (checked) {
    chapter.children.forEach(section => selection.selectedSectionIds.add(section.id));
  } else {
    selection.selectedSectionIds.clear();
  }
  selection.isIndeterminate = false;
};
const handleBatchDelete = (chapterId) => {
  const selection = selectionState[chapterId];
  const chapter = courseDetail.chapters.find(c => c.id === chapterId);
  if (!selection || !chapter) return;
  const selectedIds = selection.selectedSectionIds;
  if (selectedIds.size === 0) {
    ElMessage.warning('请至少选择一个课件进行删除');
    return;
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.size} 个课件吗？`, '批量删除确认', {
    type: 'warning',
  }).then(() => {
    chapter.children = chapter.children.filter(section => !selectedIds.has(section.id));
    selectedIds.clear();
    handleSectionSelectionChange(chapterId);
    ElMessage.success('批量删除成功');
  }).catch(() => {});
};
const editingState = reactive({ type: null, id: null, text: '' });
const inputRefs = ref({});
const setInputRef = (el, type, id) => { if (el) { inputRefs.value[`${type}-${id}`] = el; } };
const courseDetail = reactive({ id: null, name: '', cover: '', coverPreviewUrl: '', courseCategory: '', creator: '', createTime: '', scope: 0, status: 0, instructorName: '', intro: '', summary: '', chapters: [] });
const scopeMap = { 0: '公开课', 1: '指定人员', 2: '指定班级', 3: '指定组织' };
const addCoursewareDialogVisible = ref(false);
const currentChapterIndex = ref(null);
const editInfoDialogVisible = ref(false);
const editScopeDialogVisible = ref(false);
const fetchCourseData = async () => { 
    loading.value = true;
  try {
    const res = await getCourseDetail({ id: courseId.value });
    if (res.code !== 200) { ElMessage.error(res.msg || '获取课程详情失败'); return; }
    const basicInfo = { ...res.data };
    delete basicInfo.courseChapterList;
    Object.assign(courseDetail, basicInfo);
    if (courseDetail.cover) { courseDetail.coverPreviewUrl = await previewFile(courseDetail.cover); }
    if (res.data.courseChapterList && res.data.courseChapterList.length > 0) {
      courseDetail.chapters = res.data.courseChapterList.map(chapter => {
        selectionState[chapter.id] = { selectedSectionIds: new Set(), isAllSelected: false, isIndeterminate: false };
        return {
          ...chapter,
          children: chapter.courseSectionList ? chapter.courseSectionList.map(section => ({
            ...section,
            coursewareName: `课件ID-${section.coursewareId}`,
            exerciseCount: 0,
            materialName: null,
            materialCount: 0
          })) : []
        };
      });
    } else { courseDetail.chapters = []; }
    const materialPromises = [];
    courseDetail.chapters.forEach(chapter => {
      chapter.children.forEach(section => {
        materialPromises.push(
          getSectionMaterials(section.id).then(materialRes => {
            section.materialName = null;
            if (materialRes.code === 200 && materialRes.data && materialRes.data.length > 0) {
              section.materialName = materialRes.data[0].fileName;
              section.materialCount = materialRes.data.length;
            }
          })
        );
      });
    });
    await Promise.all(materialPromises);
  } catch (error) {
    console.error(error);
    ElMessage.error('获取课程详情接口异常');
  } finally {
    loading.value = false;
  }
};
const handleEditSuccess = () => { fetchCourseData(); };
const handleEditTitle = (type, item) => {
  editingState.type = type;
  editingState.id = item.id;
  editingState.text = item.name;
  nextTick(() => {
    const inputEl = inputRefs.value[`${type}-${id}`];
    if (inputEl) { inputEl.focus(); }
  });
};
const handleSaveTitle = (item) => {
  if (editingState.text.trim() && editingState.text !== item.name) {
    item.name = editingState.text;
    handleAutoSave('标题');
  }
  editingState.type = null;
  editingState.id = null;
  editingState.text = '';
};

const handleAutoSave = async (actionName) => {
  isSaving.value = true;
  const success = await saveChapterStructure();
  if (success) {
    ElMessage.success(`${actionName}已自动保存`);
  } else {
    ElMessage.error(`${actionName}自动保存失败`);
  }
  isSaving.value = false;
};

const openAddCoursewareDialog = (chapterIndex) => {
  currentChapterIndex.value = chapterIndex;
  addCoursewareDialogVisible.value = true;
};

onMounted(() => {
  courseId.value = route.params.id;
  if (courseId.value) {
    fetchCourseData();
  } else {
    ElMessage.error('未找到课程ID，无法加载数据');
    loading.value = false;
  }
});
</script>

<style scoped>
.curriculum-provision-page {
  background-color: #f0f2f5;
  padding: 20px;
  min-height: calc(100vh - 50px);
}
.page-main-content {
  display: flex;
  gap: 20px;
}
.left-panel {
  flex: 1;
  min-width: 0;
}
.right-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.back-button {
  font-size: 16px;
}
.course-title {
  font-size: 16px;
  font-weight: 600;
}
.chapter-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 20px;
}
.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f7fa;
}
.chapter-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chapter-title {
  font-weight: 600;
}
.edit-icon {
  cursor: pointer;
  color: #409EFF;
}
.header-remark {
  font-size: 12px;
  color: #F56C6C;
}
.chapter-actions .el-icon {
  margin-left: 12px;
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;
}
.chapter-actions .el-icon:hover {
  color: #409EFF;
}
.chapter-actions .delete-icon:hover {
  color: #F56C6C;
}
.section-list {
  padding: 0 15px 15px;
}
.section-table-header,
.section-table-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
}
.section-table-header {
  color: #606266;
  font-weight: 500;
  border-bottom: 1px solid #ebeef5;
}
.section-table-row {
  border-bottom: 1px solid #f2f2f2;
}
.col-checkbox {
  flex: 0 0 40px;
}
.col-name {
  flex: 3;
  min-width: 150px;
  display: flex;
  align-items: center;
}
.col-file {
  flex: 3;
  min-width: 150px;
}
.col-exercises {
  flex: 1;
  text-align: center;
}
.col-materials {
  flex: 1;
  text-align: center;
}
.col-sort {
  flex: 1;
  text-align: center;
}
.col-actions {
  flex: 2;
  text-align: right;
}
.type-tag {
  margin-right: 8px;
}
.section-name {
  cursor: pointer;
}
.sort-icon {
  cursor: pointer;
  font-size: 16px;
  color: #909399;
  margin: 0 4px;
}
.sort-icon:hover {
  color: #409EFF;
}
.sort-icon.disabled {
  cursor: not-allowed;
  color: #c0c4cc;
}
.no-sections {
  color: #909399;
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #f2f2f2;
}
.no-sections .header-remark {
  text-align: left;
  margin-top: 8px;
}
.chapter-footer-actions {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.info-card .el-card__body {
  padding: 15px;
}
.course-cover {
  width: 100%;
  height: 180px;
  border-radius: 4px;
  margin-bottom: 15px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 12px;
  color: #303133;
}
.info-label {
  color: #606266;
}
.setting-remark {
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
}
.publish-btn {
  width: 100%;
  height: 40px;
}

/* 【仅此处有变动 Part 3】为禁用的图标添加样式 */
.chapter-actions .el-icon.disabled {
  cursor: not-allowed;
  color: #c0c4cc;
}
</style>