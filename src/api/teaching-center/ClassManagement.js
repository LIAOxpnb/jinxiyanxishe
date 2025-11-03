import request from '../../utils/request';
import axios from 'axios';

// 班级管理相关接口

/**
 * 列表 - 获取班级列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {string} data.name - 班级名称 (必需)
 * @param {boolean} data.isMe - 是否我的班级 (必需)
 * @param {number} data.clazzStatus - 班级状态: 0未开始，1进行中，2已结束 (必需)
 * @returns {Promise} 返回班级列表数据
 */
export function getClassList(data) {
  return request.post('/teacher/clazz/list', data);
}

/**
 * 新增 - 创建班级
 * @param {Object} data - 班级信息
 * @param {string} data.name - 班级名称 (必需)
 * @param {number} data.studyDate - 学习时间 (0不限时，1指定时间) (必需)
 * @param {string} data.startTime - 指定开始时间 (必需)
 * @param {string} data.endTime - 指定结束时间 (必需)
 * @returns {Promise} 返回创建结果
 */
export function createClass(data) {
  return request.post('/teacher/clazz/save', data);
}

/**
 * 修改 - 更新班级
 * @param {Object} data - 班级信息
 * @param {number} data.id - 班级ID (必需)
 * @param {string} data.name - 班级名称 (必需)
 * @param {number} data.studyDate - 学习时间 (必需)
 * @param {string} data.startTime - 开始时间 (必需)
 * @param {string} data.endTime - 结束时间 (必需)
 * @returns {Promise} 返回更新结果
 */
export function updateClass(data) {
  return request.post('/teacher/clazz/update', data);
}

/**
 * 删除 - 删除班级
 * @param {string} id - 班级ID编号 (必需)
 * @returns {Promise} 返回删除结果
 */
export function deleteClass(id) {
  return request.get(`/teacher/clazz/delete?id=${id}`);
}

/**
 * 查询班级用户 - 获取班级用户列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {number} data.id - 班级ID (必需)
 * @param {string} data.param - 姓名、手机号、警号、身份证号 (必需)
 * @param {number} data.graduate - 毕业状态 (必需)
 * @returns {Promise} 返回班级用户列表数据
 */
export function getClassUsers(data) {
  return request.post('/teacher/clazz/selClazzUser', data);
}

/**
 * 设置班级用户（删除原用户） - 设置班级用户并删除原有用户
 * @param {Object} data - 请求参数
 * @param {number} data.id - 班级ID (必需)
 * @param {Array<number>} data.userIdList - 用户ID列表 (必需)
 * @returns {Promise} 返回设置结果
 */
export function setClassUsers(data) {
  return request.post('/teacher/clazz/setClazzUser', data);
}

/**
 * 添加班级用户（不删除原用户） - 向班级添加新用户
 * @param {Object} data - 请求参数
 * @param {number} data.id - 班级ID (必需)
 * @param {Array<number>} data.userIdList - 用户ID列表 (必需)
 * @returns {Promise} 返回添加结果
 */
export function addClassUsers(data) {
  return request.post('/teacher/clazz/addClazzUser', data);
}

/**
 * 删除班级用户 - 从班级中删除指定用户
 * @param {Object} data - 请求参数
 * @param {number} data.id - 班级ID (必需)
 * @param {Array<number>} data.userIdList - 要删除的用户ID列表 (必需)
 * @returns {Promise} 返回删除结果
 */
export async function removeClassUsers(data) {
  try {
    // 1. 先获取班级当前的所有用户
    const currentUsersResponse = await getClassUsers({
      page: 1,
      size: 1000, // 获取足够多的用户
      id: data.id,
      param: '',
      graduate: ''
    });

    if (currentUsersResponse.code !== 200 || !currentUsersResponse.data.records) {
      throw new Error('获取班级用户列表失败');
    }

    // 2. 从当前用户列表中排除要删除的用户
    const remainingUserIds = currentUsersResponse.data.records
      .filter(user => !data.userIdList.includes(user.id))
      .map(user => user.id);

    // 3. 使用 setClazzUser 接口重新设置班级用户列表（只包含剩余的用户）
    return await request.post('/teacher/clazz/setClazzUser', {
      id: data.id,
      userIdList: remainingUserIds
    });
  } catch (error) {
    throw new Error('删除班级用户失败: ' + (error.message || error));
  }
}

/**
 * 查询可加入的考试列表 - 获取可以添加到班级的考试列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {number} data.clazzId - 当前班级 (必需)
 * @param {string} data.examCategory - 考试分类 (可选)
 * @param {string} data.name - 考试名称 (可选)
 * @param {number} data.creator - 创建人 (可选)
 * @returns {Promise} 返回可加入的考试列表
 */
export function getCanJoinExamList(data) {
  return request.post('/teacher/clazz/getCanJoinExamList', data);
}

/**
 * 添加班级考试、课程、靶场 - 为班级绑定考试、课程或靶场
 * @param {Object} data - 请求参数
 * @param {number} data.id - 班级ID (必需)
 * @param {Array<number>} data.examIdList - 考试ID列表 (必需)
 * @param {Array<number>} data.courseIdList - 课程ID列表 (必需)
 * @param {Array<number>} data.shootingRangeIdList - 靶场ID列表 (必需)
 * @returns {Promise} 返回绑定结果
 */
export function addClazzBind(data) {
  return request.post('/teacher/clazz/addClazzBind', data);
}

/**
 * 获取班级绑定的考试、课程、靶场 - 查询班级已绑定的内容
 * @param {string} id - 班级ID (必需)
 * @returns {Promise} 返回班级绑定的考试、课程、靶场信息
 */
export function getClazzBind(id) {
  return request.get(`/teacher/clazz/selClazzBind?id=${id}`);
}

/**
 * 删除班级考试、课程、靶场 - 解除班级与考试、课程、靶场的绑定
 * @param {Object} data - 请求参数
 * @param {Array<number>} data.ids - 要删除的绑定ID列表 (必需)
 * @returns {Promise} 返回删除结果
 */
export function delClazzBind(data) {
  return request.post('/teacher/clazz/delClazzBind', data);
}

/**
 * 下载用户导入模板 - 下载学员批量导入的Excel模板
 * @returns {Promise} 返回模板文件blob
 */
export function downloadUserTemplate() {
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.VITE_APP_BASE_API || '/api';
  
  return axios.get(`${baseURL}/teacher/clazz/downloadUserTemplate`, {
    responseType: 'blob',
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  }).then(response => response.data);
}

/**
 * 批量导入用户 - 通过Excel文件批量导入学员到班级
 * @param {FormData} formData - 表单数据，包含file和clazzId
 * @returns {Promise} 返回导入结果
 */
export function uploadUserTemplate(formData) {
  return request.post('/teacher/clazz/uploadUserTemplate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 班级汇总 - 获取班级的统计汇总信息
 * @param {string} id - 班级ID (必需)
 * @returns {Promise} 返回班级汇总统计数据
 */
export function getClazzSummary(id) {
  return request.get(`/teacher/clazz/summary?id=${id}`);
}