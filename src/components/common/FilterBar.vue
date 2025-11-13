<template>
  <div class="filter-bar">
    <template v-if="showCreateButton">
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
        @change="(value) => onFieldChange(field.model, value)"
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

const props = defineProps({
  createButtonText: {
    type: String,
    default: '新增'
  },
  fields: {
    type: Array,
    required: true,
  },
  createOptions: {
    type: Array,
    default: null
  },
  // 【已添加】新增一个 prop 来控制创建按钮的显示，默认为 true
  showCreateButton: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['create', 'filter', 'reset', 'field-change']);

const filterData = reactive({});

watch(() => props.fields, (newFields) => {
  if (newFields) {
    newFields.forEach(field => {
      // 如果字段已存在且新值不同，则更新；如果不存在，则初始化
      if (filterData[field.model] === undefined) {
        filterData[field.model] = field.defaultValue || '';
      } else if (field.defaultValue !== undefined && filterData[field.model] !== field.defaultValue) {
        filterData[field.model] = field.defaultValue;
      }
    });
    // 清理不再存在的字段
    for (const key in filterData) {
      if (!newFields.find(f => f.model === key)) {
        delete filterData[key];
      }
    }
  }
}, { immediate: true, deep: true });

const onCreate = () => {
  emit('create');
};

const onCreateOption = (command) => {
  emit('create', command);
};

const onFilter = () => {
  emit('filter', filterData);
};

const onReset = () => {
  props.fields.forEach(field => {
    filterData[field.model] = field.defaultValue || '';
  });
  onFilter();
  emit('reset');
};

const onFieldChange = (fieldModel, value) => {
  emit('field-change', fieldModel, value, filterData);
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