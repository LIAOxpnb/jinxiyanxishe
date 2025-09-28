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