import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { deleteImage } from '../../utils/image.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    // 获取所有已软删除的图片
    const deletedImages = await db.images.find({ isDeleted: true })

    if (deletedImages.length === 0) {
      return {
        success: true,
        message: '没有需要硬删除的图片',
        data: { deletedCount: 0 }
      }
    }

    let deletedCount = 0
    let errors = []

    for (const image of deletedImages) {
      try {
        // 删除物理文件（按储存桶并扣减容量）
        await deleteImage(image.filename, image.bucketId, image.size)

        // 从数据库删除记录
        await db.images.remove({ _id: image._id })
        deletedCount++
      } catch (err) {
        console.error(`删除图片失败 ${image.uuid}:`, err)
        errors.push(image.uuid)
      }
    }

    return {
      success: true,
      message: `成功硬删除 ${deletedCount} 张图片`,
      data: {
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Settings] 硬删除图片失败:', error)
    throw createError({
      statusCode: 500,
      message: '硬删除图片失败'
    })
  }
})
