import { getBucketsConfig } from '../../../utils/storage.js'
import { optionalAuthMiddleware } from '../../../utils/authMiddleware.js'

/**
 * 获取当前用户可选的储存桶列表（用于首页上传下拉）
 * - 未登录（游客）：仅返回 allowGuest 为 true 的桶
 * - 已登录普通用户：仅返回 allowUser 为 true 的桶
 * - 已登录管理员：返回全部桶
 */
export default defineEventHandler(async (event) => {
  try {
    await optionalAuthMiddleware(event)
    const user = event.context.user
    const isAdmin = user && user.role === 'admin'

    const { defaultId, buckets } = await getBucketsConfig()
    const list = buckets || []
    const defaultBucketId = defaultId || list[0]?.id || 'default'

    let choices
    if (isAdmin) {
      choices = list.map(b => ({ id: b.id, name: b.name || b.id }))
    } else if (user) {
      choices = list
        .filter(b => b.allowUser !== false)
        .map(b => ({ id: b.id, name: b.name || b.id }))
    } else {
      choices = list
        .filter(b => b.allowGuest !== false)
        .map(b => ({ id: b.id, name: b.name || b.id }))
    }

    return {
      success: true,
      data: {
        defaultId: defaultBucketId,
        buckets: choices
      }
    }
  } catch (error) {
    console.error('[Config] 获取储存桶选项失败:', error)
    throw createError({ statusCode: 500, message: '获取储存桶选项失败' })
  }
})
