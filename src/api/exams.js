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
 * @description [学生端] 交卷
 * @param {string} id - 答题记录ID (必填)
 * @param {number} forcedSubmission - 是否强制交卷 (1: 强制, 其他: 非强制)
 */
export function submitStudentExamPaper(id, forcedSubmission) {
  const params = { id };
  if (forcedSubmission !== undefined) {
    params.forcedSubmission = forcedSubmission;
  }
  return request({
    url: '/student/exam/submitPaper',
    method: 'get',
    params: params
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

/**
 * @description [新增] [学生端] 暂存答题记录
 * @param {object} data - 暂存的答题数据
 * @param {number} data.id - 答题记录ID，继续答题时传入，重新答题则不传
 * @param {number} data.examId - 考试ID (必填)
 * @param {Array<object>} data.examSubmitRecordList - 提交记录列表 (必填)
 * @param {number} data.examSubmitRecordList[].questionId - 题目ID (必填)
 * @param {string} data.examSubmitRecordList[].userAnswer - 用户答案 (必填)
 * @param {string} data.examSubmitRecordList[].details - 试卷给的选项，原封不动返回 (必填)
 * @param {string} data.examSubmitRecordList[].fileName - 文件名 (必填)
 * @param {string} data.examSubmitRecordList[].filePath - 文件路径 (必填)
 */
export function submitStudentExamRecord(data) {
  return request({
    url: '/student/exam/submitRecord',
    method: 'post',
    data: data
  });
}

/**
 * @description [学生端] 保存已答题时长
 * @param {object} data - 时长数据
 * @param {number} data.type - 类型：0-考试，1-靶场 (必填)
 * @param {number} data.recordId - 答题记录ID (必填)
 * @param {number} data.useTime - 已使用的时间（秒） (必填)
 */
export function saveRecordUseTime(data) {
  return request({
    url: '/student/exam/saveRecordUseTime',
    method: 'post',
    data: data
  });
}

/**
 * @description [学生端] 获取已答题时长
 * @param {object} data - 查询参数
 * @param {number} data.type - 类型：0-考试，1-靶场 (必填)
 * @param {number} data.recordId - 答题记录ID (必填)
 */
export function getRecordUseTime(data) {
  return request({
    url: '/student/exam/getRecordUseTime',
    method: 'post',
    data: data
  });
}