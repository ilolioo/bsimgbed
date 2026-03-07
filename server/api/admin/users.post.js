import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    const body = await readBody(event)
    const { username, password } = body || {}

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

    const existing = await db.users.findOne({ username: name })
    if (existing) {
      throw createError({
        statusCode: 400,
        message: '用户名已存在'
      })
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)
    const newUser = {
      _id: uuidv4(),
      username: name,
      password: hashedPassword,
      passwordChanged: false,
      role: 'user',
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
