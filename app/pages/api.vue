<template>
  <div class="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-[40vh]">
    <p class="text-gray-500 dark:text-gray-400">正在跳转到设置...</p>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth', 'admin']
})

// API 管理已迁移到「设置 → API管理」
onMounted(() => {
  navigateTo({ path: '/settings', query: { tab: 'api' } }, { replace: true })
})
</script>
