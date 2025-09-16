import request from '@/utils/request'; // 确保路径正确

/**
 * @description 获取组织树
 */
export function getOrgTree() {
  // 请与后端确认这个接口的完整URL路径
  return request.post('/admin/org/tree'); 
}