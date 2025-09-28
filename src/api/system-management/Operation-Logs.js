import request from '../../utils/request.js';

// 操作日志管理API

/**
 * 获取操作日志列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @param {string} [params.title] - 日志标题搜索
 * @param {string} [params.operName] - 操作人搜索
 * @param {string} [params.time] - 时间范围搜索（格式：2020-01-01 00:00:00 - 2020-12-31 23:59:59）
 * @returns {Promise} 返回操作日志列表
 */
export const getOperationLogsList = (params) => {
  return request({
    url: '/admin/sysOperLog/list',
    method: 'POST',
    data: params
  });
};
