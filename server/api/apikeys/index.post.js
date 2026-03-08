import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    const user = event.context.user

    const body = await readBody(event)
    const isAdmin = user.role === 'admin'

    const existingCount = await db.apikeys.count({ userId: user.userId })
    // 普通用户最多拥有两个 ApiKey
    if (!isAdmin && existingCount >= 2) {
      throw createError({
        statusCode: 400,
        message: '普通用户最多可拥有两个 ApiKey，请使用或删除现有密钥后再创建'
      })
    }

    // 所有用户均可自定义名称，可选；未传或为空时使用用户名
    const rawName = body?.name != null ? String(body.name).trim() : ''
    const nameToUse = rawName || user.username || '用户'

    const apiKey = `sk-${uuidv4().replace(/-/g, '')}`

    // 若当前用户尚无 Key，则新建的为默认 Key；否则为非默认
    const newKey = {
      _id: uuidv4(),
      key: apiKey,
      name: nameToUse,
      isDefault: existingCount === 0,
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
