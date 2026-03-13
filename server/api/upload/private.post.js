import db from '../../utils/db.js'
import { getImageMetadata, saveUploadedFile } from '../../utils/image.js'
import { parseFormData, processImageWithConfig, generateTimestampId } from '../../utils/upload.js'
import { getBucketsConfig } from '../../utils/storage.js'
import { v4 as uuidv4 } from 'uuid'
import { createModerationTask } from '../../utils/moderationQueue.js'
import { sendUploadNotification } from '../../utils/notification.js'

/**
 * 解析 base64 字符串，支持带 data URI 前缀和纯 base64
 * @param {string} base64String - base64 字符串
 * @returns {{ buffer: Buffer, format: string, originalFilename: string }}
 */
function parseBase64Image(base64String) {
  let base64Data = base64String
  let format = 'png' // 默认格式

  // 检查是否包含 data URI 前缀
  const dataUriMatch = base64String.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
  if (dataUriMatch) {
    format = dataUriMatch[1].toLowerCase()
    base64Data = dataUriMatch[2]
    // 处理特殊格式
    if (format === 'jpeg') format = 'jpg'
    if (format === 'svg+xml') format = 'svg'
  }

  // 解码 base64
  const buffer = Buffer.from(base64Data, 'base64')

  // 验证是否为有效的图片数据
  if (buffer.length === 0) {
    throw new Error('无效的 base64 数据')
  }

  return {
    buffer,
    format,
    originalFilename: `image.${format}`
  }
}

export default defineEventHandler(async (event) => {
  const clientIP = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  try {
    // 获取 ApiKey（从 header 或 query）
    const apiKey = getHeader(event, 'x-api-key') || getQuery(event).apiKey

    if (!apiKey) {
      throw createError({
        statusCode: 401,
        message: '缺少 API Key'
      })
    }

    // 验证 ApiKey
    const keyDoc = await db.apikeys.findOne({ key: apiKey, enabled: true })
    if (!keyDoc) {
      throw createError({
        statusCode: 401,
        message: 'API Key 无效或已禁用'
      })
    }

    // 获取私有 API 配置
    const configDoc = await db.settings.findOne({ key: 'privateApiConfig' })
    const config = configDoc?.value || {}

    let file = null

    // 检查 Content-Type 来决定解析方式
    const contentType = getHeader(event, 'content-type') || ''

    let requestedBucketId = null
    let requestedShowOnHomepage = true
    if (contentType.includes('application/json')) {
      // JSON 格式，支持 base64 上传
      const body = await readBody(event)
      if (body.bucketId) requestedBucketId = String(body.bucketId).trim() || null
      if (body.showOnHomepage === false) requestedShowOnHomepage = false

      if (body.base64) {
        // base64 字符串上传
        try {
          const parsed = parseBase64Image(body.base64)
          file = {
            buffer: parsed.buffer,
            originalFilename: body.filename || parsed.originalFilename,
            mimetype: `image/${parsed.format}`,
            size: parsed.buffer.length
          }
        } catch (e) {
          throw createError({
            statusCode: 400,
            message: 'base64 图片数据无效: ' + e.message
          })
        }
      }
    } else {
      // multipart/form-data 格式
      const formResult = await parseFormData(event)
      file = formResult.file
      requestedShowOnHomepage = formResult.showOnHomepage !== false
      requestedBucketId = formResult.bucketId || null
    }

    if (!file) {
      throw createError({
        statusCode: 400,
        message: '请选择要上传的图片，支持 multipart/form-data 或 JSON 格式的 base64 字符串'
      })
    }

    // 私有 API 支持所有格式，只检查是否为图片
    const fileExt = file.originalFilename?.split('.').pop()?.toLowerCase() || ''

    // 检查文件大小
    const maxFileSize = config.maxFileSize || 100 * 1024 * 1024
    if (file.size > maxFileSize) {
      throw createError({
        statusCode: 400,
        message: `文件大小超过限制 (最大 ${Math.round(maxFileSize / 1024 / 1024)}MB)`
      })
    }

    // 储存桶权限：管理员可用全部；普通用户仅可用 allowUser 为 true 的桶
    const { defaultId, buckets } = await getBucketsConfig()
    const allBucketIds = (buckets || []).map(b => b.id)
    const uploadUser = keyDoc.userId ? await db.users.findOne({ _id: keyDoc.userId }) : null
    const isAdmin = uploadUser?.role === 'admin'
    const allowedBucketIds = isAdmin
      ? allBucketIds
      : (buckets || []).filter(b => b.allowUser !== false).map(b => b.id)
    let bucketIdToUse = defaultId || allowedBucketIds[0] || allBucketIds[0]
    if (requestedBucketId) {
      if (!allowedBucketIds.includes(requestedBucketId)) {
        throw createError({ statusCode: 400, message: '储存桶不存在或您无权使用该储存桶' })
      }
      bucketIdToUse = requestedBucketId
    }

    // 以时间戳生成唯一 ID（用于文件名与 /i/xxx 路径）
    const imageUuid = generateTimestampId()

    // 处理图片（根据配置决定是否压缩和转换格式）
    const { processedBuffer, finalFormat, isWebp } = await processImageWithConfig(file.buffer, fileExt, config)

    // 获取图片元数据
    const metadata = await getImageMetadata(processedBuffer)

    // 保存文件到所选储存桶
    const filename = `${imageUuid}.${finalFormat}`
    const bucketId = await saveUploadedFile(processedBuffer, filename, bucketIdToUse)

    // 获取用户信息（通过 ApiKey 关联）
    const uploadedBy = keyDoc.name || 'API用户'

    const userId = keyDoc.userId || null

    // 与游客上传一致：使用公共 API 配置中的内容安全开关，普通用户上传也走鉴黄
    const publicConfigDoc = await db.settings.findOne({ key: 'publicApiConfig' })
    const contentSafetyEnabled = publicConfigDoc?.value?.contentSafety?.enabled || false

    const imageDoc = {
      _id: uuidv4(),
      uuid: imageUuid,
      originalName: file.originalFilename,
      filename: filename,
      bucketId: bucketId || undefined,
      format: finalFormat,
      size: processedBuffer.length,
      width: metadata.width || 0,
      height: metadata.height || 0,
      isWebp: isWebp,
      isDeleted: false,
      uploadedBy: uploadedBy,
      uploadedByType: 'private',
      apiKeyId: keyDoc._id,
      userId,
      showOnHomepage: requestedShowOnHomepage,
      ip: clientIP,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // 内容审核相关字段（与游客上传一致）
      moderationStatus: contentSafetyEnabled ? 'pending' : 'skipped',
      moderationResult: contentSafetyEnabled ? null : { skipped: true, reason: '内容安全检测未启用' },
      moderationChecked: !contentSafetyEnabled,
      isNsfw: false
    }

    await db.images.insert(imageDoc)

    // 若启用内容安全检测，创建审核任务（与游客上传一致）
    if (contentSafetyEnabled) {
      try {
        await createModerationTask(imageDoc._id, imageUuid, filename, bucketId)
      } catch (err) {
        console.error('[Upload] 创建审核任务失败:', err)
      }
    }

    // 获取站点 URL 配置，用于生成完整图片链接
    const appSettingsDoc = await db.settings.findOne({ key: 'appSettings' })
    let siteUrl = appSettingsDoc?.value?.siteUrl || ''

    // 如果没有配置站点 URL，使用请求的 Host 作为兜底
    if (!siteUrl) {
      const protocol = getHeader(event, 'x-forwarded-proto') || 'http'
      const host = getHeader(event, 'host') || 'localhost'
      siteUrl = `${protocol}://${host}`
    }

    // 移除末尾斜杠，确保 URL 拼接正确
    siteUrl = siteUrl.replace(/\/+$/, '')
    const fullImageUrl = `${siteUrl}/i/${imageUuid}.${finalFormat}`

    // 发送上传通知（异步，不阻塞响应）
    sendUploadNotification(
      {
        id: imageDoc._id,
        filename: filename,
        format: finalFormat,
        size: processedBuffer.length,
        url: fullImageUrl,
        bucketId: bucketId
      },
      {
        name: uploadedBy,
        type: 'private',
        ip: clientIP
      }
    ).catch(err => {
      console.error('[Upload] 发送上传通知失败:', err)
    })

    // 返回结果
    return {
      success: true,
      message: '上传成功',
      data: {
        id: imageDoc._id,
        uuid: imageUuid,
        filename: filename,
        format: finalFormat,
        size: processedBuffer.length,
        width: metadata.width || 0,
        height: metadata.height || 0,
        url: `/i/${imageUuid}.${finalFormat}`,
        uploadedAt: imageDoc.uploadedAt
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Upload] 私有上传失败:', error)
    throw createError({
      statusCode: 500,
      message: '上传失败，请稍后重试'
    })
  }
})
