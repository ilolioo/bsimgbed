import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    const user = event.context.user

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

    if (user.role !== 'admin' && apiKey.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        message: '无权操作此 ApiKey'
      })
    }

    const userId = apiKey.userId
    // 若删除的是该用户的默认 Key，且该用户还有其他 Key，则将其中一把设为默认
    if (apiKey.isDefault) {
      const others = await db.apikeys.find({ userId, _id: { $ne: id } })
      if (others.length > 0) {
        const nextDefault = others.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0]
        await db.apikeys.update(
          { _id: nextDefault._id },
          { $set: { isDefault: true, updatedAt: new Date().toISOString() } }
        )
      }
    }

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
