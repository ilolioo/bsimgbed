import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { getBucketsConfig } from '../../utils/storage.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    const { defaultId, buckets } = await getBucketsConfig()
    const data = {
      defaultId: defaultId || 'default',
      buckets: (buckets || []).map(b => ({
        id: b.id,
        name: b.name || b.id,
        driver: (b.driver || 'local').toLowerCase(),
        sizeLimit: b.sizeLimit ?? 1024 * 1024 * 1024,
        usedSize: b.usedSize ?? 0,
        allowGuest: b.allowGuest !== false,
        webdav: b.webdav ? {
          baseUrl: b.webdav.baseUrl || '',
          username: b.webdav.username || '',
          hasPassword: !!b.webdav.password
        } : null,
        telegram: b.telegram ? {
          chatId: b.telegram.chatId || '',
          apiBaseUrl: b.telegram.apiBaseUrl || '',
          hasToken: !!b.telegram.token
        } : null
      }))
    }
    return { success: true, data }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Config] 获取储存桶配置失败:', error)
    throw createError({ statusCode: 500, message: '获取配置失败' })
  }
})
