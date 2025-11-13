/**
 * 富文本处理工具函数
 */

/**
 * 去除富文本编辑器自动添加的外层 <p> 标签
 * 适用于 wangEditor 等富文本编辑器
 * @param {string} htmlContent - 富文本HTML内容
 * @returns {string} 处理后的内容
 */
export function removeOuterPTag(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent || '';
  }
  
  const trimmed = htmlContent.trim();
  
  // 如果内容只是被单个 <p> 标签包裹（没有嵌套的 <p> 标签），去除该标签
  if (trimmed.startsWith('<p>') && trimmed.endsWith('</p>')) {
    // 检查是否只有一个 <p> 标签（不包含嵌套的 <p>）
    const innerContent = trimmed.slice(3, -4);
    if (innerContent.indexOf('<p>') === -1) {
      return innerContent;
    }
  }
  
  return htmlContent;
}

/**
 * 批量去除多个字段的外层 <p> 标签
 * @param {Object} obj - 包含多个富文本字段的对象
 * @param {Array<string>} fields - 需要处理的字段名数组
 * @returns {Object} 处理后的对象（不修改原对象）
 */
export function removeOuterPTagsFromFields(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = { ...obj };
  fields.forEach(field => {
    if (result[field]) {
      result[field] = removeOuterPTag(result[field]);
    }
  });
  
  return result;
}

/**
 * 清理富文本内容，去除空的 <p> 标签和多余的空白
 * @param {string} htmlContent - 富文本HTML内容
 * @returns {string} 清理后的内容
 */
export function cleanRichText(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }
  
  let cleaned = htmlContent;
  
  // 去除空的 <p> 标签
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  
  // 去除空的 <p><br></p> 标签
  cleaned = cleaned.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
  
  // 去除开头和结尾的空白
  cleaned = cleaned.trim();
  
  // 如果清理后为空或只剩下空标签，返回空字符串
  if (!cleaned || cleaned === '<p></p>' || cleaned === '<p><br></p>') {
    return '';
  }
  
  return cleaned;
}
