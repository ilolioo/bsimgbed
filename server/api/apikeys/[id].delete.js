import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少 ApiKey ID'
      })
    }

    const apiKey = await db.apikeys.findOne({ _id: id })
    if (!apiKey) {
      throw createError({
        statusCode: 404,
        message: 'ApiKey 不存在'
      })
    }

    // 检查是否为默认 Key（不能删除）
    if (apiKey.isDefault) {
      throw createError({
        statusCode: 400,
        message: '默认 ApiKey 不能删除，只能更新'
      })
    }

    // 删除 ApiKey
    await db.apikeys.remove({ _id: id })

    return {
      success: true,
      message: 'ApiKey 删除成功'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[ApiKeys] 删除 ApiKey 失败:', error)
    throw createError({
      statusCode: 500,
      message: '删除 ApiKey 失败'
    })
  }
})
