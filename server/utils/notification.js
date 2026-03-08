/**
 * 通知服务 - 支持 Webhook、Telegram 和 Email 通知
 * 后续可扩展支持其他通知方式（钉钉等）
 */

import db from './db.js'
import TelegramBot from 'node-telegram-bot-api'
import nodemailer from 'nodemailer'
import { getFileBuffer, fileExists } from './storage.js'

// 通知类型枚举
export const NOTIFICATION_TYPES = {
  LOGIN: 'login',           // 登录通知
  UPLOAD: 'upload',         // 图片上传通知
  NSFW_DETECTED: 'nsfw',    // 鉴黄检测结果通知
  // 后续可扩展
  // DELETE: 'delete',      // 图片删除通知
  // API_KEY: 'apikey',     // API Key 操作通知
}

// 通知方式枚举
export const NOTIFICATION_METHODS = {
  WEBHOOK: 'webhook',
  TELEGRAM: 'telegram',
  EMAIL: 'email',
  SERVERCHAN: 'serverchan',
  // 后续可扩展
  // DINGTALK: 'dingtalk',
}

// 默认邮箱配置（独立于通知，用于注册验证与通知方式为邮件时）
export function getDefaultEmailConfig() {
  return {
    registrationEmailVerification: false,
    service: '',
    user: '',
    pass: '',
    to: '',
    // 自定义邮件内容（留空则使用内置默认）
    subjectPrefix: '[bsimgbed]',
    verificationSubject: '请验证你的邮箱',
    verificationBody: '', // HTML，占位符 {{username}} {{verifyUrl}}
    testSubject: '测试通知',
    testBody: '', // 留空用默认
    notificationSubjectTemplate: '{{title}}', // 占位符 {{title}}
    notificationBodyTemplate: '' // HTML，占位符 {{title}} {{message}} {{dataTable}}，留空用默认
  }
}

/**
 * 获取邮箱配置（独立存储；若未配置则从旧 notificationConfig 迁移读出）
 */
export async function getEmailConfig() {
  try {
    const doc = await db.settings.findOne({ key: 'emailConfig' })
    if (doc?.value && (doc.value.service !== undefined || doc.value.user !== undefined)) {
      const def = getDefaultEmailConfig()
      return {
        ...def,
        ...doc.value,
        registrationEmailVerification: doc.value.registrationEmailVerification !== undefined
          ? !!doc.value.registrationEmailVerification
          : def.registrationEmailVerification,
        subjectPrefix: doc.value.subjectPrefix !== undefined ? String(doc.value.subjectPrefix) : def.subjectPrefix,
        verificationSubject: doc.value.verificationSubject !== undefined ? String(doc.value.verificationSubject) : def.verificationSubject,
        verificationBody: doc.value.verificationBody !== undefined ? String(doc.value.verificationBody) : def.verificationBody,
        testSubject: doc.value.testSubject !== undefined ? String(doc.value.testSubject) : def.testSubject,
        testBody: doc.value.testBody !== undefined ? String(doc.value.testBody) : def.testBody,
        notificationSubjectTemplate: doc.value.notificationSubjectTemplate !== undefined ? String(doc.value.notificationSubjectTemplate) : def.notificationSubjectTemplate,
        notificationBodyTemplate: doc.value.notificationBodyTemplate !== undefined ? String(doc.value.notificationBodyTemplate) : def.notificationBodyTemplate
      }
    }
    const notifDoc = await db.settings.findOne({ key: 'notificationConfig' })
    const v = notifDoc?.value
    if (v) {
      const def = getDefaultEmailConfig()
      return {
        ...def,
        registrationEmailVerification: !!v.registrationEmailVerification,
        service: v.email?.service || '',
        user: v.email?.user || '',
        pass: v.email?.pass || '',
        to: v.email?.to || ''
      }
    }
    return getDefaultEmailConfig()
  } catch (error) {
    console.error('[Notification] 获取邮箱配置失败:', error)
    return getDefaultEmailConfig()
  }
}

/**
 * 保存邮箱配置
 */
export async function saveEmailConfig(config) {
  try {
    const current = await getEmailConfig()
    const def = getDefaultEmailConfig()
    const next = {
      registrationEmailVerification: config.registrationEmailVerification !== undefined ? !!config.registrationEmailVerification : current.registrationEmailVerification,
      service: (config.service !== undefined ? config.service : current.service) || '',
      user: (config.user !== undefined ? config.user : current.user) || '',
      pass: (config.pass !== undefined && config.pass !== '') ? config.pass : current.pass,
      to: (config.to !== undefined ? config.to : current.to) || '',
      subjectPrefix: config.subjectPrefix !== undefined ? String(config.subjectPrefix).trim() || def.subjectPrefix : current.subjectPrefix,
      verificationSubject: config.verificationSubject !== undefined ? String(config.verificationSubject).trim() || def.verificationSubject : current.verificationSubject,
      verificationBody: config.verificationBody !== undefined ? String(config.verificationBody) : current.verificationBody,
      testSubject: config.testSubject !== undefined ? String(config.testSubject).trim() || def.testSubject : current.testSubject,
      testBody: config.testBody !== undefined ? String(config.testBody) : current.testBody,
      notificationSubjectTemplate: config.notificationSubjectTemplate !== undefined ? String(config.notificationSubjectTemplate).trim() || def.notificationSubjectTemplate : current.notificationSubjectTemplate,
      notificationBodyTemplate: config.notificationBodyTemplate !== undefined ? String(config.notificationBodyTemplate) : current.notificationBodyTemplate
    }
    await db.settings.update(
      { key: 'emailConfig' },
      { $set: { value: next, updatedAt: new Date().toISOString() } },
      { upsert: true }
    )
    return { success: true }
  } catch (error) {
    console.error('[Notification] 保存邮箱配置失败:', error)
    return { success: false, error: error.message }
  }
}

// 默认通知配置（不再包含邮箱与注册验证，邮箱见 getEmailConfig）
export function getDefaultNotificationConfig() {
  return {
    enabled: false,
    method: NOTIFICATION_METHODS.TELEGRAM,
    types: {
      [NOTIFICATION_TYPES.LOGIN]: true,
      [NOTIFICATION_TYPES.UPLOAD]: true,
      [NOTIFICATION_TYPES.NSFW_DETECTED]: true,
    },
    webhook: {
      url: '',
      method: 'POST',
      contentType: 'application/json',
      headers: {},
      bodyTemplate: JSON.stringify({
        type: '{{type}}',
        title: '{{title}}',
        message: '{{message}}',
        timestamp: '{{timestamp}}',
        data: '{{data}}'
      }, null, 2)
    },
    telegram: {
      token: '',
      chatId: ''
    },
    email: { service: '', user: '', pass: '', to: '' },
    serverchan: {
      sendKey: ''
    }
  }
}

/**
 * 获取通知配置
 */
export async function getNotificationConfig() {
  try {
    const configDoc = await db.settings.findOne({ key: 'notificationConfig' })
    if (configDoc?.value) {
      const defaultConfig = getDefaultNotificationConfig()
      const v = configDoc.value
      return {
        ...defaultConfig,
        enabled: v.enabled !== undefined ? !!v.enabled : defaultConfig.enabled,
        method: v.method || defaultConfig.method,
        types: { ...defaultConfig.types, ...v.types },
        webhook: { ...defaultConfig.webhook, ...v.webhook },
        telegram: { ...defaultConfig.telegram, ...v.telegram },
        email: { ...defaultConfig.email },
        serverchan: { ...defaultConfig.serverchan, ...v.serverchan }
      }
    }
    return getDefaultNotificationConfig()
  } catch (error) {
    console.error('[Notification] 获取配置失败:', error)
    return getDefaultNotificationConfig()
  }
}

/**
 * 保存通知配置
 */
export async function saveNotificationConfig(config) {
  try {
    await db.settings.update(
      { key: 'notificationConfig' },
      {
        $set: {
          value: config,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )
    return { success: true }
  } catch (error) {
    console.error('[Notification] 保存配置失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 替换模板变量
 */
function replaceTemplateVariables(template, variables) {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    // 如果值是对象，转换为 JSON 字符串
    const replacement = typeof value === 'object' ? JSON.stringify(value) : String(value)
    result = result.split(placeholder).join(replacement)
  }
  return result
}

/**
 * 发送 Webhook 通知
 */
async function sendWebhookNotification(config, payload) {
  const { webhook } = config

  if (!webhook.url) {
    console.warn('[Notification] Webhook URL 未配置')
    return { success: false, error: 'Webhook URL 未配置' }
  }

  try {
    // 准备模板变量
    const variables = {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      timestamp: payload.timestamp || new Date().toISOString(),
      data: payload.data || {}
    }

    // 替换请求体模板中的变量
    let body = webhook.bodyTemplate
    body = replaceTemplateVariables(body, variables)

    // 构建请求头
    const headers = {
      'Content-Type': webhook.contentType || 'application/json',
      ...webhook.headers
    }

    // 发送请求
    const response = await fetch(webhook.url, {
      method: webhook.method || 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Notification] Webhook 请求失败:', response.status, errorText)
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`
      }
    }

    console.log('[Notification] Webhook 通知发送成功:', payload.type)
    return { success: true }
  } catch (error) {
    console.error('[Notification] Webhook 发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 检查URL是否为有效的完整URL（包含协议和主机）
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 从存储中读取图片（本地或 WebDAV）
 * @param {string} filename - 图片文件名
 * @returns {Promise<Buffer|null>} 图片Buffer，失败返回null
 */
async function readLocalImage(filename, bucketId) {
  try {
    const exists = await fileExists(filename, bucketId)
    if (!exists) {
      console.warn(`[Notification] 图片文件不存在: ${filename}`)
      return null
    }

    const buffer = await getFileBuffer(filename, bucketId)
    return buffer
  } catch (error) {
    console.warn('[Notification] 读取本地图片出错:', error.message)
    return null
  }
}

/**
 * 根据content-type获取文件扩展名
 */
function getExtensionFromContentType(contentType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg'
  }
  return map[contentType] || 'jpg'
}

/**
 * 构建 Telegram 消息文本（用于 caption 或普通消息）
 */
function buildTelegramMessage(payload, includeImageUrl = false) {
  let message = `*${escapeMarkdown(payload.title)}*\n${escapeMarkdown(payload.message)}`

  // 如果有额外数据，添加到消息中
  if (payload.data && Object.keys(payload.data).length > 0) {
    message += '\n\n*详细信息:*'
    for (const [key, value] of Object.entries(payload.data)) {
      // 跳过图片URL（除非明确要求包含）
      if (!includeImageUrl && (key === 'url' || key === 'imageUrl')) continue
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value
      message += `\n• ${key}: \`${escapeMarkdown(String(displayValue))}\``
    }
  }

  return message
}

/**
 * 发送 Telegram 通知
 */
async function sendTelegramNotification(config, payload) {
  const { telegram } = config

  if (!telegram.token || !telegram.chatId) {
    console.warn('[Notification] Telegram Token 或 Chat ID 未配置')
    return { success: false, error: 'Telegram Token 或 Chat ID 未配置' }
  }

  try {
    console.log('[Notification] Telegram 通知预发送:', payload.title)

    // 创建 Bot 实例，从环境变量读取 API 地址（用于反代）
    const botOptions = {}
    const apiUrl = process.env.TELEGRAM_API_URL
    if (apiUrl) {
      botOptions.baseApiUrl = apiUrl
      console.log('[Notification] 使用自定义 Telegram API 地址:', apiUrl)
    }
    const bot = new TelegramBot(telegram.token, botOptions)
    const chatId = Number(telegram.chatId)

    // 检查是否有有效的图片URL需要发送
    const imageUrl = payload.data?.url || payload.data?.imageUrl
    const hasValidImageUrl = isValidImageUrl(imageUrl)

    // 优先尝试从本地读取图片文件
    const localFilename = payload.data?.filename
    let imageBuffer = null

    if (localFilename) {
      console.log('[Notification] 尝试读取本地图片:', localFilename)
      imageBuffer = await readLocalImage(localFilename, payload.data?.bucketId)
    }

    if (imageBuffer) {
      // 成功读取本地图片，使用Buffer发送
      const caption = buildTelegramMessage(payload, false)
      const format = payload.data?.format || getExtensionFromContentType('image/jpeg')
      const contentType = `image/${format === 'jpg' ? 'jpeg' : format}`

      try {
        // 使用 sendPhoto API 发送图片（使用Buffer）
        await bot.sendPhoto(chatId, imageBuffer, {
          caption: caption,
          parse_mode: 'Markdown'
        }, {
          filename: localFilename,
          contentType: contentType
        })
        console.log('[Notification] Telegram 图片通知发送成功:', payload.title)
      } catch (photoError) {
        // 如果 sendPhoto 失败，回退到普通消息
        console.warn('[Notification] Telegram sendPhoto 失败，回退到普通消息:', photoError.message)

        let fallbackMessage = buildTelegramMessage(payload, true)
        if (hasValidImageUrl) {
          fallbackMessage += `\n\n🔗 [查看图片](${imageUrl})`
        }

        await bot.sendMessage(chatId, fallbackMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
        console.log('[Notification] Telegram 回退消息发送成功:', payload.title)
      }
    } else if (hasValidImageUrl) {
      // 本地读取失败但有URL，发送带链接的文本消息
      console.warn('[Notification] 本地图片读取失败，发送带链接的文本消息')

      let fallbackMessage = buildTelegramMessage(payload, true)
      fallbackMessage += `\n\n🔗 [查看图片](${imageUrl})`

      await bot.sendMessage(chatId, fallbackMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    } else {
      // 没有有效图片URL时，发送普通文本消息
      const message = buildTelegramMessage(payload, true)
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    }

    console.log('[Notification] Telegram 通知发送成功:', payload.title)
    return { success: true }
  } catch (error) {
    console.error('[Notification] Telegram 发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 转义 Telegram Markdown 特殊字符
 * 注意：Telegram 的 Markdown 模式只需要转义少量字符
 * 参考：https://core.telegram.org/bots/api#markdown-style
 */
function escapeMarkdown(text) {
  if (!text) return ''
  return String(text).replace(/([_*`\[])/g, '\\$1')
}

function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 生成邮件 HTML 模板
 */
function generateEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 2px solid #007bff;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #007bff;
      font-size: 24px;
    }
    .content {
      padding: 10px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .info-item {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #555;
    }
    .info-value {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>此邮件由 bsimgbed 图床系统自动发送</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * 发送 Email 通知（使用独立邮箱配置）
 */
async function sendEmailNotification(config, payload) {
  const email = await getEmailConfig()

  if (!email.service || !email.user || !email.pass) {
    console.warn('[Notification] Email 配置不完整，请在设置-邮箱设置中配置')
    return { success: false, error: 'Email 配置不完整（需在邮箱设置中填写 service、user、pass）' }
  }

  try {
    console.log('[Notification] 邮件通知预发送:', payload.title)

    const transporter = nodemailer.createTransport({
      service: email.service,
      auth: {
        user: email.user,
        pass: email.pass
      }
    })

    // 检查是否有有效的图片URL
    const imageUrl = payload.data?.url || payload.data?.imageUrl
    const hasValidImageUrl = isValidImageUrl(imageUrl)

    // 构建邮件内容
    let htmlContent = `
      <div class="header">
        <h1>${payload.title}</h1>
      </div>
      <div class="content">
        <p>${payload.message}</p>
    `

    // 如果有有效的图片URL，在邮件中显示图片
    if (hasValidImageUrl) {
      htmlContent += `
        <div style="margin-top: 20px; text-align: center;">
          <img src="${imageUrl}" alt="上传的图片" style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          <p style="margin-top: 10px; font-size: 12px; color: #666;">
            <a href="${imageUrl}" target="_blank" style="color: #007bff;">点击查看原图</a>
          </p>
        </div>
      `
    }

    // 如果有额外数据，添加到邮件中
    if (payload.data && Object.keys(payload.data).length > 0) {
      htmlContent += '<div style="margin-top: 20px;"><h3>详细信息</h3>'
      for (const [key, value] of Object.entries(payload.data)) {
        // 跳过图片URL，因为已经显示了图片
        if (key === 'url' || key === 'imageUrl') continue
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value
        htmlContent += `
          <div class="info-item">
            <span class="info-label">${key}:</span>
            <span class="info-value">${displayValue}</span>
          </div>
        `
      }
      htmlContent += '</div>'
    }

    htmlContent += '</div>'

    // 收件人地址，默认发送给自己
    const toAddress = email.to || email.user

    const prefix = (email.subjectPrefix != null && String(email.subjectPrefix).trim()) ? String(email.subjectPrefix).trim() : '[bsimgbed]'
    const subjTpl = (email.notificationSubjectTemplate != null && String(email.notificationSubjectTemplate).trim()) ? String(email.notificationSubjectTemplate).trim() : '{{title}}'
    const subject = `${prefix} ${subjTpl.replace(/\{\{title\}\}/g, payload.title)}`

    let finalHtml = htmlContent
    const bodyTpl = email.notificationBodyTemplate != null ? String(email.notificationBodyTemplate).trim() : ''
    if (bodyTpl) {
      const dataTable = payload.data && Object.keys(payload.data).length > 0
        ? '<div style="margin-top:20px;"><h3>详细信息</h3>' + Object.entries(payload.data)
          .filter(([k]) => k !== 'url' && k !== 'imageUrl')
          .map(([k, v]) => `<div class="info-item"><span class="info-label">${escapeHtml(k)}:</span><span class="info-value">${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</span></div>`).join('') + '</div>'
        : ''
      const imageUrl = payload.data?.url || payload.data?.imageUrl
      const imageHtml = isValidImageUrl(imageUrl)
        ? `<div style="margin-top: 20px; text-align: center;"><img src="${escapeHtml(imageUrl)}" alt="上传的图片" style="max-width: 100%; max-height: 400px; border-radius: 8px;" /><p style="margin-top: 10px; font-size: 12px; color: #666;"><a href="${escapeHtml(imageUrl)}" target="_blank" style="color: #007bff;">点击查看原图</a></p></div>`
        : ''
      finalHtml = bodyTpl
        .replace(/\{\{title\}\}/g, escapeHtml(payload.title))
        .replace(/\{\{message\}\}/g, escapeHtml(payload.message))
        .replace(/\{\{dataTable\}\}/g, dataTable)
        .replace(/\{\{imageHtml\}\}/g, imageHtml)
    }

    // 发送邮件
    await transporter.sendMail({
      from: email.user,
      to: toAddress,
      subject,
      html: generateEmailTemplate(finalHtml)
    })

    console.log('[Notification] 邮件通知发送成功:', payload.title)
    return { success: true }
  } catch (error) {
    console.error('[Notification] 邮件发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 发送 Server酱 通知
 */
async function sendServerChanNotification(config, payload) {
  const { serverchan } = config

  if (!serverchan.sendKey) {
    console.warn('[Notification] Server酱 SendKey 未配置')
    return { success: false, error: 'Server酱 SendKey 未配置' }
  }

  try {
    console.log('[Notification] Server酱通知预发送:', payload.title)

    const url = `https://sctapi.ftqq.com/${serverchan.sendKey}.send`

    // 检查是否有有效的图片URL
    const imageUrl = payload.data?.url || payload.data?.imageUrl
    const hasValidImageUrl = isValidImageUrl(imageUrl)

    // 构建消息内容（Markdown 格式）
    let content = payload.message

    // 如果有有效的图片URL，使用 Markdown 语法显示图片
    if (hasValidImageUrl) {
      content += `\n\n![图片预览](${imageUrl})`
    }

    // 如果有额外数据，添加到消息中
    if (payload.data && Object.keys(payload.data).length > 0) {
      content += '\n\n### 详细信息\n'
      for (const [key, value] of Object.entries(payload.data)) {
        // 跳过图片URL，因为已经显示了图片
        if (key === 'url' || key === 'imageUrl') continue
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value
        content += `\n- **${key}**: ${displayValue}`
      }
    }

    // 发送请求
    const params = new URLSearchParams({
      text: payload.title,
      desp: content
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    const data = await response.json()

    if (data.code !== 0) {
      console.error('[Notification] Server酱发送失败:', data)
      return { success: false, error: data.message || 'Server酱发送失败' }
    }

    console.log('[Notification] Server酱通知发送成功:', payload.title)
    return { success: true }
  } catch (error) {
    console.error('[Notification] Server酱发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 发送通知
 * @param {string} type - 通知类型
 * @param {object} payload - 通知内容
 */
export async function sendNotification(type, payload) {
  try {
    const config = await getNotificationConfig()

    // 检查通知是否启用
    if (!config.enabled) {
      return { success: true, skipped: true, reason: '通知功能未启用' }
    }

    // 检查该类型通知是否启用
    if (!config.types[type]) {
      return { success: true, skipped: true, reason: `${type} 类型通知未启用` }
    }

    // 根据通知方式发送
    switch (config.method) {
      case NOTIFICATION_METHODS.WEBHOOK:
        return await sendWebhookNotification(config, {
          type,
          ...payload,
          timestamp: new Date().toISOString()
        })

      case NOTIFICATION_METHODS.TELEGRAM:
        return await sendTelegramNotification(config, {
          type,
          ...payload,
          timestamp: new Date().toISOString()
        })

      case NOTIFICATION_METHODS.EMAIL:
        return await sendEmailNotification(config, {
          type,
          ...payload,
          timestamp: new Date().toISOString()
        })

      case NOTIFICATION_METHODS.SERVERCHAN:
        return await sendServerChanNotification(config, {
          type,
          ...payload,
          timestamp: new Date().toISOString()
        })

      default:
        return { success: false, error: `不支持的通知方式: ${config.method}` }
    }
  } catch (error) {
    console.error('[Notification] 发送通知失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 发送登录通知
 */
export async function sendLoginNotification(username, ip, userAgent) {
  return sendNotification(NOTIFICATION_TYPES.LOGIN, {
    title: '登录通知',
    message: `用户 ${username} 已登录`,
    data: {
      username,
      ip,
      userAgent,
      loginTime: new Date().toISOString()
    }
  })
}

/**
 * 发送上传通知
 */
export async function sendUploadNotification(imageInfo, uploaderInfo) {
  return sendNotification(NOTIFICATION_TYPES.UPLOAD, {
    title: '图片上传通知',
    message: `新图片已上传: ${imageInfo.filename}`,
    data: {
      imageId: imageInfo.id,
      filename: imageInfo.filename,
      format: imageInfo.format,
      size: imageInfo.size,
      url: imageInfo.url,
      bucketId: imageInfo.bucketId,
      uploader: uploaderInfo.name,
      uploaderType: uploaderInfo.type,
      ip: uploaderInfo.ip,
      uploadTime: new Date().toISOString()
    }
  })
}

/**
 * 发送鉴黄检测结果通知
 */
export async function sendNsfwNotification(imageInfo, moderationResult) {
  const isNsfw = moderationResult.isNsfw
  return sendNotification(NOTIFICATION_TYPES.NSFW_DETECTED, {
    title: isNsfw ? '⚠️ 检测到违规图片' : '图片审核通过',
    message: isNsfw
      ? `图片 ${imageInfo.filename} 被检测为违规内容`
      : `图片 ${imageInfo.filename} 审核通过`,
    data: {
      imageId: imageInfo.id,
      filename: imageInfo.filename,
      url: imageInfo.url,
      isNsfw,
      score: moderationResult.score,
      provider: moderationResult.provider,
      checkTime: new Date().toISOString()
    }
  })
}

/**
 * 测试 Webhook 连接
 */
export async function testWebhook(webhookConfig) {
  try {
    const testPayload = {
      type: 'test',
      title: '测试通知',
      message: '这是一条测试通知，用于验证 Webhook 配置是否正确。',
      timestamp: new Date().toISOString(),
      data: { test: true }
    }

    // 替换模板变量
    let body = webhookConfig.bodyTemplate
    body = replaceTemplateVariables(body, testPayload)

    const headers = {
      'Content-Type': webhookConfig.contentType || 'application/json',
      ...webhookConfig.headers
    }

    const response = await fetch(webhookConfig.url, {
      method: webhookConfig.method || 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`
      }
    }

    return { success: true, message: '测试通知发送成功' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * 测试 Telegram 连接
 */
export async function testTelegram(telegramConfig) {
  try {
    if (!telegramConfig.token || !telegramConfig.chatId) {
      return { success: false, error: '请提供 Token 和 Chat ID' }
    }

    console.log('[Notification] Telegram 测试通知预发送')

    const message = `*测试通知*\n这是一条测试通知，用于验证 Telegram 配置是否正确。\n\n_发送时间: ${new Date().toISOString()}_`

    // 创建 Bot 实例，从环境变量读取 API 地址（用于反代）
    const botOptions = {}
    const apiUrl = process.env.TELEGRAM_API_URL
    if (apiUrl) {
      botOptions.baseApiUrl = apiUrl
      console.log('[Notification] 使用自定义 Telegram API 地址:', apiUrl)
    }
    const bot = new TelegramBot(telegramConfig.token, botOptions)
    await bot.sendMessage(Number(telegramConfig.chatId), message, { parse_mode: 'Markdown' })

    console.log('[Notification] Telegram 测试通知发送成功')
    return { success: true, message: '测试通知发送成功' }
  } catch (error) {
    console.error('[Notification] Telegram 测试失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 发送注册邮箱验证邮件
 * @param {string} toEmail - 收件人邮箱
 * @param {string} username - 用户名
 * @param {string} verifyUrl - 验证链接
 */
export async function sendVerificationEmail(toEmail, username, verifyUrl) {
  const emailConfig = await getEmailConfig()
  if (!emailConfig.service || !emailConfig.user || !emailConfig.pass) {
    throw new Error('邮件服务未配置，请在设置-邮箱设置中配置')
  }
  const transporter = nodemailer.createTransport({
    service: emailConfig.service,
    auth: { user: emailConfig.user, pass: emailConfig.pass }
  })
  const prefix = (emailConfig.subjectPrefix != null && String(emailConfig.subjectPrefix).trim()) ? String(emailConfig.subjectPrefix).trim() : '[bsimgbed]'
  const subj = (emailConfig.verificationSubject != null && String(emailConfig.verificationSubject).trim()) ? String(emailConfig.verificationSubject).trim() : '请验证你的邮箱'
  const subject = `${prefix} ${subj}`

  let htmlContent
  const bodyTpl = emailConfig.verificationBody != null ? String(emailConfig.verificationBody).trim() : ''
  if (bodyTpl) {
    htmlContent = bodyTpl
      .replace(/\{\{username\}\}/g, escapeHtml(username))
      .replace(/\{\{verifyUrl\}\}/g, escapeHtml(verifyUrl))
  } else {
    htmlContent = `
    <div class="header">
      <h1>邮箱验证</h1>
    </div>
    <div class="content">
      <p>你好，<strong>${escapeHtml(username)}</strong>：</p>
      <p>你正在注册账号，请点击下方链接完成邮箱验证（链接 24 小时内有效）：</p>
      <p style="margin: 20px 0;"><a href="${escapeHtml(verifyUrl)}" style="color: #007bff; word-break: break-all;">${escapeHtml(verifyUrl)}</a></p>
      <p style="color: #666; font-size: 14px;">如非本人操作，请忽略此邮件。</p>
    </div>
  `
  }
  await transporter.sendMail({
    from: emailConfig.user,
    to: toEmail,
    subject,
    html: generateEmailTemplate(htmlContent)
  })
}

/**
 * 测试 Email 连接
 */
export async function testEmail(emailConfig) {
  try {
    if (!emailConfig.service || !emailConfig.user || !emailConfig.pass) {
      return { success: false, error: '请提供完整的邮件配置（service、user、pass）' }
    }

    console.log('[Notification] Email 测试通知预发送')

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      service: emailConfig.service,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    })

    // 收件人地址，默认发送给自己
    const toAddress = emailConfig.to || emailConfig.user

    const prefix = (emailConfig.subjectPrefix != null && String(emailConfig.subjectPrefix).trim()) ? String(emailConfig.subjectPrefix).trim() : '[bsimgbed]'
    const subj = (emailConfig.testSubject != null && String(emailConfig.testSubject).trim()) ? String(emailConfig.testSubject).trim() : '测试通知'
    const subject = `${prefix} ${subj}`

    const bodyTpl = emailConfig.testBody != null ? String(emailConfig.testBody).trim() : ''
    const htmlContent = bodyTpl || `
      <div class="header">
        <h1>测试通知</h1>
      </div>
      <div class="content">
        <p>这是一条测试通知，用于验证邮件配置是否正确。</p>
        <div class="info-item">
          <span class="info-label">发送时间:</span>
          <span class="info-value">${new Date().toISOString()}</span>
        </div>
      </div>
    `

    await transporter.sendMail({
      from: emailConfig.user,
      to: toAddress,
      subject,
      html: generateEmailTemplate(htmlContent)
    })

    console.log('[Notification] Email 测试通知发送成功')
    return { success: true, message: '测试通知发送成功' }
  } catch (error) {
    console.error('[Notification] Email 测试失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 测试 Server酱 连接
 */
export async function testServerChan(serverchanConfig) {
  try {
    if (!serverchanConfig.sendKey) {
      return { success: false, error: '请提供 Server酱 SendKey' }
    }

    console.log('[Notification] Server酱测试通知预发送')

    const url = `https://sctapi.ftqq.com/${serverchanConfig.sendKey}.send`

    const content = `这是一条测试通知，用于验证 Server酱 配置是否正确。\n\n发送时间: ${new Date().toISOString()}`

    const params = new URLSearchParams({
      text: '测试通知',
      desp: content
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    const data = await response.json()

    if (data.code !== 0) {
      console.error('[Notification] Server酱测试失败:', data)
      return { success: false, error: data.message || 'Server酱发送失败' }
    }

    console.log('[Notification] Server酱测试通知发送成功')
    return { success: true, message: '测试通知发送成功' }
  } catch (error) {
    console.error('[Notification] Server酱测试失败:', error)
    return { success: false, error: error.message }
  }
}

export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_METHODS,
  getDefaultEmailConfig,
  getEmailConfig,
  saveEmailConfig,
  getDefaultNotificationConfig,
  getNotificationConfig,
  saveNotificationConfig,
  sendNotification,
  sendLoginNotification,
  sendUploadNotification,
  sendNsfwNotification,
  sendVerificationEmail,
  testWebhook,
  testTelegram,
  testEmail,
  testServerChan
}