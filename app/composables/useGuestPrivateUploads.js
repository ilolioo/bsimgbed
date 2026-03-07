import { ref } from 'vue'

const STORAGE_KEY = 'bsimgbed_guest_private_uploads'
const MAX_ITEMS = 50
const TTL_MS = 24 * 60 * 60 * 1000 // 1 天

// 模块级 ref，保证多组件共享同一列表
const list = ref([])

/**
 * 游客未勾选「上传后展示」时，将上传记录存到本地，1 天内在首页可见、可操作；1 天后仅管理员可见。
 */
export function useGuestPrivateUploads() {
  function load() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const arr = raw ? JSON.parse(raw) : []
      const now = Date.now()
      const filtered = arr.filter(
        (item) => now - new Date(item.uploadedAt).getTime() < TTL_MS
      )
      if (filtered.length !== arr.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      }
      list.value = filtered.slice(0, MAX_ITEMS)
    } catch (_) {
      list.value = []
    }
  }

  /**
   * @param {{ url: string, uploadedAt: string, filename?: string, id?: string }} record
   */
  function append(record) {
    if (typeof window === 'undefined') return
    load()
    const newItem = {
      url: record.url,
      uploadedAt: record.uploadedAt,
      filename: record.filename ?? record.url?.split('/').pop() ?? 'image',
      id: record.id
    }
    const arr = [newItem, ...list.value]
    const trimmed = arr.slice(0, MAX_ITEMS)
    list.value = trimmed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  }

  return { list, load, append }
}
