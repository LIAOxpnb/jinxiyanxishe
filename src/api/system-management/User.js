import request from '@/utils/request';

/**
 * @description 批量添加用户
 * @param {object} data - 用户数据
 * @param {string} data.password - 密码
 * @param {number} data.needChangePassword - 是否登录重置 (0否 1是)
 * @param {array} data.users - 用户列表
 * @param {string} data.users[].username - 手机号
 * @param {string} data.users[].password - 密码
 * @param {string} data.users[].policeNumber - 警号
 * @param {string} data.users[].idCard - 身份证
 * @param {string} data.users[].name - 姓名
 * @param {number} data.users[].orgId - 组织ID
 */
export function batchSaveUsers(data) {
  return request.post('/admin/user/batchSave', data);
}

/**
 * @description 获取用户(教师)列表
 * @param {object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 页大小
 * @param {number} params.orgId - 组织ID
 * @param {string} params.param - 姓名、手机号、警号、身份证号
 * @param {number} params.status - 状态 (0正常 1禁止)
 * @param {number} params.teacher - 教师列表 (0否 1是)
 * @param {boolean} params.pagination - 是否分页 默认分页
 */
export function getUserList(params) {
  return request.post('/admin/user/list', params);
}

/**
 * @description 获取用户详情
 * @param {number} id - 用户ID
 */
export function getUserDetail(id) {
  return request.get('/admin/user/detail', {
    params: { id }
  });
}

/**
 * @description 修改用户信息
 * @param {object} data - 用户数据
 * @param {number} data.id - 用户ID
 * @param {string} data.username - 用户名
 * @param {string} data.policeNumber - 警号
 * @param {string} data.idCard - 身份证
 * @param {string} data.name - 姓名
 * @param {number} data.orgId - 组织ID
 * @param {number} data.status - 状态
 */
export function updateUser(data) {
  return request.post('/admin/user/update', data);
}

/**
 * @description 删除用户
 * @param {number} id - 用户ID
 */
export function deleteUser(id) {
  return request.get('/admin/user/delete', {
    params: { id }
  });
}

/**
 * @description 修改用户密码
 * @param {object} data - 密码数据
 * @param {number} data.id - 用户ID
 * @param {string} data.password - 新密码
 */
export function updateUserPassword(data) {
  return request.post('/admin/user/upPassword', data);
}
