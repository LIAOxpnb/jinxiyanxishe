import axios from 'axios';
import { ElMessage } from 'element-plus'; // 推荐引入 ElMessage 用于统一错误提示
// import router from '@/router'; // 如果需要处理token过期跳转，请取消此行注释

const service = axios.create({
  // 建议使用环境变量来管理 baseURL
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 30000,
});

// --- 请求拦截器 (核心修改点) ---
service.interceptors.request.use(
  (config) => {
    // *** 修改点 1: 从 localStorage 读取 Token ***
    // 确保与您 Login.vue 文件中的存储方式一致
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers = config.headers || {};
      // 请与后端确认请求头Key是否为 'Authorization' 以及格式是否为 'Bearer ' + token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error); // for debug
    return Promise.reject(error);
  }
);

// --- 响应拦截器 (推荐优化的版本) ---
service.interceptors.response.use(
  (response) => {
    const res = response.data;

    // *** 修改点 2: 增加对后端业务错误(code !== 200)的统一处理 ***
    if (res.code !== 200) {
      ElMessage({
        message: res.msg || 'Error',
        type: 'error',
        duration: 5 * 1000
      });

      // 示例：在这里可以统一处理 Token 过期等情况，例如跳转登录页
      // if (res.code === 401) {
      //   // 清除本地token，然后跳转到登录页
      //   localStorage.removeItem('token');
      //   router.push('/login');
      // }
      
      return Promise.reject(new Error(res.msg || 'Error'));
    } else {
      // 如果成功，直接返回后端返回的完整数据
      // (您之前的代码是只返回 response.data，我这里改为返回 res，因为 res 就是 response.data)
      return res;
    }
  },
  (error) => {
    console.error('Response Error:', error); // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;