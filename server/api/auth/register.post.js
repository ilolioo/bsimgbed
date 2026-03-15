import db from '../../utils/db.js'
import { generateToken } from '../../utils/jwt.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getEmailConfig, sendVerificationEmail } from '../../utils/notification.js'

const USERNAME_MIN_LEN = 4
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LEN = 6

/**
 * 注册接口：初始化时创建首个管理员，否则创建普通用户。
 * 支持开启邮箱验证时发验证邮件，未验证前不可登录。
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}
    const username = body.username != null ? String(body.username).trim() : ''
    const email = body.email != null ? String(body.email).trim().toLowerCase() : ''
    const password = body.password != null ? String(body.password) : ''

    if (!username) {
      throw createError({ statusCode: 400, message: '请输入用户名' })
    }
    if (username.length < USERNAME_MIN_LEN) {
      throw createError({ statusCode: 400, message: '用户名至少 4 位' })
    }
    if (/^\d+$/.test(username)) {
      throw createError({ statusCode: 400, message: '用户名不能为纯数字' })
    }
    if (!USERNAME_REGEX.test(username)) {
      throw createError({ statusCode: 400, message: '用户名仅支持英文、数字、下划线' })
    }

    if (!email) {
      throw createError({ statusCode: 400, message: '请输入邮箱' })
    }
    if (!EMAIL_REGEX.test(email)) {
      throw createError({ statusCode: 400, message: '邮箱格式不正确' })
    }

    if (!password || password.length < PASSWORD_MIN_LEN) {
      throw createError({ statusCode: 400, message: '密码至少 6 位' })
    }
    if (/^\d+$/.test(password)) {
      throw createError({ statusCode: 400, message: '密码不能为纯数字' })
    }

    const existingUsername = await db.users.findOne({ username })
    if (existingUsername) {
      throw createError({ statusCode: 400, message: '用户名已存在' })
    }
    const existingEmail = await db.users.findOne({ email })
    if (existingEmail) {
      throw createError({ statusCode: 400, message: '该邮箱已被注册' })
    }

    const adminCount = await db.users.count({ role: 'admin' })
    const role = adminCount === 0 ? 'admin' : 'user'

    const emailConfig = await getEmailConfig()
    const emailVerificationRequired = !!emailConfig.registrationEmailVerification
    if (emailVerificationRequired && (!emailConfig.service || !emailConfig.user || !emailConfig.pass)) {
      throw createError({ statusCode: 400, message: '邮箱验证已开启，但邮件服务未配置，请联系管理员' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()

    const userDoc = {
      username,
      email,
      password: hashedPassword,
      role,
      disabled: false,
      createdAt: now,
      updatedAt: now
    }

    if (emailVerificationRequired) {
      userDoc.emailVerified = false
      userDoc.emailVerificationToken = crypto.randomBytes(32).toString('hex')
      userDoc.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } else {
      userDoc.emailVerified = true
    }

    const inserted = await db.users.insert(userDoc)
    const userId = inserted._id || inserted

    if (emailVerificationRequired) {
      const appDoc = await db.settings.findOne({ key: 'appSettings' })
      const appSettings = appDoc?.value || {}
      let baseUrl = appSettings.siteUrl || ''
      if (!baseUrl) {
        const protocol = getHeader(event, 'x-forwarded-proto') || 'http'
        const host = getHeader(event, 'host') || 'localhost'
        baseUrl = `${protocol}://${host}`
      }
      baseUrl = baseUrl.replace(/\/+$/, '')
      const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(userDoc.emailVerificationToken)}`
      try {
        await sendVerificationEmail(email, username, verifyUrl)
      } catch (err) {
        console.error('[Auth] 注册验证邮件发送失败:', err)
        await db.users.remove({ _id: userId })
        throw createError({ statusCode: 500, message: '发送验证邮件失败，请稍后重试' })
      }
      return {
        success: true,
        message: '注册成功，请查收邮件完成邮箱验证',
        data: { emailVerificationRequired: true }
      }
    }

    const token = await generateToken({
      userId,
      username,
      role
    })

    return {
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: userId,
          username,
          role
        }
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    console.error('[Auth] 注册失败:', error)
    throw createError({
      statusCode: 500,
      message: '注册失败: ' + (error.message || '未知错误')
    })
  }
})
