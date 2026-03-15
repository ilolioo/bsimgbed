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
        allowUser: b.allowUser !== false,
        showOnCapacity: b.showOnCapacity !== false,
        webdav: b.webdav ? {
          baseUrl: b.webdav.baseUrl || '',
          username: b.webdav.username || '',
          hasPassword: !!b.webdav.password
        } : null,
        telegram: b.telegram ? {
          chatId: b.telegram.chatId || '',
          apiBaseUrl: b.telegram.apiBaseUrl || '',
          hasToken: !!b.telegram.token
        } : null,
        ftp: b.ftp ? {
          host: b.ftp.host || '',
          port: b.ftp.port || 21,
          username: b.ftp.username || '',
          basePath: b.ftp.basePath || '',
          secure: !!b.ftp.secure,
          hasPassword: !!b.ftp.password
        } : null,
        sftp: b.sftp ? {
          host: b.sftp.host || '',
          port: b.sftp.port || 22,
          username: b.sftp.username || '',
          basePath: b.sftp.basePath || '',
          hasPassword: !!b.sftp.password,
          hasPrivateKey: !!b.sftp.privateKey,
          hasPassphrase: !!b.sftp.passphrase
        } : null,
        s3: b.s3 ? {
          bucket: b.s3.bucket || '',
          region: b.s3.region || '',
          endpoint: b.s3.endpoint || '',
          pathPrefix: b.s3.pathPrefix || '',
          forcePathStyle: !!b.s3.forcePathStyle,
          hasAccessKey: !!b.s3.accessKeyId,
          hasSecretKey: !!b.s3.secretAccessKey
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
