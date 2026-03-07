import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    // 获取当前设置
    const currentSettings = await db.settings.findOne({ key: 'appSettings' })
    const currentValue = currentSettings?.value || {
      appName: 'bsimgbed',
      appLogo: '',
      favicon: '',
      backgroundUrl: '',
      backgroundBlur: 0,
      siteUrl: '',
      announcement: {
        enabled: false,
        content: '',
        displayType: 'modal'
      }
    }

    // 获取请求体
    const body = await readBody(event)

    // 构建更新对象 - 只更新传递的字段
    const updatedValue = { ...currentValue }

    // 更新 appName（如果传递了）
    if (body.appName !== undefined) {
      updatedValue.appName = body.appName || 'bsimgbed'
    }

    // 更新 appLogo（如果传递了）
    if (body.appLogo !== undefined) {
      updatedValue.appLogo = body.appLogo || ''
    }

    // 更新 favicon（如果传递了）
    if (body.favicon !== undefined) {
      updatedValue.favicon = (body.favicon || '').trim()
    }

    // 更新 backgroundUrl（如果传递了）
    if (body.backgroundUrl !== undefined) {
      updatedValue.backgroundUrl = body.backgroundUrl || ''
    }

    // 更新 backgroundBlur（如果传递了）
    if (body.backgroundBlur !== undefined) {
      let blurValue = parseInt(body.backgroundBlur) || 0
      if (blurValue < 0) blurValue = 0
      if (blurValue > 20) blurValue = 20
      updatedValue.backgroundBlur = blurValue
    }

    // 更新 siteUrl（如果传递了）
    if (body.siteUrl !== undefined) {
      let siteUrlValue = (body.siteUrl || '').trim()
      if (siteUrlValue) {
        siteUrlValue = siteUrlValue.replace(/\/+$/, '')
      }
      updatedValue.siteUrl = siteUrlValue
    }

    if (body.registrationEnabled !== undefined) {
      updatedValue.registrationEnabled = !!body.registrationEnabled
    }

    const defaultBlock = { enabled: false, content: '', displayType: 'modal' }
    const defaultAnnouncement = { guest: { ...defaultBlock }, user: { ...defaultBlock } }

    function mergeBlock(target, source) {
      if (!source || typeof source !== 'object') return target
      return {
        enabled: source.enabled !== undefined ? !!source.enabled : target.enabled,
        content: source.content !== undefined ? source.content : target.content,
        displayType: source.displayType !== undefined && ['modal', 'banner'].includes(source.displayType) ? source.displayType : target.displayType
      }
    }

    // 更新 announcement（如果传递了）
    if (body.announcement !== undefined) {
      if (body.announcement === null) {
        updatedValue.announcement = defaultAnnouncement
      } else {
        const cur = currentValue.announcement || {}
        const curGuest = cur.guest || (cur.enabled !== undefined ? cur : defaultBlock)
        const curUser = cur.user || defaultBlock
        updatedValue.announcement = {
          guest: mergeBlock(curGuest, body.announcement.guest),
          user: mergeBlock(curUser, body.announcement.user)
        }
      }
    }

    // 更新设置
    await db.settings.update(
      { key: 'appSettings' },
      {
        $set: {
          value: updatedValue,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )

    return {
      success: true,
      message: '设置已保存',
      data: updatedValue
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Settings] 更新应用设置失败:', error)
    throw createError({
      statusCode: 500,
      message: '保存设置失败'
    })
  }
})
