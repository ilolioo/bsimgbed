import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)

    // 获取私有 API 配置
    const config = await db.settings.findOne({ key: 'privateApiConfig' })

    if (!config) {
      // 返回默认配置（上传是否在首页展示以上传时「上传后展示」勾选为准）
      return {
        success: true,
        data: {
          maxFileSize: 100 * 1024 * 1024,
          enableCompression: false,
          compressionQuality: 80,
          convertToWebp: false,
          convertToPng: false
        }
      }
    }

    return {
      success: true,
      data: config.value
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
