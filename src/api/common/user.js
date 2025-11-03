// user.js

import request from '@/utils/request';

// 用户相关接口
export function login(payload) {
  // payload: { username, password }
  // 必须遵循后端接口文档，使用 GET 请求，并将参数放在 params 中
  return request.get('/user/auth/login', {
    params: payload
  });
}

export function getProfile() {
  return request.get('/user/profile');
}

export function logout() {
  return request.post('/auth/logout');
}

/**
 * @description: 查看登录用户信息
 * @param {*}
 * @return {*}
 */
export function getUserInfo() {
  return request.get('/admin/user/info');
}

/**
 * @description: 登录后修改自己的密码
 * @param {object} payload { password: 'new_password' }
 * @return {*}
 */
export function updateMyPassword(payload) {
  // 根据接口文档，修改密码应该是 POST 请求，并且数据在 body 中
  return request.post('/admin/user/upMyPassword', payload);
}