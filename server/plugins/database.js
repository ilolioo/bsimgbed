import db from '../utils/db.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { getDefaultContentSafetyConfig } from '../utils/moderation.js'

// 初始化默认管理员用户
async function initDefaultUser() {
  const existingUser = await db.users.findOne({ username: 'baisiimg' })
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('baisiimg', 10)
    await db.users.insert({
      _id: uuidv4(),
      username: 'baisiimg',
      password: hashedPassword,
      passwordChanged: false,
      role: 'admin',
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('[Database] 默认管理员用户已创建 (用户名: baisiimg, 密码: baisiimg)')
  } else {
    const updates = {}
    if (existingUser.role === undefined) {
      updates.role = 'admin'
    }
    if (existingUser.disabled === undefined) {
      updates.disabled = false
    }
    if (Object.keys(updates).length) {
      updates.updatedAt = new Date().toISOString()
      await db.users.update({ _id: existingUser._id }, { $set: updates })
      if (updates.role) console.log('[Database] 已为现有用户 baisiimg 设置 role: admin')
    }
  }
}

// 初始化 JWT 密钥
async function initJwtSecret() {
  const isProduction = process.env.NODE_ENV === 'production'
  let jwtSetting = await db.settings.findOne({ key: 'jwtSecret' })

  if (isProduction) {
    // 生产环境：每次重启都重新生成 JWT 密钥，使所有之前的 token 失效
    const secret = crypto.randomBytes(64).toString('hex')
    if (jwtSetting) {
      await db.settings.update(
        { key: 'jwtSecret' },
        { $set: { value: secret, updatedAt: new Date().toISOString() } }
      )
    } else {
      await db.settings.insert({
        _id: uuidv4(),
        key: 'jwtSecret',
        value: secret,
        createdAt: new Date().toISOString()
      })
    }
    console.log('[Database] JWT 密钥已重新生成（生产环境）')
  } else {
    // 开发环境：仅在不存在时生成，保持 token 持久化
    if (!jwtSetting) {
      const secret = crypto.randomBytes(64).toString('hex')
      await db.settings.insert({
        _id: uuidv4(),
        key: 'jwtSecret',
        value: secret,
        createdAt: new Date().toISOString()
      })
      console.log('[Database] JWT 密钥已生成（开发环境）')
    }
  }
}

// 初始化默认 ApiKey（归属默认管理员）
async function initDefaultApiKey() {
  const existingKey = await db.apikeys.findOne({ isDefault: true })
  if (!existingKey) {
    const adminUser = await db.users.findOne({ username: 'baisiimg' })
    const adminId = adminUser ? adminUser._id : null
    const apiKey = `sk-${uuidv4().replace(/-/g, '')}`
    await db.apikeys.insert({
      _id: uuidv4(),
      key: apiKey,
      name: '默认密钥',
      isDefault: true,
      enabled: true,
      userId: adminId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('[Database] 默认 ApiKey 已创建')
  }
}

// 初始化公共 API 配置
async function initPublicApiConfig() {
  const existingConfig = await db.settings.findOne({ key: 'publicApiConfig' })
  if (!existingConfig) {
    await db.settings.insert({
      _id: uuidv4(),
      key: 'publicApiConfig',
      value: {
        enabled: false,                         // 是否启用公共 API（默认关闭）
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],  // 允许的图片格式
        maxFileSize: 10 * 1024 * 1024,          // 最大文件大小 10MB
        compressToWebp: true,                   // 是否压缩转换为 WebP
        webpQuality: 80,                        // WebP 压缩质量 (100 - 20% = 80)
        rateLimit: 10,                          // 每分钟请求限制
        allowConcurrent: false,                 // 是否允许并发上传
        // 内容安全配置（从 moderation.js 获取默认配置）
        contentSafety: getDefaultContentSafetyConfig()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('[Database] 公共 API 配置已初始化')
  }
}

// 初始化私有 API 配置
async function initPrivateApiConfig() {
  const existingConfig = await db.settings.findOne({ key: 'privateApiConfig' })
  if (!existingConfig) {
    await db.settings.insert({
      _id: uuidv4(),
      key: 'privateApiConfig',
      value: {
        maxFileSize: 100 * 1024 * 1024,         // 最大文件大小 100MB
        convertToWebp: false,                   // 是否转换为 WebP
        rateLimit: 100,                         // 每分钟请求限制
        maxConcurrent: 5                        // 最大并发数
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('[Database] 私有 API 配置已初始化')
  }
}

// 初始化应用设置
async function initAppSettings() {
  const existingSettings = await db.settings.findOne({ key: 'appSettings' })
  if (!existingSettings) {
    await db.settings.insert({
      _id: uuidv4(),
      key: 'appSettings',
      value: {
        appName: 'bsimgbed',
        appLogo: '',
        favicon: '',
        registrationEnabled: true,
        registrationEmailVerification: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    console.log('[Database] 应用设置已初始化')
  }
}

// 创建数据库索引
async function createIndexes() {
  // 用户表索引
  await db.users.ensureIndex({ fieldName: 'username', unique: true })
  await db.users.ensureIndex({ fieldName: 'email' })
  await db.users.ensureIndex({ fieldName: 'emailVerificationToken' })

  // 图片表索引
  await db.images.ensureIndex({ fieldName: 'uuid', unique: true })
  await db.images.ensureIndex({ fieldName: 'uploadedAt' })
  await db.images.ensureIndex({ fieldName: 'isDeleted' })
  await db.images.ensureIndex({ fieldName: 'uploadedBy' })
  await db.images.ensureIndex({ fieldName: 'userId' })
  await db.images.ensureIndex({ fieldName: 'moderationStatus' })  // 审核状态索引
  await db.images.ensureIndex({ fieldName: 'isNsfw' })            // 违规标记索引

  // ApiKey 表索引
  await db.apikeys.ensureIndex({ fieldName: 'key', unique: true })
  await db.apikeys.ensureIndex({ fieldName: 'userId' })

  // 设置表索引
  await db.settings.ensureIndex({ fieldName: 'key', unique: true })

  // 审核任务表索引
  await db.moderationTasks.ensureIndex({ fieldName: 'imageId' })
  await db.moderationTasks.ensureIndex({ fieldName: 'status' })
  await db.moderationTasks.ensureIndex({ fieldName: 'createdAt' })

  // IP 黑名单表索引
  await db.ipBlacklist.ensureIndex({ fieldName: 'ip', unique: true })
  await db.ipBlacklist.ensureIndex({ fieldName: 'createdAt' })

  console.log('[Database] 数据库索引已创建')
}

// 多用户迁移：为已有 apikeys、images 补全 userId（归属默认管理员）
async function migrateMultiUser() {
  const adminUser = await db.users.findOne({ username: 'baisiimg' })
  if (!adminUser) return

  const adminId = adminUser._id

  const keysWithoutUserId = await db.apikeys.find({ userId: { $exists: false } })
  if (keysWithoutUserId.length > 0) {
    for (const k of keysWithoutUserId) {
      await db.apikeys.update(
        { _id: k._id },
        { $set: { userId: adminId, updatedAt: new Date().toISOString() } }
      )
    }
    console.log('[Database] 多用户迁移: 已为', keysWithoutUserId.length, '个 ApiKey 设置 userId')
  }

  const imagesWithoutUserId = await db.images.find({ userId: { $exists: false } })
  if (imagesWithoutUserId.length > 0) {
    for (const img of imagesWithoutUserId) {
      await db.images.update(
        { _id: img._id },
        { $set: { userId: adminId } }
      )
    }
    console.log('[Database] 多用户迁移: 已为', imagesWithoutUserId.length, '张图片设置 userId')
  }

  const usersWithoutDisabled = await db.users.find({ disabled: { $exists: false } })
  if (usersWithoutDisabled.length > 0) {
    for (const u of usersWithoutDisabled) {
      await db.users.update(
        { _id: u._id },
        { $set: { disabled: false, updatedAt: new Date().toISOString() } }
      )
    }
    console.log('[Database] 多用户迁移: 已为', usersWithoutDisabled.length, '个用户设置 disabled')
  }
}

// 数据库初始化
export async function initDatabase() {
  try {
    await createIndexes()
    await initDefaultUser()
    await migrateMultiUser()
    await initJwtSecret()
    await initDefaultApiKey()
    await initPublicApiConfig()
    await initPrivateApiConfig()
    await initAppSettings()
    console.log('[Database] 数据库初始化完成')
  } catch (error) {
    console.error('[Database] 数据库初始化失败:', error)
    throw error
  }
}

export default defineNitroPlugin(async () => {
  await initDatabase()
})
