import db from '../../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../../utils/authMiddleware.js'
import { generateToken } from '../../../utils/jwt.js'
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
    const unsetFields = {}
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

    if (body.email !== undefined) {
      const emailStr = String(body.email).trim().toLowerCase()
      if (emailStr === '') {
        // 留空表示不修改，保持原邮箱不变
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(emailStr)) {
          throw createError({
            statusCode: 400,
            message: '邮箱格式不正确'
          })
        }
        if (emailStr !== (target.email || '')) {
          const existingByEmail = await db.users.findOne({ email: emailStr })
          if (existingByEmail && existingByEmail._id !== id) {
            throw createError({
              statusCode: 400,
              message: '该邮箱已被其他用户使用'
            })
          }
        }
        updates.email = emailStr
        updates.emailVerified = true
      }
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

    // 可上传文件大小（字节）；不传或 null 表示使用私有 API 默认
    if (body.maxFileSize !== undefined) {
      if (body.maxFileSize === null || body.maxFileSize === '') {
        unsetFields.maxFileSize = 1
      } else {
        const bytes = Number(body.maxFileSize)
        if (!Number.isFinite(bytes) || bytes < 0) {
          throw createError({
            statusCode: 400,
            message: '可上传文件大小必须为非负数字（字节）'
          })
        }
        updates.maxFileSize = Math.floor(bytes)
      }
    }

    if (Object.keys(updates).length <= 1 && Object.keys(unsetFields).length === 0) {
      return {
        success: true,
        message: '无变更',
        data: {
          id: target._id,
          username: updates.username ?? target.username,
          role: updates.role ?? target.role ?? 'user',
          disabled: updates.disabled !== undefined ? updates.disabled : (target.disabled === true),
          maxFileSize: target.maxFileSize != null ? target.maxFileSize : null
        }
      }
    }

    const updateDoc = { $set: updates }
    if (Object.keys(unsetFields).length > 0) updateDoc.$unset = unsetFields
    await db.users.update(
      { _id: id },
      updateDoc
    )

    const updated = await db.users.findOne({ _id: id })
    const data = {
      id: updated._id,
      username: updated.username,
      role: updated.role || 'user',
      disabled: updated.disabled === true,
      maxFileSize: updated.maxFileSize != null ? updated.maxFileSize : null,
      createdAt: updated.createdAt
    }
    if (isSelf && updates.username) {
      data.token = await generateToken({
        userId: updated._id,
        username: updated.username
      })
    }
    return {
      success: true,
      message: '用户已更新',
      data
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
