<template>
  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="$emit('close')"
      >
        <div
          class="card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- 标题 -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">我的</h3>
            <button
              type="button"
              @click="$emit('close')"
              class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="关闭"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- 内容 - 可滚动 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- 用户信息 -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">用户信息</h4>
              <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">用户名</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ me?.username || '—' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">邮箱</span>
                  <span class="text-gray-900 dark:text-white">{{ me?.email || '未设置' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">邮箱验证</span>
                  <span class="text-gray-900 dark:text-white">{{ me?.emailVerified ? '已验证' : '未验证' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">角色</span>
                  <span class="text-gray-900 dark:text-white">{{ me?.role === 'admin' ? '管理员' : '用户' }}</span>
                </div>
              </div>
            </div>

            <!-- 修改资料（除用户名外） -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">修改资料</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">用户名不可修改，可修改邮箱与新密码。</p>
              <form @submit.prevent="saveProfile" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱</label>
                  <input
                    v-model="profileForm.email"
                    type="email"
                    class="input w-full"
                    placeholder="选填，可用于登录"
                    :disabled="savingProfile"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新密码</label>
                  <input
                    v-model="profileForm.newPassword"
                    type="password"
                    class="input w-full"
                    placeholder="不修改请留空"
                    :disabled="savingProfile"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">至少 6 位，不能为纯数字</p>
                </div>
                <button type="submit" class="btn-primary" :disabled="savingProfile">
                  {{ savingProfile ? '保存中...' : '保存' }}
                </button>
              </form>
            </div>

            <!-- API Key 管理 -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">个人 API Key</h4>
                <button
                  type="button"
                  class="btn-secondary text-sm"
                  :disabled="addingKey || (settingsStore.apiKeys.length >= 2 && !authStore.isAdmin)"
                  @click="createKey"
                >
                  {{ addingKey ? '创建中...' : '添加' }}
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">用于私有上传、URL 上传等，普通用户最多 2 个。</p>
              <div v-if="loadingKeys" class="text-sm text-gray-500 py-3">加载中...</div>
              <div v-else-if="!settingsStore.apiKeys.length" class="text-sm text-gray-500 dark:text-gray-400 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3">暂无 API Key，点击「添加」创建</div>
              <div v-else class="space-y-2">
                <div
                  v-for="k in settingsStore.apiKeys"
                  :key="k.id"
                  class="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm"
                >
                  <div class="min-w-0 flex-1">
                    <span class="font-medium text-gray-900 dark:text-white">{{ k.name || '未命名' }}</span>
                    <span v-if="k.isDefault" class="ml-1 text-xs text-primary-600 dark:text-primary-400">默认</span>
                    <div class="flex items-center gap-1 mt-1">
                      <code class="text-xs font-mono truncate text-gray-600 dark:text-gray-400">
                        {{ showKeyId === k.id ? k.key : (k.key ? k.key.slice(0, 4) + '****' + k.key.slice(-4) : '') }}
                      </code>
                      <button type="button" class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="showKeyId = showKeyId === k.id ? null : k.id" title="显示/隐藏">
                        <Icon :name="showKeyId === k.id ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-3.5 h-3.5" />
                      </button>
                      <button type="button" class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="copyKey(k.key)" title="复制">
                        <Icon name="heroicons:clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button v-if="k.isDefault" type="button" class="btn-secondary text-xs py-1" :disabled="regeneratingId === k.id" @click="regenerateKey(k)">
                      {{ regeneratingId === k.id ? '刷新中' : '刷新' }}
                    </button>
                    <template v-if="!k.isDefault">
                      <button type="button" class="btn-secondary text-xs py-1" :disabled="settingDefaultId === k.id" @click="setDefaultKey(k)">
                        {{ settingDefaultId === k.id ? '设置中' : '设为默认' }}
                      </button>
                      <button type="button" class="text-red-600 dark:text-red-400 text-xs hover:underline" :disabled="deletingId === k.id" @click="deleteKey(k)">
                        {{ deletingId === k.id ? '删除中' : '删除' }}
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'
import { copyToClipboard } from '~/utils/clipboard'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const me = ref(null)
const profileForm = reactive({ email: '', newPassword: '' })
const savingProfile = ref(false)
const loadingKeys = ref(false)
const addingKey = ref(false)
const showKeyId = ref(null)
const regeneratingId = ref(null)
const settingDefaultId = ref(null)
const deletingId = ref(null)

async function fetchMe() {
  if (!authStore.token) return
  try {
    const res = await $fetch('/api/auth/me', { headers: authStore.authHeader })
    if (res?.success && res.data) {
      me.value = res.data
      profileForm.email = res.data.email || ''
      profileForm.newPassword = ''
    }
  } catch (_) {
    me.value = null
  }
}

async function fetchKeys() {
  loadingKeys.value = true
  try {
    await settingsStore.fetchApiKeys()
  } finally {
    loadingKeys.value = false
  }
}

watch(() => authStore.isAuthenticated, (ok) => {
  if (ok) {
    fetchMe()
    fetchKeys()
  } else {
    me.value = null
  }
}, { immediate: true })

watch(() => props.visible, (visible) => {
  if (visible && authStore.isAuthenticated) {
    fetchMe()
    fetchKeys()
  }
})

async function saveProfile() {
  savingProfile.value = true
  try {
    const res = await $fetch('/api/auth/me', {
      method: 'PUT',
      headers: authStore.authHeader,
      body: {
        email: profileForm.email.trim(),
        newPassword: profileForm.newPassword || undefined
      }
    })
    if (res?.success && res.data) {
      authStore.updateUserProfile(res.data)
      me.value = res.data
      profileForm.newPassword = ''
      toastStore.success(res.message || '已保存')
    } else {
      toastStore.error(res?.message || '保存失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '保存失败')
  } finally {
    savingProfile.value = false
  }
}

async function createKey() {
  addingKey.value = true
  try {
    const result = await settingsStore.createApiKey('')
    if (result.success && result.data) {
      toastStore.success('ApiKey 已创建')
      showKeyId.value = result.data.id
    } else {
      toastStore.error(result.message || '创建失败')
    }
  } catch (_) {
    toastStore.error('创建失败')
  } finally {
    addingKey.value = false
  }
}

function copyKey(key) {
  copyToClipboard(key).then(() => toastStore.success('已复制')).catch(() => toastStore.error('复制失败'))
}

async function regenerateKey(k) {
  regeneratingId.value = k.id
  try {
    const result = await settingsStore.updateApiKey(k.id, { regenerate: true })
    if (result.success && result.data) {
      showKeyId.value = k.id
      toastStore.success('ApiKey 已刷新')
    } else {
      toastStore.error(result.message || '刷新失败')
    }
  } catch (_) {
    toastStore.error('刷新失败')
  } finally {
    regeneratingId.value = null
  }
}

async function setDefaultKey(k) {
  settingDefaultId.value = k.id
  try {
    const result = await settingsStore.updateApiKey(k.id, { isDefault: true })
    if (result.success) toastStore.success('已设为默认')
    else toastStore.error(result.message || '设置失败')
  } catch (_) {
    toastStore.error('设置失败')
  } finally {
    settingDefaultId.value = null
  }
}

async function deleteKey(k) {
  deletingId.value = k.id
  try {
    const result = await settingsStore.deleteApiKey(k.id)
    if (result.success) {
      toastStore.success('已删除')
      if (showKeyId.value === k.id) showKeyId.value = null
    } else {
      toastStore.error(result.message || '删除失败')
    }
  } catch (_) {
    toastStore.error('删除失败')
  } finally {
    deletingId.value = null
  }
}
</script>
