/**
 * 全局配置缓存
 * 用于避免重复调用全局设置接口
 */

let globalConfigCache = null
let globalConfigPromise = null

/**
 * 获取全局配置（带缓存）
 * @returns {Promise<Object>} 全局配置对象
 */
export async function getGlobalConfig() {
  // 如果已有缓存，直接返回
  if (globalConfigCache) {
    return globalConfigCache
  }

  // 如果正在请求中，返回同一个 Promise（避免并发请求）
  if (globalConfigPromise) {
    return globalConfigPromise
  }

  // 动态导入以避免循环依赖
  const { getGlobalSettings } = await import('@/api/system-management/Global-Settings')
  const { previewFile } = await import('@/api/common/PreviewFile')

  globalConfigPromise = (async () => {
    try {
      const res = await getGlobalSettings()
      if (res.code === 200 && res.data) {
        // 预处理图标URL
        if (res.data.icon) {
          try {
            res.data.iconUrl = await previewFile(res.data.icon)
          } catch (e) {
            console.error('预览图标失败:', e)
            res.data.iconUrl = ''
          }
        } else {
          res.data.iconUrl = ''
        }

        globalConfigCache = res.data
        return res.data
      }
      return null
    } catch (error) {
      console.error('获取全局配置失败:', error)
      return null
    } finally {
      globalConfigPromise = null
    }
  })()

  return globalConfigPromise
}

/**
 * 清除全局配置缓存
 */
export function clearGlobalConfig() {
  globalConfigCache = null
  globalConfigPromise = null
}

/**
 * 获取缓存的全局配置（同步，如果没有缓存则返回 null）
 */
export function getGlobalConfigSync() {
  return globalConfigCache
}
