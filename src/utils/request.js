import axios from 'axios';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截：自动带上 token（如有）
service.interceptors.request.use(
  (config) => {
    try {
      // 仅从 sessionStorage 读取 token（会话级存储，浏览器关闭后失效）
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore storage errors in some environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截：规范返回或抛出统一错误
service.interceptors.response.use(
  (response) => {
    // 如果后端直接返回数据对象，优先返回 response.data
    return response && Object.prototype.hasOwnProperty.call(response, 'data')
      ? response.data
      : response;
  },
  (error) => {
    if (error && error.response) {
      const { status, data } = error.response;
      const message = (data && data.message) || error.message || '请求错误';
      const err = new Error(message);
      err.status = status;
      err.data = data;
      return Promise.reject(err);
    }
    return Promise.reject(error);
  }
);

export default service;
