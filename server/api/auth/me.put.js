import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getEmailConfig, sendVerificationEmail } from '../../utils/notification.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 当前用户更新自己的基本信息：邮箱、密码。
 * 用户名不可通过此接口修改。
 * 若已开启邮箱验证且更改了邮箱，则发送验证邮件，新邮箱需验证后生效。
 */
export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  const { userId } = event.context.user

  const user = await db.users.findOne({ _id: userId })
  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  const body = await readBody(event) || {}
  const emailStr = body.email !== undefined ? String(body.email).trim().toLowerCase() : null
  const newPassword = body.newPassword !== undefined ? String(body.newPassword) : ''

  const updates = { updatedAt: new Date().toISOString() }
  let needVerify = false

  const unsetFields = {}

  if (emailStr !== null) {
    if (emailStr === '') {
      updates.email = ''
      updates.emailVerified = true
      unsetFields.emailVerificationToken = ''
      unsetFields.emailVerificationExpiresAt = ''
    } else {
      if (!EMAIL_REGEX.test(emailStr)) {
        throw createError({ statusCode: 400, message: '邮箱格式不正确' })
      }
      const existingByEmail = await db.users.findOne({ email: emailStr })
      if (existingByEmail && existingByEmail._id !== userId) {
        throw createError({ statusCode: 400, message: '该邮箱已被其他用户使用' })
      }
      const emailConfig = await getEmailConfig()
      const emailVerificationEnabled = !!emailConfig.registrationEmailVerification

      if (emailStr !== (user.email || '')) {
        updates.email = emailStr
        if (emailVerificationEnabled) {
          updates.emailVerified = false
          updates.emailVerificationToken = crypto.randomBytes(32).toString('hex')
          updates.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          needVerify = true

          const appDoc = await db.settings.findOne({ key: 'appSettings' })
          const appSettings = appDoc?.value || {}
          let baseUrl = appSettings.siteUrl || ''
          if (!baseUrl) {
            const protocol = getHeader(event, 'x-forwarded-proto') || 'http'
            const host = getHeader(event, 'host') || 'localhost'
            baseUrl = `${protocol}://${host}`
          }
          baseUrl = baseUrl.replace(/\/+$/, '')
          const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(updates.emailVerificationToken)}`
          try {
            await sendVerificationEmail(emailStr, user.username, verifyUrl)
          } catch (err) {
            console.error('[Auth] 发送验证邮件失败:', err)
            throw createError({ statusCode: 500, message: '发送验证邮件失败，请稍后重试' })
          }
        } else {
          updates.emailVerified = true
        }
      }
    }
  }

  if (newPassword !== '') {
    if (newPassword.length < 6) {
      throw createError({ statusCode: 400, message: '新密码至少 6 位' })
    }
    if (/^\d+$/.test(newPassword)) {
      throw createError({ statusCode: 400, message: '密码不能为纯数字' })
    }
    updates.password = await bcrypt.hash(newPassword, 10)
    updates.passwordChanged = true
  }

  if (Object.keys(updates).length <= 1 && Object.keys(unsetFields).length === 0) {
    const current = await db.users.findOne({ _id: userId })
    return {
      success: true,
      message: '无变更',
      data: {
        id: current._id,
        username: current.username,
        email: current.email || '',
        emailVerified: current.emailVerified === true,
        role: current.role || 'user'
      },
      needVerify: false
    }
  }

  const updateOp = { $set: updates }
  if (Object.keys(unsetFields).length) updateOp.$unset = unsetFields
  await db.users.update(
    { _id: userId },
    updateOp
  )

  const updated = await db.users.findOne({ _id: userId })
  return {
    success: true,
    message: needVerify ? '已保存，请查收新邮箱的验证邮件完成验证' : '已保存',
    data: {
      id: updated._id,
      username: updated.username,
      email: updated.email || '',
      emailVerified: updated.emailVerified === true,
      role: updated.role || 'user'
    },
    needVerify
  }
})
