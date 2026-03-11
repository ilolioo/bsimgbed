<template>
  <!-- 弹窗形式（展示形式为弹窗的条目） -->
  <Teleport to="body">
    <Transition name="announcement-modal">
      <div
        v-if="showModal"
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

  <!-- 顶部横幅形式（展示形式为横幅的条目，可手动或自动轮播） -->
  <Transition name="announcement-banner">
    <div
      v-if="showBanner"
      class="px-4 py-3 rounded-lg mb-4 bg-gray-200/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-300 border border-gray-300/50 dark:border-gray-600/50"
    >
      <div class="flex items-center gap-2">
        <Icon name="heroicons:megaphone" class="w-5 h-5 flex-shrink-0 text-gray-700 dark:text-white shrink-0" />
        <!-- 多条时：上一页 -->
        <button
          v-if="bannerItems.length > 1"
          type="button"
          @click="bannerPrev"
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-400/30 dark:hover:bg-gray-500/50 transition-colors text-gray-700 dark:text-white"
          title="上一条"
        >
          <Icon name="heroicons:chevron-left" class="w-5 h-5" />
        </button>
        <!-- 当前条内容 -->
        <div class="flex-1 min-w-0 flex items-center gap-2">
          <Transition name="banner-slide" mode="out-in">
            <div
              :key="bannerIndex"
              class="prose prose-sm prose-gray-900 dark:prose-invert max-w-none flex-1 min-w-0 truncate-content text-gray-900 dark:text-gray-300 announcement-banner-content"
              v-html="bannerItems[bannerIndex] || ''"
            />
          </Transition>
        </div>
        <!-- 多条时：下一页 -->
        <button
          v-if="bannerItems.length > 1"
          type="button"
          @click="bannerNext"
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-400/30 dark:hover:bg-gray-500/50 transition-colors text-gray-700 dark:text-white"
          title="下一条"
        >
          <Icon name="heroicons:chevron-right" class="w-5 h-5" />
        </button>
        <!-- 指示点（多条时） -->
        <div v-if="bannerItems.length > 1" class="flex items-center gap-1 flex-shrink-0">
          <button
            v-for="(_, i) in bannerItems"
            :key="i"
            type="button"
            @click="bannerIndex = i"
            class="w-2 h-2 rounded-full transition-colors"
            :class="i === bannerIndex ? 'bg-primary-500 dark:bg-primary-400' : 'bg-gray-400 dark:bg-gray-500 hover:bg-gray-500 dark:hover:bg-gray-400'"
            :title="'第 ' + (i + 1) + ' 条'"
          />
        </div>
        <button
          @click="close"
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-400/30 dark:hover:bg-gray-500/50 rounded-lg transition-colors text-gray-800 dark:text-white"
          title="关闭公告"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5 text-gray-800 dark:text-white shrink-0" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  const def = { enabled: false, displayType: 'modal', bannerAutoRotate: false, bannerRotateSpeed: 5, items: [{ id: '1', content: '' }] }
  if (authStore.isAuthenticated) return a.user || def
  return a.guest || (a.enabled !== undefined ? a : def)
})
const enabled = computed(() => currentBlock.value.enabled || false)
const blockDisplayType = computed(() => currentBlock.value.displayType || 'modal')

// 每条条目的展示形式：item.form 优先，否则用块的 displayType
function itemForm(it) {
  if (it && (it.form === 'modal' || it.form === 'banner')) return it.form
  return blockDisplayType.value
}
// 弹窗用：形式为 modal 且内容非空的条目，合并为一段 HTML
const modalItems = computed(() => {
  const block = currentBlock.value
  const items = Array.isArray(block.items) ? block.items : (block.content !== undefined ? [{ id: '1', content: block.content }] : [])
  return items
    .filter(it => it && itemForm(it) === 'modal' && it.content != null && String(it.content).trim() !== '')
    .map(it => String(it.content).trim())
})
const content = computed(() => {
  if (modalItems.value.length === 0) return ''
  const sep = '<hr class="my-3 border-gray-200 dark:border-gray-600" />'
  return modalItems.value.join(sep)
})
// 横幅用：形式为 banner 且内容非空的条目（多条可手动/自动轮播）
const bannerItems = computed(() => {
  const block = currentBlock.value
  const items = Array.isArray(block.items) ? block.items : (block.content !== undefined ? [{ id: '1', content: block.content }] : [])
  return items
    .filter(it => it && itemForm(it) === 'banner' && it.content != null && String(it.content).trim() !== '')
    .map(it => String(it.content).trim())
})

const showModal = computed(() => visible.value && modalItems.value.length > 0)
const showBanner = computed(() => visible.value && bannerItems.value.length > 0)

const bannerIndex = ref(0)
watch(bannerItems, (items) => {
  const maxIdx = Math.max(0, items.length - 1)
  if (bannerIndex.value > maxIdx) bannerIndex.value = maxIdx
}, { immediate: true })
watch(() => currentBlock.value, () => { bannerIndex.value = 0 })

let bannerAutoRotateTimer = null
function clearBannerAutoRotate() {
  if (bannerAutoRotateTimer) {
    clearInterval(bannerAutoRotateTimer)
    bannerAutoRotateTimer = null
  }
}
watch(
  () => ({
    show: showBanner.value,
    auto: currentBlock.value.bannerAutoRotate,
    speed: currentBlock.value.bannerRotateSpeed,
    count: bannerItems.value.length
  }),
  (cur) => {
    clearBannerAutoRotate()
    if (cur.show && cur.auto && cur.count > 1 && cur.speed >= 1) {
      const ms = Math.min(120, Math.max(1, Number(cur.speed) || 5)) * 1000
      bannerAutoRotateTimer = setInterval(() => { bannerNext() }, ms)
    }
  },
  { immediate: true }
)
onUnmounted(clearBannerAutoRotate)

function bannerPrev() {
  const n = bannerItems.value.length
  if (n <= 1) return
  bannerIndex.value = (bannerIndex.value - 1 + n) % n
}
function bannerNext() {
  const n = bannerItems.value.length
  if (n <= 1) return
  bannerIndex.value = (bannerIndex.value + 1) % n
}

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

const hasAnyAnnouncement = computed(() => modalItems.value.length > 0 || bannerItems.value.length > 0)

// 检查并显示公告
function checkAndShowAnnouncement() {
  if (enabled.value && hasAnyAnnouncement.value && !isDismissed()) {
    visible.value = true
  }
}

// 监听公告配置与登录状态变化
watch(
  () => ({ announcement: settingsStore.appSettings.announcement, isAuth: authStore.isAuthenticated }),
  () => {
    if (enabled.value && hasAnyAnnouncement.value && !isDismissed()) {
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

/* 横幅内多条公告切换 */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.banner-slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.banner-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
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