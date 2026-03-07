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

    const adminUser = await db.users.findOne({ role: 'admin', _id: { $ne: id } })
    const reassignId = adminUser ? adminUser._id : null

    if (reassignId) {
      await db.images.update({ userId: id }, { $set: { userId: reassignId } }, { multi: true })
      await db.apikeys.update({ userId: id }, { $set: { userId: reassignId } }, { multi: true })
    }

    await db.users.remove({ _id: id })

    return {
      success: true,
      message: '用户已删除'
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
