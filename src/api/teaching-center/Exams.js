import request from '../../utils/request';

/**
 * @description 获取考试列表
 * @param {object} data - 查询参数
 * @param {number} data.page - 页码 (必填)
 * @param {number} data.size - 每页数量 (必填)
 * @param {string} data.examCategory - 考试分类 (必填)
 * @param {string} data.name - 考试名称 (必填)
 * @param {number} data.status - 发布状态 (0未发布, 1已发布) (必填)
 * @param {boolean} data.isMe -我的考试, 默认true (必填)
 */
export function getExamList(data) {
  return request({
    url: '/teacher/exam/list',
    method: 'post',
    data: data
  });
}

/**
 * @description 添加考试 (创建考试第一步)
 * @param {object} data - 考试基本信息
 * @param {string} data.name - 考试名称 (必填)
 * @param {string} data.examCategory - 考试分类 (必填)
 */
export function addExam(data) {
  return request({
    url: '/teacher/exam/save',
    method: 'post',
    data: data
  });
}

/**
 * @description 修改/更新考试设置
 * @param {object} data - 完整的考试设置信息
 * @param {number} data.id - 考试ID (必填)
 * @param {string} data.name - 考试名称 (必填)
 * @param {string} data.examCategory - 考试分类 (必填)
 * @param {number} data.examDate - 考试时间 (0不限制, 1指定时间) (必填)
 * @param {string} [data.startTime] - 开始时间 (可选)
 * @param {string} [data.endTime] - 结束时间 (可选)
 * @param {number} data.duration - 考试时长(分钟, -1不限制) (必填)
 * @param {number} data.attempts - 考试次数(-1不限制) (必填)
 * @param {number} data.scope - 考试范围(0未指定, 1指定人员, 2指定班级) (必填)
 * @param {number} data.disorder - 乱序(0否, 1是) (必填)
 * @param {number} data.viewPaper - 查看试卷(0否, 1是) (必填)
 * @param {number} data.disableCopy - 禁止复制(0否, 1是) (必填)
 * @param {number} data.qualified - 合格分 (必填)
 * @param {Array<object>} data.clazzUserBindList - 考试用户、班级绑定关系 (必填)
 */
export function updateExam(data) {
  return request({
    url: '/teacher/exam/update',
    method: 'post',
    data: data
  });
}

/**
 * @description 删除考试
 * @param {string} id - 考试的ID
 */
export function deleteExam(id) {
  return request({
    url: '/teacher/exam/delete',
    method: 'get',
    params: { id }
  });
}

/**
 * @description 获取单个考试的详细信息 (包含试题列表)
 * @param {string} id - 考试的ID
 */
export function getExamDetail(id) {
  return request({
    url: '/teacher/exam/detail',
    method: 'get',
    params: { id }
  });
}

/**
 * @description 修改考试发布状态
 * @param {object} params - 参数对象
 * @param {number} params.id - 考试ID
 * @param {number} params.status - 新的状态 (1发布, 0取消发布)
 */
export function updateExamStatus(params) {
  return request({
    url: '/teacher/exam/release',
    method: 'get',
    params: params
  });
}

/**
 * @description 设置考试的题目列表及分数
 * @param {object} data - 数据
 * @param {number} data.id - 考试ID (必填)
 * @param {Array<object>} data.examQuestionList - 题目列表 (必填)
 * @param {number} [data.examQuestionList[].questionId] - 题目ID
 * @param {number} [data.examQuestionList[].sort] - 排序
 * @param {number} [data.examQuestionList[].score] - 分数
 */
export function setExamQuestions(data) {
  return request({
    url: '/teacher/exam/setQuestionList',
    method: 'post',
    data: data
  });
}

/**
 * @description 设置考试的及格线
 * @param {object} data - 数据
 * @param {number} data.id - 考试ID (必填)
 * @param {number} data.qualified - 及格分数 (必填)
 */
export function setPassingScore(data) {
  return request({
    url: '/teacher/exam/setQualified',
    method: 'post',
    data: data
  });
}

/**
 * @description 获取需要阅卷的考试列表
 * @param {object} data - 查询参数
 * @param {number} data.page - 页码 (必填)
 * @param {number} data.size - 每页数量 (必填)
 * @param {number} data.qualified - 是否合格 (0否, 1是) (必填)
 * @param {number} data.status - 状态 (2系统修改已完成等待人工修改, 4完成) (必填)
 */
export function getMarkingList(data) {
  return request({
    url: '/teacher/exam/gradePaperList',
    method: 'post',
    data: data
  });
}

/**
 * @description [新增] 获取单个待阅卷的详情 (单个学生的答卷)
 * @param {string} id - 学生提交记录的ID
 */
export function getGradePaperDetail(id) {
  return request({
    url: '/teacher/exam/gradePaperDetail', //
    method: 'get', //
    params: { id } //
  });
}

/**
 * @description [新增] 提交批阅后的分数
 * @param {Array<object>} data - 包含题目ID和分数的数组
 * @param {number} data[].id - 考生答案记录的ID (examSubmitRecordList中的id)
 * @param {number} data[].score - 批改后的分数
 */
export function submitGradePaper(data) {
  return request({
    url: '/teacher/exam/gradePaper', //
    method: 'post', //
    data: data //
  });
}

/**
 * @description 获取用户(教师)列表
 * @param {object} params - 查询参数
 */
export function getUserList(params) {
  return request.post('/admin/user/list', params);
}