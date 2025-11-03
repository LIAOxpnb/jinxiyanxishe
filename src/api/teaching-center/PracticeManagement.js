import request from '@/utils/request';

// 練習管理相關接口

/**
 * @description 获取练习列表
 * @param {Object} data - 请求参数
 * @param {number} data.page - 頁碼
 * @param {number} data.size - 頁面大小
 * @param {string} data.name - 練習名稱
 * @param {number} data.creator - 創建人ID
 * @param {number} data.courseId - 課程ID
 * @param {boolean} data.isMe - 我的練習
 * @returns {Promise}
 */
export function getPracticeList(data) {
  return request.post('/teacher/practice/list', data);
}

/**
 * @description 創建練習
 * @param {Object} data - 请求参数
 * @param {string} data.name - 練習名稱
 * @param {number} data.courseId - 課程ID
 * @param {number} data.chapterId - 章節ID
 * @param {number} data.sectionId - 小節ID
 * @returns {Promise}
 */
export function createPractice(data) {
  return request.post('/teacher/practice/save', data);
}

/**
 * @description 刪除練習
 * @param {Array<string|number>} ids - 包含一個或多個要刪除練習ID的陣列
 * @returns {Promise}
 */
export function deletePractice(ids) {
  // 將ID陣列轉換為逗號分隔的字串以支持批量刪除
  const idString = ids.join(',');
  return request.get('/teacher/practice/delete', {
    params: { id: idString }
  });
}

/**
 * @description 修改練習
 * @param {Object} data - 请求参数
 * @param {number} data.id - 練習ID
 * @param {string} data.name - 練習名稱
 * @param {number} data.courseId - 課程ID
 * @param {number} data.chapterId - 章節ID
 * @param {number} data.sectionId - 小節ID
 * @param {number} data.disorder - 是否亂序 (0否, 1是)
 * @returns {Promise}
 */
export function updatePractice(data) {
  return request.post('/teacher/practice/update', data);
}

/**
 * @description 設置練習題目
 * @param {Object} data - 請求參數
 * @param {number} data.id - 練習ID
 * @param {Array<Object>} data.practiceQuestionList - 題目列表
 * @param {number} data.practiceQuestionList.questionId - 題目ID
 * @param {number} data.practiceQuestionList.sort - 排序
 * @returns {Promise}
 */
export function setPracticeQuestionList(data) {
  return request.post('/teacher/practice/setQuestionList', data);
}

/**
 * @description 获取练习详情
 * @param {Object} params - 请求参数
 * @param {string} params.id - 練習ID
 * @returns {Promise}
 */
export function getPracticeDetail(params) {
  return request.get('/teacher/practice/detail', { params });
}

/**
 * @description 複製練習
 * @param {Object} params - 请求参数
 * @param {string} params.id - 要複製的練習ID
 * @param {string} params.name - 新練習的名稱
 * @returns {Promise}
 */
export function copyPractice(params) {
  return request.get('/teacher/practice/copy', { params });
}