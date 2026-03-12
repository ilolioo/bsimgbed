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

    const defaultAboutProject = 'bsimgbed 是一个简单易用的个人图床应用，支持本地磁盘、WebDAV、Telegram 等多种存储方式，可自由切换无需重启。提供公共/私有 API、API Key 管理、内容安全（NSFW 检测、违规自动处理）与通知等能力，适合自建图床与图片管理。'
    const defaultProjectInfo = [{ label: '项目地址', url: 'https://github.com/ilolioo/bsimgbed' }]

    function normalizeProjectInfo(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return defaultProjectInfo
      return arr.filter(it => it && (it.url || it.label)).map(it => ({
        label: String(it.label || '').trim() || '链接',
        url: String(it.url || '').trim()
      }))
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
          announcement: defaultAnnouncement(),
          aboutProject: defaultAboutProject,
          projectInfo: defaultProjectInfo
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
        announcement: normalizeAnnouncement(settings.value.announcement),
        aboutProject: (settings.value.aboutProject != null && settings.value.aboutProject !== '') ? String(settings.value.aboutProject) : defaultAboutProject,
        projectInfo: normalizeProjectInfo(settings.value.projectInfo)
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
