import request from '@/utils/request';

/**
 * @description 获取组织列表
 */
export function getOrgList() {
  return request.post('/admin/organization/list');
}

/**
 * @description 获取组织树
 */
export function getOrgTree() {
  return request.post('/admin/organization/tree');
}

/**
 * @description 获取组织详情
 * @param {number} id - 组织ID
 */
export function getOrgDetail(id) {
  return request.get('/admin/organization/detail', {
    params: { id }
  });
}

/**
 * @description 新建组织
 * @param {object} data - 组织数据
 * @param {string} data.orgName - 组织名称
 * @param {number} data.parentId - 父级组织ID
 * @param {number} data.sort - 排序
 */
export function createOrg(data) {
  return request.post('/admin/organization/save', data);
}

/**
 * @description 修改组织
 * @param {object} data - 组织数据
 * @param {number} data.id - 组织ID
 * @param {string} data.orgName - 组织名称
 * @param {number} data.parentId - 父级组织ID
 * @param {number} data.sort - 排序
 */
export function updateOrg(data) {
  return request.post('/admin/organization/update', data);
}

/**
 * @description 删除组织
 * @param {number} id - 组织ID
 */
export function deleteOrg(id) {
  return request.get('/admin/organization/delete', {
    params: { id }
  });
}