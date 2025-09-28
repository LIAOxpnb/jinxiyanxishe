import request from '@/utils/request';

/**
 * @description 获取角色列表
 * @param {object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 页大小
 * @param {string} [params.name] - 角色名称（可选）
 * @param {boolean} [params.pagination=true] - 是否分页，默认true
 */
export function getRoleList(params) {
  return request({
    url: '/admin/role/list',
    method: 'post',
    data: params
  });
}

/**
 * @description 新增权限角色
 * @param {object} data - 角色数据
 * @param {string} data.name - 角色名称
 * @param {array} data.roleDetailsList - 权限详情列表
 * @param {number} data.roleDetailsList[].dictId - 字典ID
 * @param {string} data.roleDetailsList[].rolePath - 权限路径
 */
export function saveRole(data) {
  return request({
    url: '/admin/role/save',
    method: 'post',
    data
  });
}

/**
 * @description 获取权限详情
 * @param {string} id - 角色ID
 */
export function getRoleDetail(id) {
  return request({
    url: '/admin/role/detail',
    method: 'get',
    params: { id }
  });
}

/**
 * @description 修改角色（含权限清单）
 * @param {object} data - 角色数据
 * @param {number} data.id - 角色ID
 * @param {string} data.name - 角色名称
 * @param {array} data.roleDetailsList - 权限详情列表
 * @param {number} data.roleDetailsList[].dictId - 字典ID
 * @param {string} data.roleDetailsList[].rolePath - 权限路径
 */
export function updateRole(data) {
  return request({
    url: '/admin/role/update',
    method: 'post',
    data
  });
}

/**
 * @description 授权用户角色
 * @param {object} data - 授权数据
 * @param {number} data.roleId - 角色ID
 * @param {array} data.userList - 用户ID列表，例如：[1, 2, 3]
 */
export function grantUserRole(data) {
  return request({
    url: '/admin/role/grant',
    method: 'post',
    data
  });
}

/**
 * @description 移除用户角色授权
 * @param {object} data - 移除授权数据
 * @param {number} data.roleId - 角色ID
 * @param {array} data.userList - 用户ID列表，例如：[1, 2, 3]
 */
export function revokeUserRole(data) {
  return request({
    url: '/admin/role/revoke',
    method: 'post',
    data
  });
}
