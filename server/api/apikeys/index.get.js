import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    const user = event.context.user

    // 仅返回当前用户自己的 ApiKey（包括管理员）
    const apiKeys = await db.apikeys.find({ userId: user.userId })

    apiKeys.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    // 返回 ApiKey 列表
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
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[ApiKeys] 获取 ApiKey 列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取 ApiKey 列表失败'
    })
  }
})
