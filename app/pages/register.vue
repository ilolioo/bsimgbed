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
          <div v-if="registrationEmailVerification">
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
                placeholder="用于接收验证链接"
                :disabled="loading"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">注册后需点击邮件中的链接完成验证方可登录</p>
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
                placeholder="至少 3 位"
                :disabled="loading"
              />
            </div>
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
                placeholder="至少 6 位"
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
          </div>
          <div>
            <label for="reg-confirm" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">确认密码</label>
            <input
              id="reg-confirm"
              v-model="form.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              class="input"
              placeholder="再次输入密码"
              :disabled="loading"
            />
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

onMounted(() => {
  settingsStore.fetchPublicAppSettings()
})

async function handleRegister() {
  if (!registrationEnabled.value) return
  if (!form.value.username || !form.value.password) {
    toastStore.error('请填写用户名和密码')
    return
  }
  if (registrationEmailVerification.value && !form.value.email?.trim()) {
    toastStore.error('请填写邮箱')
    return
  }
  if (form.value.username.trim().length < 3) {
    toastStore.error('用户名至少 3 位')
    return
  }
  if (form.value.password.length < 6) {
    toastStore.error('密码至少 6 位')
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
      password: form.value.password
    }
    if (registrationEmailVerification.value && form.value.email?.trim()) {
      body.email = form.value.email.trim()
    }
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body
    })
    if (res.success) {
      toastStore.success(res.message || (res.data?.emailVerificationRequired ? '请查收邮件完成验证' : '注册成功，请登录'))
      if (res.data?.emailVerificationRequired) {
        router.push('/login')
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
