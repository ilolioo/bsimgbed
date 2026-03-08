import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { saveEmailConfig } from '../../utils/notification.js'

export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  requireAdmin(event)

  try {
    const body = await readBody(event) || {}
    const config = {
      registrationEmailVerification: body.registrationEmailVerification !== undefined ? !!body.registrationEmailVerification : undefined,
      service: body.service,
      user: body.user,
      pass: body.pass,
      to: body.to,
      subjectPrefix: body.subjectPrefix,
      verificationSubject: body.verificationSubject,
      verificationBody: body.verificationBody,
      testSubject: body.testSubject,
      testBody: body.testBody,
      notificationSubjectTemplate: body.notificationSubjectTemplate,
      notificationBodyTemplate: body.notificationBodyTemplate
    }
    const result = await saveEmailConfig(config)
    if (!result.success) {
      throw createError({ statusCode: 500, message: result.error || '保存失败' })
    }
    return { success: true, message: '邮箱设置已保存' }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Settings] 保存邮箱配置失败:', error)
    throw createError({ statusCode: 500, message: '保存邮箱配置失败' })
  }
})
