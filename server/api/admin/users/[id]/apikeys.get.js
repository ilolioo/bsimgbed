import db from '../../../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../../../utils/authMiddleware.js'

/**
 * 管理员获取指定用户的 ApiKey 列表
 */
export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少用户 ID' })
  }

  const user = await db.users.findOne({ _id: id })
  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  const apiKeys = await db.apikeys.find({ userId: id })
  apiKeys.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const safeKeys = apiKeys.map(key => ({
    id: key._id,
    key: key.key,
    name: key.name,
    isDefault: key.isDefault || false,
    enabled: key.enabled !== false,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt
  }))

  return {
    success: true,
    data: safeKeys
  }
})
