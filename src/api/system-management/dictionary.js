import request from '../../utils/request'; // 1. 路径风格与 user.js 保持一致


/**
 * 获取字典列表 (分页)
 * @param {object} params - 查询参数，例如 { pageNum: 1, pageSize: 20 }
 */
export function getDictList(params) {
  return request.post('/admin/dict/list', params);
}

/**
 * 根据字典类型查询字典数据列表
 * @param {string} dictType - 字典类型 (例如: 'question_category')
 */
export function getDictByType(dictType) {
  return request.get('/admin/dict/get', {
    params: {
      dictType
    }
  });
}

// --- 以下是本次新增的三个函数 ---

/**
 * 新增字典
 * @param {object} data - 字典数据对象
 */
export function addDict(data) {
  return request.post('/admin/dict/save', data);
}

/**
 * 修改字典
 * @param {object} data - 字典数据对象 (必须包含 id)
 */
export function updateDict(data) {
  return request.post('/admin/dict/update', data);
}

/**
 * 删除字典
 * @param {number | string} id - 字典ID
 */
export function deleteDict(id) {
  return request.get('/admin/dict/delete', {
    params: {
      id
    }
  });
}