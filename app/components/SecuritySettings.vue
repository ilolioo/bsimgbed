<template>
  <div class="space-y-6">
    <!-- 内容安全配置 -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-orange-500 dark:text-orange-400" />
          内容安全
        </h2>
        <button
          type="button"
          @click="toggleContentSafety"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          :class="contentSafety.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="contentSafety.enabled ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">自动检测访客上传图片是否包含违规内容</p>

      <!-- 内容安全详细配置 -->
      <div v-if="contentSafety.enabled" class="space-y-4">
        <!-- 检测服务选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            检测服务
          </label>
          <select
            v-model="contentSafety.provider"
            class="input w-full max-w-xs"
          >
            <option value="nsfwdet">nsfwdet.com(公益) - 20张/ip/分钟</option>
            <option value="elysiatools">elysiatools.com(公益) - 未说明限制</option>
            <option value="nsfw_detector">nsfw_detector(开源) - 自建</option>
          </select>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">选择用于检测违规内容的API服务</p>
        </div>

        <!-- nsfwdet 配置 -->
        <div v-if="contentSafety.provider === 'nsfwdet'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API 地址
            </label>
            <input
              type="text"
              v-model="contentSafety.providers.nsfwdet.apiUrl"
              class="input w-full"
              placeholder="https://nsfwdet.com/api/v1/detect-nsfw"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="text"
              v-model="contentSafety.providers.nsfwdet.apiKey"
              class="input w-full"
              placeholder="nsfw_xxxxxxxx"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              用于API请求认证的密钥（默认使用厂商开放的公共密钥）
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              违规阈值 ({{ (contentSafety.providers.nsfwdet.threshold * 100).toFixed(0) }}%)
            </label>
            <input
              type="range"
              v-model.number="contentSafety.providers.nsfwdet.threshold"
              min="0.1"
              max="0.9"
              step="0.05"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              当检测结果超过此阈值时，图片将被标记为违规
            </p>
          </div>
        </div>

        <!-- elysiatools 配置（可选覆盖） -->
        <div v-if="contentSafety.provider === 'elysiatools'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:globe-alt" class="w-4 h-4 text-green-500 dark:text-green-400" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Elysia Tools 可选配置</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">留空则使用默认地址；若服务地址变更可在此覆盖。</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">上传地址（可选）</label>
            <input
              type="text"
              v-model="contentSafety.providers.elysiatools.uploadUrl"
              class="input w-full"
              placeholder="https://elysiatools.com/upload/nsfw-image-detector"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">检测 API 地址（可选）</label>
            <input
              type="text"
              v-model="contentSafety.providers.elysiatools.apiUrl"
              class="input w-full"
              placeholder="https://elysiatools.com/zh/api/tools/nsfw-image-detector"
            />
          </div>
        </div>

        <!-- nsfw_detector 配置 -->
        <div v-if="contentSafety.provider === 'nsfw_detector'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:server" class="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">自建服务配置 <a href="https://github.com/chaos-zhu/nsfw_detector" class="text-blue-500 dark:text-blue-400" target="_blank">开源地址</a></span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API 地址 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="contentSafety.providers['nsfw_detector'].apiUrl"
              class="input w-full"
              placeholder="http://your-server:port/check"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              自建 NSFW 检测服务的 API 地址（必填）
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key（Bearer Token）
            </label>
            <input
              type="text"
              v-model="contentSafety.providers['nsfw_detector'].apiKey"
              class="input w-full"
              placeholder="如需认证请填写，否则留空"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              用于 Authorization: Bearer 认证的密钥（可选）
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              违规阈值 ({{ (contentSafety.providers['nsfw_detector'].threshold * 100).toFixed(0) }}%)
            </label>
            <input
              type="range"
              v-model.number="contentSafety.providers['nsfw_detector'].threshold"
              min="0.1"
              max="0.99"
              step="0.01"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              当检测结果的 nsfw 值超过此阈值时，图片将被标记为违规
            </p>
          </div>
        </div>

        <!-- 自动拉黑 IP -->
        <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">自动拉黑违规 IP</label>
            <p class="text-xs text-gray-500 dark:text-gray-400">检测到违规图片时，自动将上传者 IP 加入黑名单</p>
          </div>
          <button
            type="button"
            @click="contentSafety.autoBlacklistIp = !contentSafety.autoBlacklistIp"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            :class="contentSafety.autoBlacklistIp ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="contentSafety.autoBlacklistIp ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>

        <div class="pt-4">
          <button @click="saveContentSafety" class="btn-primary" :disabled="savingContentSafety">
            {{ savingContentSafety ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </div>
    </div>

    <!-- IP 黑名单 -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">IP 黑名单</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">被加入黑名单的访客IP将无法使用公共API上传图片</p>
        </div>
        <button
          @click="fetchBlacklist()"
          class="btn-secondary text-sm flex items-center justify-center gap-1 min-w-[90px]"
          :disabled="loadingBlacklist"
        >
          <Icon v-if="loadingBlacklist" name="heroicons:arrow-path" class="animate-spin h-4 w-4 shrink-0" />
          <span>{{ loadingBlacklist ? '刷新中' : '刷新列表' }}</span>
        </button>
      </div>

      <!-- 手动添加 IP -->
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">手动添加 IP</h3>
        <div class="flex gap-3">
          <input
            v-model="newBlacklistIp"
            type="text"
            class="input flex-1"
            placeholder="输入 IP 地址，如 192.168.1.1"
            @keyup.enter="addToBlacklistManual"
          />
          <input
            v-model="newBlacklistReason"
            type="text"
            class="input flex-1"
            placeholder="原因（可选）"
            @keyup.enter="addToBlacklistManual"
          />
          <button
            @click="addToBlacklistManual"
            class="btn-primary text-sm whitespace-nowrap"
            :disabled="!newBlacklistIp.trim() || addingToBlacklist"
          >
            {{ addingToBlacklist ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>

      <!-- 列表容器 - 设置最小高度避免抖动 -->
      <div class="min-h-[200px]">
        <!-- 空状态 -->
        <div v-if="blacklist.length === 0 && !loadingBlacklist" class="text-center py-12">
          <Icon name="heroicons:shield-check" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">黑名单为空</h3>
          <p class="text-gray-500 dark:text-gray-400">当前没有被禁止的 IP 地址</p>
        </div>

        <!-- 加载中（首次加载） -->
        <div v-else-if="loadingBlacklist && blacklist.length === 0" class="flex justify-center py-12">
          <Loading size="lg" />
        </div>

        <!-- 黑名单列表 -->
        <div v-else class="space-y-3 relative">
          <!-- 刷新时的遮罩层 -->
          <div v-if="loadingBlacklist" class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-lg">
            <Loading size="md" />
          </div>
          <div
            v-for="item in blacklist"
            :key="item._id"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono font-medium text-gray-900 dark:text-white">{{ item.ip }}</span>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ item.reason || '未指定原因' }}
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                添加于 {{ formatDate(item.createdAt) }}
              </div>
            </div>
            <button
              @click="removeFromBlacklist(item)"
              class="btn-secondary text-sm ml-4"
            >
              移除
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="blacklistPagination.totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
        <button
          @click="fetchBlacklist(blacklistPagination.page - 1)"
          :disabled="blacklistPagination.page <= 1"
          class="btn-secondary text-sm"
        >
          上一页
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ blacklistPagination.page }} / {{ blacklistPagination.totalPages }}
        </span>
        <button
          @click="fetchBlacklist(blacklistPagination.page + 1)"
          :disabled="blacklistPagination.page >= blacklistPagination.totalPages"
          class="btn-secondary text-sm"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const defaultContentSafetyConfig = {
  enabled: false,
  provider: 'elysiatools',
  autoBlacklistIp: false,
  providers: {
    nsfwdet: {
      name: 'NSFW Detector',
      apiUrl: 'https://nsfwdet.com/api/v1/detect-nsfw',
      apiKey: 'nsfw_2f7ab4f1d743d69ee242eec932b19671',
      threshold: 0.5
    },
    elysiatools: {
      name: 'Elysia Tools',
      uploadUrl: 'https://elysiatools.com/upload/nsfw-image-detector',
      apiUrl: 'https://elysiatools.com/zh/api/tools/nsfw-image-detector'
    },
    'nsfw_detector': {
      name: 'nsfw_detector',
      apiUrl: '',
      apiKey: '',
      threshold: 0.8
    }
  }
}

const contentSafety = reactive(JSON.parse(JSON.stringify(defaultContentSafetyConfig)))
const savingContentSafety = ref(false)

// IP 黑名单
const blacklist = ref([])
const blacklistPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const loadingBlacklist = ref(false)
const newBlacklistIp = ref('')
const newBlacklistReason = ref('')
const addingToBlacklist = ref(false)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function mergeContentSafetyIntoPublicConfig() {
  const full = { ...settingsStore.publicApiConfig }
  if (!full.contentSafety) full.contentSafety = { ...defaultContentSafetyConfig }
  full.contentSafety = { ...contentSafety }
  return full
}

async function toggleContentSafety() {
  contentSafety.enabled = !contentSafety.enabled
  if (!contentSafety.enabled) {
    await saveContentSafety()
  }
}

async function saveContentSafety() {
  savingContentSafety.value = true
  try {
    const fullConfig = mergeContentSafetyIntoPublicConfig()
    const result = await settingsStore.savePublicApiConfig(fullConfig)
    if (result.success) {
      toastStore.success('配置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    savingContentSafety.value = false
  }
}

async function fetchBlacklist(page = 1) {
  loadingBlacklist.value = true
  try {
    const response = await $fetch('/api/blacklist', {
      params: { page, limit: 20 },
      headers: authStore.authHeader
    })
    if (response.success && response.data) {
      blacklist.value = response.data.records
      blacklistPagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('获取黑名单失败:', error)
    toastStore.error('获取黑名单失败')
  } finally {
    loadingBlacklist.value = false
  }
}

async function addToBlacklistManual() {
  if (!newBlacklistIp.value.trim()) {
    toastStore.error('请输入 IP 地址')
    return
  }
  addingToBlacklist.value = true
  try {
    const response = await $fetch('/api/blacklist', {
      method: 'POST',
      headers: authStore.authHeader,
      body: {
        ip: newBlacklistIp.value.trim(),
        reason: newBlacklistReason.value.trim() || '手动添加'
      }
    })
    if (response.success) {
      toastStore.success(response.message || `IP ${newBlacklistIp.value} 已添加到黑名单`)
      newBlacklistIp.value = ''
      newBlacklistReason.value = ''
      await fetchBlacklist(1)
    } else {
      toastStore.error(response.message || '添加失败')
    }
  } catch (error) {
    console.error('添加黑名单失败:', error)
    toastStore.error(error.data?.message || '添加失败')
  } finally {
    addingToBlacklist.value = false
  }
}

async function removeFromBlacklist(item) {
  try {
    const response = await $fetch(`/api/blacklist/${item._id}`, {
      method: 'DELETE',
      headers: authStore.authHeader
    })
    if (response.success) {
      toastStore.success(`IP ${item.ip} 已从黑名单中移除`)
      await fetchBlacklist(blacklistPagination.value.page)
    } else {
      toastStore.error(response.message || '移除失败')
    }
  } catch (error) {
    console.error('移除黑名单失败:', error)
    toastStore.error('移除失败')
  }
}

onMounted(async () => {
  await settingsStore.fetchPublicApiConfig()
  const fetched = settingsStore.publicApiConfig
  if (fetched && fetched.contentSafety) {
    Object.assign(contentSafety, {
      enabled: fetched.contentSafety.enabled,
      provider: fetched.contentSafety.provider || 'elysiatools',
      autoBlacklistIp: !!fetched.contentSafety.autoBlacklistIp,
      providers: {
        ...defaultContentSafetyConfig.providers,
        ...fetched.contentSafety.providers,
        nsfwdet: { ...defaultContentSafetyConfig.providers.nsfwdet, ...(fetched.contentSafety.providers?.nsfwdet || {}) },
        elysiatools: { ...defaultContentSafetyConfig.providers.elysiatools, ...(fetched.contentSafety.providers?.elysiatools || {}) },
        'nsfw_detector': { ...defaultContentSafetyConfig.providers['nsfw_detector'], ...(fetched.contentSafety.providers?.['nsfw_detector'] || {}) }
      }
    })
  }
  await fetchBlacklist()
})
</script>
