<template>
  <div class="filter-bar">
    <el-button type="primary" @click="onCreate">{{ createButtonText }}</el-button>

    <template v-for="field in fields" :key="field.model">
      <el-input
        v-if="field.type === 'input'"
        v-model="filterData[field.model]"
        :placeholder="field.placeholder"
        class="filter-item"
      ></el-input>

      <el-select
        v-if="field.type === 'select'"
        v-model="filterData[field.model]"
        :placeholder="field.placeholder"
        class="filter-item"
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
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

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
    // validator: (value) => { ... } // 可以在这里添加复杂的校验逻辑
  }
});

// 定义组件可以发出的事件
const emit = defineEmits(['create', 'filter']);

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

// “筛选”按钮点击事件
const onFilter = () => {
  // 将收集到的筛选数据作为参数，发出 filter 事件
  emit('filter', filterData);
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