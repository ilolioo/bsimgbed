<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">系统设置</h1>

    <!-- 标签页 -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab.id
          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 应用设置 -->
    <div v-show="activeTab === 'app'" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">应用设置</h2>

        <form @submit.prevent="saveAppSettings" class="space-y-4">
          <!-- 应用名称 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              应用名称
            </label>
            <input
              v-model="appSettings.appName"
              type="text"
              class="input"
              placeholder="bsimgbed"
            />
          </div>

          <!-- 应用 Logo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              应用 Logo URL
            </label>
            <input
              v-model="appSettings.appLogo"
              type="text"
              class="input"
              placeholder="留空则使用默认图标"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              输入图片 URL，留空则显示默认图标
            </p>

            <!-- Logo 预览 -->
            <div v-if="appSettings.appLogo" class="mt-3 flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-gray-400">预览：</span>
              <img
                :src="appSettings.appLogo"
                alt="Logo 预览"
                class="h-8 w-8 rounded-lg object-cover"
                @error="logoError = true"
              />
              <span v-if="logoError" class="text-sm text-red-500 dark:text-red-400">图片加载失败</span>
            </div>
          </div>

          <!-- Favicon -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Favicon URL
            </label>
            <input
              v-model="appSettings.appFavicon"
              type="text"
              class="input"
              placeholder="留空则与 Logo 一致"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              浏览器标签页图标，留空则使用应用 Logo，均未设置时使用默认图标
            </p>

            <!-- Favicon 预览 -->
            <div v-if="appSettings.appFavicon" class="mt-3 flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-gray-400">预览：</span>
              <img
                :src="appSettings.appFavicon"
                alt="Favicon 预览"
                class="h-6 w-6 rounded object-cover"
                @error="faviconError = true"
              />
              <span v-if="faviconError" class="text-sm text-red-500 dark:text-red-400">图片加载失败</span>
            </div>
          </div>

          <!-- 全局背景图片 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              全局背景图片 URL
            </label>
            <input
              v-model="appSettings.backgroundUrl"
              type="text"
              class="input"
              placeholder="留空则使用默认背景"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              输入图片 URL 作为全局背景，留空则使用默认背景
            </p>

            <!-- 背景图片预览 -->
            <div v-if="appSettings.backgroundUrl" class="mt-3">
              <span class="text-sm text-gray-600 dark:text-gray-400">预览：</span>
              <div class="mt-2 relative rounded-lg overflow-hidden h-32 w-full max-w-md">
                <img
                  :src="appSettings.backgroundUrl"
                  alt="背景预览"
                  class="w-full h-full object-cover"
                  @error="backgroundError = true"
                />
                <div
                  v-if="appSettings.backgroundBlur > 0"
                  class="absolute inset-0 backdrop-blur"
                  :style="{ backdropFilter: `blur(${appSettings.backgroundBlur}px)` }"
                ></div>
              </div>
              <span v-if="backgroundError" class="text-sm text-red-500 dark:text-red-400">图片加载失败</span>
            </div>
          </div>

          <!-- 毛玻璃效果 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              毛玻璃效果：{{ appSettings.backgroundBlur }}px
            </label>
            <input
              v-model.number="appSettings.backgroundBlur"
              type="range"
              min="0"
              max="30"
              step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0px (无模糊)</span>
              <span>30px (最大模糊)</span>
            </div>
          </div>

          <!-- 站点 URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              站点 URL(建议填写)
            </label>
            <input
              v-model="appSettings.siteUrl"
              type="text"
              class="input"
              placeholder="例如: https://example.com 或 http://127.0.0.1:8080"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              用于通知消息中的图片完整链接，留空则自动使用请求时的 Host
            </p>
          </div>

          <div class="pt-4">
            <button type="submit" class="btn-primary" :disabled="savingApp">
              {{ savingApp ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 公告设置 -->
    <div v-show="activeTab === 'announcement'" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:megaphone" class="w-5 h-5 text-primary-500" />
          公告设置
        </h2>

        <form @submit.prevent="saveAnnouncementSettings" class="space-y-4">
          <!-- 启用开关 -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">启用公告</label>
              <p class="text-xs text-gray-500 dark:text-gray-400">开启后每次刷新页面都会显示公告</p>
            </div>
            <button
              type="button"
              @click="announcementSettings.enabled = !announcementSettings.enabled"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="announcementSettings.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="announcementSettings.enabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <!-- 展示形式 -->
          <div v-if="announcementSettings.enabled">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              展示形式
            </label>
            <div class="flex gap-4">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="announcementSettings.displayType"
                  value="modal"
                  class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">弹窗提醒</span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="announcementSettings.displayType"
                  value="banner"
                  class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">顶部横幅</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              弹窗提醒：居中弹窗显示；顶部横幅：页面顶部显示，支持点击关闭
            </p>
          </div>

          <!-- 公告内容 -->
          <div v-if="announcementSettings.enabled">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              公告内容
            </label>
            <textarea
              v-model="announcementSettings.content"
              rows="6"
              class="input w-full font-mono text-sm"
              placeholder="请输入公告内容，支持 HTML 语法，例如：&#10;<p>欢迎使用 <strong>bsimgbed</strong> 图床！</p>&#10;<p style='color: red;'>重要通知：系统将于今晚维护</p>"
            ></textarea>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              支持 HTML 语法，可使用标签如 &lt;p&gt;、&lt;strong&gt;、&lt;a&gt;、&lt;span style="..."&gt; 等
            </p>
          </div>

          <!-- 预览 -->
          <div v-if="announcementSettings.enabled && announcementSettings.content" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              预览效果
            </label>
            <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div v-html="announcementSettings.content" class="prose prose-sm dark:prose-invert max-w-none"></div>
            </div>
          </div>

          <div class="pt-4">
            <button type="submit" class="btn-primary" :disabled="savingAnnouncement">
              {{ savingAnnouncement ? '保存中...' : '保存公告设置' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 存储配置（多储存桶） -->
    <div v-show="activeTab === 'storage'" class="space-y-6">
      <div class="card p-6">
        <div class="flex items-start gap-3 mb-1">
          <div class="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Icon name="heroicons:server-stack" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">储存桶</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">新上传的图片将保存到默认桶。可添加多个桶并设置每个桶的容量上限，更换默认桶后原有图片仍可访问与删除。</p>
          </div>
        </div>

        <!-- 默认储存桶 -->
        <div class="mt-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">默认储存桶（新上传使用）</label>
          <select v-model="storageDefaultId" class="input w-full max-w-md bg-white dark:bg-gray-800">
            <option v-for="b in storageBuckets" :key="b.id" :value="b.id">
              {{ b.name }} — {{ formatSize(b.usedSize) }} / {{ formatSize(b.sizeLimit) }}
            </option>
          </select>
        </div>

        <!-- 储存桶列表 -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">储存桶列表</span>
            <button type="button" class="btn-secondary text-sm inline-flex items-center gap-1.5" @click="addBucket">
              <Icon name="heroicons:plus" class="w-4 h-4" />
              添加储存桶
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="b in storageBuckets"
              :key="b.id"
              class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-sm"
              :class="storageDefaultId === b.id ? 'ring-1 ring-primary-500/50 bg-primary-50/30 dark:bg-primary-900/10' : 'bg-gray-50/50 dark:bg-gray-800/30'"
            >
              <!-- 桶信息行 -->
              <div class="p-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3 flex-wrap min-w-0">
                  <span class="font-medium text-gray-900 dark:text-white truncate">{{ b.name }}</span>
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0"
                    :class="b.driver === 'local' ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300' : b.driver === 'webdav' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'"
                  >
                    <Icon v-if="b.driver === 'local'" name="heroicons:computer-desktop" class="w-3.5 h-3.5" />
                    <Icon v-else-if="b.driver === 'webdav'" name="heroicons:cloud-arrow-up" class="w-3.5 h-3.5" />
                    <Icon v-else name="heroicons:paper-airplane" class="w-3.5 h-3.5" />
                    {{ b.driver === 'local' ? '本地' : b.driver === 'webdav' ? 'WebDAV' : 'Telegram' }}
                  </span>
                  <span v-if="storageDefaultId === b.id" class="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded">默认</span>
                  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{{ formatSize(b.usedSize) }} / {{ formatSize(b.sizeLimit) }}</span>
                    <div class="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden" title="已用容量">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="(b.usedSize || 0) / (b.sizeLimit || 1) > 0.9 ? 'bg-red-500' : (b.usedSize || 0) / (b.sizeLimit || 1) > 0.7 ? 'bg-amber-500' : 'bg-primary-500'"
                        :style="{ width: Math.min(100, ((b.usedSize || 0) / (b.sizeLimit || 1)) * 100) + '%' }"
                      />
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button v-if="storageDefaultId !== b.id" type="button" class="btn-secondary text-sm inline-flex items-center gap-1" @click="storageDefaultId = b.id">
                    <Icon name="heroicons:star" class="w-4 h-4" />
                    设为默认
                  </button>
                  <button type="button" class="btn-secondary text-sm inline-flex items-center gap-1" @click="toggleEditBucket(b.id)">
                    <Icon :name="editingBucketId === b.id ? 'heroicons:chevron-up' : 'heroicons:pencil-square'" class="w-4 h-4" />
                    {{ editingBucketId === b.id ? '收起' : '编辑' }}
                  </button>
                  <button v-if="storageBuckets.length > 1" type="button" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="删除" @click="removeBucket(b.id)">
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- 编辑表单（可折叠） -->
              <div v-if="editingBucketId === b.id" class="px-4 pb-4 pt-0">
                <div class="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 p-4 space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">名称</label>
                      <input v-model="b.name" type="text" class="input w-full" placeholder="储存桶名称" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">存储方式</label>
                      <select v-model="b.driver" class="input w-full">
                        <option value="local">本地磁盘</option>
                        <option value="webdav">WebDAV</option>
                        <option value="telegram">Telegram</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">容量上限 (MB)</label>
                    <input v-model.number="b.sizeLimitMB" type="number" min="1" class="input w-32" />
                  </div>
                  <!-- 允许游客使用 -->
                  <div class="flex items-center justify-between py-1">
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">允许游客使用</label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">开启后，未登录用户可在首页选择此储存桶上传</p>
                    </div>
                    <button
                      type="button"
                      @click="b.allowGuest = !b.allowGuest"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      :class="b.allowGuest !== false ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        :class="b.allowGuest !== false ? 'translate-x-6' : 'translate-x-1'"
                      />
                    </button>
                  </div>
                  <!-- WebDAV 配置 -->
                  <div v-if="b.driver === 'webdav'" class="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      WebDAV 配置
                    </p>
                    <div class="space-y-2">
                      <input v-model="b.webdav.baseUrl" type="url" class="input w-full" placeholder="Base URL（如 https://dav.example.com）" />
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input v-model="b.webdav.username" type="text" class="input w-full" placeholder="用户名" />
                        <input v-model="b.webdav.password" type="password" class="input w-full" :placeholder="b.webdav.hasPassword ? '****（留空不修改）' : '密码'" autocomplete="new-password" />
                      </div>
                    </div>
                  </div>
                  <!-- Telegram 配置 -->
                  <div v-if="b.driver === 'telegram'" class="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Icon name="heroicons:paper-airplane" class="w-4 h-4 text-sky-500 dark:text-sky-400" />
                      Telegram 配置
                    </p>
                    <div class="space-y-2">
                      <input v-model="b.telegram.token" type="text" class="input w-full" :placeholder="b.telegram.hasToken ? '****（留空不修改）' : 'Bot Token'" />
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input v-model="b.telegram.chatId" type="text" class="input w-full" placeholder="Chat ID" />
                        <input v-model="b.telegram.apiBaseUrl" type="url" class="input w-full" placeholder="API 地址（可选）" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <button type="button" class="btn-primary inline-flex items-center gap-2" :disabled="savingStorage" @click="saveStorageConfig">
            <Icon v-if="!savingStorage" name="heroicons:check" class="w-4 h-4" />
            <Loading v-else size="sm" class="text-current" />
            {{ savingStorage ? '保存中...' : '保存储存桶配置' }}
          </button>
          <span class="text-xs text-gray-500 dark:text-gray-400">修改后需点击保存才会生效</span>
        </div>
      </div>
    </div>

    <!-- 账户设置 -->
    <div v-show="activeTab === 'account'" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">账户设置</h2>

        <div class="space-y-6">
          <!-- 修改用户名 -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">修改用户名</h3>
            <form @submit.prevent="updateUsername" class="flex gap-3">
              <input
                v-model="newUsername"
                type="text"
                class="input flex-1"
                placeholder="新用户名"
              />
              <button type="submit" class="btn-secondary" :disabled="savingUsername">
                {{ savingUsername ? '保存中...' : '修改' }}
              </button>
            </form>
          </div>

          <!-- 修改密码 -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">修改密码</h3>
            <form @submit.prevent="updatePassword" class="space-y-3">
              <input
                v-model="passwordForm.oldPassword"
                type="password"
                class="input"
                placeholder="当前密码"
              />
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="input"
                placeholder="新密码"
              />
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                class="input"
                placeholder="确认新密码"
              />
              <button type="submit" class="btn-secondary" :disabled="savingPassword">
                {{ savingPassword ? '保存中...' : '修改密码' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// 标签页
const tabs = [
  { id: 'app', label: '应用设置' },
  { id: 'announcement', label: '公告设置' },
  { id: 'storage', label: '存储配置' },
  { id: 'account', label: '账户设置' }
]
const activeTab = ref('app')

// 应用设置
const appSettings = reactive({
  appName: 'bsimgbed',
  appLogo: '',
  appFavicon: '',
  backgroundUrl: '',
  backgroundBlur: 0,
  siteUrl: ''
})
const logoError = ref(false)
const faviconError = ref(false)
const backgroundError = ref(false)
const savingApp = ref(false)

// 公告设置
const announcementSettings = reactive({
  enabled: false,
  content: '',
  displayType: 'modal'
})
const savingAnnouncement = ref(false)

// 存储配置（多桶）
const storageDefaultId = ref('default')
const storageBuckets = ref([])
const editingBucketId = ref(null)
const savingStorage = ref(false)

function formatSize(bytes) {
  if (bytes == null) return '0 B'
  const n = Number(bytes)
  if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(1) + ' GB'
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n >= 1024) return (n / 1024).toFixed(1) + ' KB'
  return n + ' B'
}

function addBucket() {
  const id = 'new-' + Date.now()
  storageBuckets.value.push({
    id,
    name: '新储存桶',
    driver: 'local',
    sizeLimit: 1024 * 1024 * 1024,
    sizeLimitMB: 1024,
    usedSize: 0,
    allowGuest: true,
    webdav: { baseUrl: '', username: '', password: '', hasPassword: false },
    telegram: { token: '', chatId: '', apiBaseUrl: '', hasToken: false }
  })
  editingBucketId.value = id
}

function removeBucket(id) {
  storageBuckets.value = storageBuckets.value.filter(b => b.id !== id)
  if (storageDefaultId.value === id) storageDefaultId.value = storageBuckets.value[0]?.id || 'default'
  if (editingBucketId.value === id) editingBucketId.value = null
}

function toggleEditBucket(id) {
  editingBucketId.value = editingBucketId.value === id ? null : id
}

// 账户设置
const newUsername = ref('')
const savingUsername = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const savingPassword = ref(false)

// 保存应用设置
async function saveAppSettings() {
  savingApp.value = true
  logoError.value = false
  faviconError.value = false
  backgroundError.value = false

  try {
    const result = await settingsStore.saveAppSettings({
      appName: appSettings.appName,
      appLogo: appSettings.appLogo,
      appFavicon: appSettings.appFavicon,
      backgroundUrl: appSettings.backgroundUrl,
      backgroundBlur: appSettings.backgroundBlur,
      siteUrl: appSettings.siteUrl,
      announcement: announcementSettings
    })

    if (result.success) {
      toastStore.success('设置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    savingApp.value = false
  }
}

// 保存公告设置
async function saveAnnouncementSettings() {
  savingAnnouncement.value = true

  try {
    const result = await settingsStore.updateAppSetting({
      announcement: {
        enabled: announcementSettings.enabled,
        content: announcementSettings.content,
        displayType: announcementSettings.displayType
      }
    })

    if (result.success) {
      toastStore.success('公告设置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    savingAnnouncement.value = false
  }
}

// 获取储存桶配置
async function fetchStorageConfig() {
  try {
    const response = await $fetch('/api/config/storage', { headers: authStore.authHeader })
    if (response.success && response.data) {
      storageDefaultId.value = response.data.defaultId || 'default'
      storageBuckets.value = (response.data.buckets || []).map(b => ({
        id: b.id,
        name: b.name || b.id,
        driver: (b.driver || 'local').toLowerCase(),
        sizeLimit: b.sizeLimit ?? 1024 * 1024 * 1024,
        sizeLimitMB: Math.round((b.sizeLimit ?? 1024 * 1024 * 1024) / 1024 / 1024),
        usedSize: b.usedSize ?? 0,
        allowGuest: b.allowGuest !== false,
        webdav: b.webdav ? { baseUrl: b.webdav.baseUrl || '', username: b.webdav.username || '', password: '', hasPassword: !!b.webdav.hasPassword } : { baseUrl: '', username: '', password: '', hasPassword: false },
        telegram: b.telegram ? { token: '', chatId: b.telegram.chatId || '', apiBaseUrl: b.telegram.apiBaseUrl || '', hasToken: !!b.telegram.hasToken } : { token: '', chatId: '', apiBaseUrl: '', hasToken: false }
      }))
    }
  } catch (error) {
    console.error('获取储存桶配置失败:', error)
  }
}

// 保存储存桶配置
async function saveStorageConfig() {
  savingStorage.value = true
  try {
    const buckets = storageBuckets.value.map(b => ({
      id: b.id.startsWith('new-') ? undefined : b.id,
      name: b.name,
      driver: b.driver,
      sizeLimit: (b.sizeLimitMB || 1024) * 1024 * 1024,
      allowGuest: b.allowGuest !== false,
      webdav: b.driver === 'webdav' ? { baseUrl: b.webdav.baseUrl, username: b.webdav.username, password: b.webdav.password || undefined } : undefined,
      telegram: b.driver === 'telegram' ? { token: b.telegram.token || undefined, chatId: b.telegram.chatId, apiBaseUrl: b.telegram.apiBaseUrl || undefined } : undefined
    }))
    const response = await $fetch('/api/config/storage', {
      method: 'PUT',
      body: { defaultId: storageDefaultId.value, buckets },
      headers: authStore.authHeader
    })
    if (response.success) {
      toastStore.success(response.message || '储存桶配置已保存')
      await fetchStorageConfig()
      editingBucketId.value = null
    } else {
      toastStore.error(response.message || '保存失败')
    }
  } catch (error) {
    toastStore.error(error.data?.message || '保存失败')
  } finally {
    savingStorage.value = false
  }
}

// 修改用户名
async function updateUsername() {
  if (!newUsername.value.trim()) {
    toastStore.error('请输入新用户名')
    return
  }

  savingUsername.value = true

  try {
    const response = await $fetch('/api/admin/username', {
      method: 'PUT',
      body: { username: newUsername.value.trim() },
      headers: authStore.authHeader
    })

    if (response.success) {
      authStore.updateUsername(newUsername.value.trim(), response.data?.token)
      toastStore.success('用户名已更新')
      newUsername.value = ''
    } else {
      toastStore.error(response.message || '更新失败')
    }
  } catch (error) {
    toastStore.error(error.data?.message || '更新失败')
  } finally {
    savingUsername.value = false
  }
}

// 修改密码
async function updatePassword() {
  if (!passwordForm.oldPassword) {
    toastStore.error('请输入当前密码')
    return
  }
  if (!passwordForm.newPassword) {
    toastStore.error('请输入新密码')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    toastStore.error('新密码至少需要 6 个字符')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toastStore.error('两次输入的密码不一致')
    return
  }

  savingPassword.value = true

  try {
    const response = await $fetch('/api/admin/password', {
      method: 'PUT',
      body: {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      },
      headers: authStore.authHeader
    })

    if (response.success) {
      authStore.clearMustChangePassword()
      toastStore.success('密码已更新')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      toastStore.error(response.message || '更新失败')
    }
  } catch (error) {
    toastStore.error(error.data?.message || '更新失败')
  } finally {
    savingPassword.value = false
  }
}

// 初始化
onMounted(async () => {
  await settingsStore.fetchAppSettings()
  await fetchStorageConfig()

  // 同步到本地状态
  appSettings.appName = settingsStore.appSettings.appName || 'bsimgbed'
  appSettings.appLogo = settingsStore.appSettings.appLogo || ''
  appSettings.appFavicon = settingsStore.appSettings.appFavicon || ''
  appSettings.backgroundUrl = settingsStore.appSettings.backgroundUrl || ''
  appSettings.backgroundBlur = settingsStore.appSettings.backgroundBlur || 0
  appSettings.siteUrl = settingsStore.appSettings.siteUrl || ''

  const announcement = settingsStore.appSettings.announcement || {}
  announcementSettings.enabled = announcement.enabled || false
  announcementSettings.content = announcement.content || ''
  announcementSettings.displayType = announcement.displayType || 'modal'

  newUsername.value = ''
})
</script>
