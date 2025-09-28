import request from '../../utils/request.js';

// 消息管理API

/**
 * 获取消息列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @param {string} [params.content] - 消息内容搜索
 * @returns {Promise} 返回消息列表
 */
export const getMessageList = (params) => {
  return request({
    url: '/admin/announcement/list',
    method: 'POST',
    data: params
  });
};

/**
 * 新增消息
 * @param {Object} data - 消息数据
 * @param {string} data.content - 消息内容
 * @returns {Promise} 返回新增结果
 */
export const createMessage = (data) => {
  return request({
    url: '/admin/announcement/save',
    method: 'POST',
    data
  });
};

/**
 * 修改消息
 * @param {Object} data - 消息数据
 * @param {number} data.id - 消息ID
 * @param {string} data.content - 消息内容
 * @returns {Promise} 返回修改结果
 */
export const updateMessage = (data) => {
  return request({
    url: '/admin/announcement/update',
    method: 'POST',
    data
  });
};

/**
 * 获取消息详情
 * @param {string} id - 消息ID
 * @returns {Promise} 返回消息详情
 */
export const getMessageDetail = (id) => {
  return request({
    url: '/admin/announcement/detail',
    method: 'GET',
    params: { id }
  });
};

/**
 * 删除消息
 * @param {string} id - 消息ID
 * @returns {Promise} 返回删除结果
 */
export const deleteMessage = (id) => {
  return request({
    url: '/admin/announcement/delete',
    method: 'GET',
    params: { id }
  });
};