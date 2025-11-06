import request from '@/utils/request';

/**
 * @description 获取靶场列表
 * @param {object} data - 请求参数
 * @param {number} data.page - 页码
 * @param {number} data.size - 页面大小
 * @param {number} data.shootingRangeType - 靶场类型 (0练习 1正式)
 * @param {string} data.shootingRangeCategory - 靶场分类
 * @param {string} data.name - 靶场名称
 * @returns {Promise}
 */
export function getShootingRangeList(data) {
  return request.post('/student/shootingRange/list', data);
}

/**
 * @description 获取靶场详情
 * @param {string|number} id - 靶场ID
 * @returns {Promise}
 */
export function getShootingRangeDetail(id) {
  return request.get('/student/shootingRange/detail', {
    params: { id }
  });
}

/**
 * @description 获取靶场题目列表
 * @param {string|number} id - 靶场ID
 * @returns {Promise}
 */
export function getShootingRangeQuestions(id) {
  return request.get('/student/shootingRange/questionList', {
    params: { id }
  });
}

/**
 * @description 查看线索集
 * @param {string|number} id - 靶场ID
 * @returns {Promise}
 */
export function getShootingRangeClues(id) {
  return request.get('/student/shootingRange/clueList', {
    params: { id }
  });
}

/**
 * @description 暂存答题记录
 * @param {object} data - 请求参数
 * @param {number} data.id - 答题记录ID（继续答题时传入）
 * @param {number} data.shootingRangeId - 靶场ID（必填）
 * @param {Array<object>} data.shootingRangeSubmitRecordList - 答题记录列表（必填）
 * @param {number} data.shootingRangeSubmitRecordList[].questionId - 题目ID
 * @param {string} data.shootingRangeSubmitRecordList[].userAnswer - 用户答案
 * @returns {Promise}
 */
export function submitShootingRangeRecord(data) {
  return request.post('/student/shootingRange/submitRecord', data);
}

/**
 * @description 交卷
 * @param {string|number} id - 靶场ID（不是答题记录ID）
 * @returns {Promise}
 */
export function submitShootingRangePaper(id) {
  return request.get('/student/shootingRange/submitPaper', {
    params: { id }
  });
}

/**
 * @description 查看靶场结果
 * @param {string|number} id - 靶场记录ID
 * @returns {Promise}
 */
export function getShootingRangeResult(id) {
  return request.get('/student/shootingRange/result', {
    params: { id }
  });
}

/**
 * @description 获取靶场打分详情（教师端）
 * @param {string|number} id - 提交记录ID
 * @returns {Promise}
 */
export function getShootingRangeGradePaperDetail(id) {
  return request.get('/teacher/shootingRange/gradePaperDetail', {
    params: { id }
  });
}

/**
 * @description 查看靶场记录详情（学生端）
 * @param {string|number} id - 答题记录ID
 * @returns {Promise}
 */
export function getShootingRangeRecordDetail(id) {
  return request.get('/student/shootingRange/shootingRangeRecordDetail', {
    params: { id }
  });
}