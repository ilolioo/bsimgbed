<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">容量</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">各储存桶当前用量与上限</p>

    <div v-if="loading" class="flex justify-center py-12">
      <Loading size="lg" />
    </div>

    <div v-else-if="error" class="card p-6 text-center">
      <p class="text-red-500 dark:text-red-400">{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchUsage">重试</button>
    </div>

    <div v-else-if="!buckets.length" class="card p-8 text-center text-gray-500 dark:text-gray-400">
      暂无储存桶数据
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="b in buckets"
        :key="b.id"
        class="card p-5"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="font-medium text-gray-900 dark:text-white">{{ b.name }}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatSize(b.usedSize) }} / {{ formatSize(b.sizeLimit) }}
          </span>
        </div>
        <div class="h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full rounded-full transition-all duration-500 min-w-[2px]"
            :class="percent(b) >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' : percent(b) >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-primary-500 to-primary-600'"
            :style="{ width: Math.min(100, percent(b)) + '%' }"
          />
        </div>
        <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          已用 {{ percent(b).toFixed(1) }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const buckets = ref([])
const loading = ref(true)
const error = ref('')

function formatSize(bytes) {
  if (bytes == null || bytes < 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function percent(b) {
  const limit = b.sizeLimit || 1
  return ((b.usedSize || 0) / limit) * 100
}

async function fetchUsage() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch('/api/config/storage/usage')
    if (res.success && res.data) {
      buckets.value = res.data.buckets || []
    }
  } catch (e) {
    error.value = e.data?.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsage()
})
</script>
