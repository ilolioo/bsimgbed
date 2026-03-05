import db from '../../utils/db.js'
import { verifyToken, extractToken } from '../../utils/jwt.js'
import { v4 as uuidv4 } from 'uuid'
const BUCKETS_KEY = 'storageBuckets'
const PLACEHOLDER = '****'

export default defineEventHandler(async (event) => {
  try {
    const token = extractToken(event)
    if (!token) throw createError({ statusCode: 401, message: '请先登录' })
    const user = await verifyToken(token)
    if (!user) throw createError({ statusCode: 401, message: 'Token 无效或已过期' })

    const body = await readBody(event)
    const { defaultId: bodyDefaultId, buckets: bodyBuckets } = body

    const current = await db.settings.findOne({ key: BUCKETS_KEY })
    const currentValue = current?.value || {}
    const currentBuckets = currentValue.buckets || []
    const currentDefaultId = currentValue.defaultId || 'default'

    let nextDefaultId = bodyDefaultId !== undefined ? String(bodyDefaultId) : currentDefaultId
    let nextBuckets = currentBuckets

    if (Array.isArray(bodyBuckets) && bodyBuckets.length > 0) {
      nextBuckets = bodyBuckets.map(b => {
        let id = b.id || b._id
        const existing = id ? currentBuckets.find(x => x.id === id) : null
        if (!id || id.toString().startsWith('new-')) id = existing?.id || uuidv4()
        const driver = (b.driver || (existing?.driver) || 'local').toLowerCase()
        if (!['local', 'webdav', 'telegram'].includes(driver)) {
          throw createError({ statusCode: 400, message: `储存桶 ${b.name || id} 无效的驱动` })
        }
        const sizeLimit = typeof b.sizeLimit === 'number' ? b.sizeLimit : (existing?.sizeLimit ?? 1024 * 1024 * 1024)
        const usedSize = existing?.usedSize ?? 0
        const allowGuest = b.allowGuest !== undefined ? !!b.allowGuest : (existing?.allowGuest !== false)
        const out = {
          id,
          name: (b.name !== undefined ? b.name : existing?.name) || id || '未命名',
          driver,
          sizeLimit,
          usedSize,
          allowGuest,
          webdav: null,
          telegram: null
        }
        if (driver === 'webdav' && (b.webdav || existing?.webdav)) {
          const w = b.webdav || {}
          const ew = existing?.webdav || {}
          out.webdav = {
            baseUrl: (w.baseUrl !== undefined ? w.baseUrl : ew.baseUrl) || '',
            username: (w.username !== undefined ? w.username : ew.username) || '',
            password: (w.password !== undefined && w.password !== '' && w.password !== PLACEHOLDER)
              ? w.password
              : (ew.password || '')
          }
        }
        if (driver === 'telegram' && (b.telegram || existing?.telegram)) {
          const t = b.telegram || {}
          const et = existing?.telegram || {}
          out.telegram = {
            chatId: (t.chatId !== undefined ? t.chatId : et.chatId) || '',
            apiBaseUrl: (t.apiBaseUrl !== undefined ? t.apiBaseUrl : et.apiBaseUrl) || '',
            token: (t.token !== undefined && t.token !== '' && t.token !== PLACEHOLDER)
              ? t.token
              : (et.token || '')
          }
        }
        return out
      })
      if (nextDefaultId && !nextBuckets.some(b => b.id === nextDefaultId)) {
        nextDefaultId = nextBuckets[0]?.id || 'default'
      }
    }

    await db.settings.update(
      { key: BUCKETS_KEY },
      { $set: { value: { defaultId: nextDefaultId, buckets: nextBuckets }, updatedAt: new Date().toISOString() } },
      { upsert: true }
    )
    return { success: true, message: '储存桶配置已保存', data: { defaultId: nextDefaultId } }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Config] 保存储存桶配置失败:', error)
    throw createError({ statusCode: 500, message: '保存配置失败' })
  }
})
