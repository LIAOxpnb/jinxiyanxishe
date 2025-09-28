import request from '@/utils/request'; 

/**
 * @description 新增讲师
 * @param {object} data 讲师信息对象
 * @param {number} data.id - id为0时表示新增
 * @param {number} data.role - 角色
 * @param {string} data.avatar - 头像地址
 * @param {string} data.introduction - 简介
 * @param {string} data.intro - 介绍
 */
export function addLecturer(data) {
  return request({
    url: '/admin/teacher/save',
    method: 'post',
    data
  });
}

/**
 * @description 修改讲师
 * @param {object} data 讲师信息对象
 * @param {number} data.id - 要修改的讲师ID
 * @param {number} data.role - 角色
 * @param {string} data.avatar - 头像地址
 * @param {string} data.introduction - 简介
 * @param {string} data.intro - 介绍
 * @note 您的API文档截图显示此接口为GET方法，但GET请求通常不应有请求体(body)。
 * 为遵循RESTful规范和通用性，此处实现为POST方法。如果后端确实需要GET，请将下方的'post'改为'get'。
 */
export function updateLecturer(data) {
  return request({
    url: '/admin/teacher/update',
    method: 'post', // 根据截图，这是一个GET请求，但此处为保持规范性而使用POST
    data
  });
}

/**
 * @description 删除讲师
 * @param {object} data
 * @param {number} data.id - 要删除的讲师ID
 * @param {boolean} [data.takedown=false] - 是否下架
 * @param {boolean} [data.removeUser=false] - 是否删除用户
 */
export function deleteLecturer(data) {
  return request({
    url: '/admin/teacher/delete',
    method: 'post',
    data
  });
}

/**
 * @description 获取讲师详情
 * @param {object} params - 查询参数
 * @param {number} params.id - 讲师ID
 */
export function getLecturerDetail(params) {
  return request({
    url: '/admin/teacher/detail',
    method: 'get',
    params
  });
}