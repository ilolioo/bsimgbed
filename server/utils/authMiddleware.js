import db from '../utils/db.js'
import { verifyToken, extractToken } from '../utils/jwt.js'

// 确保 context.user 包含 role（兼容旧 token 无 role 时从数据库补全）
async function ensureUserWithRole(decoded) {
  if (decoded.role) return decoded
  const dbUser = await db.users.findOne({ _id: decoded.userId })
  return dbUser
    ? { ...decoded, role: dbUser.role || 'user' }
    : decoded
}

// 认证中间件 - 验证用户是否登录
export async function authMiddleware(event) {
  const token = extractToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未登录，请先登录'
    })
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    throw createError({
      statusCode: 401,
      message: 'Token 无效或已过期'
    })
  }

  const user = await ensureUserWithRole(decoded)
  event.context.user = user
  return user
}

// 可选认证中间件 - 不强制要求登录，但如果有 token 则验证
export async function optionalAuthMiddleware(event) {
  const token = extractToken(event)

  if (!token) {
    event.context.user = null
    return null
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    event.context.user = null
    return null
  }
  const user = await ensureUserWithRole(decoded)
  event.context.user = user
  return user
}

// 要求当前用户为管理员，否则抛出 403
export function requireAdmin(event) {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限'
    })
  }
}

// 包装为 eventHandler 的认证中间件
export const authHandler = defineEventHandler(async (event) => {
  return authMiddleware(event)
})

// 包装为 eventHandler 的可选认证中间件
export const optionalAuthHandler = defineEventHandler(async (event) => {
  return optionalAuthMiddleware(event)
})

export default authMiddleware
