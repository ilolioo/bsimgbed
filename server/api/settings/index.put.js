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

    const defaultItems = () => [{ id: '1', content: '' }]
    const defaultBlock = () => ({ enabled: false, displayType: 'modal', items: defaultItems() })
    const defaultAnnouncement = () => ({ guest: defaultBlock(), user: defaultBlock() })

    function normalizeBlockItems(items) {
      if (!Array.isArray(items) || items.length === 0) return defaultItems()
      return items.map((it, i) => ({
        id: (it && it.id) ? String(it.id) : `item-${i + 1}`,
        content: (it && it.content !== undefined) ? String(it.content) : ''
      }))
    }

    function mergeBlock(target, source) {
      if (!source || typeof source !== 'object') return target
      const base = {
        enabled: source.enabled !== undefined ? !!source.enabled : (target.enabled !== false),
        displayType: (source.displayType && ['modal', 'banner'].includes(source.displayType)) ? source.displayType : (target.displayType || 'modal')
      }
      if (Array.isArray(source.items) && source.items.length > 0) {
        base.items = normalizeBlockItems(source.items)
      } else if (source.content !== undefined) {
        base.items = [{ id: '1', content: String(source.content) }]
      } else {
        base.items = Array.isArray(target.items) && target.items.length > 0 ? target.items : defaultItems()
      }
      return base
    }

    // 更新 announcement（如果传递了）
    if (body.announcement !== undefined) {
      if (body.announcement === null) {
        updatedValue.announcement = defaultAnnouncement()
      } else {
        const cur = currentValue.announcement || {}
        const curGuest = cur.guest || (cur.enabled !== undefined ? { enabled: cur.enabled, displayType: cur.displayType || 'modal', items: cur.content !== undefined ? [{ id: '1', content: cur.content }] : defaultItems() } : defaultBlock())
        const curUser = cur.user || defaultBlock()
        const guestBlock = mergeBlock(
          { enabled: curGuest.enabled, displayType: curGuest.displayType || 'modal', items: Array.isArray(curGuest.items) ? curGuest.items : (curGuest.content !== undefined ? [{ id: '1', content: curGuest.content }] : defaultItems()) },
          body.announcement.guest
        )
        const userBlock = mergeBlock(
          { enabled: curUser.enabled, displayType: curUser.displayType || 'modal', items: Array.isArray(curUser.items) ? curUser.items : (curUser.content !== undefined ? [{ id: '1', content: curUser.content }] : defaultItems()) },
          body.announcement.user
        )
        updatedValue.announcement = { guest: guestBlock, user: userBlock }
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
