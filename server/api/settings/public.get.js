import db from '../../utils/db.js'
import { getEmailConfig } from '../../utils/notification.js'

export default defineEventHandler(async (event) => {
  try {
    const settings = await db.settings.findOne({ key: 'appSettings' })
    const emailConfig = await getEmailConfig()

    const defaultBlock = { enabled: false, content: '', displayType: 'modal' }
    const defaultAnnouncement = { guest: { ...defaultBlock }, user: { ...defaultBlock } }

    function normalizeAnnouncement(ann) {
      if (!ann || typeof ann !== 'object') return defaultAnnouncement
      if (ann.guest && ann.user) {
        return {
          guest: { ...defaultBlock, ...ann.guest },
          user: { ...defaultBlock, ...ann.user }
        }
      }
      const legacy = ann.enabled !== undefined ? ann : defaultBlock
      return {
        guest: { ...defaultBlock, ...(ann.guest || legacy) },
        user: { ...defaultBlock, ...(ann.user || defaultBlock) }
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
          announcement: defaultAnnouncement
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