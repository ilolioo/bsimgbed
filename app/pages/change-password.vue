<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="card p-6">
        <div class="text-center mb-6">
          <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Icon name="heroicons:key" class="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">修改密码</h1>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            设置新密码以保障账号安全
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="oldPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              当前密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:lock-closed" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="oldPassword"
                v-model="form.oldPassword"
                :type="showOld ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="input !pl-10 !pr-10"
                placeholder="请输入当前密码"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showOld = !showOld"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon
                  :name="showOld ? 'heroicons:eye-slash' : 'heroicons:eye'"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                />
              </button>
            </div>
          </div>

          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              新密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:key" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="newPassword"
                v-model="form.newPassword"
                :type="showNew ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="input !pl-10 !pr-10"
                placeholder="请输入新密码"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showNew = !showNew"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon
                  :name="showNew ? 'heroicons:eye-slash' : 'heroicons:eye'"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                />
              </button>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              确认新密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="heroicons:key" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="input !pl-10 !pr-10"
                placeholder="请再次输入新密码"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showConfirm = !showConfirm"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon
                  :name="showConfirm ? 'heroicons:eye-slash' : 'heroicons:eye'"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
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
            <span>{{ loading ? '提交中...' : '确认修改' }}</span>
          </button>
        </form>

        <p class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          修改成功后将自动跳转到首页
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastStore } from '~/stores/toast'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const loading = ref(false)
const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})

async function handleSubmit() {
  if (!form.oldPassword) {
    toastStore.error('请输入当前密码')
    return
  }
  if (!form.newPassword) {
    toastStore.error('请输入新密码')
    return
  }
  if (form.newPassword.length < 6) {
    toastStore.error('新密码至少需要 6 位')
    return
  }
  if (/^\d+$/.test(form.newPassword)) {
    toastStore.error('密码不能为纯数字')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    toastStore.error('两次输入的新密码不一致')
    return
  }

  loading.value = true
  try {
    const response = await $fetch('/api/admin/password', {
      method: 'PUT',
      body: {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      },
      headers: authStore.authHeader
    })

    if (response.success) {
      toastStore.success('密码已修改')
      form.oldPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''
      router.push('/')
    } else {
      toastStore.error(response.message || '修改失败')
    }
  } catch (error) {
    toastStore.error(error.data?.message || '修改失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>
