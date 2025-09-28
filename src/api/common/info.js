import request from '@/utils/request';

// 显示当前登录用户信息
export function getInfo() {
  // 接口文档显示为 GET /admin/user/info
  return request.get('/admin/user/info');
}