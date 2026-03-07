import db from '../../utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const token = getQuery(event).token
    if (!token || !String(token).trim()) {
      throw createError({
        statusCode: 400,
        message: '缺少验证链接或链接已失效'
      })
    }

    const user = await db.users.findOne({
      emailVerificationToken: String(token).trim()
    })
    if (!user) {
      throw createError({
        statusCode: 400,
        message: '验证链接无效或已失效'
      })
    }

    const expiresAt = user.emailVerificationExpiresAt
    if (expiresAt && new Date(expiresAt) < new Date()) {
      throw createError({
        statusCode: 400,
        message: '验证链接已过期，请重新注册或联系管理员'
      })
    }

    await db.users.update(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date().toISOString()
        },
        $unset: {
          emailVerificationToken: '',
          emailVerificationExpiresAt: ''
        }
      }
    )

    return {
      success: true,
      message: '邮箱验证成功，请登录'
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Auth] 邮箱验证失败:', error)
    throw createError({
      statusCode: 500,
      message: '验证失败'
    })
  }
})
