<template>
  <el-dialog
    :model-value="visible"
    title="学习设置"
    width="600px"
    @close="closeDialog"
  >
    <el-form :model="formModel" label-width="100px">
      <el-form-item label="学习范围" prop="scope">
        <el-radio-group v-model="formModel.scope">
          <el-radio :label="0">公开课</el-radio>
          <el-radio :label="1">指定人员</el-radio>
          <el-radio :label="2">指定班级</el-radio>
          </el-radio-group>
        <div class="form-item-hint" v-if="formModel.scope === 0">
          * 公开课所有人可见，班级可选择
        </div>
         <div class="form-item-hint" v-if="formModel.scope === 1">
          * 仅选择的人员可见，如被班级选择后，班级成员也可看见
        </div>
      </el-form-item>

      <el-form-item v-if="formModel.scope === 1">
        <!-- 已选择人员展示 -->
        <div class="selected-display">
          <div v-if="selectedScopeUsers.length === 0" class="no-selection">
            未选择人员
          </div>
          <div v-else class="selection-summary">
            已选择 {{ selectedScopeUsers.length }} 人
            <div class="selected-list">
              <el-tag v-for="user in selectedScopeUsers.slice(0, 10)" :key="user.id" closable
                @close="removeSelectedUser(user)" style="margin: 2px;">
                {{ user.name }}
              </el-tag>
              <span v-if="selectedScopeUsers.length > 10" class="more-items">
                等{{ selectedScopeUsers.length }}人
              </span>
            </div>
          </div>
        </div>
        <el-button @click="openUserSelectionDialog" style="margin-top: 10px;">
          {{ selectedScopeUsers.length > 0 ? '修改人员' : '选择人员' }}
        </el-button>
      </el-form-item>

      <el-form-item v-if="formModel.scope === 2">
        <!-- 已选择班级展示 -->
        <div class="selected-display">
          <div v-if="selectedScopeClasses.length === 0" class="no-selection">
            未选择班级
          </div>
          <div v-else class="selection-summary">
            已选择 {{ selectedScopeClasses.length }} 个班级
            <div class="selected-list">
              <el-tag v-for="clazz in selectedScopeClasses.slice(0, 10)" :key="clazz.id" closable
                @close="removeSelectedClass(clazz)" style="margin: 2px;">
                {{ clazz.name }}
              </el-tag>
              <span v-if="selectedScopeClasses.length > 10" class="more-items">
                等{{ selectedScopeClasses.length }}个班级
              </span>
            </div>
          </div>
        </div>
        <el-button @click="openClassSelectionDialog" style="margin-top: 10px;">
          {{ selectedScopeClasses.length > 0 ? '修改班级' : '选择班级' }}
        </el-button>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 选择人员弹窗 -->
  <el-dialog v-model="userSelectionDialogVisible" title="选择人员" width="1000px" :close-on-click-modal="false">
    <div class="add-dialog">
      <div class="left-section">
        <div class="search-section">
          <el-input v-model="userSearchKeyword" placeholder="姓名、手机号、警号、身份证号" @input="handleUserSearch" clearable>
            <template #append><el-button @click="handleUserSearch"><el-icon><Search /></el-icon></el-button></template>
          </el-input>
        </div>
        <div class="list-container">
            <el-tree ref="orgTreeRef" :data="orgTreeData" :props="{ children: 'children', label: 'name' }" show-checkbox node-key="id" @check="handleOrgTreeCheck" :default-expand-all="false">
              <template #default="{ data }">
                <div class="tree-node">
                  <el-icon v-if="data.type === 'org'" class="org-icon"><OfficeBuilding /></el-icon>
                  <el-avatar v-else :size="20"><el-icon><User /></el-icon></el-avatar>
                  <span class="node-label">{{ data.name }}</span>
                  <span v-if="data.type === 'user'" class="user-dept">{{ data.department }}</span>
                </div>
              </template>
            </el-tree>
        </div>
      </div>
      <div class="right-section">
        <div class="section-header">
          <span>已选：{{ selectedScopeUsers.length }} 名用户</span>
          <el-button type="primary" link @click="clearSelectedUsers">清空</el-button>
        </div>
        <div class="selected-list-dialog">
          <div v-for="user in selectedScopeUsers" :key="user.id" class="selected-item">
            <el-avatar :size="32"><el-icon><User /></el-icon></el-avatar>
            <div class="item-details">
                <div class="item-name">{{ user.name }}</div>
                <div class="item-sub-text">{{ user.department }}</div>
            </div>
            <el-button circle plain type="danger" size="small" class="remove-btn" @click="removeSelectedUser(user)"><el-icon><Close /></el-icon></el-button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="userSelectionDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmSelectedUsers">确定</el-button>
    </template>
  </el-dialog>

  <!-- 选择班级弹窗 -->
  <el-dialog v-model="classSelectionDialogVisible" title="选择班级" width="1000px" :close-on-click-modal="false">
    <div class="add-dialog">
      <div class="left-section">
        <div class="search-section">
          <el-input v-model="classSearchKeyword" placeholder="班级名称" @input="handleClassSearch" clearable>
            <template #append><el-button @click="handleClassSearch"><el-icon><Search /></el-icon></el-button></template>
          </el-input>
        </div>
        <div class="list-container">
          <div v-for="clazz in classListData" :key="clazz.id" class="class-item">
            <el-checkbox :model-value="clazz.checked" @change="(val) => handleClassCheck(clazz, val)">
              <div class="class-info">
                <div class="item-details">
                    <span class="item-name">{{ clazz.name }}</span>
                </div>
                <span class="class-members">({{ clazz.userCount }}人)</span>
              </div>
            </el-checkbox>
          </div>
        </div>
        <div class="class-pagination">
          <span class="pagination-info">共{{ classTotal }}条</span>
          <el-pagination v-model:current-page="classCurrentPage" v-model:page-size="classPageSize" :total="classTotal" layout="prev, pager, next" @current-change="handleClassPageChange" size="small" />
        </div>
      </div>
      <div class="right-section">
        <div class="section-header">
          <span>已选：{{ selectedScopeClasses.length }} 个班级</span>
          <el-button type="primary" link @click="clearSelectedClasses">清空</el-button>
        </div>
        <div class="selected-list-dialog">
          <div v-for="clazz in selectedScopeClasses" :key="clazz.id" class="selected-item">
            <el-icon class="class-icon"><OfficeBuilding /></el-icon>
            <div class="item-details">
                <div class="item-name">{{ clazz.name }}</div>
                <div class="item-sub-text">{{ clazz.userCount }}人</div>
            </div>
            <el-button circle plain type="danger" size="small" class="remove-btn" @click="removeSelectedClass(clazz)"><el-icon><Close /></el-icon></el-button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="classSelectionDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmSelectedClasses">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, watch, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { updateCourse } from '../../../api/teaching-center/CourseManagement';
import { getOrgTree } from '@/api/system-management/Org.js';
import { getUserList } from '@/api/system-management/User.js';
import { getClassList } from '@/api/teaching-center/ClassManagement.js';
import { Search, User, OfficeBuilding, Close } from '@element-plus/icons-vue';

const props = defineProps({
  visible: Boolean,
  courseData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:visible', 'success']);

const formModel = reactive({
  scope: 0,
  clazzUserBindList: [] // 用于存储指定的人员/班级
});

// --- 新增代码开始 ---

const userSelectionDialogVisible = ref(false);
const classSelectionDialogVisible = ref(false);

const selectedScopeUsers = ref([]);
const selectedScopeClasses = ref([]);

const orgTreeData = ref([]);
const orgTreeRef = ref(null);
const userSearchKeyword = ref('');

const classListData = ref([]);
const classSearchKeyword = ref('');
const classCurrentPage = ref(1);
const classPageSize = ref(10);
const classTotal = ref(0);

// --- 新增代码结束 ---

watch(() => props.visible, (newVal) => {
  if (newVal) {
    formModel.scope = props.courseData.scope;
    // 回显已指定的班级/人员
    selectedScopeUsers.value = [];
    selectedScopeClasses.value = [];
    if (props.courseData.clazzUserBindList) {
        if (props.courseData.scope === 1) { // 指定人员
            selectedScopeUsers.value = props.courseData.clazzUserBindList.map(item => ({ 
                id: item.userId, 
                name: item.userName, 
                // department 信息在课程列表中通常不返回，这里可以留空或显示占位符
                department: '...' 
            }));
        } else if (props.courseData.scope === 2) { // 指定班级
            selectedScopeClasses.value = props.courseData.clazzUserBindList.map(item => ({ 
                id: item.clazzId, 
                name: item.clazzName, 
                // userCount 信息同样可能缺失
                userCount: item.userCount || 0 
            }));
        }
    }
  }
});

// --- 新增代码开始 ---

const openUserSelectionDialog = async () => {
  userSelectionDialogVisible.value = true;
  await fetchOrgTree();
  // 在打开弹窗后，根据已选用户勾选树节点
  setTimeout(() => {
    if (orgTreeRef.value) {
      const userKeys = selectedScopeUsers.value.map(u => `user_${u.id}`);
      orgTreeRef.value.setCheckedKeys(userKeys, false);
    }
  }, 0);
};

const openClassSelectionDialog = async () => {
  classSelectionDialogVisible.value = true;
  await fetchClassList();
};

const fetchOrgTree = async () => {
  try {
    const res = await getOrgTree({ personnel: true });
    if (res.code === 200) {
      orgTreeData.value = transformOrgTreeData(res.data);
    }
  } catch (e) { ElMessage.error("获取组织树失败"); }
};

const transformOrgTreeData = (nodes) => {
  return (nodes || []).map(node => {
    const transformedNode = { id: `org_${node.id}`, name: node.orgName, type: 'org', children: [] };
    if (node.users) {
      transformedNode.children.push(...node.users.map(u => ({ id: `user_${u.id}`, originalId: u.id, name: u.name, type: 'user', department: node.orgName })));
    }
    if (node.children) {
      transformedNode.children.push(...transformOrgTreeData(node.children));
    }
    return transformedNode;
  });
};

const handleUserSearch = async () => {
  // 在这个简化版本中，我们假设组织树足够用，不单独实现关键词搜索结果列表
  // 如果需要，可以像RangeSetup.vue一样实现
  ElMessage.info('请在左侧组织树中进行选择');
};

const handleOrgTreeCheck = (data, { checkedNodes }) => {
  selectedScopeUsers.value = checkedNodes
    .filter(n => n.type === 'user')
    .map(u => ({ id: u.originalId, name: u.name, department: u.department }));
};

const removeSelectedUser = (user) => {
  selectedScopeUsers.value = selectedScopeUsers.value.filter(u => u.id !== user.id);
  const treeNodeKey = `user_${user.id}`;
  if (orgTreeRef.value?.getNode(treeNodeKey)?.checked) {
    orgTreeRef.value.setChecked(treeNodeKey, false, false);
  }
};

const clearSelectedUsers = () => {
  selectedScopeUsers.value = [];
  orgTreeRef.value?.setCheckedKeys([]);
};

const confirmSelectedUsers = () => { 
    userSelectionDialogVisible.value = false; 
};

const fetchClassList = async () => {
  try {
    const res = await getClassList({ page: classCurrentPage.value, size: classPageSize.value, name: classSearchKeyword.value });
    if (res.code === 200) {
      classListData.value = res.data.records.map(c => ({ ...c, checked: selectedScopeClasses.value.some(s => s.id === c.id) }));
      classTotal.value = res.data.total;
    }
  } catch (e) { ElMessage.error("获取班级列表失败"); }
};

const handleClassSearch = () => { 
    classCurrentPage.value = 1;
    fetchClassList(); 
};
const handleClassPageChange = (page) => { 
    classCurrentPage.value = page; 
    fetchClassList(); 
};

const handleClassCheck = (clazz, isChecked) => {
  if (isChecked) {
    if (!selectedScopeClasses.value.some(c => c.id === clazz.id)) {
        selectedScopeClasses.value.push(clazz);
    }
  } else {
    selectedScopeClasses.value = selectedScopeClasses.value.filter(c => c.id !== clazz.id);
  }
};

const removeSelectedClass = (clazz) => {
  selectedScopeClasses.value = selectedScopeClasses.value.filter(c => c.id !== clazz.id);
  const itemInList = classListData.value.find(c => c.id === clazz.id);
  if (itemInList) itemInList.checked = false;
};

const clearSelectedClasses = () => {
  selectedScopeClasses.value = [];
  classListData.value.forEach(c => c.checked = false);
};

const confirmSelectedClasses = () => { 
    classSelectionDialogVisible.value = false; 
};

// --- 新增代码结束 ---

const handleSelectPersonnel = () => {
    ElMessage.info('指定人员功能待开发');
    // 此处会弹出另一个复杂对话框用于选择人员或组织
};

const closeDialog = () => {
  emit('update:visible', false);
};

const submitForm = async () => {
  // 从原始数据构建一个完整的 payload, 只修改 scope
  const payload = {
    ...props.courseData,
    scope: formModel.scope,
  };

  // 根据 scope 携带 clazzUserBindList
  if (formModel.scope === 1) {
    payload.clazzUserBindList = selectedScopeUsers.value.map(user => ({ userId: user.id, userName: user.name }));
  } else if (formModel.scope === 2) {
    payload.clazzUserBindList = selectedScopeClasses.value.map(clazz => ({ clazzId: clazz.id, clazzName: clazz.name }));
  } else {
    payload.clazzUserBindList = [];
  }

  // 删除不需要的字段，避免后端校验问题
  delete payload.coverPreviewUrl; 
  delete payload.chapters;

  const res = await updateCourse(payload);
  if (res.code === 200) {
    ElMessage.success('学习设置更新成功！');
    emit('success');
    closeDialog();
  } else {
    ElMessage.error(res.msg || '更新失败');
  }
};
</script>

<style scoped>
.form-item-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  width: 100%;
  margin-top: 4px;
}

/* --- 新增样式开始 --- */
.selected-display {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
  width: 100%;
  margin-top: 10px;
}
.no-selection {
  color: #909399;
  text-align: center;
  padding: 10px 0;
}
.selection-summary {
  font-size: 14px;
  color: #606266;
}
.selected-list {
  margin-top: 8px;
}
.more-items {
  color: #909399;
  font-size: 12px;
  margin-left: 5px;
}

.add-dialog {
  display: flex;
  gap: 20px;
  height: 500px;
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.search-section {
  margin-bottom: 16px;
}

.list-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.right-section {
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

.selected-list-dialog {
  flex: 1;
  overflow: auto;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.item-details {
    flex-grow: 1;
    min-width: 0;
}

.item-name {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-sub-text {
    font-size: 12px;
    color: #909399;
}

.remove-btn {
  color: #f56c6c;
  margin-left: auto;
}

.tree-node, .class-info { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    width: 100%;
    overflow: hidden;
}
.node-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.user-dept, .class-members { 
    font-size: 12px; 
    color: #909399; 
    margin-left: auto;
    padding-left: 8px;
    flex-shrink: 0;
}
.class-pagination { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-top: 10px; 
    font-size: 14px;
}
.class-item {
    padding: 5px 0;
}
/* --- 新增样式结束 --- */
</style>