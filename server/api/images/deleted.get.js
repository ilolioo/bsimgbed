import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'

/**
 * 获取回收站图片列表（仅管理员）
 */
export default defineEventHandler(async (event) => {
  await authMiddleware(event)
  requireAdmin(event)

  try {
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = Math.min(parseInt(query.limit) || 20, 100)
    const skip = (page - 1) * limit

    const queryCondition = { isDeleted: true }
    const total = await db.images.count(queryCondition)

    let images = await db.images.find(queryCondition)
    images.sort((a, b) => new Date((b.deletedAt || b.updatedAt) || 0) - new Date((a.deletedAt || a.updatedAt) || 0))
    images = images.slice(skip, skip + limit)

    const list = images.map(img => ({
      id: img._id,
      uuid: img.uuid,
      filename: img.filename,
      originalName: img.originalName,
      format: img.format,
      size: img.size,
      width: img.width,
      height: img.height,
      url: `/api/images/preview/${img.uuid}.${img.format}`,
      uploadedBy: img.uploadedBy,
      uploadedByType: img.uploadedByType,
      uploadedAt: img.uploadedAt,
      deletedAt: img.deletedAt || null,
      deletedBy: img.deletedBy || null
    }))

    return {
      success: true,
      data: {
        images: list,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        }
      }
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Images] 获取回收站列表失败:', error)
    throw createError({ statusCode: 500, message: '获取回收站列表失败' })
  }
})
