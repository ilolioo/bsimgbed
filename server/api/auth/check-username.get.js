import db from '../../utils/db.js'

// 与注册逻辑一致：至少4位，不能为纯数字，仅允许英文字母、数字、下划线
const USERNAME_MIN_LEN = 4
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const raw = query.username != null ? String(query.username).trim() : ''

    if (!raw) {
      return {
        success: true,
        available: false,
        message: '请输入用户名'
      }
    }

    if (raw.length < USERNAME_MIN_LEN) {
      return {
        success: true,
        available: false,
        message: '用户名至少 4 位'
      }
    }

    if (/^\d+$/.test(raw)) {
      return {
        success: true,
        available: false,
        message: '用户名不能为纯数字'
      }
    }

    if (!USERNAME_REGEX.test(raw)) {
      return {
        success: true,
        available: false,
        message: '用户名仅支持英文、数字、下划线'
      }
    }

    const existing = await db.users.findOne({ username: raw })
    return {
      success: true,
      available: !existing,
      message: existing ? '用户名已存在' : '用户名可用'
    }
  } catch (error) {
    console.error('[Auth] 检查用户名失败:', error)
    throw createError({
      statusCode: 500,
      message: '检查失败'
    })
  }
})
