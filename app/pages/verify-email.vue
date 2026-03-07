<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="card p-6 text-center">
        <Loading v-if="loading" size="md" class="mx-auto" />
        <template v-else>
          <div v-if="success" class="space-y-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon name="heroicons:check" class="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p class="text-lg font-medium text-gray-900 dark:text-white">{{ message }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">正在跳转到登录页...</p>
          </div>
          <div v-else class="space-y-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <p class="text-gray-700 dark:text-gray-300">{{ message }}</p>
            <NuxtLink to="/login" class="btn-primary inline-block">返回登录</NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const loading = ref(true)
const success = ref(false)
const message = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    loading.value = false
    success.value = false
    message.value = '缺少验证链接或链接已失效'
    return
  }
  try {
    const res = await $fetch('/api/auth/verify-email', {
      query: { token }
    })
    if (res.success) {
      success.value = true
      message.value = res.message || '邮箱验证成功'
      toastStore.success(message.value)
      setTimeout(() => {
        router.replace('/login?verified=1')
      }, 1500)
    } else {
      success.value = false
      message.value = res.message || '验证失败'
    }
  } catch (e) {
    success.value = false
    message.value = e.data?.message || '验证链接无效或已过期'
    toastStore.error(message.value)
  } finally {
    loading.value = false
  }
})
</script>
