import db from '../../utils/db.js'
import { optionalAuthMiddleware } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await optionalAuthMiddleware(event)
    const user = event.context.user

    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const skip = (page - 1) * limit

    const isAdmin = user && user.role === 'admin'

    // 获取私有 API 配置，检查是否允许首页展示私有图片
    const privateConfig = await db.settings.findOne({ key: 'privateApiConfig' })
    const showPrivateOnHomepage = privateConfig?.value?.showOnHomepage === true

    let queryCondition
    if (isAdmin) {
      queryCondition = { isDeleted: false, isNsfw: { $ne: true } }
    } else if (user && showPrivateOnHomepage) {
      queryCondition = { isDeleted: false, isNsfw: { $ne: true } }
    } else if (user) {
      // 普通用户：公开图 + 自己上传的图 + 其他用户设为「上传后展示」的图
      queryCondition = {
        isDeleted: false,
        isNsfw: { $ne: true },
        $or: [
          { userId: user.userId },
          { uploadedByType: 'public' },
          { showOnHomepage: true },
          { showOnHomepage: { $exists: false } }
        ]
      }
    } else {
      // 游客：公开上传的图 + 登录用户设为「对所有人可见」的图（展示在首页）
      queryCondition = {
        isDeleted: false,
        isNsfw: { $ne: true },
        $or: [
          { uploadedByType: 'public' },
          { showOnHomepage: true },
          { showOnHomepage: { $exists: false } }
        ]
      }
    }

    // 获取总数与当前页数据（数据库层排序分页，避免全量加载）
    const [total, images] = await Promise.all([
      db.images.count(queryCondition),
      db.images.findWithOptions(queryCondition, {
        sort: { uploadedAt: -1 },
        skip,
        limit
      })
    ])

    // 过滤敏感信息
    const safeImages = images.map(img => {
      const baseInfo = {
        id: img._id,
        uuid: img.uuid,
        filename: img.filename,
        originalName: img.originalName,
        format: img.format,
        size: img.size,
        width: img.width,
        height: img.height,
        url: `/i/${img.uuid}.${img.format}`,
        uploadedBy: img.uploadedBy,
        uploadedAt: img.uploadedAt,
        showOnHomepage: img.showOnHomepage !== false
      }
      // 当前用户为自己的图片或管理员时返回 userId，用于前端判断是否可改展示状态
      if (isAdmin || (user && img.userId && img.userId === user.userId)) {
        baseInfo.userId = img.userId
      }

      // 管理员可见额外信息
      if (isAdmin) {
        return {
          ...baseInfo,
          isNsfw: img.isNsfw || false,
          isDeleted: img.isDeleted || false,
          moderationStatus: img.moderationStatus,
          moderationScore: img.moderationResult?.score
        }
      }

      return baseInfo
    })

    return {
      success: true,
      data: {
        images: safeImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error) {
    console.error('[Images] 获取图片列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取图片列表失败'
    })
  }
})
