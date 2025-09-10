import request from '../utils/request';

// 考试相关接口
export function fetchExams(params) {
  // params: { page, pageSize, filters... }
  return request.get('/exams', { params });
}

export function fetchExamById(id) {
  return request.get(`/exams/${id}`);
}

export function createExam(data) {
  return request.post('/exams', data);
}

export function updateExam(id, data) {
  return request.put(`/exams/${id}`, data);
}

export function deleteExam(id) {
  return request.delete(`/exams/${id}`);
}
