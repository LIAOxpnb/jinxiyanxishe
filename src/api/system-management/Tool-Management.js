import request from '../../utils/request.js';

// 工具管理API

/**
 * 获取工具列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @param {string} params.name - 工具名称（可选）
 * @returns {Promise} 返回工具列表
 */
export const getToolsList = (params) => {
  return request({
    url: '/admin/tools/list',
    method: 'POST',
    data: params
  });
};

/**
 * 新增工具
 * @param {Object} data - 工具数据
 * @param {string} data.name - 工具名称
 * @param {string} data.urlPath - URL路径
 * @returns {Promise} 返回新增结果
 */
export const addTool = (data) => {
  return request({
    url: '/admin/tools/save',
    method: 'POST',
    data
  });
};

/**
 * 修改工具
 * @param {Object} data - 工具数据
 * @param {number} data.id - 工具ID
 * @param {string} data.name - 工具名称
 * @param {string} data.urlPath - URL路径
 * @returns {Promise} 返回修改结果
 */
export const updateTool = (data) => {
  return request({
    url: '/admin/tools/update',
    method: 'POST',
    data
  });
};

/**
 * 删除工具
 * @param {number} id - 工具ID
 * @returns {Promise} 返回删除结果
 */
export const deleteTool = (id) => {
  return request({
    url: '/admin/tools/delete',
    method: 'GET',
    params: { id }
  });
};

/**
 * 获取工具详情
 * @param {number} id - 工具ID
 * @returns {Promise} 返回工具详情
 */
export const getToolDetail = (id) => {
  return request({
    url: '/admin/tools/detail',
    method: 'GET',
    params: { id }
  });
};
