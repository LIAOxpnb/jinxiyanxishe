import request from '@/utils/request';

/**
 * @description 获取加密视频流
 * @param {string} fileName - 视频文件名 (必填)
 * @returns {Promise} 返回视频流 URL
 */
export function getVideoStream(fileName) {
  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    console.warn('getVideoStream: fileName is empty or invalid');
    return Promise.reject(new Error('文件名不能为空'));
  }

  return request.get('/minio/file/stream', {
    params: {
      fileName: fileName.trim()
    }
  });
}

/**
 * @description 获取加密视频流 URL（用于直接在 video 标签中使用）
 * @param {string} fileName - 视频文件名 (必填)
 * @returns {string} 返回视频流 URL
 */
export function getVideoStreamUrl(fileName) {
  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    console.warn('getVideoStreamUrl: fileName is empty or invalid');
    return '';
  }

  // 构建请求 URL，通常用于 video 标签的 src 属性
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const token = sessionStorage.getItem('token') || '';
  // 尝试使用 token 参数传递认证信息
  // 注意：后端需要支持从 query parameter 中读取 token
  // 如果后端只支持 Header 认证，则此方法无效，需要改为 Blob 方式播放
  const url = `${baseURL}/minio/file/stream?fileName=${encodeURIComponent(fileName.trim())}&token=${encodeURIComponent(token)}`;
  console.log('Generated Video Stream URL:', url);
  return url;
}

/**
 * @description 获取加密视频预览流
 * @param {string} fileName - 视频文件名 (必填)
 * @returns {Promise} 返回视频预览流 URL
 */
export function getVideoPreview(fileName) {
  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    console.warn('getVideoPreview: fileName is empty or invalid');
    return Promise.reject(new Error('文件名不能为空'));
  }

  return request.get('/minio/file/preview', {
    params: {
      fileName: fileName.trim()
    }
  });
}
