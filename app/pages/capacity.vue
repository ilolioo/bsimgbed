<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 标题区 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
          <Icon name="heroicons:circle-stack" class="w-7 h-7 text-primary-500" />
          容量
        </h1>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400">各储存桶当前用量与上限</p>
      </div>
      <button
        v-if="!loading && !error && buckets.length > 0"
        type="button"
        class="btn-secondary inline-flex items-center gap-2 self-start sm:self-center"
        :disabled="refreshing"
        @click="refresh"
      >
        <Icon :name="refreshing ? 'heroicons:arrow-path' : 'heroicons:arrow-path'" class="w-4 h-4" :class="{ 'animate-spin': refreshing }" />
        {{ refreshing ? '刷新中…' : '刷新' }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loading size="lg" />
    </div>

    <div v-else-if="error" class="card p-6 text-center">
      <Icon name="heroicons:exclamation-triangle" class="w-12 h-12 mx-auto text-amber-500 dark:text-amber-400 mb-3" />
      <p class="text-gray-700 dark:text-gray-300 mb-1">无法获取容量信息</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ error }}</p>
      <button class="btn-secondary" @click="fetchUsage">重试</button>
    </div>

    <div v-else-if="!buckets.length" class="card p-8 text-center">
      <Icon name="heroicons:circle-stack" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <p class="text-gray-700 dark:text-gray-300 font-medium mb-1">暂无储存桶数据</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">尚未配置储存桶，或暂无用量数据</p>
      <NuxtLink v-if="authStore.isAuthenticated" to="/settings" class="btn-primary inline-flex items-center gap-2">
        <Icon name="heroicons:cog-6-tooth" class="w-4 h-4" />
        前往设置
      </NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <!-- 汇总卡片 -->
      <div class="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <Icon name="heroicons:chart-bar" class="w-5 h-5 text-primary-500" />
          <span class="font-medium text-gray-900 dark:text-white">总容量</span>
        </div>
        <div class="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
          <span class="text-gray-500 dark:text-gray-400">已用 <span class="font-mono font-medium text-gray-900 dark:text-white">{{ formatSize(summary.totalUsed) }}</span></span>
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <span class="font-mono text-gray-700 dark:text-gray-300">{{ formatSize(summary.totalLimit) }}</span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="summary.percent >= 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : summary.percent >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'"
          >
            {{ summary.percent.toFixed(1) }}%
          </span>
        </div>
      </div>

      <!-- 储存桶列表 -->
      <div class="space-y-4">
        <div
          v-for="(b, index) in buckets"
          :key="b.id"
          class="card p-5 transition-all duration-200 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700/50"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <span class="font-medium text-gray-900 dark:text-white truncate min-w-0">{{ b.name }}</span>
            <div class="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <span class="text-sm font-mono text-gray-600 dark:text-gray-400">
                {{ formatSize(b.usedSize) }} / {{ formatSize(b.sizeLimit) }}
              </span>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums"
                :class="percent(b) >= 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : percent(b) >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'"
              >
                已用 {{ percent(b).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuenow="percent(b)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${b.name} 已用 ${percent(b).toFixed(1)}%`"
            class="h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
          >
            <div
              class="h-full rounded-full transition-all duration-500 min-w-[2px]"
              :class="percent(b) >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' : percent(b) >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-primary-500 to-primary-600'"
              :style="{ width: Math.min(100, percent(b)) + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const buckets = ref([])
const loading = ref(true)
const error = ref('')
const refreshing = ref(false)

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

const summary = computed(() => {
  const totalUsed = buckets.value.reduce((s, b) => s + (b.usedSize || 0), 0)
  const totalLimit = buckets.value.reduce((s, b) => s + (b.sizeLimit || 0), 0)
  const percent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
  return { totalUsed, totalLimit, percent }
})

async function fetchUsage() {
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
    refreshing.value = false
  }
}

function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  fetchUsage()
}

onMounted(() => {
  fetchUsage()
})
</script>

<style scoped>
.card {
  animation: capacity-card-in 0.35s ease-out backwards;
}
@keyframes capacity-card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
