import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { getEmailConfig } from '../../utils/notification.js'

export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  requireAdmin(event)

  try {
    const config = await getEmailConfig()
    return {
      success: true,
      data: {
        registrationEmailVerification: !!config.registrationEmailVerification,
        service: config.service || '',
        user: config.user || '',
        pass: '', // 不返回密码
        hasPassword: !!(config.pass && config.pass.length > 0),
        to: config.to || ''
      }
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Settings] 获取邮箱配置失败:', error)
    throw createError({ statusCode: 500, message: '获取邮箱配置失败' })
  }
})
