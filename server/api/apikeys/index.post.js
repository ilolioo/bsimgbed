import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    const user = event.context.user

    const body = await readBody(event)
    const isAdmin = user.role === 'admin'

    // 普通用户只能拥有一个 ApiKey
    if (!isAdmin) {
      const existingCount = await db.apikeys.count({ userId: user.userId })
      if (existingCount >= 1) {
        throw createError({
          statusCode: 400,
          message: '普通用户只能拥有一个 ApiKey，请使用或删除现有密钥后再创建'
        })
      }
    }

    // 普通用户：名称固定为用户名；管理员：使用请求体中的名称
    let nameToUse
    if (isAdmin) {
      const { name } = body
      if (!name || !String(name).trim()) {
        throw createError({
          statusCode: 400,
          message: '请输入 ApiKey 名称'
        })
      }
      nameToUse = String(name).trim()
    } else {
      nameToUse = user.username || '用户'
    }

    const apiKey = `sk-${uuidv4().replace(/-/g, '')}`

    const newKey = {
      _id: uuidv4(),
      key: apiKey,
      name: nameToUse,
      isDefault: false,
      enabled: true,
      userId: user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await db.apikeys.insert(newKey)

    return {
      success: true,
      message: 'ApiKey 创建成功',
      data: {
        id: newKey._id,
        key: newKey.key,
        name: newKey.name,
        isDefault: newKey.isDefault,
        enabled: newKey.enabled,
        createdAt: newKey.createdAt
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[ApiKeys] 创建 ApiKey 失败:', error)
    throw createError({
      statusCode: 500,
      message: '创建 ApiKey 失败'
    })
  }
})
