import request from '../../utils/request';

// 数据包详情管理相关接口

/**
 * 导入数据(csv) - 导入CSV文件数据
 * @param {FormData} formData - 包含文件和ID的表单数据
 * @param {File} formData.file - CSV文件 (必需)
 * @param {string} formData.id - 数据包ID (必需)
 * @returns {Promise} 返回导入结果
 */
export function importDataFromCSV(formData) {
  return request.post('/teacher/dataPacket/importData', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 数据包字段查询 - 获取数据包表头字段列表
 * @param {string} id - 数据包ID (必需)
 * @returns {Promise} 返回字段列表
 */
export function getDataPacketHeaders(id) {
  return request.get(`/teacher/dataPacket/headers?id=${id}`);
}

/**
 * 数据包详情列表 - 获取数据包详细数据列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 页码 (必需)
 * @param {number} data.size - 页面大小 (必需)
 * @param {number} data.id - 数据包ID (必需)
 * @returns {Promise} 返回数据列表
 */
export function getDataPacketDetailList(data) {
  return request.post('/teacher/dataPacket/dataList', data);
}

/**
 * 修改数据包详情数据 - 更新数据包中的具体数据行
 * @param {Object} data - 数据信息
 * @param {number} data.dataPacketId - 数据包ID (必需)
 * @param {number} data.id - 数据行ID (必需)
 * @param {string} data.v1 - 字段值1 (可选)
 * @param {string} data.v2 - 字段值2 (可选)
 * @returns {Promise} 返回更新结果
 */
export function updateDataPacketDetail(data) {
  return request.post('/teacher/dataPacket/updateData', data);
}
