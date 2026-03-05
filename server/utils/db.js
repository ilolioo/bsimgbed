import Datastore from '@seald-io/nedb'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 数据目录：生产环境使用 /app/db，开发环境使用项目根目录下的 db
const dataDir = process.env.NODE_ENV === 'production'
  ? '/app/db'
  : join(process.cwd(), 'db')

// 确保 db 目录存在
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

console.log('[Database] 数据目录:', dataDir)

// 创建数据库实例
const users = new Datastore({
  filename: join(dataDir, 'users.db'),
  autoload: true
})

const images = new Datastore({
  filename: join(dataDir, 'images.db'),
  autoload: true
})

const apikeys = new Datastore({
  filename: join(dataDir, 'apikeys.db'),
  autoload: true
})

const settings = new Datastore({
  filename: join(dataDir, 'settings.db'),
  autoload: true
})

// 内容审核任务表
const moderationTasks = new Datastore({
  filename: join(dataDir, 'moderation_tasks.db'),
  autoload: true
})

// IP 黑名单表
const ipBlacklist = new Datastore({
  filename: join(dataDir, 'ip_blacklist.db'),
  autoload: true
})

// 存储元信息表（用于第三方存储，如 Telegram）
const storageMeta = new Datastore({
  filename: join(dataDir, 'storage_meta.db'),
  autoload: true
})

// Promise 化数据库操作
const promisify = (db) => ({
  findOne: (query) => db.findOneAsync(query),
  find: (query) => db.findAsync(query),
  insert: (doc) => db.insertAsync(doc),
  update: (query, update, options = {}) => db.updateAsync(query, update, options),
  remove: (query, options = {}) => db.removeAsync(query, options),
  count: (query) => db.countAsync(query),
  ensureIndex: (options) => db.ensureIndexAsync(options)
})

export const db = {
  users: promisify(users),
  images: promisify(images),
  apikeys: promisify(apikeys),
  settings: promisify(settings),
  moderationTasks: promisify(moderationTasks),
  ipBlacklist: promisify(ipBlacklist),
  storageMeta: promisify(storageMeta)
}

// 支持 sort/skip/limit 的查询（用于分页，避免全量加载）
function findWithOptions (rawStore, query, options = {}) {
  const { sort = {}, skip = 0, limit } = options
  return new Promise((resolve, reject) => {
    let cursor = rawStore.find(query)
    if (Object.keys(sort).length) cursor = cursor.sort(sort)
    if (skip > 0) cursor = cursor.skip(skip)
    if (limit != null && limit > 0) cursor = cursor.limit(limit)
    cursor.exec((err, docs) => (err ? reject(err) : resolve(docs)))
  })
}

db.images.findWithOptions = (query, options) => findWithOptions(images, query, options)

// 为图片列表排序建立索引，加速分页查询
images.ensureIndex({ fieldName: 'uploadedAt', unique: false }, (err) => {
  if (err) console.error('[Database] images.uploadedAt 索引创建失败:', err)
})

export default db
