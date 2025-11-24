# 学生答案富文本支持更新说明

## 更新日期
2025年11月20日

## 问题描述
学生答案在论述题和简答题中现已支持富文本格式（包含HTML和图片），但之前的显示逻辑只支持纯文本，导致富文本内容无法正常显示，甚至报错。

## 解决方案
统一修改了所有显示学生答案的组件，对论述题和简答题的学生答案进行富文本处理，使其与题目详情、解析的显示逻辑保持一致。

## 修改的文件

### 1. ExamQuestionCardForMarking.vue（阅卷卡片）
**路径**: `src/components/exam/ExamQuestionCardForMarking.vue`

**修改内容**:
- 添加 `processedUserAnswer` 响应式变量存储处理后的学生答案
- 在 `watch` 中添加对论述题/简答题学生答案的富文本处理
- 模板中针对论述题/简答题使用 `v-html` 显示富文本，其他题型使用纯文本
- CSS 样式中添加 `.student-answer-content :deep(img)` 支持图片显示

**关键代码**:
```javascript
// 处理后的学生答案（富文本）
const processedUserAnswer = ref('');

// 处理学生答案（论述题/简答题可能包含富文本）
if (newRecord.question.questionType === '论述' || newRecord.question.questionType === '简答') {
  processedUserAnswer.value = await convertImagesToPreviewUrls(newRecord.userAnswer);
}
```

### 2. ExamResultQuestionDisplay.vue（考试结果显示）
**路径**: `src/components/exam/ExamResultQuestionDisplay.vue`

**修改内容**:
- 添加 `processedUserAnswer` 响应式变量
- 在 `watch` 中添加对论述题/简答题学生答案的富文本处理
- 论述题/简答题的 `.essay-content` 使用 `v-html` 显示富文本
- CSS 样式中添加 `.essay-content :deep(img)` 支持图片显示

**关键代码**:
```vue
<div class="essay-content" :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'" v-html="processedUserAnswer || '未作答'">
</div>
```

### 3. PracticeResultQuestionDisplay.vue（练习结果显示）
**路径**: `src/components/practice/PracticeResultQuestionDisplay.vue`

**修改内容**:
- 添加 `processedUserAnswer` 响应式变量
- 在 `watch` 中添加对论述题/简答题学生答案的富文本处理
- 在 `feedback-section` 中针对论述题/简答题单独显示，使用 `v-html`
- CSS 样式中添加 `.essay-answer-content` 和图片支持

**关键代码**:
```vue
<!-- 论述题/简答题使用富文本显示 -->
<div v-if="['论述', '简答'].includes(record.question.questionType)">
  <p><strong>你的答案：</strong></p>
  <div class="essay-answer-content" :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'" v-html="processedUserAnswer || '未作答'"></div>
</div>
<!-- 其他题型使用纯文本显示 -->
<p v-else><strong>你的答案：</strong> <span :class="record.isCorrect === 2 ? 'correct-text' : 'incorrect-text'">{{ formatUserAnswer(record.userAnswer) || '未作答' }}</span></p>
```

## 技术要点

### 1. 富文本处理函数
所有组件都使用统一的 `convertImagesToPreviewUrls` 函数：
- 解析HTML内容
- 提取图片标签
- 将图片URL转换为预览URL（调用 `previewFile` API）
- 返回处理后的HTML内容

### 2. 条件渲染
- **论述题/简答题**: 使用 `v-html` 渲染富文本内容
- **其他题型**: 使用纯文本渲染（单选、多选、判断、填空等）

### 3. 样式支持
为富文本中的图片添加统一样式：
```css
.student-answer-content :deep(img),
.essay-content :deep(img),
.essay-answer-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
```

## 测试建议

### 测试场景
1. ✅ 阅卷页面 - 论述题学生答案包含图片
2. ✅ 阅卷页面 - 简答题学生答案包含图片
3. ✅ 考试结果页面 - 论述题学生答案包含图片
4. ✅ 练习结果页面 - 论述题学生答案包含图片
5. ✅ 其他题型（单选、多选、判断、填空）的答案显示不受影响

### 预期结果
- 学生答案中的图片正常显示，大小自适应
- 富文本内容格式正确，无HTML标签泄露
- 不再出现显示错误或报错

## 注意事项
1. 只有论述题和简答题支持富文本答案
2. 图片URL会自动转换为预览URL，确保可访问性
3. 保持与题目标题、详情、解析的显示逻辑一致
4. 答题界面（TakeExamQuestionCard.vue）不需要修改，因为那是输入界面
