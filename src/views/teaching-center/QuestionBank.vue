<template>
  <el-container class="page-container">
    <el-aside width="220px" class="left-panel">
      <el-menu default-active="active-item" class="group-menu">
        <el-menu-item index="group-name">
          <el-select v-model="selectedGroup" placeholder="分组名称" size="small"></el-select>
        </el-menu-item>
        <el-menu-item index="all">
          <span>全部</span>
          <span class="count">500</span>
        </el-menu-item>
        <el-menu-item index="ungrouped">
          <span>未分组</span>
          <span class="count">300</span>
        </el-menu-item>
        <el-menu-item index="active-item" class="custom-active-item">
          <span>张老师专题讲座</span>
          <span class="count">150</span>
        </el-menu-item>
        <el-menu-item index="group1">
          <span>分组名称</span>
          <span class="count">25</span>
        </el-menu-item>
        <el-menu-item index="group2">
          <span>分组名称</span>
          <span class="count">1</span>
        </el-menu-item>
        <el-menu-item index="group3">
          <span>分组名称</span>
          <span class="count">1</span>
        </el-menu-item>
        <el-menu-item index="group4">
          <span>分组名称</span>
          <span class="count">2</span>
        </el-menu-item>
        <el-menu-item index="group5">
          <span>分组名称</span>
          <span class="count">1</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-info-box">
        <div class="info-box-title">【试题分组说明】</div>
        <p>规则：将分组数据删除，需到此板块恢复；</p>
        <p>1、分组、试题均支持数据恢复；</p>
        <p>2、如果这里没有自己恢复的数据，不是自己创建的分组不可见，即使里面有曾经自己出的试题。</p>
      </div>
      
      <div class="add-group-btn-wrapper">
        <el-button class="add-group-btn" plain>+ 新增试题分组</el-button>
      </div>
    </el-aside>

    <el-main class="right-panel">
      <h1 class="page-title">题库</h1>
      
      <el-alert
        title="【新】新增三种模式：手动新增（可点击查看原型）、AI新增（可点击查看原型）、批量导入（见下方批量管理）"
        type="error"
        :closable="false"
        class="custom-alert"
      ></el-alert>

      <FilterBar
        create-button-text="新增试题"
        :fields="questionFilterFields"
        @create="handleCreateQuestion"
        @filter="handleFilterQuestions"
      />

      <el-table 
        :data="tableData" 
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="题目">
          <template #default="scope">
            <el-link type="primary" :underline="false">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="题型" width="100" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="group" label="试题分组" width="120" />
        <el-table-column prop="difficulty" label="难度" width="80" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="creationTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default>
            <el-button link type="primary" size="small">编辑</el-button>
            <el-button link type="primary" size="small">统计</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-dropdown>
          <el-button>
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>批量删除</el-dropdown-item>
              <el-dropdown-item>批量分组</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, prev, pager, next, jumper"
          :total="102"
          background
        >
        </el-pagination>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
// 引入 FilterBar 组件，@ 是 src 目录的别名
import FilterBar from '@/components/FilterBar.vue';

// 左侧分组下拉菜单
const selectedGroup = ref('');

// **** 为 FilterBar 组件提供配置 ****
const questionFilterFields = ref([
  { type: 'input', model: 'title', placeholder: '题目' },
  { type: 'input', model: 'creator', placeholder: '创建人' },
  { 
    type: 'select', 
    model: 'type', 
    placeholder: '题型', 
    options: [
      { label: '单选题', value: 'single_choice' },
      { label: '多选题', value: 'multiple_choice' },
      { label: '判断题', value: 'true_false' },
    ] 
  },
  { 
    type: 'select', 
    model: 'category', 
    placeholder: '分类', 
    options: [
        { label: '资金分析', value: 'cat_1' },
        { label: '司法会计', value: 'cat_2' },
    ]
  },
  { 
    type: 'select', 
    model: 'difficulty', 
    placeholder: '难度', 
    options: [
        { label: '简单', value: 'easy' },
        { label: '中等', value: 'medium' },
        { label: '困难', value: 'hard' },
    ]
  },
]);

// **** FilterBar 组件事件的处理函数 ****
const handleCreateQuestion = () => {
  console.log('触发了“新增试题”事件');
  // 在这里编写打开弹窗或跳转页面的逻辑
};

const handleFilterQuestions = (filterData) => {
  console.log('触发了“筛选”事件，收到的筛选数据为:', filterData);
  // 在这里根据 filterData 调用 API，刷新下面的表格数据
};


// 表格数据
const tableData = ref([
  { title: '练习标题练习标题练习标题练习标题练习标题...', type: '单选', category: '资金分析', group: '分组名称', difficulty: '高', creator: '用户名', creationTime: 'YY-MM-DD HH:mm' },
  { title: '练习标题练习标题练习标题练习标题练习标题...', type: '多选', category: '司法会计', group: '分组名称', difficulty: '中', creator: '用户名', creationTime: 'YY-MM-DD HH:mm' },
  { title: '练习标题练习标题练习标题练习标题练习标题...', type: '判断', category: '数据分析', group: '分组名称', difficulty: '低', creator: '用户名', creationTime: 'YY-MM-DD HH:mm' },
  { title: '练习标题练习标题练习标题练习标题练习标题...', type: '论述', category: '判断', group: '分组名称', difficulty: '中', creator: '用户名', creationTime: 'YY-MM-DD HH:mm' },
  { title: '练习标题练习标题练习标题练习标题练习标题...', type: '论述', category: '论述', group: '分组名称', difficulty: '中', creator: '用户名', creationTime: 'YY-MM-DD HH:mm' },
  { title: '练习标题练习标题练习标题练习标题练习标题...', type: '论述', category: '单选', group: '单选', difficulty: '中', creator: '用户名', creationTime: 'YY-MM-DD HH:mm' },
]);

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);
</script>

<style scoped>
.page-container {
  height: 100vh;
  background-color: #ffffff;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e6e6e6;
  padding-top: 20px;
}
.group-menu { border-right: none; }
.group-menu .el-menu-item { display: flex; justify-content: space-between; align-items: center; height: 40px; line-height: 40px; }
.group-menu .el-menu-item .count { color: #909399; }
.custom-active-item { color: #409eff !important; background-color: #ecf5ff !important; font-weight: bold; }
.custom-active-item .count { color: #409eff !important; }
.el-menu-item:hover { background-color: #f5f7fa; }
.sidebar-info-box { margin: 20px 15px; padding: 10px 15px; border: 1px solid #f56c6c; background-color: #fff8f8; border-radius: 4px; font-size: 12px; line-height: 1.6; color: #606266; }
.info-box-title { color: #f56c6c; font-weight: bold; margin-bottom: 8px; }
.add-group-btn-wrapper { margin-top: auto; padding: 20px 15px; }
.add-group-btn { width: 100%; }

/* 右侧面板 */
.right-panel {
  padding: 20px;
}
.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
}
.custom-alert {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
  margin-bottom: 20px;
}

/* 表格和底部 */
.el-table {
  margin-top: 20px;
}
.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>