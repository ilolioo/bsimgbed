import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    const { userId } = event.context.user || {}

    // 获取私有 API 配置
    const config = await db.settings.findOne({ key: 'privateApiConfig' })
    const defaultMaxFileSize = config?.value?.maxFileSize || 100 * 1024 * 1024

    const data = config?.value
      ? { ...config.value }
      : {
          maxFileSize: defaultMaxFileSize,
          enableCompression: false,
          compressionQuality: 80,
          convertToWebp: false,
          convertToPng: false
        }

    // 登录用户：若在用户管理中单独配置了可上传文件大小，则覆盖为该项限制（首页上传区使用）
    if (userId) {
      const user = await db.users.findOne({ _id: userId })
      if (user?.maxFileSize != null && user.maxFileSize > 0) {
        data.maxFileSize = user.maxFileSize
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Config] 获取私有 API 配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取配置失败'
    })
  }
})
