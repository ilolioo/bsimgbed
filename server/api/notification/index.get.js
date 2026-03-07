import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { getNotificationConfig } from '../../utils/notification.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    // 获取通知配置
    const config = await getNotificationConfig()

    return {
      success: true,
      data: config
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Notification] 获取通知配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取通知配置失败'
    })
  }
})