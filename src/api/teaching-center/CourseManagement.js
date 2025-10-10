import request from '../../utils/request';

// 课程管理相关接口

/**
 * @description 创建课程
 * @param {Object} data - 请求参数
 * @param {string} data.name - 课程名称 (必需)
 * @param {string} data.courseCategory - 课程分类 (必需)
 * @param {string} data.cover - 封面 (必需)
 * @param {string} data.summary - 摘要 (必需)
 * @param {string} data.intro - 介绍 (必需)
 * @returns {Promise}
 */
export function createCourse(data) {
  return request.post('/teacher/course/save', data);
}

/**
 * @description 获取课程列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {string} [data.name] - 课程名 (可选)
 * @param {number} [data.creator] - 创建者ID (可选)
 * @param {number} [data.scope] - 范围：0公开, 1指定类 (可选)
 * @param {string} [data.courseCategory] - 课程分类 (可选)
 * @param {number} [data.status] - 状态：0未发布, 1已发布 (可选)
 * @param {boolean} [data.isMe] - 是否是我的课程 (可选)
 * @returns {Promise}
 */
export function getCourseList(data) {
  return request.post('/teacher/course/list', data);
}

/**
 * @description 修改课程
 * @param {Object} data - 请求参数
 * @param {number} data.id - 课程ID (必需)
 * @param {string} data.name - 课程名 (必需)
 * @param {string} data.courseCategory - 课程分类 (必需)
 * @param {string} data.cover - 封面 (必需)
 * @param {number} data.scope - 范围：0公开, 1指定人员, 2指定班级 (必需)
 * @param {number} data.status - 状态：0未发布, 1已发布 (必需)
 * @param {string} [data.summary] - 摘要 (可选)
 * @param {string} [data.intro] - 介绍 (可选)
 * @param {Array<Object>} [data.clazzUserBindList] - 指定的班级/用户列表 (可选)
 * @returns {Promise}
 */
export function updateCourse(data) {
  return request.post('/teacher/course/update', data);
}

/**
 * @description 获取课程详情
 * @param {Object} params - 请求参数
 * @param {string} params.id - 课程ID (必需)
 * @returns {Promise}
 */
export function getCourseDetail(params) {
  return request.get('/teacher/course/detail', { params });
}

/**
 * @description 保存或修改课程的章节与小节
 * @param {Array<Object>} data - 章节列表数据
 * @returns {Promise}
 */
export function updateCourseChapters(data) {
  return request.post('/teacher/course/chapter/issue/update', data);
}

/**
 * @description 修改课程发布状态
 * @param {Object} params - 请求参数
 * @param {number} params.id - 课程ID (必需)
 * @param {number} params.status - 状态：1发布, 2取消发布 (必需)
 * @returns {Promise}
 */
export function updateCourseStatus(params) {
  return request.get('/teacher/course/release', { params });
}

/**
 * @description 复制课程
 * @param {Object} params - 请求参数
 * @param {string} params.id - 要复制的课程ID (必需)
 * @param {string} params.name - 新课程的名称 (必需)
 * @returns {Promise}
 */
export function copyCourse(params) {
  return request.get('/teacher/course/copy', { params });
}

/**
 * @description 删除课程
 * @param {Array<number|string>} ids - 包含一个或多个要删除课程ID的数组
 * @returns {Promise}
 */
export function deleteCourse(ids) {
  // 根据接口文档，这是一个GET请求，我们将ID数组转换为逗号分隔的字符串
  // 这样既可以支持单个删除 (id=1)，也支持批量删除 (id=1,2,3)
  const idString = ids.join(',');
  
  return request({
    url: '/teacher/course/delete',
    method: 'get',
    params: {
      id: idString
    }
  });
}