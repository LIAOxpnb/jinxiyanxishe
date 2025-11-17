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

/**
 * @description 保存小节资料
 * @param {string} id - 小节ID
 * @param {Array<Object>} data - 资料文件列表
 * @param {string} data.fileName - 文件名
 * @param {string} data.filePath - 文件路径
 * @returns {Promise}
 */
export function saveSectionMaterials(id, data) {
  return request.post('/teacher/course/materialSave', data, {
    params: { id }
  });
}

/**
 * @description 查看小节资料
 * @param {string} id - 小节ID
 * @returns {Promise}
 */
export function getSectionMaterials(id) {
  return request.get('/teacher/course/materialList', {
    params: { id }
  });
}

/**
 * 删除小节资料
 * @param {string|number} id - 资料ID
 * @returns {Promise}
 */
export function deleteSectionMaterial(id) {
  return request.get('/teacher/course/deleteMaterial', {
    params: { id }
  });
}

/**
 * @description 章节小节保存修改
 * @param {Array<Object>} data - 章节及小节数据
 * @returns {Promise}
 * 示例：
 * [
 *   {
 *     courseId: 10,
 *     name: '第一章 函数',
 *     sort: 1,
 *     courseSectionList: [
 *       { name: '1.1 定义', sort: 1, coursewareId: 1 },
 *       { name: '1.2 例题', sort: 2, coursewareId: 2 }
 *     ]
 *   }
 * ]
 */
/**
 * @description 保存或更新章节和课时
 * @param {Object} data - 章节课时数据
 * @returns {Promise}
 * @example
 * saveOrUpdateChaptersAndSections({
 *   courseId: 10,
 *   courseChapterList: [
 *     {
 *       courseId: 10,
 *       name: '第一章 函数',
 *       sort: 1,
 *       courseSectionList: [
 *         { name: '1.1 定义', sort: 1, coursewareId: 1 },
 *         { name: '1.2 例题', sort: 2, coursewareId: 2 }
 *       ]
 *     }
 *   ]
 * })
 */
export function saveOrUpdateChaptersAndSections(data) {
  return request.post('/teacher/courseChapter/saveUpdate', data);
}

/**
 * @description 导入课程
 * @param {FormData} data - 包含文件的FormData对象
 * @returns {Promise}
 */
export function importFullCourse(data) {
  return request.post('/teacher/course/importFullCourse', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}