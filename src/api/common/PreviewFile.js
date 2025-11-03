import request from '@/utils/request'; // 确保路径正确
import { ElMessage } from 'element-plus';

/**
 * @description [新增] 预览文件
 * @param {string} fileName - 后端返回的文件相对路径
 * @returns {Promise<string>} 返回一个临时的、可直接访问的文件URL
 */
export async function previewFile(fileName) {
  // 增加空值检查
  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    console.warn('previewFile: fileName is empty or invalid');
    throw new Error('文件名为空或无效');
  }

  try {
    const response = await request({
      url: '/minio/file/preview', //
      method: 'get', //
      params: {
        fileName: fileName.trim() //
      }
    });
    if (response.code === 200 && typeof response.data === 'string') {
      return response.data; // 直接返回后端生成的完整URL
    } else {
      // 如果后端没有返回有效的URL字符串，则抛出错误
      const errorMsg = response.msg || response.message || '获取预览地址失败';
      console.warn(`previewFile failed: ${errorMsg}`, { fileName, response });
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('获取预览地址失败:', error);
    // 将错误继续向上抛出，以便调用方可以处理
    throw error;
  }
}
