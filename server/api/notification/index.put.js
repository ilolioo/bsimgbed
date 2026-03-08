import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { getNotificationConfig, saveNotificationConfig, NOTIFICATION_TYPES, NOTIFICATION_METHODS } from '../../utils/notification.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    const body = await readBody(event)
    const { enabled, method, types, webhook, telegram, serverchan } = body

    if (method && !Object.values(NOTIFICATION_METHODS).includes(method)) {
      throw createError({
        statusCode: 400,
        message: `不支持的通知方式: ${method}`
      })
    }

    const current = await getNotificationConfig()

    const config = {
      enabled: !!enabled,
      method: method || NOTIFICATION_METHODS.WEBHOOK,
      types: {
        [NOTIFICATION_TYPES.LOGIN]: !!types?.login,
        [NOTIFICATION_TYPES.UPLOAD]: !!types?.upload,
        [NOTIFICATION_TYPES.NSFW_DETECTED]: !!types?.nsfw,
      },
      webhook: {
        url: webhook?.url || '',
        method: webhook?.method || 'POST',
        contentType: webhook?.contentType || 'application/json',
        headers: webhook?.headers || {},
        bodyTemplate: webhook?.bodyTemplate || JSON.stringify({
          type: '{{type}}',
          title: '{{title}}',
          message: '{{message}}',
          timestamp: '{{timestamp}}',
          data: '{{data}}'
        }, null, 2)
      },
      telegram: {
        token: telegram?.token || '',
        chatId: telegram?.chatId || ''
      },
      email: { service: '', user: '', pass: '', to: '' },
      serverchan: {
        sendKey: serverchan?.sendKey || ''
      }
    }

    // 保存配置
    const result = await saveNotificationConfig(config)

    if (!result.success) {
      throw createError({
        statusCode: 500,
        message: result.error || '保存配置失败'
      })
    }

    return {
      success: true,
      message: '通知配置已保存',
      data: config
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Notification] 保存通知配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '保存通知配置失败'
    })
  }
})