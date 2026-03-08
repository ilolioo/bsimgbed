import { authMiddleware, requireAdmin } from '../../../utils/authMiddleware.js'
import { getEmailConfig, testEmail } from '../../../utils/notification.js'

export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  requireAdmin(event)

  const body = await readBody(event) || {}
  const saved = await getEmailConfig()
  const config = {
    service: body.service !== undefined ? body.service : saved.service,
    user: body.user !== undefined ? body.user : saved.user,
    pass: (body.pass !== undefined && body.pass !== '') ? body.pass : saved.pass,
    to: body.to !== undefined ? body.to : saved.to
  }
  if (!config.service || !config.user || !config.pass) {
    throw createError({ statusCode: 400, message: '请填写完整的邮件配置（服务商、发件人邮箱、授权码）' })
  }
  const result = await testEmail(config)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error || '测试失败' })
  }
  return { success: true, message: result.message || '测试通知发送成功' }
})
