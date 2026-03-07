import db from '../../utils/db.js'

/**
 * 公开接口：系统是否尚未创建管理员（需要跳转初始化页）
 */
export default defineEventHandler(async () => {
  const adminCount = await db.users.count({ role: 'admin' })
  return {
    success: true,
    needSetup: adminCount === 0
  }
})
