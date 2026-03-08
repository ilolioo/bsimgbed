<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- 全局背景图片 -->
    <div
      v-if="backgroundUrl"
      class="fixed inset-0 z-0"
    >
      <img
        :src="backgroundUrl"
        alt="背景"
        class="w-full h-full object-cover"
      />
      <div
        v-if="backgroundBlur > 0"
        class="absolute inset-0"
        :style="{ backdropFilter: `blur(${backgroundBlur}px)`, WebkitBackdropFilter: `blur(${backgroundBlur}px)` }"
      ></div>
      <!-- 背景遮罩层，确保内容可读性 -->
      <div class="absolute inset-0 bg-white/30 dark:bg-gray-900/50"></div>
    </div>

    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-2">
          <!-- 左侧：Logo + 应用名称（与登录页规则一致：有 Logo 且未加载失败则显示图片，否则显示默认图标） -->
          <NuxtLink to="/" class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
            <div class="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 shrink-0">
              <img
                v-if="appLogo && !headerLogoError"
                :src="appLogo"
                :alt="appName"
                class="w-full h-full object-contain"
                @error="headerLogoError = true"
              />
              <div
                v-else
                class="w-full h-full rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center"
              >
                <Icon name="heroicons:photo" class="w-5 h-5 text-white" />
              </div>
            </div>
            <span class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">{{ appName }}</span>
          </NuxtLink>

          <!-- 右侧：导航菜单 - 移动端可横向滚动 -->
          <nav class="flex items-center gap-0.5 sm:gap-2 overflow-x-auto scrollbar-hide">
            <!-- 首页 -->
            <NuxtLink
              to="/"
              class="nav-link nav-link-icon sm:nav-link-text"
              :class="{ 'nav-link-active': route.path === '/' }"
              title="首页"
            >
              <Icon name="heroicons:home" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">首页</span>
            </NuxtLink>

            <!-- 容量 -->
            <NuxtLink
              to="/capacity"
              class="nav-link nav-link-icon sm:nav-link-text"
              :class="{ 'nav-link-active': route.path === '/capacity' }"
              title="容量"
            >
              <Icon name="heroicons:circle-stack" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">容量</span>
            </NuxtLink>

            <!-- API（登录用户可访问：API Key 与文档） -->
            <NuxtLink
              v-if="authStore.isAuthenticated"
              to="/api"
              class="nav-link nav-link-icon sm:nav-link-text"
              :class="{ 'nav-link-active': route.path === '/api' }"
              title="API"
            >
              <Icon name="heroicons:code-bracket" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">API</span>
            </NuxtLink>

            <!-- 设置（仅管理员） -->
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/settings"
              class="nav-link nav-link-icon sm:nav-link-text"
              :class="{ 'nav-link-active': route.path === '/settings' }"
              title="设置"
            >
              <Icon name="heroicons:cog-6-tooth" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">设置</span>
            </NuxtLink>

            <!-- 统计（仅管理员） -->
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/stats"
              class="nav-link nav-link-icon sm:nav-link-text"
              :class="{ 'nav-link-active': route.path === '/stats' }"
              title="统计"
            >
              <Icon name="heroicons:chart-bar" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">统计</span>
            </NuxtLink>

            <!-- 关于 -->
            <NuxtLink
              to="/about"
              class="nav-link nav-link-icon sm:nav-link-text"
              :class="{ 'nav-link-active': route.path === '/about' }"
              title="关于"
            >
              <Icon name="heroicons:information-circle" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">关于</span>
            </NuxtLink>

            <!-- 分隔线 -->
            <div class="w-px h-6 bg-gray-400 dark:bg-gray-600 flex-shrink-0"></div>

            <!-- 我的（已登录时显示） -->
            <button
              v-if="authStore.isAuthenticated"
              type="button"
              @click="openMyModal"
              class="nav-link nav-link-icon sm:nav-link-text"
              title="我的"
            >
              <Icon name="heroicons:user-circle" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">我的</span>
            </button>

            <!-- 登录/登出 -->
            <button
              v-if="authStore.isAuthenticated"
              @click="handleLogout"
              class="nav-link nav-link-icon sm:nav-link-text text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="登出"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 flex-shrink-0 text-current" />
              <span class="hidden sm:inline">登出</span>
            </button>
            <template v-else>
              <NuxtLink
                to="/register"
                class="nav-link nav-link-icon sm:nav-link-text"
                :class="{ 'nav-link-active': route.path === '/register' }"
                title="注册"
              >
                <Icon name="heroicons:user-plus" class="w-5 h-5 flex-shrink-0 text-current" />
                <span class="hidden sm:inline">注册</span>
              </NuxtLink>
              <NuxtLink
                to="/login"
                class="nav-link nav-link-icon sm:nav-link-text"
                :class="{ 'nav-link-active': route.path === '/login' }"
                title="登录"
              >
                <Icon name="heroicons:arrow-left-on-rectangle" class="w-5 h-5 flex-shrink-0 text-current" />
                <span class="hidden sm:inline">登录</span>
              </NuxtLink>
            </template>

            <!-- 暗黑模式切换 -->
            <ThemeToggle class="flex-shrink-0" />
          </nav>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="flex-1 relative z-10">
      <slot />
    </main>

    <!-- 我的 - 账户信息弹层 -->
    <Teleport to="body">
      <div
        v-if="showMyModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showMyModal = false"
      >
        <div class="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">我的账户</h2>
            <button
              type="button"
              class="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="showMyModal = false"
              aria-label="关闭"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
          <form v-if="!loadingMy" @submit.prevent="saveMyProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">用户名</label>
              <input
                :value="myForm.username"
                type="text"
                class="input w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                readonly
                disabled
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">用户名不可修改</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱</label>
              <input
                v-model="myForm.email"
                type="email"
                class="input w-full"
                placeholder="选填，可用于登录"
              />
              <p v-if="settingsStore.appSettings?.registrationEmailVerification" class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">已开启邮箱验证，更改邮箱后需查收新邮件完成验证</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新密码（不填则不修改）</label>
              <input
                v-model="myForm.newPassword"
                type="password"
                class="input w-full"
                placeholder="留空保持原密码"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">确认新密码</label>
              <input
                v-model="myForm.confirmPassword"
                type="password"
                class="input w-full"
                placeholder="与上面一致"
              />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="btn-primary" :disabled="savingMy">
                {{ savingMy ? '保存中...' : '保存' }}
              </button>
              <button type="button" class="btn-secondary" @click="showMyModal = false">
                取消
              </button>
            </div>
          </form>
          <div v-else class="py-8 flex justify-center">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast 组件 -->
    <Toast />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// 应用配置（与登录页一致：无配置时显示默认图标，不强制 fallback 到 favicon）
const appName = computed(() => settingsStore.appSettings.appName || 'bsimgbed')
const appLogo = computed(() => settingsStore.appSettings.appLogo || '')
const appFavicon = computed(() => settingsStore.appSettings.favicon || '')
const headerLogoError = ref(false)
const backgroundUrl = computed(() => settingsStore.appSettings.backgroundUrl || '')
const backgroundBlur = computed(() => settingsStore.appSettings.backgroundBlur || 0)

// 获取 favicon MIME 类型
function getFaviconType(url) {
  if (url.endsWith('.svg')) return 'image/svg+xml'
  if (url.endsWith('.ico')) return 'image/x-icon'
  if (url.endsWith('.png')) return 'image/png'
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg'
  if (url.endsWith('.gif')) return 'image/gif'
  if (url.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

// 立即更新 favicon（直接操作 DOM）
function updateFavicon(url) {
  if (typeof document === 'undefined') return

  // 移除所有现有的 favicon link 标签
  const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
  existingLinks.forEach(link => link.remove())

  // 创建新的 favicon link 标签
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = getFaviconType(url)
  // 添加时间戳避免缓存
  link.href = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now()
  document.head.appendChild(link)
}

// 监听 favicon / appLogo 变化，立即更新 favicon：优先使用设置的 favicon，否则 Logo，否则默认
watch([appFavicon, appLogo], ([favicon, logo]) => {
  updateFavicon(favicon || logo || '/favicon.png')
  headerLogoError.value = false
}, { immediate: true })

// 动态设置页面标题
useHead({
  title: appName
})

// 初始化
onMounted(async () => {
  // 先获取公共应用设置（无需登录，包含背景图片等）
  await settingsStore.fetchPublicAppSettings()

  // 验证 Token（authStore.init() 已在插件中调用）
  if (authStore.token) {
    await authStore.verify()
  }

  // 获取完整应用设置（如果已登录）
  if (authStore.isAuthenticated) {
    await settingsStore.fetchAppSettings()
  }
})

// 登出处理
async function handleLogout() {
  authStore.logout()
  toastStore.success('已退出登录')
  router.push('/')
}

// 我的 - 账户信息弹层
const showMyModal = ref(false)
const loadingMy = ref(false)
const savingMy = ref(false)
const myForm = reactive({
  username: '',
  email: '',
  newPassword: '',
  confirmPassword: ''
})

async function openMyModal() {
  showMyModal.value = true
  loadingMy.value = true
  myForm.username = ''
  myForm.email = ''
  myForm.newPassword = ''
  myForm.confirmPassword = ''
  try {
    const res = await $fetch('/api/auth/me', { headers: authStore.authHeader })
    if (res.success && res.data) {
      myForm.username = res.data.username || ''
      myForm.email = res.data.email || ''
    }
  } catch (_) {
    toastStore.error('获取账户信息失败')
    showMyModal.value = false
  } finally {
    loadingMy.value = false
  }
}

async function saveMyProfile() {
  if (myForm.newPassword && myForm.newPassword !== myForm.confirmPassword) {
    toastStore.error('两次输入的密码不一致')
    return
  }
  if (myForm.newPassword && myForm.newPassword.length < 6) {
    toastStore.error('新密码至少 6 位')
    return
  }
  if (myForm.newPassword && /^\d+$/.test(myForm.newPassword)) {
    toastStore.error('密码不能为纯数字')
    return
  }
  savingMy.value = true
  try {
    const body = { email: myForm.email }
    if (myForm.newPassword) body.newPassword = myForm.newPassword
    const res = await $fetch('/api/auth/me', {
      method: 'PUT',
      body,
      headers: authStore.authHeader
    })
    if (res.success) {
      toastStore.success(res.message || '已保存')
      if (res.needVerify) {
        toastStore.success('请查收新邮箱的验证邮件并点击链接完成验证')
      }
      myForm.newPassword = ''
      myForm.confirmPassword = ''
      showMyModal.value = false
    } else {
      toastStore.error(res.message || '保存失败')
    }
  } catch (e) {
    toastStore.error(e.data?.message || '保存失败')
  } finally {
    savingMy.value = false
  }
}
</script>

<style scoped>
.nav-link {
  @apply rounded-lg text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center flex-shrink-0;
}

/* 移动端图标样式 */
.nav-link-icon {
  @apply p-2;
}

/* 桌面端文字样式 */
@screen sm {
  .nav-link-text {
    @apply px-3 py-2;
  }
}

.nav-link-active {
  @apply bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400;
}

/* 顶栏图标在黑夜主题下正确继承颜色（含移动端） */
.nav-link :deep(svg),
.nav-link :deep(.icon),
.nav-link :deep(span) {
  color: inherit;
}
.nav-link :deep(svg) {
  fill: currentColor;
}

/* 隐藏滚动条但保持滚动功能 */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
</style>