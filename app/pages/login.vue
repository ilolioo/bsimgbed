<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- 登录卡片 -->
      <div class="card p-6">
        <!-- 标题 -->
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
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">登录</h1>
          <div class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>{{ appName }} - 面向个人的图床应用</p>
          </div>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 用户名 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              用户名
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:user" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                autocomplete="username"
                class="input !pl-10"
                placeholder="请输入用户名"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- 密码 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:lock-closed" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
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
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                />
                <Icon
                  v-else
                  name="heroicons:eye"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                />
              </button>
            </div>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            class="w-full btn-primary py-3 flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <Loading v-if="loading" size="sm" class="text-white" />
            <span>{{ loading ? '登录中...' : '登录' }}</span>
          </button>
        </form>
        <p class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          没有账号？
          <NuxtLink to="/register" class="text-primary-600 dark:text-primary-400 hover:underline">注册</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const appName = computed(() => settingsStore.appSettings?.appName || 'bsimgbed')
const appLogo = computed(() => settingsStore.appSettings?.appLogo || '')
const logoError = ref(false)

// 表单数据
const form = ref({
  username: '',
  password: ''
})

// 状态
const loading = ref(false)
const showPassword = ref(false)

const route = useRoute()

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  } else {
    settingsStore.fetchPublicAppSettings()
    if (route.query.verified === '1') {
      toastStore.success('邮箱验证成功，请登录')
    }
  }
})

// 登录处理
async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    toastStore.error('请输入用户名和密码')
    return
  }

  loading.value = true

  try {
    const result = await authStore.login(form.value.username, form.value.password)

    if (result.success) {
      toastStore.success('登录成功')
      router.push(result.mustChangePassword ? '/change-password' : '/')
    } else {
      toastStore.error(result.message || '用户名或密码错误')
    }
  } catch (err) {
    toastStore.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>