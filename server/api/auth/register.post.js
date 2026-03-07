import db from '../../utils/db.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { sendVerificationEmail } from '../../utils/notification.js'

function createDefaultApiKeyForUser(userId) {
  const apiKey = `sk-${uuidv4().replace(/-/g, '')}`
  const now = new Date().toISOString()
  const newKey = {
    _id: uuidv4(),
    key: apiKey,
    name: '默认',
    isDefault: true,
    enabled: true,
    userId,
    createdAt: now,
    updatedAt: now
  }
  return db.apikeys.insert(newKey)
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  try {
    const appDoc = await db.settings.findOne({ key: 'appSettings' })
    const appSettings = appDoc?.value || {}
    const registrationEnabled = appSettings.registrationEnabled !== false
    const emailVerification = !!appSettings.registrationEmailVerification

    if (!registrationEnabled) {
      throw createError({
        statusCode: 403,
        message: '注册已关闭，请联系管理员'
      })
    }

    const body = await readBody(event)
    const { username, password, email } = body || {}

    if (!username || !String(username).trim()) {
      throw createError({
        statusCode: 400,
        message: '请输入用户名'
      })
    }

    if (!password || String(password).length < 6) {
      throw createError({
        statusCode: 400,
        message: '密码长度至少 6 位'
      })
    }

    const name = String(username).trim()
    if (name.length < 3) {
      throw createError({
        statusCode: 400,
        message: '用户名长度至少 3 位'
      })
    }

    if (emailVerification) {
      const emailStr = email ? String(email).trim().toLowerCase() : ''
      if (!emailStr) {
        throw createError({
          statusCode: 400,
          message: '请填写邮箱'
        })
      }
      if (!EMAIL_REGEX.test(emailStr)) {
        throw createError({
          statusCode: 400,
          message: '邮箱格式不正确'
        })
      }
      const existingByEmail = await db.users.findOne({ email: emailStr })
      if (existingByEmail) {
        throw createError({
          statusCode: 400,
          message: '该邮箱已被注册'
        })
      }
    }

    const existing = await db.users.findOne({ username: name })
    if (existing) {
      throw createError({
        statusCode: 400,
        message: '用户名已存在'
      })
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)
    const now = new Date().toISOString()
    const newUser = {
      _id: uuidv4(),
      username: name,
      password: hashedPassword,
      passwordChanged: false,
      role: 'user',
      disabled: false,
      createdAt: now,
      updatedAt: now
    }

    if (emailVerification) {
      const emailStr = String(email).trim().toLowerCase()
      newUser.email = emailStr
      newUser.emailVerified = false
      newUser.emailVerificationToken = crypto.randomBytes(32).toString('hex')
      newUser.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    await db.users.insert(newUser)

    try {
      await createDefaultApiKeyForUser(newUser._id)
    } catch (err) {
      console.error('[Auth] 为新用户创建默认 ApiKey 失败:', err)
    }

    if (emailVerification) {
      let baseUrl = appSettings.siteUrl || ''
      if (!baseUrl) {
        const protocol = getHeader(event, 'x-forwarded-proto') || 'http'
        const host = getHeader(event, 'host') || 'localhost'
        baseUrl = `${protocol}://${host}`
      }
      baseUrl = baseUrl.replace(/\/+$/, '')
      const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(newUser.emailVerificationToken)}`
      try {
        await sendVerificationEmail(newUser.email, newUser.username, verifyUrl)
      } catch (err) {
        console.error('[Auth] 发送验证邮件失败:', err)
        await db.users.remove({ _id: newUser._id })
        throw createError({
          statusCode: 500,
          message: err.message || '发送验证邮件失败，请稍后重试'
        })
      }
      return {
        success: true,
        message: '注册成功，请查收邮件完成邮箱验证后登录',
        data: {
          id: newUser._id,
          username: newUser.username,
          emailVerificationRequired: true
        }
      }
    }

    return {
      success: true,
      message: '注册成功，请登录',
      data: {
        id: newUser._id,
        username: newUser.username
      }
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Auth] 注册失败:', error)
    throw createError({
      statusCode: 500,
      message: error.message || '注册失败'
    })
  }
})
