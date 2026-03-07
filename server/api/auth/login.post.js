import db from '../../utils/db.js'
import { generateToken } from '../../utils/jwt.js'
import bcrypt from 'bcryptjs'
import { sendLoginNotification } from '../../utils/notification.js'

export default defineEventHandler(async (event) => {
  try {
    const appDoc = await db.settings.findOne({ key: 'appSettings' })
    const emailVerificationRequired = !!appDoc?.value?.registrationEmailVerification

    const body = await readBody(event)
    const { username, password } = body

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        message: '用户名和密码不能为空'
      })
    }

    const user = await db.users.findOne({ username })
    if (!user) {
      throw createError({
        statusCode: 401,
        message: '用户名或密码错误'
      })
    }

    if (user.disabled === true) {
      throw createError({
        statusCode: 403,
        message: '账号已被禁用，请联系管理员'
      })
    }

    if (emailVerificationRequired && user.email && user.emailVerified !== true) {
      throw createError({
        statusCode: 403,
        message: '请先完成邮箱验证，查收邮件中的验证链接'
      })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: '用户名或密码错误'
      })
    }

    const role = user.role || 'user'

    // 生成 Token
    const token = await generateToken({
      userId: user._id,
      username: user.username,
      role
    })

    // 发送登录通知（异步，不阻塞响应）
    const clientIP = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'
    sendLoginNotification(user.username, clientIP, userAgent).catch(err => {
      console.error('[Login] 发送登录通知失败:', err)
    })

    return {
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role
        }
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: '登录失败: ' + error.message
    })
  }
})
