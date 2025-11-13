import request from '@/utils/request';

// 靶场管理相关接口

/**
 * @description 获取靶场列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码
 * @param {number} data.size - 页面大小
 * @param {string} data.name - 靶场名称
 * @param {string} data.shootingRangeCategory - 分类
 * @param {number} data.status - 状态 (0未发布, 1已发布)
 * @param {number} data.shootingRangeType - 靶场类型 (0训练, 1正式)
 * @param {boolean} data.isMe - 是否是我的靶场
 * @returns {Promise}
 */
export function getShootingRangeList(data) {
  return request.post('/teacher/shootingRange/list', data);
}

/**
 * @description 新增靶场
 * @param {Object} data - 请求参数
 * @param {string} data.name - 靶场名称
 * @param {string} data.introduction - 简介
 * @param {string} data.shootingRangeCategory - 靶场分类
 * @param {number} data.shootingRangeType - 靶场类型 (0训练, 1正式)
 * @returns {Promise}
 */
export function createShootingRange(data) {
  return request.post('/teacher/shootingRange/save', data);
}

/**
 * @description 删除靶场
 * @param {Array<string|number>} ids - 包含一个或多个要删除靶场ID的数组
 * @returns {Promise}
 */
export function deleteShootingRange(ids) {
  const idString = ids.join(',');
  return request.get('/teacher/shootingRange/delete', {
    params: { id: idString }
  });
}

/**
 * @description 修改靶场
 * @param {Object} data - 请求参数
 * @param {number} data.id - 靶场ID
 * @param {string} data.name - 靶场名称
 * @param {string} data.introduction - 简介
 * @param {string} data.shootingRangeCategory - 靶场分类
 * @param {number} data.shootingRangeType - 靶场类型
 * @param {number} data.challengeMode - 闯关模式
 * @param {number} data.participateDate - 参与时间
 * @param {string} data.startTime - 开始时间
 * @param {string} data.endTime - 结束时间
 * @param {number} data.duration - 时长
 * @param {number} data.scope - 参与人员范围
 * @param {number} data.disableCopy - 禁止复制
 * @param {Array<Object>} [data.clazzUserBindList] - 绑定的班级或用户列表 (可选)
 * @returns {Promise}
 */
export function updateShootingRange(data) {
  return request.post('/teacher/shootingRange/update', data);
}

/**
 * @description 获取靶场详情
 * @param {Object} params - 请求参数
 * @param {string} params.id - 靶场ID
 * @returns {Promise}
 */
export function getShootingRangeDetail(params) {
  return request.get('/teacher/shootingRange/detail', { params });
}

/**
 * @description 设置线索和题目
 * @param {Object} data - 请求参数
 * @param {number} data.id - 靶场ID
 * @param {Array<Object>} [data.clues] - 线索列表 (可选)
 * @param {Array<Object>} data.questions - 题目列表
 * @returns {Promise}
 */
export function setClueAndQuestionList(data) {
  return request.post('/teacher/shootingRange/setClueAndQuestionList', data);
}

/**
 * @description 设置及格线
 * @param {Object} data - 请求参数
 * @param {number} data.id - 靶场ID
 * @param {number} data.qualified - 及格分数
 * @returns {Promise}
 */
export function setShootingRangeQualified(data) {
  return request.post('/teacher/shootingRange/setQualified', data);
}

/**
 * @description 修改靶场状态（发布/取消发布）
 * @param {Object} params - 请求参数
 * @param {number} params.id - 靶场ID
 * @param {number} params.status - 状态 (1发布, 0取消发布)
 * @returns {Promise}
 */
export function updateShootingRangeStatus(params) {
  return request.get('/teacher/shootingRange/release', { params });
}

/**
 * @description 获取阅卷列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码
 * @param {number} data.size - 页面大小
 * @param {number} data.qualified - 是否合格 (0否, 1是)
 * @param {number} data.status - 状态 (2系统修改已完成等待人工修改, 4完成)
 * @param {number} data.shootingRangeId - 靶场ID
 * @returns {Promise}
 */
export function getGradePaperList(data) {
  return request.post('/teacher/shootingRange/gradePaperList', data);
}

/**
 * @description 获取阅卷详情
 * @param {Object} params - 请求参数
 * @param {string} params.id - ID
 * @returns {Promise}
 */
export function getGradePaperDetail(params) {
  return request.get('/teacher/shootingRange/gradePaperDetail', { params });
}

/**
 * @description 阅卷（提交分数）
 * @param {Array<Object>} data - 需要打分的题目数组
 * @param {number} [data.id] - examQuestion.id (可选)
 * @param {number} [data.score] - 得分 (可选)
 * @returns {Promise}
 */
export function gradePaper(data) {
  return request.post('/teacher/shootingRange/gradePaper', data);
}

/**
 * @description 复制靶场
 * @param {Object} params - 复制参数
 * @param {string} params.id - 靶场ID (必填)
 * @param {string} params.name - 新靶场名称 (必填)
 * @returns {Promise}
 */
export function copyShootingRange(params) {
  return request.get('/teacher/shootingRange/copy', { params });
}