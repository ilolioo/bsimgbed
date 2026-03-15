<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="card p-6">
        <div class="text-center mb-4">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <img
              v-if="appLogo && !logoError"
              :src="appLogo"
              :alt="appName"
              class="w-full h-full object-contain"
              @error="logoError = true"
            />
            <div
              v-else
              class="w-full h-full rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center"
            >
              <Icon name="heroicons:photo" class="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">注册账号</h1>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ appName }}</p>
        </div>

        <p v-if="!registrationEnabled" class="text-center text-amber-600 dark:text-amber-400 py-4">
          注册已关闭，请联系管理员。
        </p>
        <form v-else @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label for="reg-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:envelope" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="reg-email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                class="input !pl-10"
                :placeholder="registrationEmailVerification ? '用于接收验证链接' : '可用于登录'"
                :disabled="loading"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ registrationEmailVerification ? '注册后需点击邮件中的链接完成验证方可登录' : '邮箱与用户名均可用于登录' }}
            </p>
          </div>
          <div>
            <label for="reg-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">用户名</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:user" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="reg-username"
                v-model="form.username"
                type="text"
                required
                autocomplete="username"
                class="input !pl-10"
                :class="{ 'border-green-500 dark:border-green-500': usernameStatus === 'available', 'border-red-500 dark:border-red-500': usernameStatus === 'taken' || usernameStatus === 'invalid' }"
                placeholder="请输入用户名"
                :disabled="loading"
                @input="onUsernameInput"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">用户名至少 4 位，不能为纯数字，仅支持英文、数字、下划线</p>
            <p v-if="usernameStatus === 'checking'" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">检测中…</p>
            <p v-else-if="usernameStatus === 'available'" class="mt-0.5 text-xs text-green-600 dark:text-green-400">用户名可用</p>
            <p v-else-if="usernameStatus === 'taken' || usernameStatus === 'invalid'" class="mt-0.5 text-xs text-red-600 dark:text-red-400">{{ usernameStatusMessage }}</p>
          </div>
          <div>
            <label for="reg-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:lock-closed" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="reg-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="input !pl-10 !pr-10"
                placeholder="请输入密码"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon
                  v-if="showPassword"
                  name="heroicons:eye-slash"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
                />
                <Icon
                  v-else
                  name="heroicons:eye"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
                />
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">密码至少 6 位，且不能为纯数字</p>
          </div>
          <div>
            <label for="reg-confirm" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">确认密码</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:lock-closed" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="reg-confirm"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="input !pl-10 !pr-10"
                placeholder="请再次输入密码"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon
                  v-if="showConfirmPassword"
                  name="heroicons:eye-slash"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
                />
                <Icon
                  v-else
                  name="heroicons:eye"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
                />
              </button>
            </div>
          </div>
          <button
            type="submit"
            class="w-full btn-primary py-3 flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <Loading v-if="loading" size="sm" class="text-white" />
            <span>{{ loading ? '注册中...' : '注册' }}</span>
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          已有账号？
          <NuxtLink to="/login" class="text-primary-600 dark:text-primary-400 hover:underline">去登录</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'

const router = useRouter()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const USERNAME_MIN_LEN = 4
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

const appName = computed(() => settingsStore.appSettings?.appName || 'bsimgbed')
const appLogo = computed(() => settingsStore.appSettings?.appLogo || '')
const registrationEnabled = computed(() => settingsStore.appSettings?.registrationEnabled !== false)
const registrationEmailVerification = computed(() => !!settingsStore.appSettings?.registrationEmailVerification)
const logoError = ref(false)

const form = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
})
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const usernameStatus = ref('idle') // idle | checking | available | taken | invalid
const usernameStatusMessage = ref('')
let usernameCheckTimer = null

onMounted(() => {
  settingsStore.fetchPublicAppSettings()
})

function onUsernameInput() {
  const raw = form.value.username.trim()
  if (usernameCheckTimer) clearTimeout(usernameCheckTimer)
  if (!raw || raw.length < USERNAME_MIN_LEN) {
    usernameStatus.value = 'idle'
    usernameStatusMessage.value = ''
    return
  }
  if (/^\d+$/.test(raw) || !USERNAME_REGEX.test(raw)) {
    usernameStatus.value = 'invalid'
    usernameStatusMessage.value = /^\d+$/.test(raw) ? '用户名不能为纯数字' : '用户名仅支持英文、数字、下划线'
    return
  }
  usernameStatus.value = 'checking'
  usernameStatusMessage.value = ''
  usernameCheckTimer = setTimeout(async () => {
    usernameCheckTimer = null
    try {
      const res = await $fetch('/api/auth/check-username', {
        query: { username: raw }
      })
      if (res.success) {
        usernameStatus.value = res.available ? 'available' : 'taken'
        usernameStatusMessage.value = res.message || (res.available ? '用户名可用' : '用户名已存在')
      } else {
        usernameStatus.value = 'idle'
      }
    } catch (e) {
      usernameStatus.value = 'idle'
    }
  }, 400)
}

function validateUsername() {
  const raw = form.value.username.trim()
  if (!raw || raw.length < USERNAME_MIN_LEN) return '用户名至少 4 位'
  if (/^\d+$/.test(raw)) return '用户名不能为纯数字'
  if (!USERNAME_REGEX.test(raw)) return '用户名仅支持英文、数字、下划线'
  if (usernameStatus.value === 'checking') return '正在检测用户名，请稍候'
  if (usernameStatus.value === 'taken' || usernameStatus.value === 'invalid') return usernameStatusMessage.value || '请更换用户名'
  return null
}

async function handleRegister() {
  if (!registrationEnabled.value) return
  if (!form.value.username || !form.value.password) {
    toastStore.error('请填写用户名和密码')
    return
  }
  if (!form.value.email?.trim()) {
    toastStore.error('请填写邮箱')
    return
  }
  const usernameErr = validateUsername()
  if (usernameErr) {
    toastStore.error(usernameErr)
    return
  }
  if (form.value.password.length < 6) {
    toastStore.error('密码至少 6 位')
    return
  }
  if (/^\d+$/.test(form.value.password)) {
    toastStore.error('密码不能为纯数字')
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    toastStore.error('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const body = {
      username: form.value.username.trim(),
      email: form.value.email.trim(),
      password: form.value.password
    }
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body
    })
    if (res.success) {
      toastStore.success(res.message || (res.data?.emailVerificationRequired ? '请查收邮件完成验证' : '注册成功，请登录'))
      if (res.data?.emailVerificationRequired) {
        router.push('/login?verify=1')
      } else {
        router.push('/login')
      }
    } else {
      toastStore.error(res.message || '注册失败')
    }
  } catch (e) {
    toastStore.error(e.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>
