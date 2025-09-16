<template>
  <el-dialog
    :model-value="visible"
    title="添加人员"
    width="800px"
    top="10vh"
    :close-on-click-modal="false"
    @update:modelValue="$emit('update:visible', $event)"
    class="user-selector-dialog"
  >
    <div class="selector-container">
      <div class="left-panel">
        <el-input v-model="searchKeyword" placeholder="姓名,手机号,警号,身份证号" clearable :prefix-icon="Search" />
        <div class="tree-container" v-loading="loading">
          <el-tree
            ref="treeRef"
            :data="treeData"
            show-checkbox
            node-key="id"
            :props="treeProps"
            :filter-node-method="filterNode"
            @check="handleTreeCheck"
            default-expand-all
          />
        </div>
      </div>

      <div class="right-panel">
        <div class="selected-header">
          <span>已选: {{ selectedUsers.length }} 名用户</span>
          <el-button type="primary" link @click="clearSelection">清空</el-button>
        </div>
        <div class="selected-list">
          <div v-for="user in selectedUsers" :key="user.id" class="selected-item">
            <el-avatar :size="24" :icon="UserFilled" />
            <div class="user-info">
              <span class="user-name">{{ user.name || user.username }}</span>
              <span class="user-org">{{ getOrgName(user.orgId) }}</span>
            </div>
            <el-icon class="remove-icon" @click="removeUser(user)"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { Search, UserFilled, Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getUserList } from '@/api/teaching-center/Exams.js';
import { getOrgTree } from '@/api/Org.js'; // 导入组织树接口

const props = defineProps({
  visible: Boolean,
  initialSelection: {
    type: Array,
    default: () => []
  }
});
const emit = defineEmits(['update:visible', 'confirm']);

const loading = ref(false);
const searchKeyword = ref('');
const treeRef = ref(null);
const treeData = ref([]);
const flatOrgMap = ref(new Map());
const selectedUsers = ref([]);
const treeProps = { children: 'children', label: 'label' };

watch(searchKeyword, (val) => {
  treeRef.value?.filter(val);
});

const filterNode = (value, data) => {
  if (!value) return true;
  return data.label.includes(value);
};

// --- 核心数据处理 ---

// 辅助函数：递归遍历树，将后端字段映射为 el-tree 需要的字段 (orgname -> label)
// 同时填充 flatOrgMap 以便快速查找组织名称
const mapAndProcessTree = (nodes) => {
    if (!nodes || nodes.length === 0) return [];
    return nodes.map(node => {
        flatOrgMap.value.set(node.id, node.orgname); // 填充Map
        const mappedNode = {
            id: `org_${node.id}`, // 使用 'org_' 前缀避免和用户id冲突
            label: node.orgname,
            children: mapAndProcessTree(node.children || []) // 递归处理子节点
        };
        return mappedNode;
    });
};

const fetchOrgTree = async () => {
  try {
    const res = await getOrgTree();
    if (res.code === 200 && res.data) {
      // 后端直接返回了树形结构，我们只需要映射一下字段名
      return mapAndProcessTree(res.data);
    }
  } catch (error) {
    ElMessage.error("获取组织树失败");
    console.error(error);
  }
  return []; // 出错时返回空数组
};

const getOrgName = (orgId) => {
    return flatOrgMap.value.get(orgId) || '未知部门';
};

const processData = async () => {
  loading.value = true;
  const orgTree = await fetchOrgTree();
  const userRes = await getUserList({ pageNum: 1, pageSize: 10000, teacher: 1 }); // 获取全部用户
  
  if (userRes.code === 200) {
    const users = userRes.data.records;
    users.forEach(user => {
      const orgNode = findOrgNode(orgTree, user.orgId);
      if (orgNode) {
        if (!orgNode.children) orgNode.children = [];
        orgNode.children.push({
          id: user.id, // 用户ID是数字
          label: user.name || user.username,
          isUser: true, // 标记为用户节点
          raw: user // 保存原始用户数据
        });
      }
    });
    treeData.value = orgTree;
  }
  loading.value = false;
};

const findOrgNode = (nodes, orgId) => {
    if (!nodes) return null;
    for (const node of nodes) {
        if (node.id === `org_${orgId}`) return node;
        const found = findOrgNode(node.children, orgId);
        if (found) return found;
    }
    return null;
};

// --- 选择逻辑 ---
const handleTreeCheck = (node, { checkedNodes }) => {
    selectedUsers.value = checkedNodes.filter(n => n.isUser).map(n => n.raw);
};

const removeUser = (userToRemove) => {
    selectedUsers.value = selectedUsers.value.filter(u => u.id !== userToRemove.id);
    treeRef.value?.setCheckedKeys(selectedUsers.value.map(u => u.id));
};

const clearSelection = () => {
    selectedUsers.value = [];
    treeRef.value?.setCheckedKeys([]);
};

const handleConfirm = () => {
    emit('confirm', JSON.parse(JSON.stringify(selectedUsers.value)));
    emit('update:visible', false);
};

onMounted(async () => {
    await processData();
    if (props.initialSelection.length > 0) {
        selectedUsers.value = JSON.parse(JSON.stringify(props.initialSelection));
        await nextTick();
        treeRef.value?.setCheckedKeys(selectedUsers.value.map(u => u.id));
    }
});
</script>

<style>
.user-selector-dialog .el-dialog__body { padding: 10px 20px; }
</style>
<style scoped>
.selector-container {
  display: flex;
  height: 60vh;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.left-panel {
  width: 50%;
  padding: 12px;
  border-right: 1px solid #dcdfe6;
}
.right-panel {
  width: 50%;
}
.tree-container {
  margin-top: 12px;
  flex-grow: 1;
  overflow-y: auto;
}
.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #dcdfe6;
  font-size: 14px;
  color: #606266;
}
.selected-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 12px;
}
.selected-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}
.user-info {
  display: flex;
  flex-direction: column;
  margin-left: 8px;
  line-height: 1.2;
}
.user-name {
  font-size: 14px;
  color: #303133;
}
.user-org {
  font-size: 12px;
  color: #909399;
}
.remove-icon {
  margin-left: auto;
  cursor: pointer;
  color: #909399;
}
.remove-icon:hover {
  color: #f56c6c;
}
</style>