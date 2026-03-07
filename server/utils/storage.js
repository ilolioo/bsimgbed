import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync, createReadStream } from 'fs'
import { writeFile, readFile } from 'fs/promises'
import { Readable } from 'stream'
import db from './db.js'

// 存储驱动默认值（环境变量），运行时可由数据库覆盖
const ENV_DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase()

// 本地上传目录：生产环境使用 /app/uploads，开发环境使用项目根目录下的 uploads
const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/app/uploads'
  : join(process.cwd(), 'uploads')

// 仅在本地存储模式下确保目录存在（启动时按 env 判断）
if (ENV_DRIVER === 'local') {
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }
}

console.log('[Storage] 默认驱动:', ENV_DRIVER, '本地目录:', uploadsDir)

/**
 * 获取当前存储配置（默认桶的配置，兼容旧调用）
 * @returns {Promise<{ driver: string, webdav?: object, telegram?: object }>}
 */
export async function getStorageConfig() {
  const bucket = await getBucketById(null)
  if (!bucket) return { driver: 'local', webdav: null, telegram: null }
  const driver = (bucket.driver || 'local').toLowerCase()
  let webdav = null
  if (bucket.webdav?.baseUrl && bucket.webdav?.username) {
    webdav = {
      baseUrl: String(bucket.webdav.baseUrl).replace(/\/+$/, ''),
      username: bucket.webdav.username,
      password: bucket.webdav.password || ''
    }
  }
  if (!webdav && driver === 'webdav') {
    const baseUrl = process.env.WEBDAV_BASE_URL
    const username = process.env.WEBDAV_USERNAME
    const password = process.env.WEBDAV_PASSWORD
    if (baseUrl && username && password) {
      webdav = { baseUrl: baseUrl.replace(/\/+$/, ''), username, password }
    }
  }
  let telegram = null
  if (bucket.telegram?.token && bucket.telegram?.chatId) {
    telegram = {
      token: bucket.telegram.token,
      chatId: String(bucket.telegram.chatId),
      apiBaseUrl: (bucket.telegram.apiBaseUrl || process.env.TELEGRAM_API_URL || 'https://api.telegram.org').replace(/\/+$/, '')
    }
  }
  if (!telegram && driver === 'telegram') {
    const token = process.env.TG_STORAGE_TOKEN || process.env.TELEGRAM_STORAGE_TOKEN || process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TG_STORAGE_CHAT_ID || process.env.TELEGRAM_STORAGE_CHAT_ID
    if (token && chatId) {
      telegram = { token, chatId: String(chatId), apiBaseUrl: (process.env.TELEGRAM_API_URL || 'https://api.telegram.org').replace(/\/+$/, '') }
    }
  }
  return { driver, webdav, telegram }
}

const BUCKETS_KEY = 'storageBuckets'
const DEFAULT_SIZE_LIMIT = 1024 * 1024 * 1024 // 1GB

async function migrateToBuckets() {
  const doc = await db.settings.findOne({ key: BUCKETS_KEY })
  if (doc?.value?.buckets?.length) return doc.value
  const old = await db.settings.findOne({ key: 'storageConfig' })
  const v = old?.value || {}
  const driver = (v.driver || process.env.STORAGE_DRIVER || 'local').toLowerCase()
  const buckets = [{
    id: 'default',
    name: '默认',
    driver,
    sizeLimit: DEFAULT_SIZE_LIMIT,
    usedSize: 0,
    webdav: v.webdav || null,
    telegram: v.telegram || null
  }]
  const value = { defaultId: 'default', buckets }
  await db.settings.update(
    { key: BUCKETS_KEY },
    { $set: { value, updatedAt: new Date().toISOString() } },
    { upsert: true }
  )
  console.log('[Storage] 已从 storageConfig 迁移为多桶配置')
  return value
}

export async function getBucketsConfig() {
  let doc = await db.settings.findOne({ key: BUCKETS_KEY })
  if (!doc?.value?.buckets?.length) return await migrateToBuckets()
  return doc.value
}

export async function getDefaultBucketId() {
  const { defaultId, buckets } = await getBucketsConfig()
  if (buckets.some(b => b.id === defaultId)) return defaultId
  return (buckets[0]?.id) || 'default'
}

export async function getBucketById(bucketId) {
  const { buckets } = await getBucketsConfig()
  const list = buckets || []
  const id = (bucketId && String(bucketId).trim()) || await getDefaultBucketId()
  const normalizedId = String(id).trim()
  const bucket = list.find(b => String(b.id).trim() === normalizedId)
  if (bucket) return bucket
  if (bucketId && String(bucketId).trim()) {
    throw new Error(`[Storage] 未找到储存桶: ${normalizedId}`)
  }
  return list[0]
}

/** 更新桶的已用容量（写入数据库） */
async function updateBucketUsedSize(bucketId, delta) {
  const doc = await db.settings.findOne({ key: BUCKETS_KEY })
  if (!doc?.value?.buckets) return
  const buckets = doc.value.buckets.map(b => {
    if (b.id !== bucketId) return b
    const used = (b.usedSize || 0) + delta
    return { ...b, usedSize: Math.max(0, used) }
  })
  await db.settings.update(
    { key: BUCKETS_KEY },
    { $set: { value: { ...doc.value, buckets }, updatedAt: new Date().toISOString() } }
  )
}

export function getStorageDriver() {
  return ENV_DRIVER
}

export function getUploadsDirPath() {
  return uploadsDir
}

function getLocalFilePath(bucketId, filename) {
  const dir = bucketId ? join(uploadsDir, bucketId) : uploadsDir
  return join(dir, filename)
}

function resolveWebdavConfig(webdavFromConfig, bucketName = '') {
  if (webdavFromConfig?.baseUrl && webdavFromConfig?.username && webdavFromConfig?.password) {
    return {
      baseUrl: webdavFromConfig.baseUrl.replace(/\/+$/, ''),
      username: webdavFromConfig.username,
      password: webdavFromConfig.password
    }
  }
  // 若已传入该桶的配置但不完整，不回退到环境变量（避免用错账号），直接报错
  if (webdavFromConfig && (webdavFromConfig.baseUrl || webdavFromConfig.username)) {
    throw new Error(
      `[Storage] WebDAV 储存桶「${bucketName || '当前'}」配置不完整，请在系统设置 → 存储配置中填写完整的 Base URL、用户名和密码`
    )
  }
  const baseUrl = process.env.WEBDAV_BASE_URL
  const username = process.env.WEBDAV_USERNAME
  const password = process.env.WEBDAV_PASSWORD
  if (!baseUrl || !username || !password) {
    throw new Error('[Storage] WebDAV 配置不完整，请在后台存储配置或环境变量中设置')
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), username, password }
}

function buildWebdavFileUrl(baseUrl, filename) {
  return `${baseUrl}/${encodeURIComponent(filename)}`
}

function getWebdavAuthHeader(username, password) {
  const token = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${token}`
}

function resolveTelegramConfig(telegramFromConfig) {
  if (telegramFromConfig?.token && telegramFromConfig?.chatId) {
    return {
      token: telegramFromConfig.token,
      chatId: String(telegramFromConfig.chatId),
      apiBaseUrl: (telegramFromConfig.apiBaseUrl || process.env.TELEGRAM_API_URL || 'https://api.telegram.org').replace(/\/+$/, '')
    }
  }
  const token = process.env.TG_STORAGE_TOKEN || process.env.TELEGRAM_STORAGE_TOKEN || process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TG_STORAGE_CHAT_ID || process.env.TELEGRAM_STORAGE_CHAT_ID
  if (!token || !chatId) {
    throw new Error('[Storage] Telegram 存储配置不完整，请在后台存储配置或环境变量中设置')
  }
  return {
    token,
    chatId: String(chatId),
    apiBaseUrl: (process.env.TELEGRAM_API_URL || 'https://api.telegram.org').replace(/\/+$/, '')
  }
}

/**
 * 保存文件到指定桶（不传则用默认桶）
 * @returns {Promise<string>} 返回 bucketId，用于写入 image.bucketId
 */
export async function saveFile(buffer, filename, bucketId) {
  const bid = bucketId || await getDefaultBucketId()
  const bucket = await getBucketById(bid)
  if (!bucket) throw new Error('[Storage] 未找到储存桶')

  const size = Buffer.isBuffer(buffer) ? buffer.length : Buffer.from(buffer).length
  const limit = bucket.sizeLimit ?? DEFAULT_SIZE_LIMIT
  const used = bucket.usedSize || 0
  if (used + size > limit) {
    throw new Error(`[Storage] 储存桶「${bucket.name}」已满（已用 ${(used / 1024 / 1024).toFixed(1)}MB / 限制 ${(limit / 1024 / 1024).toFixed(1)}MB）`)
  }

  const driver = (bucket.driver || 'local').toLowerCase()
  const webdavFromConfig = bucket.webdav || null
  const telegramFromConfig = bucket.telegram || null

  if (driver === 'local') {
    const dir = join(uploadsDir, bucket.id)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const filepath = getLocalFilePath(bucket.id, filename)
    await writeFile(filepath, buffer)
    await updateBucketUsedSize(bucket.id, size)
    return bucket.id
  }

  if (driver === 'webdav') {
    const { baseUrl, username, password } = resolveWebdavConfig(webdavFromConfig, bucket.name)
    const url = buildWebdavFileUrl(baseUrl, filename)
    const authHeader = getWebdavAuthHeader(username, password)
    const body = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(body.length)
      },
      body
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`[Storage] WebDAV 上传失败: ${res.status} ${res.statusText} ${text.slice(0, 200)}`)
    }
    await updateBucketUsedSize(bucket.id, size)
    return bucket.id
  }

  if (driver === 'telegram') {
    const { token, chatId, apiBaseUrl } = resolveTelegramConfig(telegramFromConfig)
    const body = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
    const form = new FormData()
    form.append('chat_id', chatId)
    form.append('document', new Blob([body], { type: 'application/octet-stream' }), filename)
    const url = `${apiBaseUrl}/bot${token}/sendDocument`
    const res = await fetch(url, { method: 'POST', body: form })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) {
      const msg = json?.description || res.statusText
      throw new Error(`[Storage] Telegram 上传失败: ${res.status} ${msg}`)
    }
    const result = json.result || {}
    const doc = result.document || {}
    const fileId = doc.file_id
    const messageId = result.message_id
    if (!fileId) throw new Error('[Storage] Telegram 上传成功但未返回 file_id')
    try {
      await db.storageMeta.update(
        { filename, bucketId: bucket.id },
        {
          $set: {
            driver: 'telegram',
            fileId,
            messageId,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        },
        { upsert: true }
      )
    } catch (err) {
      console.error('[Storage] 保存 Telegram 元信息失败:', err)
    }
    await updateBucketUsedSize(bucket.id, size)
    return bucket.id
  }

  const dir = join(uploadsDir, bucket.id)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const filepath = getLocalFilePath(bucket.id, filename)
  await writeFile(filepath, buffer)
  await updateBucketUsedSize(bucket.id, size)
  return bucket.id
}

/**
 * 删除文件（需传入 bucketId，以便从对应桶删除；fileSize 可选，用于扣减桶已用容量）
 */
export async function deleteFile(filename, bucketId, fileSize) {
  const bid = bucketId || await getDefaultBucketId()
  const bucket = await getBucketById(bid)
  if (!bucket) return false

  const driver = (bucket.driver || 'local').toLowerCase()
  const webdavFromConfig = bucket.webdav || null
  const telegramFromConfig = bucket.telegram || null

  if (driver === 'local') {
    const filepath = getLocalFilePath(bucket.id, filename)
    if (existsSync(filepath)) unlinkSync(filepath)
    else if (bucket.id === 'default') {
      const legacy = join(uploadsDir, filename)
      if (existsSync(legacy)) unlinkSync(legacy)
    }
    if (fileSize != null) await updateBucketUsedSize(bucket.id, -fileSize)
    return true
  }

  if (driver === 'webdav') {
    const { baseUrl, username, password } = resolveWebdavConfig(webdavFromConfig, bucket.name)
    const url = buildWebdavFileUrl(baseUrl, filename)
    const authHeader = getWebdavAuthHeader(username, password)
    const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': authHeader } })
    if (res.ok || res.status === 404) {
      if (fileSize != null) await updateBucketUsedSize(bucket.id, -fileSize)
      return true
    }
    const text = await res.text().catch(() => '')
    console.error('[Storage] WebDAV 删除失败:', res.status, res.statusText, text.slice(0, 200))
    return false
  }

  if (driver === 'telegram') {
    const { token, chatId, apiBaseUrl } = resolveTelegramConfig(telegramFromConfig)
    try {
      let meta = await db.storageMeta.findOne({ filename, bucketId: bucket.id })
      if (!meta) meta = await db.storageMeta.findOne({ filename })
      if (meta?.messageId) {
        const url = `${apiBaseUrl}/bot${token}/deleteMessage`
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: meta.messageId })
        }).catch(err => console.warn('[Storage] Telegram 删除消息失败（忽略）:', err?.message || err))
      }
      await db.storageMeta.remove({ filename, bucketId: bucket.id }, { multi: false })
      if (meta && !meta.bucketId) await db.storageMeta.remove({ filename }, { multi: false })
      if (fileSize != null) await updateBucketUsedSize(bucket.id, -fileSize)
    } catch (err) {
      console.error('[Storage] 删除 Telegram 元信息失败:', err)
    }
    return true
  }

  return false
}

/**
 * 检查文件是否存在（bucketId 为空时使用默认桶，兼容旧数据）
 */
export async function fileExists(filename, bucketId) {
  const bid = bucketId || await getDefaultBucketId()
  const bucket = await getBucketById(bid)
  if (!bucket) return false

  const driver = (bucket.driver || 'local').toLowerCase()
  const webdavFromConfig = bucket.webdav || null

  if (driver === 'local') {
    const filepath = getLocalFilePath(bucket.id, filename)
    if (existsSync(filepath)) return true
    if (bucket.id === 'default') return existsSync(join(uploadsDir, filename))
    return false
  }
  if (driver === 'webdav') {
    const { baseUrl, username, password } = resolveWebdavConfig(webdavFromConfig, bucket.name)
    const url = buildWebdavFileUrl(baseUrl, filename)
    const authHeader = getWebdavAuthHeader(username, password)
    const headers = { 'Authorization': authHeader }
    let res = await fetch(url, { method: 'HEAD', headers })
    if (res.ok) return true
    // 部分 WebDAV（如 Nextcloud）对 HEAD 不支持或误报 404，用 Range GET 再判一次
    if (res.status === 404 || res.status === 405) {
      res = await fetch(url, { method: 'GET', headers: { ...headers, 'Range': 'bytes=0-0' } })
      if (res.ok || res.status === 206) return true
      if (res.status === 404) return false
    }
    if (res.status === 404) return false
    console.warn('[Storage] WebDAV 检查文件存在失败:', res.status, res.statusText)
    return false
  }
  if (driver === 'telegram') {
    try {
      let meta = await db.storageMeta.findOne({ filename, bucketId: bucket.id })
      if (!meta) meta = await db.storageMeta.findOne({ filename })
      return !!meta
    } catch (err) {
      console.error('[Storage] 查询 Telegram 元信息失败:', err)
      return false
    }
  }
  return false
}

/**
 * 读取文件为 Buffer（bucketId 为空时使用默认桶）
 */
export async function getFileBuffer(filename, bucketId) {
  const bid = bucketId || await getDefaultBucketId()
  const bucket = await getBucketById(bid)
  if (!bucket) throw new Error('[Storage] 未找到储存桶')

  const driver = (bucket.driver || 'local').toLowerCase()
  const webdavFromConfig = bucket.webdav || null
  const telegramFromConfig = bucket.telegram || null

  if (driver === 'local') {
    const filepath = getLocalFilePath(bucket.id, filename)
    if (existsSync(filepath)) return await readFile(filepath)
    if (bucket.id === 'default') {
      const legacy = join(uploadsDir, filename)
      if (existsSync(legacy)) return await readFile(legacy)
    }
    throw new Error('[Storage] 本地文件不存在')
  }
  if (driver === 'webdav') {
    const { baseUrl, username, password } = resolveWebdavConfig(webdavFromConfig, bucket.name)
    const url = buildWebdavFileUrl(baseUrl, filename)
    const authHeader = getWebdavAuthHeader(username, password)
    const res = await fetch(url, { method: 'GET', headers: { 'Authorization': authHeader } })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`[Storage] WebDAV 读取文件失败: ${res.status} ${res.statusText} ${text.slice(0, 200)}`)
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
  if (driver === 'telegram') {
    const { token, apiBaseUrl } = resolveTelegramConfig(telegramFromConfig)
    let meta = await db.storageMeta.findOne({ filename, bucketId: bucket.id })
    if (!meta) meta = await db.storageMeta.findOne({ filename })
    if (!meta?.fileId) throw new Error('[Storage] Telegram 元信息不存在或缺少 fileId')
    const fileInfoUrl = `${apiBaseUrl}/bot${token}/getFile?file_id=${encodeURIComponent(meta.fileId)}`
    const infoRes = await fetch(fileInfoUrl)
    const infoJson = await infoRes.json().catch(() => null)
    if (!infoRes.ok || !infoJson?.ok || !infoJson.result?.file_path) {
      const msg = infoJson?.description || infoRes.statusText
      throw new Error(`[Storage] Telegram 获取文件信息失败: ${infoRes.status} ${msg}`)
    }
    const filePath = infoJson.result.file_path
    const fileUrl = `${apiBaseUrl}/file/bot${token}/${filePath}`
    const fileRes = await fetch(fileUrl)
    if (!fileRes.ok) {
      const text = await fileRes.text().catch(() => '')
      throw new Error(`[Storage] Telegram 读取文件失败: ${fileRes.status} ${fileRes.statusText} ${text.slice(0, 200)}`)
    }
    const arrayBuffer = await fileRes.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
  throw new Error('[Storage] 不支持的存储驱动')
}

/**
 * 获取可读流（用于直接响应图片）（bucketId 为空时使用默认桶）
 */
export async function getFileStream(filename, bucketId) {
  const bid = bucketId || await getDefaultBucketId()
  const bucket = await getBucketById(bid)
  if (!bucket) throw new Error('[Storage] 未找到储存桶')

  const driver = (bucket.driver || 'local').toLowerCase()
  if (driver === 'local') {
    const filepath = getLocalFilePath(bucket.id, filename)
    if (existsSync(filepath)) return createReadStream(filepath)
    if (bucket.id === 'default') {
      const legacy = join(uploadsDir, filename)
      if (existsSync(legacy)) return createReadStream(legacy)
    }
    throw new Error('[Storage] 本地文件不存在')
  }
  if (driver === 'webdav' || driver === 'telegram') {
    const buffer = await getFileBuffer(filename, bucket.id)
    return Readable.from(buffer)
  }
  throw new Error('[Storage] 不支持的存储驱动')
}

