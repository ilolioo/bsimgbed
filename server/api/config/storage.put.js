import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { v4 as uuidv4 } from 'uuid'
const BUCKETS_KEY = 'storageBuckets'
const PLACEHOLDER = '****'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    const body = await readBody(event)
    const { defaultId: bodyDefaultId, buckets: bodyBuckets } = body

    const current = await db.settings.findOne({ key: BUCKETS_KEY })
    const currentValue = current?.value || {}
    const currentBuckets = currentValue.buckets || []
    const currentDefaultId = currentValue.defaultId || 'default'

    let nextDefaultId = bodyDefaultId !== undefined ? String(bodyDefaultId) : currentDefaultId
    let nextBuckets = currentBuckets

    if (Array.isArray(bodyBuckets) && bodyBuckets.length > 0) {
      const usedIds = new Set()
      nextBuckets = bodyBuckets.map(b => {
        let id = (b.id ?? b._id ?? '').toString().trim()
        const existing = id ? currentBuckets.find(x => x.id === id) : null
        if (!id) {
          id = existing?.id || uuidv4()
        } else {
          // 自定义 ID：仅保留英文、数字、连字符、下划线，避免路径问题
          const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
          if (!sanitized) {
            throw createError({ statusCode: 400, message: `储存桶 ${b.name || id} 的 ID 无效，请使用英文/数字/连字符/下划线` })
          }
          id = sanitized
        }
        if (usedIds.has(id)) {
          throw createError({ statusCode: 400, message: `储存桶 ID 重复: ${id}` })
        }
        usedIds.add(id)
        const driver = (b.driver || (existing?.driver) || 'local').toLowerCase()
        if (!['local', 'webdav', 'telegram', 'ftp', 'sftp', 's3'].includes(driver)) {
          throw createError({ statusCode: 400, message: `储存桶 ${b.name || id} 无效的驱动` })
        }
        // -1 表示不限制容量；其他负数归一为 -1
        let sizeLimit = typeof b.sizeLimit === 'number' ? b.sizeLimit : (existing?.sizeLimit ?? 1024 * 1024 * 1024)
        if (sizeLimit < 0) sizeLimit = -1
        const usedSize = existing?.usedSize ?? 0
        const allowGuest = b.allowGuest !== undefined ? !!b.allowGuest : (existing?.allowGuest !== false)
        const allowUser = b.allowUser !== undefined ? !!b.allowUser : (existing?.allowUser !== false)
        const showOnCapacity = b.showOnCapacity !== undefined ? !!b.showOnCapacity : (existing?.showOnCapacity !== false)
        const out = {
          id,
          name: (b.name !== undefined ? b.name : existing?.name) || id || '未命名',
          driver,
          sizeLimit,
          usedSize,
          allowGuest,
          allowUser,
          showOnCapacity,
          webdav: null,
          telegram: null,
          ftp: null,
          sftp: null,
          s3: null
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
        if (driver === 'ftp' && (b.ftp || existing?.ftp)) {
          const f = b.ftp || {}
          const ef = existing?.ftp || {}
          out.ftp = {
            host: (f.host !== undefined ? f.host : ef.host) || '',
            port: (f.port !== undefined ? Number(f.port) : (ef.port || 21)) || 21,
            username: (f.username !== undefined ? f.username : ef.username) || '',
            basePath: (f.basePath !== undefined ? f.basePath : ef.basePath) || '',
            secure: (f.secure !== undefined ? !!f.secure : !!ef.secure),
            password: (f.password !== undefined && f.password !== '' && f.password !== PLACEHOLDER)
              ? f.password
              : (ef.password || '')
          }
        }
        if (driver === 'sftp' && (b.sftp || existing?.sftp)) {
          const s = b.sftp || {}
          const es = existing?.sftp || {}
          out.sftp = {
            host: (s.host !== undefined ? s.host : es.host) || '',
            port: (s.port !== undefined ? Number(s.port) : (es.port || 22)) || 22,
            username: (s.username !== undefined ? s.username : es.username) || '',
            basePath: (s.basePath !== undefined ? s.basePath : es.basePath) || '',
            password: (s.password !== undefined && s.password !== '' && s.password !== PLACEHOLDER)
              ? s.password
              : (es.password || ''),
            privateKey: (s.privateKey !== undefined && s.privateKey !== '' && s.privateKey !== PLACEHOLDER)
              ? s.privateKey
              : (es.privateKey || ''),
            passphrase: (s.passphrase !== undefined && s.passphrase !== '' && s.passphrase !== PLACEHOLDER)
              ? s.passphrase
              : (es.passphrase || '')
          }
        }
        if (driver === 's3' && (b.s3 || existing?.s3)) {
          const s3 = b.s3 || {}
          const es3 = existing?.s3 || {}
          out.s3 = {
            bucket: (s3.bucket !== undefined ? s3.bucket : es3.bucket) || '',
            region: (s3.region !== undefined ? s3.region : es3.region) || '',
            endpoint: (s3.endpoint !== undefined ? s3.endpoint : es3.endpoint) || '',
            pathPrefix: (s3.pathPrefix !== undefined ? s3.pathPrefix : es3.pathPrefix) || '',
            forcePathStyle: (s3.forcePathStyle !== undefined ? !!s3.forcePathStyle : !!es3.forcePathStyle),
            accessKeyId: (s3.accessKeyId !== undefined && s3.accessKeyId !== '' && s3.accessKeyId !== PLACEHOLDER)
              ? s3.accessKeyId
              : (es3.accessKeyId || ''),
            secretAccessKey: (s3.secretAccessKey !== undefined && s3.secretAccessKey !== '' && s3.secretAccessKey !== PLACEHOLDER)
              ? s3.secretAccessKey
              : (es3.secretAccessKey || '')
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
