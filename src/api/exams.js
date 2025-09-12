import request from '../utils/request';

/**
 * @description [学生端] 获取考试列表
 * @param {object} data - 查询参数
 * @param {number} data.page - 页码
 * @param {number} data.size - 每页数量
 * @param {string} data.examCategory - 考试分类
 * @param {string} data.name - 考试名称
 * @param {string} data.examStatus - 考试状态 (0未开始, 1进行中, 2已结束)
 */
export function getStudentExamList(data) {
  return request({
    url: '/student/exam/list',
    method: 'post',
    data: data
  });
}

/**
 * @description [学生端] 查看考试详情
 * @param {string} id - 考试的ID
 */
export function getStudentExamDetail(id) {
  return request({
    url: '/student/exam/detail',
    method: 'get',
    params: { id }
  });
}

/**
 * @description [新增] [学生端] 交卷
 * @param {object} data - 提交的答卷数据
 * @param {number} data.examId - 考试ID (必填)
 * @param {Array<object>} data.examSubmitRecordList - 提交记录列表 (必填)
 * @param {number} data.examSubmitRecordList[].questionId - 题目ID (必填)
 * @param {string} data.examSubmitRecordList[].userAnswer - 用户答案 (必填)
 * @param {string} data.examSubmitRecordList[].details - 试卷给的选项，原封不动返回 (必填)
 */
export function submitStudentExamPaper(data) {
  return request({
    url: '/student/exam/submitPaper', //
    method: 'post', //
    data: data //
  });
}

/**
 * @description [新增] [学生端] 查看考试结果
 * @param {string} id - 考试ID
 */
export function getStudentExamResult(id) {
  return request({
    url: '/student/exam/examRecordDetail', //
    method: 'get', //
    params: { id } //
  });
}