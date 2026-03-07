import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

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
        message: '密码至少 6 位'
      })
    }
    if (/^\d+$/.test(String(password))) {
      throw createError({
        statusCode: 400,
        message: '密码不能为纯数字'
      })
    }

    const name = String(username).trim()
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
    if (email != null && String(email).trim()) {
      const emailStr = String(email).trim().toLowerCase()
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        const existingEmail = await db.users.findOne({ email: emailStr })
        if (!existingEmail) {
          newUser.email = emailStr
          newUser.emailVerified = true
        }
      }
    }
    await db.users.insert(newUser)

    return {
      success: true,
      message: '用户创建成功',
      data: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Admin] 创建用户失败:', error)
    throw createError({
      statusCode: 500,
      message: '创建用户失败'
    })
  }
})
