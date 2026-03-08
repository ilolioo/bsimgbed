import db from '../../../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../../../utils/authMiddleware.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * 管理员为指定用户创建 ApiKey
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

  const body = await readBody(event) || {}
  const name = body.name ? String(body.name).trim() : (user.username || '用户')

  const apiKey = `sk-${uuidv4().replace(/-/g, '')}`
  const newKey = {
    _id: uuidv4(),
    key: apiKey,
    name,
    isDefault: false,
    enabled: true,
    userId: id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await db.apikeys.insert(newKey)

  return {
    success: true,
    message: 'ApiKey 创建成功',
    data: {
      id: newKey._id,
      key: newKey.key,
      name: newKey.name,
      isDefault: newKey.isDefault,
      enabled: newKey.enabled,
      createdAt: newKey.createdAt
    }
  }
})
