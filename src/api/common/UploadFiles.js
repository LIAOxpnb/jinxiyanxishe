import request from '@/utils/request'; // 确保路径正确

/**
 * @description 批量上传文件
 * @param {FileList | File[]} files - 从 <input type="file"> 获取的文件列表或文件数组
 */
export function uploadFiles(files) {
  // 1. 创建一个 FormData 对象
  const formData = new FormData();

  // 2. 将文件逐个附加到 FormData 中
  // [重要] 'files' 这个键名必须与后端接口定义的参数名一致
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]); //
  }

  // 3. 发送请求
  return request({
    url: '/minio/file/uploadFiles', //
    method: 'post', //
    data: formData,
    // [重要] 上传文件时，必须设置正确的请求头
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}