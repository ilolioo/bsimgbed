import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    const user = event.context.user

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少 ApiKey ID'
      })
    }

    const apiKey = await db.apikeys.findOne({ _id: id })
    if (!apiKey) {
      throw createError({
        statusCode: 404,
        message: 'ApiKey 不存在'
      })
    }

    if (user.role !== 'admin' && apiKey.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        message: '无权操作此 ApiKey'
      })
    }

    // 获取请求体
    const body = await readBody(event)
    const { name, enabled, regenerate } = body

    // 构建更新对象
    const updateData = {
      updatedAt: new Date().toISOString()
    }

    // 仅管理员可修改名称
    if (user.role === 'admin' && name !== undefined) {
      updateData.name = String(name).trim()
    }

    if (enabled !== undefined) {
      updateData.enabled = enabled
    }

    // 如果需要重新生成 Key
    if (regenerate) {
      updateData.key = `sk-${uuidv4().replace(/-/g, '')}`
    }

    // 更新
    await db.apikeys.update({ _id: id }, { $set: updateData })

    // 获取更新后的数据
    const updatedKey = await db.apikeys.findOne({ _id: id })

    return {
      success: true,
      message: 'ApiKey 更新成功',
      data: {
        id: updatedKey._id,
        key: updatedKey.key,
        name: updatedKey.name,
        isDefault: updatedKey.isDefault,
        enabled: updatedKey.enabled,
        createdAt: updatedKey.createdAt,
        updatedAt: updatedKey.updatedAt
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[ApiKeys] 更新 ApiKey 失败:', error)
    throw createError({
      statusCode: 500,
      message: '更新 ApiKey 失败'
    })
  }
})
