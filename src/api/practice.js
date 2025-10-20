import request from '@/utils/request'; // 请确保您的请求封装文件路径正确

// =================================================================================
// 练习列表与详情
// =================================================================================

/**
 * @description 获取练习列表（学生端）
 * @param {object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {string} data.name - 练习名称 (必需)
 * @returns {Promise}
 */
export function getStudentPracticeList(data) {
  return request.post('/student/practice/list', data);
}

/**
 * @description 查看练习详情（获取练习题目）
 * @param {string|number} id - 练习ID
 * @returns {Promise}
 */
export function getStudentPracticeDetail(id) {
  return request.get('/student/practice/detail', {
    params: { id }
  });
}

// =================================================================================
// 答题与记录
// =================================================================================

/**
 * @description 交卷
 * @param {object} data - 请求参数
 * @param {number} data.practiceId - 练习ID (必需)
 * @param {Array<object>} data.practiceSubmitRecordList - 答题记录列表 (必需)
 * @param {number} data.practiceSubmitRecordList[].questionId - 题目ID
 * @param {string} data.practiceSubmitRecordList[].userAnswer - 用户答案
 * @param {string} data.practiceSubmitRecordList[].details - 题目详情（前端回传）
 * @returns {Promise}
 */
export function submitPracticePaper(data) {
  return request.post('/student/practice/submitPaper', data);
}

/**
 * @description 查看练习记录（历史列表）
 * @param {object} data - 请求参数
 * @param {number} data.id - 练习ID (必需)
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @returns {Promise}
 */
export function getPracticeHistory(data) {
  return request.post('/student/practice/practiceHistory', data);
}

/**
 * @description 查看练习结果（单次作答详情）
 * @param {string|number} id - 练习记录ID
 * @returns {Promise}
 */
export function getPracticeRecordDetail(id) {
  return request.get('/student/practice/practiceRecordDetail', {
    params: { id }
  });
}
