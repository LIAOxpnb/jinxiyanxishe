<template>
  <div class="filter-bar">
    <template v-if="props.createOptions && props.createOptions.length">
        <el-dropdown @command="onCreateOption">
          <el-button type="primary">
            {{ createButtonText }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="opt in props.createOptions" :key="opt.value" :command="opt.value">{{ opt.label }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
    <template v-else>
      <el-button type="primary" @click="onCreate">{{ createButtonText }}</el-button>
    </template>

    <template v-for="field in fields" :key="field.model">
      <el-input
        v-if="field.type === 'input'"
        v-model="filterData[field.model]"
        :placeholder="field.placeholder"
        class="filter-item"
        clearable
      ></el-input>

      <el-select
        v-if="field.type === 'select'"
        v-model="filterData[field.model]"
        :placeholder="field.placeholder"
        class="filter-item"
        clearable
      >
        <el-option
          v-for="option in field.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        ></el-option>
      </el-select>
    </template>

    <el-button @click="onFilter">筛选</el-button>
    <el-button @click="onReset">重置</el-button>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';

// 定义组件接收的 props
const props = defineProps({
  // 主要操作按钮的文本
  createButtonText: {
    type: String,
    default: '新增'
  },
  // 筛选字段的配置数组
  fields: {
    type: Array,
    required: true,
  },
  // 可选：创建按钮的下拉选项数组，格式：[{ label: '手动新增', value: 'manual' }, ...]
  createOptions: {
    type: Array,
    default: null
  }
});

// 定义组件可以发出的事件
const emit = defineEmits(['create', 'filter', 'reset']);

// 创建一个响应式对象来存储所有筛选框的数据
const filterData = reactive({});

// 初始化 filterData，并确保在配置变化时也能更新
watch(() => props.fields, (newFields) => {
  // 清空旧数据
  for (const key in filterData) {
    delete filterData[key];
  }
  // 根据新的配置数组，初始化 filterData 的键
  if (newFields) {
    newFields.forEach(field => {
      filterData[field.model] = field.defaultValue || ''; // 可以设置默认值
    });
  }
}, { immediate: true, deep: true });


// “创建”按钮点击事件
const onCreate = () => {
  emit('create');
};

// 下拉创建项选择
const onCreateOption = (command) => {
  // 发出 create 事件并携带所选命令
  emit('create', command);
};

// “筛选”按钮点击事件
const onFilter = () => {
  // 将收集到的筛选数据作为参数，发出 filter 事件
  emit('filter', filterData);
};

// “重置”按钮点击事件
const onReset = () => {
  // 1. 遍历 fields 配置，将 filterData 中的每个值重置为空字符串或其默认值
  props.fields.forEach(field => {
    filterData[field.model] = field.defaultValue || '';
  });

  // 2. 主动调用 onFilter 函数，发出一个带有空数据的 filter 事件
  // 父组件监听到这个事件后，就会用空的筛选条件去重新获取列表，达到刷新效果
  onFilter();

  // 3. (可选)同时也可以发出一个 reset 事件，供父组件选择性监听
  emit('reset');
};
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background-color: #fcfcfc;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
}
.filter-item {
  width: 180px;
}
</style>