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

            <!-- API Key 管理（仅显示自己的） -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">API Key</h3>
                <button
                  type="button"
                  class="btn-secondary text-sm"
                  :disabled="addingKey || (myApiKeys.length >= 2 && !authStore.isAdmin)"
                  @click="addMyApiKey"
                >
                  {{ addingKey ? '添加中...' : '添加' }}
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">用于私有上传等接口认证，仅您本人可见；可自定义名称</p>
              <!-- 添加时填写名称 -->
              <div v-if="myApiKeys.length < 2 || authStore.isAdmin" class="mb-3">
                <input
                  v-model="newApiKeyName"
                  type="text"
                  class="input w-full text-sm"
                  placeholder="新密钥名称（可选，留空则使用用户名）"
                  maxlength="64"
                />
              </div>
              <div v-if="myApiKeys.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">暂无 ApiKey，填写名称后点击添加创建</div>
              <div v-else class="space-y-2">
                <div
                  v-for="k in myApiKeys"
                  :key="k.id"
                  class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm"
                >
                  <div class="min-w-0 flex-1">
                    <template v-if="editingKeyId === k.id">
                      <input
                        ref="editKeyInputRef"
                        v-model="editingKeyName"
                        type="text"
                        class="input text-sm py-1 w-32"
                        maxlength="64"
                        @keydown.enter="saveMyKeyName(k)"
                        @keydown.esc="editingKeyId = null"
                      />
                    </template>
                    <template v-else>
                      <span class="font-medium text-gray-900 dark:text-white">{{ k.name }}</span>
                      <button type="button" class="ml-1 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="编辑名称" @click="startEditKeyName(k)">
                        <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
                      </button>
                    </template>
                    <span v-if="k.isDefault" class="ml-1 text-xs text-primary-600 dark:text-primary-400">默认</span>
                    <div class="flex items-center gap-1 mt-0.5">
                      <code class="text-xs font-mono truncate text-gray-600 dark:text-gray-400">{{ showKeyId === k.id ? k.key : (k.key ? k.key.slice(0, 4) + '****' + k.key.slice(-4) : '') }}</code>
                      <button type="button" class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="showKeyId = showKeyId === k.id ? null : k.id" title="显示/隐藏">
                        <Icon :name="showKeyId === k.id ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-3.5 h-3.5" />
                      </button>
                      <button type="button" class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="copyMyKey(k.key)" title="复制">
                        <Icon name="heroicons:clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button v-if="k.isDefault" type="button" class="btn-secondary text-xs py-1" :disabled="regeneratingId === k.id" @click="regenerateMyKey(k)">
                      {{ regeneratingId === k.id ? '刷新中' : '刷新' }}
                    </button>
                    <template v-if="!k.isDefault">
                      <button type="button" class="btn-secondary text-xs py-1" :disabled="settingDefaultId === k.id" @click="setMyKeyDefault(k)">
                        {{ settingDefaultId === k.id ? '设置中' : '设为默认' }}
                      </button>
                      <button type="button" class="text-red-600 dark:text-red-400 text-xs hover:underline" :disabled="deletingId === k.id" @click="deleteMyKey(k)">
                        {{ deletingId === k.id ? '删除中' : '删除' }}
                      </button>
                    </template>
                  </div>
                </div>
              </div>
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
import { watch, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'
import { copyToClipboard } from '~/utils/clipboard'

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

// 初始化：不阻塞首屏，后台异步拉取设置与验证
onMounted(() => {
  settingsStore.fetchPublicAppSettings()
  if (authStore.token) authStore.verify()
  if (authStore.isAuthenticated) settingsStore.fetchAppSettings()
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
const myApiKeys = ref([])
const showKeyId = ref(null)
const addingKey = ref(false)
const regeneratingId = ref(null)
const deletingId = ref(null)
const settingDefaultId = ref(null)
const newApiKeyName = ref('')
const editingKeyId = ref(null)
const editingKeyName = ref('')
const editKeyInputRef = ref(null)

async function fetchMyApiKeys() {
  try {
    const res = await $fetch('/api/apikeys', { headers: authStore.authHeader })
    if (res.success && Array.isArray(res.data)) myApiKeys.value = res.data
  } catch (_) {
    myApiKeys.value = []
  }
}

async function openMyModal() {
  showMyModal.value = true
  loadingMy.value = true
  myForm.username = ''
  myForm.email = ''
  myForm.newPassword = ''
  myForm.confirmPassword = ''
  myApiKeys.value = []
  showKeyId.value = null
  try {
    const [meRes, keysRes] = await Promise.all([
      $fetch('/api/auth/me', { headers: authStore.authHeader }),
      $fetch('/api/apikeys', { headers: authStore.authHeader })
    ])
    if (meRes?.success && meRes.data) {
      myForm.username = meRes.data.username || ''
      myForm.email = meRes.data.email || ''
    }
    if (keysRes?.success && Array.isArray(keysRes.data)) myApiKeys.value = keysRes.data
  } catch (_) {
    toastStore.error('获取账户信息失败')
    showMyModal.value = false
  } finally {
    loadingMy.value = false
  }
}

async function addMyApiKey() {
  addingKey.value = true
  try {
    const name = newApiKeyName.value.trim() || authStore.user?.username || '我的密钥'
    const res = await $fetch('/api/apikeys', {
      method: 'POST',
      body: { name },
      headers: authStore.authHeader
    })
    if (res?.success && res.data) {
      myApiKeys.value.push(res.data)
      newApiKeyName.value = ''
      toastStore.success('ApiKey 已创建')
    } else {
      toastStore.error(res?.message || '创建失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '创建失败')
  } finally {
    addingKey.value = false
  }
}

function startEditKeyName(k) {
  editingKeyId.value = k.id
  editingKeyName.value = k.name || ''
  nextTick(() => { editKeyInputRef.value?.focus() })
}

async function saveMyKeyName(k) {
  const name = editingKeyName.value.trim()
  if (name === k.name) {
    editingKeyId.value = null
    return
  }
  try {
    const res = await $fetch(`/api/apikeys/${k.id}`, {
      method: 'PUT',
      body: { name: name || k.name },
      headers: authStore.authHeader
    })
    if (res?.success && res.data) {
      const idx = myApiKeys.value.findIndex(x => x.id === k.id)
      if (idx !== -1) myApiKeys.value[idx] = res.data
      toastStore.success('名称已更新')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '更新失败')
  }
  editingKeyId.value = null
}

function copyMyKey(key) {
  copyToClipboard(key).then(() => toastStore.success('已复制')).catch(() => toastStore.error('复制失败'))
}

async function regenerateMyKey(k) {
  regeneratingId.value = k.id
  try {
    const res = await $fetch(`/api/apikeys/${k.id}`, {
      method: 'PUT',
      body: { regenerate: true },
      headers: authStore.authHeader
    })
    if (res?.success && res.data) {
      const idx = myApiKeys.value.findIndex(x => x.id === k.id)
      if (idx !== -1) myApiKeys.value[idx] = res.data
      toastStore.success('ApiKey 已刷新')
    } else {
      toastStore.error(res?.message || '刷新失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '刷新失败')
  } finally {
    regeneratingId.value = null
  }
}

async function setMyKeyDefault(k) {
  settingDefaultId.value = k.id
  try {
    const res = await $fetch(`/api/apikeys/${k.id}`, {
      method: 'PUT',
      body: { isDefault: true },
      headers: authStore.authHeader
    })
    if (res?.success && res.data) {
      myApiKeys.value.forEach(key => {
        key.isDefault = key.id === k.id
      })
      toastStore.success('已设为默认')
    } else {
      toastStore.error(res?.message || '设置失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '设置失败')
  } finally {
    settingDefaultId.value = null
  }
}

async function deleteMyKey(k) {
  deletingId.value = k.id
  try {
    const res = await $fetch(`/api/apikeys/${k.id}`, {
      method: 'DELETE',
      headers: authStore.authHeader
    })
    if (res?.success) {
      const keysRes = await $fetch('/api/apikeys', { headers: authStore.authHeader })
      if (keysRes?.success && Array.isArray(keysRes.data)) myApiKeys.value = keysRes.data
      toastStore.success('已删除')
    } else {
      toastStore.error(res?.message || '删除失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '删除失败')
  } finally {
    deletingId.value = null
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