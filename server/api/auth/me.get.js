import { authMiddleware } from '../../utils/authMiddleware.js'
import db from '../../utils/db.js'

/**
 * 获取当前登录用户的基本信息（用于「我的」弹层）
 */
export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  const { userId } = event.context.user

  const user = await db.users.findOne({ _id: userId })
  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  return {
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email || '',
      emailVerified: user.emailVerified === true,
      role: user.role || 'user'
    }
  }
})
