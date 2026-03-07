import db from '../../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../../utils/authMiddleware.js'

/**
 * 还原回收站中的图片（仅管理员）
 */
export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少图片 ID' })
  }

  const image = await db.images.findOne({ _id: id })
  if (!image) {
    throw createError({ statusCode: 404, message: '图片不存在' })
  }

  if (!image.isDeleted) {
    return {
      success: true,
      message: '图片未在回收站中，无需还原'
    }
  }

  await db.images.update(
    { _id: id },
    {
      $set: {
        isDeleted: false,
        updatedAt: new Date().toISOString()
      },
      $unset: {
        deletedAt: '',
        deletedBy: ''
      }
    }
  )

  return {
    success: true,
    message: '已还原'
  }
})
