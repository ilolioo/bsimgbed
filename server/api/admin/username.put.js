import db from '../../utils/db.js'
import { verifyToken, extractToken, generateToken } from '../../utils/jwt.js'

export default defineEventHandler(async (event) => {
  try {
    // 验证登录
    const token = extractToken(event)
    if (!token) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      })
    }

    const user = await verifyToken(token)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Token 无效或已过期'
      })
    }

    // 获取请求体
    const body = await readBody(event)
    const { username } = body

    const name = username != null ? String(username).trim() : ''
    if (!name) {
      throw createError({
        statusCode: 400,
        message: '请输入新用户名'
      })
    }

    if (name.length < 4) {
      throw createError({
        statusCode: 400,
        message: '用户名至少 4 位'
      })
    }
    if (/^\d+$/.test(name)) {
      throw createError({
        statusCode: 400,
        message: '用户名不能为纯数字'
      })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw createError({
        statusCode: 400,
        message: '用户名仅支持英文、数字、下划线'
      })
    }

    if (name !== user.username) {
      const existingUser = await db.users.findOne({ username: name })
      if (existingUser) {
        throw createError({
          statusCode: 400,
          message: '用户名已存在'
        })
      }
    }

    await db.users.update(
      { _id: user.userId },
      {
        $set: {
          username: name,
          updatedAt: new Date().toISOString()
        }
      }
    )

    const newToken = await generateToken({
      userId: user.userId,
      username: name
    })

    return {
      success: true,
      message: '用户名修改成功',
      data: {
        token: newToken,
        username: name
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Admin] 修改用户名失败:', error)
    throw createError({
      statusCode: 500,
      message: '修改用户名失败'
    })
  }
})
