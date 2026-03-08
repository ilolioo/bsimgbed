import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    const users = await db.users.find({})
    const list = users.map(u => ({
      id: u._id,
      username: u.username,
      email: u.email || '',
      role: u.role || 'user',
      disabled: u.disabled === true,
      maxFileSize: u.maxFileSize != null ? u.maxFileSize : null,
      createdAt: u.createdAt
    }))

    return {
      success: true,
      data: list
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Admin] 获取用户列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取用户列表失败'
    })
  }
})
