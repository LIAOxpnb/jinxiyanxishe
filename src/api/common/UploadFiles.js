import request from '@/utils/request';

/**
 * @description 批量上传文件
 * @param {FileList | File[]} files - 文件列表或文件数组
 * @param {Function} onProgress - 一个用于报告上传进度的回调函数
 */
export function uploadFiles(files, onProgress) { // [修改] 增加 onProgress 参数
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  return request({
    url: '/minio/file/uploadFiles',
    method: 'post',
    data: formData,
    timeout: 0, 
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    // [新增] 将 onProgress 回调函数传递给 axios
    onUploadProgress: onProgress 
  });
}