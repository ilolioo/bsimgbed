import db from '../../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)
    const currentUser = event.context.user

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少用户 ID'
      })
    }

    if (id === currentUser.userId) {
      throw createError({
        statusCode: 400,
        message: '不能删除当前登录账号'
      })
    }

    const target = await db.users.findOne({ _id: id })
    if (!target) {
      throw createError({
        statusCode: 404,
        message: '用户不存在'
      })
    }

    const now = new Date().toISOString()
    const deletedBy = currentUser.username || '管理员'

    // 删除该用户的所有 ApiKey
    await db.apikeys.remove({ userId: id }, { multi: true })

    // 将该用户上传的图片软删除（移入回收站）
    await db.images.update(
      { userId: id, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
          deletedBy
        }
      },
      { multi: true }
    )

    await db.users.remove({ _id: id })

    return {
      success: true,
      message: '用户已删除，其 ApiKey 与上传的图片已一并处理'
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Admin] 删除用户失败:', error)
    throw createError({
      statusCode: 500,
      message: '删除用户失败'
    })
  }
})
