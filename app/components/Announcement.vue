<template>
  <!-- 弹窗形式 -->
  <Teleport to="body">
    <Transition name="announcement-modal">
      <div
        v-if="visible && displayType === 'modal'"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="close"
      >
        <div
          class="card w-full max-w-lg p-6 shadow-2xl"
          @click.stop
        >
          <!-- 标题 -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="heroicons:megaphone" class="w-5 h-5 text-primary-500 dark:text-primary-400 shrink-0" />
              公告
            </h3>
            <button
              @click="close"
              class="text-gray-600 hover:text-gray-800 dark:text-white dark:hover:text-gray-200 transition-colors"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5 text-gray-600 dark:text-white shrink-0" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="mb-6 prose prose-sm dark:prose-invert max-w-none">
            <div v-html="content"></div>
          </div>

          <!-- 按钮 -->
          <div class="flex justify-end gap-3">
            <button
              @click="dismissForDay"
              class="btn-secondary"
            >
              不再提示
            </button>
            <button
              @click="close"
              class="btn-primary"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 顶部横幅形式（在首页上传区域上方显示） -->
  <Transition name="announcement-banner">
    <div
      v-if="visible && displayType === 'banner'"
      class="px-4 py-3 rounded-lg mb-4 bg-gray-200/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-300 border border-gray-300/50 dark:border-gray-600/50"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <Icon name="heroicons:megaphone" class="w-5 h-5 flex-shrink-0 text-gray-700 dark:text-gray-300 shrink-0" />
          <div class="prose prose-sm prose-gray-900 dark:prose-invert max-w-none flex-1 min-w-0 truncate-content text-gray-900 dark:text-gray-300 announcement-banner-content" v-html="content"></div>
        </div>
        <button
          @click="close"
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-400/30 dark:hover:bg-gray-500/50 rounded-lg transition-colors text-gray-800 dark:text-gray-300"
          title="关闭公告"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5 text-gray-800 dark:text-gray-300 shrink-0" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { useAuthStore } from '~/stores/auth'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const DISMISS_KEY_GUEST = 'announcement_guest_dismissed_until'
const DISMISS_KEY_USER = 'announcement_user_dismissed_until'

const visible = ref(false)

// 按身份选取公告：未登录用游客公告，已登录用普通用户公告
const announcement = computed(() => settingsStore.appSettings.announcement || {})
const currentBlock = computed(() => {
  const a = announcement.value
  if (authStore.isAuthenticated) return a.user || { enabled: false, displayType: 'modal', items: [{ id: '1', content: '' }] }
  return a.guest || (a.enabled !== undefined ? a : { enabled: false, displayType: 'modal', items: [{ id: '1', content: '' }] })
})
const enabled = computed(() => currentBlock.value.enabled || false)
const displayType = computed(() => currentBlock.value.displayType || 'modal')
// 多条公告：取 items 中非空 content 用分隔符合并为一段 HTML 展示
const content = computed(() => {
  const block = currentBlock.value
  const items = Array.isArray(block.items) ? block.items : (block.content !== undefined ? [{ id: '1', content: block.content }] : [])
  const parts = items.map(it => (it && it.content != null && String(it.content).trim() !== '') ? String(it.content).trim() : null).filter(Boolean)
  if (parts.length === 0) return ''
  const sep = '<hr class="my-3 border-gray-200 dark:border-gray-600" />'
  return parts.join(sep)
})

function getDismissKey() {
  return authStore.isAuthenticated ? DISMISS_KEY_USER : DISMISS_KEY_GUEST
}

function isDismissed() {
  if (typeof window === 'undefined') return false

  const dismissedUntil = localStorage.getItem(getDismissKey())
  if (!dismissedUntil) return false

  const dismissedTime = parseInt(dismissedUntil, 10)
  return Date.now() < dismissedTime
}

// 关闭公告（仅本次）
function close() {
  visible.value = false
}

// 不再提示（有效期1天）
function dismissForDay() {
  if (typeof window !== 'undefined') {
    const expireTime = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem(getDismissKey(), expireTime.toString())
  }
  visible.value = false
}

// 检查并显示公告
function checkAndShowAnnouncement() {
  if (enabled.value && content.value && !isDismissed()) {
    visible.value = true
  }
}

// 监听公告配置与登录状态变化
watch(
  () => ({ announcement: settingsStore.appSettings.announcement, isAuth: authStore.isAuthenticated }),
  () => {
    if (enabled.value && content.value && !isDismissed()) {
      visible.value = true
    }
  },
  { immediate: true }
)

// 初始化时检查是否需要显示公告
onMounted(() => {
  checkAndShowAnnouncement()
})
</script>

<style scoped>
/* 弹窗动画 */
.announcement-modal-enter-active,
.announcement-modal-leave-active {
  transition: opacity 0.3s ease;
}

.announcement-modal-enter-active .card,
.announcement-modal-leave-active .card {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.announcement-modal-enter-from,
.announcement-modal-leave-to {
  opacity: 0;
}

.announcement-modal-enter-from .card,
.announcement-modal-leave-to .card {
  transform: scale(0.95);
  opacity: 0;
}

/* 横幅动画 */
.announcement-banner-enter-active,
.announcement-banner-leave-active {
  transition: all 0.3s ease;
}

.announcement-banner-enter-from,
.announcement-banner-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* 横幅内容截断 */
.truncate-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.truncate-content :deep(p) {
  margin: 0;
  display: inline;
}

.truncate-content :deep(br) {
  display: none;
}

/* 暗色模式下横幅内正文与链接（与电脑端一致） */
.announcement-banner-content :deep(p),
.announcement-banner-content :deep(span),
.announcement-banner-content :deep(a) {
  @apply text-gray-900 dark:text-gray-300;
}
.announcement-banner-content :deep(a:hover) {
  @apply text-primary-600 dark:text-primary-400;
}
</style>