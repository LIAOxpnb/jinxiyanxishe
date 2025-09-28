import request from '../../utils/request.js';

// 消息模板管理API

/**
 * 获取消息模板列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @param {string} [params.name] - 模板名称搜索
 * @returns {Promise} 返回消息模板列表
 */
export const getMessageTemplateList = (params) => {
  return request({
    url: '/admin/messageTemplate/list',
    method: 'POST',
    data: params
  });
};

/**
 * 修改消息模板
 * @param {Object} data - 模板数据
 * @param {number} data.id - 模板ID
 * @param {string} data.remark - 备注
 * @param {string} data.content - 模板内容
 * @returns {Promise} 返回修改结果
 */
export const updateMessageTemplate = (data) => {
  return request({
    url: '/admin/messageTemplate/update',
    method: 'POST',
    data
  });
};

/**
 * 获取消息模板详情
 * @param {string} id - 模板ID
 * @returns {Promise} 返回模板详情
 */
export const getMessageTemplateDetail = (id) => {
  return request({
    url: '/admin/messageTemplate/detail',
    method: 'GET',
    params: { id }
  });
};
