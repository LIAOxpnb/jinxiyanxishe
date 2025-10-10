import request from '@/utils/request';

// 课件管理相关接口

/**
 * @description 获取课件分组列表
 * @returns {Promise}
 */
export function getCoursewareGroupList() {
  return request.get('/teacher/courseware/getCoursewareGroupList');
}

/**
 * @description 添加课件分组
 * @param {Object} params - 请求参数
 * @param {string} params.name - 分组名称
 * @returns {Promise}
 */
export function addCoursewareGroup(params) {
  return request.get('/teacher/courseware/saveCoursewareGroup', { params });
}

/**
 * @description 删除课件分组
 * @param {Object} params - 请求参数
 * @param {string} params.id - 分组ID
 * @returns {Promise}
 */
export function deleteCoursewareGroup(params) {

  return request.get('/teacher/courseware/deleteCoursewareGroup', { params });
  
}

/**
 * @description 修改课件分组
 * @param {Object} data - 请求参数
 * @param {number} data.id - 分组ID (必需)
 * @param {string} data.name - 分组名称 (必需)
 * @returns {Promise}
 */
export function updateCoursewareGroup(data) {
  return request.post('/teacher/courseware/updateCoursewareGroup', data);
}

/**
 * @description 获取分组下的课件列表
 * @param {Object} data - 请求参数
 * @param {number} data.groupId - 分组ID (必需)
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {string} [data.name] - 课件名称 (可选)
 * @param {number} [data.id] - 课件ID (可选)
 * @param {number} [data.creator] - 创建人 (可选)
 * @param {string} [data.file_type] - 文件类型 (可选)
 * @param {string} [data.coursewareCategory] - 课件分类 (可选)
 * @returns {Promise}
 */
export function getCoursewareList(data) {
  return request.post('/teacher/courseware/getCoursewareList', data);
}

/**
 * @description 批量添加课件
 * @param {Array<Object>} data - 课件信息数组
 * @param {string} [data.name] - 课件名
 * @param {string} [data.fileName] - 文件名
 * @param {number} [data.groupId] - 分组ID
 * @param {string} [data.coursewareCategory] - 课件分类
 * @returns {Promise}
 */
export function batchAddCourseware(data) {
  return request.post('/teacher/courseware/batchSaveCourseware', data);
}

/**
 * @description 删除课件
 * @param {Array<string|number>} ids - 包含一个或多个要删除课件ID的数组
 * @returns {Promise}
 */
export function deleteCourseware(ids) {
  // 将ID数组转换为逗号分隔的字符串以支持批量删除
  const idString = ids.join(',');
  return request.get('/teacher/courseware/deleteCourseware', {
    params: { id: idString }
  });
}

/**
 * @description 获取课件详情
 * @param {Object} params - 请求参数
 * @param {string} params.id - 课件ID
 * @returns {Promise}
 */
export function getCoursewareDetail(params) {
  return request.get('/teacher/courseware/coursewareDetail', { params });
}

/**
 * @description 修改课件
 * @param {Object} data - 请求参数
 * @param {number} data.id - ID (必需)
 * @param {string} data.name - 名称 (必需)
 * @param {number} data.groupId - 分组ID (必需)
 * @param {string} data.coursewareCategory - 课件分类 (必需)
 * @returns {Promise}
 */
export function updateCourseware(data) {
  return request.post('/teacher/courseware/updateCourseware', data);
}