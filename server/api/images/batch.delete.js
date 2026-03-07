import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    const user = event.context.user

    const body = await readBody(event)
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw createError({
        statusCode: 400,
        message: '请选择要删除的图片'
      })
    }

    // 普通用户可删除自己上传的图片，管理员可删除任意图片
    const isAdmin = user.role === 'admin'
    let deletedCount = 0
    for (const id of ids) {
      const image = await db.images.findOne({ _id: id })
      if (!image || image.isDeleted) continue
      const isOwner = image.userId && image.userId === user.userId
      if (!isOwner && !isAdmin) continue
      await db.images.update(
        { _id: id },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: user.username
          }
        }
      )
      deletedCount++
    }

    return {
      success: true,
      message: `成功删除 ${deletedCount} 张图片`,
      data: {
        deletedCount
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Images] 批量删除图片失败:', error)
    throw createError({
      statusCode: 500,
      message: '批量删除图片失败'
    })
  }
})
