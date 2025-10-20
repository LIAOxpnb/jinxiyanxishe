// 文件路径: src/api/classroom.js

import request from '@/utils/request'; // 请确保您的请求封装文件路径正确

// =================================================================================
// 课程列表与详情
// =================================================================================

/**
 * @description 获取课程列表（学生端）
 * @param {object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {string} [data.course_category] - 课程分类 (可选)
 * @param {boolean} [data.mustLearn] - 是否为必学 (可选)
 * @returns {Promise}
 */
export function getStudentCourseList(data) {
  return request.post('/student/course/list', data);
}

/**
 * @description 获取课程详情（学生端）
 * @param {string|number} id - 课程ID
 * @returns {Promise}
 */
export function getStudentCourseDetail(id) {
  return request.get('/student/course/detail', {
    params: { id }
  });
}

/**
 * @description 获取小节详情（学生端）
 * @param {string|number} id - 小节ID
 * @returns {Promise}
 */
export function getStudentSectionDetail(id) {
  return request.get('/student/course/sectionDetail', {
    params: { id }
  });
}


// =================================================================================
// 学习进度与记录
// =================================================================================

/**
 * @description 提交小节学习记录
 * @param {object} data - 请求参数
 * @param {number} data.sectionId - 小节ID (必需)
 * @returns {Promise}
 */
export function submitSection(data) {
  return request.post('/student/course/submitSection', data);
}

/**
 * @description 视频播放心跳（每10-30秒一次）
 * @param {object} data - 请求参数
 * @param {number} data.sectionId - 小节ID (必需)
 * @param {number} data.watchSecond - 本次真实播放秒数 (1-30) (必需)
 * @param {number} data.playbackRate - 倍速 (0.5-2.0) (必需)
 * @returns {Promise}
 */
export function sendHeartbeat(data) {
  return request.post('/student/course/heartbeat', data);
}

/**
 * @description 查询课程学习进度
 * @param {string|number} [id] - 课程ID (可选)
 * @returns {Promise}
 */
export function getCourseProgress(id) {
  return request.get('/student/course/courseProgress', {
    params: { id }
  });
}

/**
 * @description 获取学习进度列表
 * @param {object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @returns {Promise}
 */
export function getLearnProgressList(data) {
  return request.post('/student/course/learnProgress', data);
}


// =================================================================================
// 课程收藏
// =================================================================================

/**
 * @description 收藏/取消收藏课程
 * @param {object} data - 请求参数
 * @param {number} data.courseId - 课程ID (必需)
 * @param {boolean} data.collect - true收藏, false取消收藏 (必需)
 * @returns {Promise}
 */
export function toggleCourseCollect(data) {
  return request.post('/student/courseCollect/toggle', data);
}

/**
 * @description 获取收藏课程列表
 * @param {object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @returns {Promise}
 */
export function getCourseCollectList(data) {
  return request.post('/student/courseCollect/list', data);
}

/**
 * @description 批量删除收藏
 * @param {number[]} ids - 要删除的收藏记录ID数组
 * @returns {Promise}
 */
export function deleteCourseCollect(ids) {
  return request.get('/student/courseCollect/delete', {
    params: { ids: ids.join(',') } // 将ID数组转换为逗号分隔的字符串
  });
}