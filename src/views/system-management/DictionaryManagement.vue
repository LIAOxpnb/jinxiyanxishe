<template>
  <div class="dictionary-management">
    <div class="page-header">
      <h1>字典管理</h1>
    </div>
    
    <div class="action-bar">
      <div class="left-actions">
        <button class="btn-primary" @click="handleAdd">新增</button>
        <div class="search-box">
          <input 
            type="text" 
            placeholder="请输入字典类型搜索"
            v-model="searchDictType"
            @keydown.enter="handleSearch"
            class="search-input"
          />
          <button class="btn-primary" @click="handleSearch" style="margin-left: 8px;">搜索</button>
          <button class="btn-secondary" @click="handleReset" style="margin-left: 8px;">重置</button>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>字典标签</th>
            <th>字典值</th>
            <th>字典类型</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tableData" :key="item.id">
            <td>{{ item.dictLabel }}</td>
            <td>{{ item.dictValue }}</td>
            <td>{{ item.dictType }}</td>
            <td>
              <span :class="['status-badge', item.status === '0' ? 'status-normal' : 'status-disabled']">
                {{ item.status === '0' ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="action-cell">
              <button class="btn-text" @click="handleEdit(item)">编辑</button>
              <button class="btn-text btn-danger" @click="handleDelete(item)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="!isSearching">
      <span class="pagination-info">共计{{ total }}条</span>
      <div class="pagination-controls">
        <button 
          v-for="page in Math.ceil(total / pageSize)" 
          :key="page"
          :class="['page-btn', { active: currentPage === page }]"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>
        <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
          <option value="10">10 条/页</option>
          <option value="20">20 条/页</option>
          <option value="50">50 条/页</option>
        </select>
      </div>
    </div>

    <div v-if="isModalVisible" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ modalTitle }}</h2>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label for="dictLabel">字典标签</label>
            <input type="text" id="dictLabel" v-model="currentDict.dictLabel" required>
          </div>
          <div class="form-group">
            <label for="dictValue">字典值</label>
            <input type="text" id="dictValue" v-model="currentDict.dictValue" required>
          </div>
          <div class="form-group">
            <label for="dictType">字典类型</label>
            <input type="text" id="dictType" v-model="currentDict.dictType" required>
          </div>
           <div class="form-group">
            <label for="dictSort">排序</label>
            <input type="number" id="dictSort" v-model="currentDict.dictSort">
          </div>
          <div class="form-group">
            <label for="status">状态</label>
            <select id="status" v-model="currentDict.status">
              <option value="0">正常</option>
              <option value="1">禁用</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="handleCancel">取消</button>
            <button type="submit" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { getDictList, getDictByType, addDict, updateDict, deleteDict } from '../../api/system-management/dictionary'

export default {
  name: 'DictionaryManagement',
  setup() {
    const searchDictType = ref('')
    const isSearching = ref(false)
    const loading = ref(false)

    const currentPage = ref(1)
    const pageSize = ref(10)
    const tableData = ref([])
    const total = ref(0)

    const isModalVisible = ref(false)
    const modalTitle = ref('')
    const currentDict = ref({})

    const fetchDictData = async () => {
      loading.value = true;
      try {
        if (searchDictType.value) {
          isSearching.value = true;
          const response = await getDictByType(searchDictType.value);
          if (response.code === 200) {
            tableData.value = response.data || [];
            total.value = response.data?.length || 0;
          } else {
            console.error('Failed to fetch dictionary by type:', response.msg);
            tableData.value = [];
            total.value = 0;
          }
        } else {
          isSearching.value = false;
          const params = {
            pageNum: currentPage.value,
            pageSize: pageSize.value,
          };
          const response = await getDictList(params);
          if (response.code === 200 && response.data) {
            tableData.value = response.data.records;
            total.value = response.data.total;
          } else {
            console.error('Failed to fetch dictionary list:', response.msg);
          }
        }
      } catch (error) {
        console.error('Error fetching dictionary data:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchDictData();
    });
    
    const handleSearch = () => {
      currentPage.value = 1;
      fetchDictData();
    };

    const handleReset = () => {
      searchDictType.value = '';
      currentPage.value = 1;
      fetchDictData();
    };

    const handlePageChange = (page) => {
      currentPage.value = page;
      fetchDictData();
    };

    const handlePageSizeChange = () => {
      currentPage.value = 1;
      fetchDictData();
    };

    const handleAdd = () => {
      currentDict.value = { status: '0' };
      modalTitle.value = '新增字典';
      isModalVisible.value = true;
    }

    const handleEdit = (item) => {
      currentDict.value = { ...item };
      modalTitle.value = '编辑字典';
      isModalVisible.value = true;
    }

    const handleDelete = async (item) => {
      if (confirm('确定要删除该字典吗？')) {
        try {
          const response = await deleteDict(item.id);
          if (response.code === 200) {
            alert('删除成功');
            fetchDictData();
          } else {
            alert('删除失败: ' + response.msg);
          }
        } catch (error) {
          console.error('删除字典失败:', error);
          alert('删除失败');
        }
      }
    }

    const handleSave = async () => {
      try {
        let response;
        if (currentDict.value.id) {
          response = await updateDict(currentDict.value);
        } else {
          response = await addDict(currentDict.value);
        }

        if (response.code === 200) {
          alert('保存成功');
          isModalVisible.value = false;
          fetchDictData();
        } else {
          alert('保存失败: ' + response.msg);
        }
      } catch (error) {
        console.error('保存字典失败:', error);
        alert('保存失败');
      }
    };

    const handleCancel = () => {
      isModalVisible.value = false;
    };

    return {
      searchDictType,
      isSearching,
      currentPage,
      pageSize,
      tableData,
      total,
      handleAdd,
      handleEdit,
      handleDelete,
      handleSearch,
      handleReset,
      handlePageChange,
      handlePageSizeChange,
      isModalVisible,
      modalTitle,
      currentDict,
      handleSave,
      handleCancel,
    }
  }
}
</script>

<style scoped>
.dictionary-management {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}

/* 页面标题 */
.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 按钮 */
.btn-primary {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #fff;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  border-color: #1890ff;
  color: #1890ff;
}


/* 搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 240px;
  height: 32px;
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-icon {
  position: absolute;
  right: 10px;
  color: #bfbfbf;
  font-size: 16px;
  pointer-events: none;
}

/* 表格容器 */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 数据表格 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background-color: #fafafa;
}

.data-table th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #595959;
  border-bottom: 1px solid #f0f0f0;
}

.data-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #262626;
}

.data-table tbody tr:hover {
  background-color: #f5f5f5;
}

/* 状态标签 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-normal {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-normal::before {
  background-color: #52c41a;
}

.status-disabled {
  background-color: #fff2e8;
  color: #fa8c16;
}

.status-disabled::before {
  background-color: #fa8c16;
}

/* 操作按钮 */
.action-cell {
  display: flex;
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-text:hover {
  background-color: #e6f7ff;
}

.btn-danger {
  color: #ff4d4f;
}

.btn-danger:hover {
  background-color: #fff2f0;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 0;
}

.pagination-info {
  color: #595959;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #262626;
  transition: all 0.3s;
}

.page-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.page-btn.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.page-size-select {
  height: 32px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  outline: none;
}

.page-size-select:focus {
  border-color: #1890ff;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}
</style>