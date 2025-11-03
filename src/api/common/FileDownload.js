import request from '@/utils/request'; // 确保路径正确
import { ElMessage } from 'element-plus';

/**
 * @description 通用文件下载
 * @param {string} fileName - 要下载的文件名 (必填)
 * @param {string} originalFileName - 原始文件名，用于下载时显示 (可选)
 */
export async function downloadFile(fileName, originalFileName = null) {
  try {
    const response = await request({
      url: '/minio/file/download', //
      method: 'get', //
      params: {
        fileName //
      },
      responseType: 'blob' // [重要] 必须指定响应类型为 blob
    });

    // 创建一个 Blob URL
    const blob = new Blob([response]);
    const url = window.URL.createObjectURL(blob);

    // 创建一个隐藏的 a 标签并模拟点击来触发下载
    const a = document.createElement('a');
    a.href = url;
    // 使用原始文件名（如果提供）或者服务器文件名
    a.download = originalFileName || fileName;
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('下载文件时出错:', error);
    ElMessage.error('下载失败，请检查文件是否存在或联系管理员');
    // 将错误抛出，以便调用方可以进一步处理
    throw error;
  }
}

/**
 * @description 通过响应头获取原始文件名的文件下载
 * @param {string} fileName - 要下载的文件名 (必填)
 */
export async function downloadFileWithOriginalName(fileName) {
  try {
    const response = await request({
      url: '/minio/file/download', //
      method: 'get', //
      params: {
        fileName //
      },
      responseType: 'blob' // [重要] 必须指定响应类型为 blob
    });

    // 创建一个 Blob URL
    const blob = new Blob([response.data || response]);
    const url = window.URL.createObjectURL(blob);

    // 尝试从响应头获取原始文件名
    let downloadFileName = fileName;
    const contentDisposition = response.headers?.['content-disposition'];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
        // 处理 UTF-8 编码的文件名
        if (downloadFileName.startsWith('UTF-8\'\'')) {
          downloadFileName = decodeURIComponent(downloadFileName.substring(7));
        }
      }
    }

    // 创建一个隐藏的 a 标签并模拟点击来触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('下载文件时出错:', error);
    ElMessage.error('下载失败，请检查文件是否存在或联系管理员');
    // 将错误抛出，以便调用方可以进一步处理
    throw error;
  }
}