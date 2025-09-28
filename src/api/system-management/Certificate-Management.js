import request from '@/utils/request';

/**
 * 证书管理 API
 * 包含证书的增删改查、授予设置、用户管理等功能
 */

// ==================== 证书基础管理 ====================

/**
 * 获取证书列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量  
 * @param {string} params.name - 证书名称（可选）
 * @param {number} params.creator - 创建人ID（可选）
 * @param {number} params.status - 状态：0正常，1异常（可选）
 * @returns {Promise} 返回证书列表数据
 */
export function getCertificateList(params) {
  return request({
    url: '/admin/certificate/list',
    method: 'post',
    data: params
  });
}

/**
 * 新增证书
 * @param {Object} data - 证书信息
 * @param {string} data.name - 证书名称（必填）
 * @param {string} data.intro - 详情描述（必填）
 * @param {string} data.unit - 单位（必填）
 * @param {number} data.issueDate - 证书颁发日期，0获证时自动生成，1统一时间（必填）
 * @param {string} data.unifyTime - 统一时间（必填）
 * @param {string} data.background - 背景图片（必填）
 * @param {string} data.officialSeal - 公章图片（必填）
 * @returns {Promise} 返回创建结果
 */
export function addCertificate(data) {
  return request({
    url: '/admin/certificate/save',
    method: 'post',
    data: data
  });
}

/**
 * 根据ID获取证书详情
 * @param {string|number} id - 证书ID
 * @returns {Promise} 返回证书详情
 */
export function getCertificateById(id) {
  return request({
    url: '/admin/certificate/detail',
    method: 'get',
    params: {
      id: id
    }
  });
}

// 为了兼容新的设置页面，添加别名
export const createCertificate = addCertificate;

/**
 * 修改证书
 * @param {string|number|Object} idOrData - 证书ID或证书信息对象
 * @param {Object} data - 证书信息（当第一个参数是ID时使用）
 * @returns {Promise} 返回修改结果
 */
export function updateCertificate(idOrData, data) {
  // 兼容两种调用方式
  const requestData = data ? { ...data, id: idOrData } : idOrData;
  
  return request({
    url: '/admin/certificate/update',
    method: 'post',
    data: requestData
  });
}

/**
 * 删除证书
 * @param {Object} data - 删除参数
 * @param {number} data.id - 证书ID（必填）
 * @param {number} data.param - 删除参数，0仅删除证书，1同步删除用户证书（必填）
 * @returns {Promise} 返回删除结果
 */
export function deleteCertificate(data) {
  return request({
    url: '/admin/certificate/delete',
    method: 'post',
    data: data
  });
}

// ==================== 证书授予设置 ====================

/**
 * 设置证书授予配置
 * 为证书配置班级、考试、射击场等授予条件
 * @param {Array} data - 授予配置数组
 * @param {number} data[].certificateId - 证书ID（必填）
 * @param {number} data[].clazzId - 班级ID（可选）
 * @param {number} data[].examId - 考试ID（可选）
 * @param {number} data[].shootingRangeId - 射击场ID（可选）
 * @returns {Promise} 返回配置结果
 */
export function setCertificateGrantConfig(data) {
  return request({
    url: '/admin/certificate/grantConfig',
    method: 'post',
    data: data
  });
}

/**
 * 查看证书授予设置
 * @param {string} id - 证书ID
 * @returns {Promise} 返回授予设置信息
 */
export function getCertificateGrantConfig(id) {
  return request({
    url: '/admin/certificate/selGrantConfig',
    method: 'get',
    params: { id }
  });
}

// ==================== 用户证书授予 ====================

/**
 * 直接授予证书给用户
 * @param {Object} data - 授予参数
 * @param {number} data.id - 证书ID（必填）
 * @param {Array<number>} data.userIds - 用户ID数组（必填）
 * @returns {Promise} 返回授予结果
 */
export function grantCertificateToUsers(data) {
  return request({
    url: '/admin/certificate/grant',
    method: 'post',
    data: data
  });
}

/**
 * 删除授予的证书
 * 撤销用户的证书
 * @param {Object} data - 删除参数
 * @param {number} data.id - 证书ID（必填）
 * @param {Array<number>} data.userIds - 用户ID数组（必填）
 * @returns {Promise} 返回删除结果
 */
export function revokeGrantedCertificate(data) {
  return request({
    url: '/admin/certificate/delGrant',
    method: 'post',
    data: data
  });
}

// ==================== 用户列表查询 ====================

/**
 * 查询可授予证书的用户列表
 * @param {string} id - 证书ID
 * @returns {Promise} 返回可授予用户列表
 */
export function getGrantableUsers(id) {
  return request({
    url: '/admin/certificate/selCanGrantUserList',
    method: 'get',
    params: { id }
  });
}

/**
 * 查询已授予证书的用户列表
 * @param {Object} params - 查询参数
 * @param {number} params.id - 证书ID（必填）
 * @param {number} params.page - 页码（必填）
 * @param {number} params.size - 每页数量（必填）
 * @param {string} params.param - 搜索参数（可选）
 * @param {number} params.source - 来源：0-班级，1-考试，2-射场，3-直接授予（必填）
 * @returns {Promise} 返回已授予用户列表
 */
export function getGrantedUsers(params) {
  return request({
    url: '/admin/certificate/selGrantUserList',
    method: 'post',
    data: params
  });
}

// ==================== 其他列表查询 ====================

/**
 * 获取考试列表
 * 用于证书授予设置中选择考试
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码（必填）
 * @param {number} params.size - 每页数量（必填）
 * @param {boolean} params.pagination - 是否分页，默认false（必填）
 * @returns {Promise} 返回考试列表
 */
export function getExamList(params) {
  return request({
    url: '/admin/exam/list',
    method: 'post',
    data: params
  });
}

/**
 * 获取射击场列表
 * 用于证书授予设置中选择射击场
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码（必填）
 * @param {number} params.size - 每页数量（必填）
 * @param {boolean} params.pagination - 是否分页，默认false（必填）
 * @returns {Promise} 返回射击场列表
 */
export function getShootingRangeList(params) {
  return request({
    url: '/admin/shootingRange/list',
    method: 'post',
    data: params
  });
}

/**
 * 获取班级列表
 * 用于证书授予设置中选择班级
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码（必填）
 * @param {number} params.size - 每页数量（必填）
 * @param {boolean} params.pagination - 是否分页，默认false（必填）
 * @returns {Promise} 返回班级列表
 */
export function getClassList(params) {
  return request({
    url: '/admin/clazz/list',
    method: 'post',
    data: params
  });
}