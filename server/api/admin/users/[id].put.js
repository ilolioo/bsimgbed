import db from '../../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../../utils/authMiddleware.js'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)
    const currentUser = event.context.user

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少用户 ID'
      })
    }

    const target = await db.users.findOne({ _id: id })
    if (!target) {
      throw createError({
        statusCode: 404,
        message: '用户不存在'
      })
    }

    const body = await readBody(event) || {}
    const isSelf = target._id === currentUser.userId

    const updates = {}
    updates.updatedAt = new Date().toISOString()

    if (body.username !== undefined) {
      const name = String(body.username).trim()
      if (name.length < 4) {
        throw createError({
          statusCode: 400,
          message: '用户名至少 4 位'
        })
      }
      if (/^\d+$/.test(name)) {
        throw createError({
          statusCode: 400,
          message: '用户名不能为纯数字'
        })
      }
      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        throw createError({
          statusCode: 400,
          message: '用户名仅支持英文、数字、下划线'
        })
      }
      if (name !== target.username) {
        const existing = await db.users.findOne({ username: name })
        if (existing) {
          throw createError({
            statusCode: 400,
            message: '用户名已存在'
          })
        }
        updates.username = name
      }
    }

    if (body.role !== undefined) {
      const role = body.role === 'admin' ? 'admin' : 'user'
      updates.role = role
    }

    if (body.disabled !== undefined) {
      if (isSelf && body.disabled === true) {
        throw createError({
          statusCode: 400,
          message: '不能禁用当前登录账号'
        })
      }
      updates.disabled = !!body.disabled
    }

    if (body.newPassword !== undefined && body.newPassword !== '') {
      const pwd = String(body.newPassword)
      if (pwd.length < 6) {
        throw createError({
          statusCode: 400,
          message: '新密码至少 6 位'
        })
      }
      if (/^\d+$/.test(pwd)) {
        throw createError({
          statusCode: 400,
          message: '密码不能为纯数字'
        })
      }
      updates.password = await bcrypt.hash(pwd, 10)
      updates.passwordChanged = true
    }

    if (Object.keys(updates).length <= 1) {
      return {
        success: true,
        message: '无变更',
        data: {
          id: target._id,
          username: updates.username ?? target.username,
          role: updates.role ?? target.role ?? 'user',
          disabled: updates.disabled !== undefined ? updates.disabled : (target.disabled === true)
        }
      }
    }

    await db.users.update(
      { _id: id },
      { $set: updates }
    )

    const updated = await db.users.findOne({ _id: id })
    return {
      success: true,
      message: '用户已更新',
      data: {
        id: updated._id,
        username: updated.username,
        role: updated.role || 'user',
        disabled: updated.disabled === true,
        createdAt: updated.createdAt
      }
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error('[Admin] 更新用户失败:', error)
    throw createError({
      statusCode: 500,
      message: '更新用户失败'
    })
  }
})
