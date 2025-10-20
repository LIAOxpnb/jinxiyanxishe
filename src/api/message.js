import request from '@/utils/request';

/**
 * @description 获取系统通知列表
 * @param {object} data - 请求参数
 * @param {number} data.page - 页码
 * @param {number} data.size - 页面大小
 * @param {string} data.content - 搜索内容
 * @returns {Promise}
 */
export function getAnnouncementList(data) {
  return request.post('/student/announcement/list', data);
}

/**
 * @description 获取私信通讯录
 * @returns {Promise}
 */
export function getAddressBook() {
  return request.get('/student/message/addressBook');
}

/**
 * @description 查询与某个用户的聊天记录
 * @param {object} data - 请求参数
 * @param {number} data.oppositeUserId - 对方用户ID
 * @param {number} data.page - 页码
 * @param {number} data.size - 页面大小
 * @returns {Promise}
 */
export function getChatRecord(data) {
  return request.post('/student/message/chatRecord', data);
}

/**
 * @description 发送私信
 * @param {object} data - 请求参数
 * @param {number} data.receiver - 接收者用户ID
 * @param {string} data.content - 消息内容
 * @returns {Promise}
 */
export function sendMessage(data) {
  return request.post('/student/message/send', data);
}