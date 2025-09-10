import request from '../../utils/request'; // 1. 路径风格与 user.js 保持一致import request from '../../utils/request';

// --- 题库分组相关接口 ---

/**
 * 获取题库分组列表
 */
export function getQuestionGroupList() {
  return request.get('/teacher/question/getQuestionGroupList');
}

/**
 * 添加题库分组
 * @param {string} name - 新分组的名称
 */
export function addQuestionGroup(name) {
  return request.get('/teacher/question/saveQuestionGroup', {
    params: {
      name
    }
  });
}

/**
 * 删除题库分组
 * @param {string | number} id - 要删除分组的ID
 */
export function deleteQuestionGroup(id) {
  return request.get('/teacher/question/deleteQuestionGroup', {
    params: {
      id
    }
  });
}

/**
 * 修改题库分组
 * @param {object} data - 分组数据对象，包含 id 和 name
 * @param {number} data.id - 分组ID
 * @param {string} data.name - 分组名称
 */
export function updateQuestionGroup(data) {
  return request.post('/teacher/question/updateQuestionGroup', data);
}

// --- 题目管理相关接口 (本次新增) ---

/**
 * 获取分组下的题库列表 (分页)
 * @param {object} params - 参数对象, e.g., { groupId: 1, page: 1, size: 10 }
 */
export function getQuestionList(params) {
  return request.post('/teacher/question/getQuestionList', params);
}

/**
 * 批量添加/保存题目
 * @param {Array<object>} data - 题目对象的数组
 * @param {string} data[].questionType - 题型（必填）
 * @param {string} data[].title - 题目（必填）
 * @param {number} data[].groupId - 分组ID（必填）
 * @param {string} data[].questionCategory - 题目分类（必填）
 * @param {string} data[].details - 详情/选项（必填）
 * @param {string} data[].answer - 答案（必填）
 * @param {number} data[].difficulty - 难度（必填）
 * @param {string} data[].analysis - 解析（必填）
 * @param {number} data[].wordLimit - 字数限制（必填）
 * @param {number} data[].fileUpload - 文件上传（必填）
 * @param {string} data[].fileName - 文件名（必填）
 * @param {string} data[].filePath - 文件路径（必填）
 */
export function saveQuestionList(data) {
  return request.post('/teacher/question/saveQuestionList', data);
}

/**
 * 修改题目
 * @param {object} data - 单个题目对象 (必须包含id)
 */
export function updateQuestion(data) {
  return request.post('/teacher/question/updateQuestion', data);
}

/**
 * 获取题目详情
 * @param {string | number} id - 题目的ID
 */
export function getQuestionDetail(id) {
  return request.get('/teacher/question/questionDetail', {
    params: {
      id
    }
  });
}

/**
 * 删除题目
 * @param {string | number} id - 题目的ID
 */
export function deleteQuestion(id) {
  return request.get('/teacher/question/deleteQuestion', {
    params: {
      id
    }
  });
}