import request from '../../utils/request';

// 数据包管理相关接口

/**
 * 新增 - 创建数据包
 * @param {Object} data - 数据包信息
 * @param {string} data.name - 数据包名称 (必需)
 * @param {string} data.remark - 备注 (可选)
 * @returns {Promise} 返回创建结果
 */
export function createDataPacket(data) {
  return request.post('/teacher/dataPacket/save', data);
}

/**
 * 列表 - 获取数据包列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {string} data.name - 数据包名称 (可选)
 * @returns {Promise} 返回数据包列表数据
 */
export function getDataPacketList(data) {
  return request.post('/teacher/dataPacket/list', data);
}

/**
 * 修改 - 更新数据包
 * @param {Object} data - 数据包信息
 * @param {number} data.id - 数据包ID (必需)
 * @param {string} data.name - 数据包名称 (必需)
 * @param {string} data.remark - 备注 (可选)
 * @returns {Promise} 返回更新结果
 */
export function updateDataPacket(data) {
  return request.post('/teacher/dataPacket/update', data);
}

/**
 * 删除 - 删除数据包
 * @param {string} id - 数据包ID (必需)
 * @returns {Promise} 返回删除结果
 */
export function deleteDataPacket(id) {
  return request.get(`/teacher/dataPacket/delete?id=${id}`);
}

/**
 * 详情 - 获取数据包详情
 * @param {string} id - 数据包ID (必需)
 * @returns {Promise} 返回数据包详细信息
 */
export function getDataPacketDetail(id) {
  return request.get(`/teacher/dataPacket/detail?id=${id}`);
}
