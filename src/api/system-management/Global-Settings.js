import request from '../../utils/request.js';

// 全局配置管理API

/**
 * 获取全局配置详情
 * @returns {Promise} 返回全局配置详情
 */
export const getGlobalSettings = () => {
  return request({
    url: '/admin/sysConfig/detail',
    method: 'GET'
  });
};

/**
 * 修改全局配置
 * @param {Object} data - 配置数据
 * @param {number} data.watermark - 页面水印设置 (1=开启, 0=关闭)
 * @returns {Promise} 返回修改结果
 */
export const updateGlobalSettings = (data) => {
  return request({
    url: '/admin/sysConfig/update',
    method: 'POST',
    data
  });
};