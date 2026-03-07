import { getBucketsConfig } from '../../../utils/storage.js'

/**
 * 获取各储存桶用量（公开，所有人可访问，仅返回用量与名称）
 */
export default defineEventHandler(async (event) => {
  try {
    const { buckets } = await getBucketsConfig()
    const list = (buckets || [])
      .filter(b => b.showOnCapacity !== false)
      .map(b => ({
        id: b.id,
        name: b.name || b.id,
        usedSize: b.usedSize ?? 0,
        sizeLimit: b.sizeLimit ?? 1024 * 1024 * 1024
      }))
    return { success: true, data: { buckets: list } }
  } catch (error) {
    console.error('[Config] 获取储存桶用量失败:', error)
    throw createError({ statusCode: 500, message: '获取用量失败' })
  }
})
