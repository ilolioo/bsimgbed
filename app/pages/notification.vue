<script setup>
definePageMeta({
  middleware: ['auth', 'admin']
})

// 通知设置已合并到系统设置，重定向到对应标签
onMounted(() => {
  navigateTo({ path: '/settings', query: { tab: 'notification' } }, { replace: true })
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
    <p class="text-gray-500 dark:text-gray-400">正在跳转到系统设置…</p>
  </div>
</template>
