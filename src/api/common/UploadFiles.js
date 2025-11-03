// UploadFiles.js (已修复)
import request from '@/utils/request'; // 确保您的请求封装文件路径正确

/**
 * @description 批量上传文件
 * @param {FileList | File[]} files - 文件列表或文件数组
 * @param {Function} onProgress - 一个用于报告上传进度的回调函数
 * @param {AbortSignal} signal - 【已添加】用于中止请求的信号
 */
export function uploadFiles(files, onProgress, signal) { // 【已修改】
  const formData = new FormData();
  
  for (let i = 0; i < files.length; i++) {
    // 后端接收的字段名是 'files'
    formData.append('files', files[i]);
  }

  // 【核心修正】
  // 我们将调用方式从 request(config) 修改为 request.post(url, data, config)
  // 这种方式能确保 onUploadProgress 作为配置项被正确传递
  return request.post(
    '/minio/file/uploadFiles', // 1. URL
    formData, // 2. Data
    { // 3. Config
      timeout: 0, // 0表示无超时限制，适合大文件上传
      maxContentLength: Infinity, // 取消内容长度限制
      maxBodyLength: Infinity, // 取消请求体长度限制
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress,
      signal: signal // 【已添加】将中止信号传递给 axios
    }
  );
}