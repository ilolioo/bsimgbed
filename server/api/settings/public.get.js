import db from '../../utils/db.js'
import { getEmailConfig } from '../../utils/notification.js'

export default defineEventHandler(async (event) => {
  try {
    const settings = await db.settings.findOne({ key: 'appSettings' })
    const emailConfig = await getEmailConfig()

    const defaultItems = () => [{ id: '1', content: '' }]
    const defaultBlock = () => ({ enabled: false, displayType: 'modal', items: defaultItems() })
    const defaultAnnouncement = () => ({ guest: defaultBlock(), user: defaultBlock() })

    function toItems(block) {
      if (!block || typeof block !== 'object') return defaultItems()
      if (Array.isArray(block.items) && block.items.length > 0) {
        return block.items.map((it, i) => ({ id: (it && it.id) ? String(it.id) : `item-${i + 1}`, content: (it && it.content !== undefined) ? String(it.content) : '' }))
      }
      if (block.content !== undefined) return [{ id: '1', content: String(block.content) }]
      return defaultItems()
    }

    function normalizeAnnouncement(ann) {
      if (!ann || typeof ann !== 'object') return defaultAnnouncement()
      const hasGuestUser = ann.guest && ann.user
      const guestSrc = hasGuestUser ? ann.guest : (ann.enabled !== undefined ? ann : null)
      const userSrc = hasGuestUser ? ann.user : defaultBlock()
      return {
        guest: {
          enabled: !!guestSrc && guestSrc.enabled !== false,
          displayType: (guestSrc?.displayType === 'banner') ? 'banner' : 'modal',
          items: toItems(guestSrc)
        },
        user: {
          enabled: userSrc?.enabled !== false,
          displayType: (userSrc?.displayType === 'banner') ? 'banner' : 'modal',
          items: toItems(userSrc)
        }
      }
    }

    if (!settings) {
      return {
        success: true,
        data: {
          appName: 'bsimgbed',
          appLogo: '',
          favicon: '',
          backgroundUrl: '',
          backgroundBlur: 0,
          registrationEnabled: true,
          registrationEmailVerification: !!emailConfig.registrationEmailVerification,
          announcement: defaultAnnouncement()
        }
      }
    }

    return {
      success: true,
      data: {
        appName: settings.value.appName || 'bsimgbed',
        appLogo: settings.value.appLogo || '',
        favicon: settings.value.favicon || '',
        backgroundUrl: settings.value.backgroundUrl || '',
        backgroundBlur: settings.value.backgroundBlur || 0,
        registrationEnabled: settings.value.registrationEnabled !== false,
        registrationEmailVerification: !!emailConfig.registrationEmailVerification,
        announcement: normalizeAnnouncement(settings.value.announcement)
      }
    }
  } catch (error) {
    console.error('[Settings] 获取公共应用设置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取设置失败'
    })
  }
})