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
        message: '缺少图片 ID'
      })
    }

    const image = await db.images.findOne({ _id: id })
    if (!image) {
      throw createError({
        statusCode: 404,
        message: '图片不存在'
      })
    }

    const isOwner = image.userId === user.userId
    const isAdmin = user.role === 'admin'
    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: '无权删除该图片'
      })
    }

    // 软删除
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

    return {
      success: true,
      message: '删除成功'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Images] 删除图片失败:', error)
    throw createError({
      statusCode: 500,
      message: '删除图片失败'
    })
  }
})
