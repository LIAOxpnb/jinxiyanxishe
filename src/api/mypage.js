import request from '@/utils/request';

/**
 * @description 查询课程学习进度
 * @param {object} params - 请求参数 { page, size }
 * @returns {Promise}
 */
export function getLearningProgress(params) {
  return request.post('/student/course/learnProgress', params);
}

/**
 * @description 获取收藏课程列表
 * @param {object} params - 请求参数 { page, size }
 * @returns {Promise}
 */
export function getCollectedCourses(params) {
  // 【核心修正】修复了错误的API路径
  return request.post('/student/courseCollect/list', params);
}

/**
 * @description 获取我的班级列表
 * @returns {Promise}
 */
export function getMyClasses() {
  return request.post('/student/clazz/list');
} 

/**
 * @description 获取我的证书列表
 * @returns {Promise}
 */
export function getMyCertificates() {
  return request.post('/student/certificate/list');
}

/**
 * @description 获取班级详情
 * @param {string} id - 班级ID编号
 * @returns {Promise}
 */
export function getClazzDetail(id) {
  return request.get('/student/clazz/detail', {
    params: { id }
  });
}