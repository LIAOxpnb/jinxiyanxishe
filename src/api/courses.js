import request from '../utils/request';

// 课程相关接口
export function fetchCourses(params) {
  // params: { page, pageSize, filters... }
  return request.get('/courses', { params });
}

export function fetchCourseById(id) {
  return request.get(`/courses/${id}`);
}

export function createCourse(data) {
  return request.post('/courses', data);
}

export function updateCourse(id, data) {
  return request.put(`/courses/${id}`, data);
}

export function deleteCourse(id) {
  return request.delete(`/courses/${id}`);
}
