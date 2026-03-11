import db from '../../utils/db.js'
import { authMiddleware, requireAdmin } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  try {
    await authMiddleware(event)
    requireAdmin(event)

    // 获取应用设置
    const settings = await db.settings.findOne({ key: 'appSettings' })

    // 获取已删除图片数量
    const deletedCount = await db.images.count({ isDeleted: true })

    const defaultItems = () => [{ id: '1', content: '' }]
    const defaultBlock = () => ({ enabled: false, displayType: 'modal', items: defaultItems() })
    const defaultAnnouncement = () => ({ guest: defaultBlock(), user: defaultBlock() })

    function toItems(block) {
      if (!block || typeof block !== 'object') return defaultItems()
      if (Array.isArray(block.items) && block.items.length > 0) {
        return block.items.map((it, i) => {
          const form = (it && (it.form === 'modal' || it.form === 'banner')) ? it.form : undefined
          return {
            id: (it && it.id) ? String(it.id) : `item-${i + 1}`,
            content: (it && it.content !== undefined) ? String(it.content) : '',
            ...(form ? { form } : {})
          }
        })
      }
      if (block.content !== undefined) return [{ id: '1', content: String(block.content) }]
      return defaultItems()
    }

    function normalizeAnnouncement(ann) {
      if (!ann || typeof ann !== 'object') return defaultAnnouncement()
      const hasGuestUser = ann.guest && ann.user
      const guestSrc = hasGuestUser ? ann.guest : (ann.enabled !== undefined ? ann : null)
      const userSrc = hasGuestUser ? ann.user : defaultBlock()
      const blockOut = (src, def) => ({
        enabled: !!src && src.enabled !== false,
        displayType: (src?.displayType === 'banner') ? 'banner' : 'modal',
        bannerAutoRotate: src?.bannerAutoRotate === true,
        bannerRotateSpeed: (typeof src?.bannerRotateSpeed === 'number' && src.bannerRotateSpeed >= 1 && src.bannerRotateSpeed <= 120) ? Math.round(src.bannerRotateSpeed) : 5,
        items: toItems(src || def)
      })
      return {
        guest: blockOut(guestSrc, defaultBlock()),
        user: blockOut(userSrc, defaultBlock())
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
          siteUrl: '',
          registrationEnabled: true,
          deletedImagesCount: deletedCount,
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
        siteUrl: settings.value.siteUrl || '',
        registrationEnabled: settings.value.registrationEnabled !== false,
        deletedImagesCount: deletedCount,
        announcement: normalizeAnnouncement(settings.value.announcement)
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Settings] 获取应用设置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取设置失败'
    })
  }
})
