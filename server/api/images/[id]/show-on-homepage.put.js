import db from '../../../utils/db.js'
import { authMiddleware } from '../../../utils/authMiddleware.js'

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

    const body = await readBody(event).catch(() => ({}))
    const showOnHomepage = body.showOnHomepage === true || body.showOnHomepage === false ? body.showOnHomepage : undefined
    if (showOnHomepage === undefined) {
      throw createError({
        statusCode: 400,
        message: '请提供 showOnHomepage (true/false)'
      })
    }

    const image = await db.images.findOne({ _id: id })
    if (!image) {
      throw createError({
        statusCode: 404,
        message: '图片不存在'
      })
    }

    const isOwner = image.userId && image.userId === user.userId
    const isAdmin = user.role === 'admin'
    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: '无权修改该图片的展示状态'
      })
    }

    await db.images.update(
      { _id: id },
      {
        $set: {
          showOnHomepage: !!showOnHomepage,
          updatedAt: new Date().toISOString()
        }
      }
    )

    return {
      success: true,
      data: { showOnHomepage: !!showOnHomepage },
      message: showOnHomepage ? '已设为首页展示' : '已设为仅自己可见'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    console.error('[Images] 更新首页展示状态失败:', error)
    throw createError({
      statusCode: 500,
      message: '更新失败'
    })
  }
})
