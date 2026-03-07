import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)
    const user = event.context.user

    const body = await readBody(event)
    const { name } = body

    if (!name || !name.trim()) {
      throw createError({
        statusCode: 400,
        message: '请输入 ApiKey 名称'
      })
    }

    const apiKey = `sk-${uuidv4().replace(/-/g, '')}`

    const newKey = {
      _id: uuidv4(),
      key: apiKey,
      name: name.trim(),
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
