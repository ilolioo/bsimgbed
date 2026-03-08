<template>
  <div class="space-y-6">
    <!-- 标签页（仅在没有 panel 时显示，即独立使用时） -->
    <div v-if="!panel" class="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg mb-6 overflow-hidden">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-3 text-sm font-medium rounded-lg border-b-2 -mb-px transition-colors"
        :class="activeTab === tab.id
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 公共配置 -->
    <div v-show="showPublic" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">公共 API 配置 <span class="text-sm font-normal text-gray-500 dark:text-gray-400">- 访客上传使用</span></h2>

        <form @submit.prevent="savePublicConfig" class="space-y-4">
          <!-- 启用开关 -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">启用公共 API</label>
              <p class="text-xs text-gray-500 dark:text-gray-400">允许未登录用户上传图片</p>
            </div>
            <button
              type="button"
              @click="publicConfig.enabled = !publicConfig.enabled"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="publicConfig.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="publicConfig.enabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <!-- 允许的格式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              允许的图片格式
            </label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="format in availableFormats"
                :key="format"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
                :class="publicConfig.allowedFormats.includes(format)
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
              >
                <input
                  type="checkbox"
                  :value="format"
                  v-model="publicConfig.allowedFormats"
                  class="sr-only"
                />
                <span class="text-sm uppercase">{{ format }}</span>
              </label>
            </div>
          </div>

          <!-- 最大文件大小 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大文件大小 (MB)
            </label>
            <input
              type="number"
              v-model.number="publicConfigMaxSizeMB"
              min="1"
              max="100"
              class="input w-32"
            />
          </div>

          <!-- 开启压缩 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">开启压缩</label>
                <p class="text-xs text-gray-500 dark:text-gray-400">压缩上传的图片（默认不转换格式）</p>
              </div>
              <button
                type="button"
                @click="publicConfig.enableCompression = !publicConfig.enableCompression"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="publicConfig.enableCompression ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="publicConfig.enableCompression ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <!-- 压缩选项 -->
            <div v-if="publicConfig.enableCompression" class="ml-4 space-y-3">
              <!-- 压缩质量 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  压缩质量 ({{ publicConfig.compressionQuality }}%)
                </label>
                <input
                  type="range"
                  v-model.number="publicConfig.compressionQuality"
                  min="10"
                  max="100"
                  step="5"
                  class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <!-- 转换格式选项组（互斥） -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">转换格式（二选一，可都不选）</label>
                <!-- 转为 WebP -->
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">转为 WebP</label>
                    <p class="text-xs text-gray-500 dark:text-gray-400">将图片转换为 WebP 格式（不可与转为 PNG 同时开启）</p>
                  </div>
                  <button
                    type="button"
                    @click="togglePublicConvertFormat('webp')"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="publicConfig.convertToWebp ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="publicConfig.convertToWebp ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </div>
                <!-- 转为 PNG -->
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">转为 PNG</label>
                    <p class="text-xs text-gray-500 dark:text-gray-400">将图片转换为 PNG 格式（不可与转为 WebP 同时开启）</p>
                  </div>
                  <button
                    type="button"
                    @click="togglePublicConvertFormat('png')"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="publicConfig.convertToPng ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="publicConfig.convertToPng ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 频率限制 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              请求频率限制 (同一IP每分钟请求数)
            </label>
            <input
              type="number"
              v-model.number="publicConfig.rateLimit"
              min="1"
              max="1000"
              class="input w-32"
            />
          </div>

          <!-- 并发限制 -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">允许并发上传</label>
              <p class="text-xs text-gray-500 dark:text-gray-400">关闭后同一 IP 只能串行上传</p>
            </div>
            <button
              type="button"
              @click="publicConfig.allowConcurrent = !publicConfig.allowConcurrent"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="publicConfig.allowConcurrent ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="publicConfig.allowConcurrent ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="pt-4">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </form>
      </div>

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
            :class="publicConfig.contentSafety.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="publicConfig.contentSafety.enabled ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">自动检测访客上传图片是否包含违规内容</p>

        <!-- 内容安全详细配置 -->
        <div v-if="publicConfig.contentSafety.enabled" class="space-y-4">
          <!-- 检测服务选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              检测服务
            </label>
            <select
              v-model="publicConfig.contentSafety.provider"
              class="input w-full max-w-xs"
            >
              <option value="nsfwdet">nsfwdet.com(公益) - 20张/ip/分钟</option>
              <option value="elysiatools">elysiatools.com(公益) - 未说明限制</option>
              <option value="nsfw_detector">nsfw_detector(开源) - 自建</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">选择用于检测违规内容的API服务</p>
          </div>

          <!-- nsfwdet 配置 -->
          <div v-if="publicConfig.contentSafety.provider === 'nsfwdet'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API 地址
              </label>
              <input
                type="text"
                v-model="publicConfig.contentSafety.providers.nsfwdet.apiUrl"
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
                v-model="publicConfig.contentSafety.providers.nsfwdet.apiKey"
                class="input w-full"
                placeholder="nsfw_xxxxxxxx"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                用于API请求认证的密钥（默认使用厂商开放的公共密钥）
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                违规阈值 ({{ (publicConfig.contentSafety.providers.nsfwdet.threshold * 100).toFixed(0) }}%)
              </label>
              <input
                type="range"
                v-model.number="publicConfig.contentSafety.providers.nsfwdet.threshold"
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
          <div v-if="publicConfig.contentSafety.provider === 'elysiatools'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="heroicons:globe-alt" class="w-4 h-4 text-green-500 dark:text-green-400" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Elysia Tools 可选配置</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">留空则使用默认地址；若服务地址变更可在此覆盖。</p>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">上传地址（可选）</label>
              <input
                type="text"
                v-model="publicConfig.contentSafety.providers.elysiatools.uploadUrl"
                class="input w-full"
                placeholder="https://elysiatools.com/upload/nsfw-image-detector"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">检测 API 地址（可选）</label>
              <input
                type="text"
                v-model="publicConfig.contentSafety.providers.elysiatools.apiUrl"
                class="input w-full"
                placeholder="https://elysiatools.com/zh/api/tools/nsfw-image-detector"
              />
            </div>
          </div>

          <!-- nsfw_detector 配置 -->
          <div v-if="publicConfig.contentSafety.provider === 'nsfw_detector'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
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
                v-model="publicConfig.contentSafety.providers['nsfw_detector'].apiUrl"
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
                v-model="publicConfig.contentSafety.providers['nsfw_detector'].apiKey"
                class="input w-full"
                placeholder="如需认证请填写，否则留空"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                用于 Authorization: Bearer 认证的密钥（可选）
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                违规阈值 ({{ (publicConfig.contentSafety.providers['nsfw_detector'].threshold * 100).toFixed(0) }}%)
              </label>
              <input
                type="range"
                v-model.number="publicConfig.contentSafety.providers['nsfw_detector'].threshold"
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
              @click="publicConfig.contentSafety.autoBlacklistIp = !publicConfig.contentSafety.autoBlacklistIp"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="publicConfig.contentSafety.autoBlacklistIp ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="publicConfig.contentSafety.autoBlacklistIp ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="pt-4">
            <button @click="savePublicConfig" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存配置' }}
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

    <!-- 私有 API 配置 -->
    <div v-show="showPrivate" class="space-y-6">
      <!-- 私有 API 系统配置（仅管理员可见） -->
      <div v-if="authStore.isAdmin" class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">私有 API 配置 <span class="text-sm font-normal text-gray-500 dark:text-gray-400">- 登录后使用</span></h2>

        <form @submit.prevent="savePrivateConfig" class="space-y-4">
          <!-- 最大文件大小 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大文件大小 (MB)
            </label>
            <input
              type="number"
              v-model.number="privateConfigMaxSizeMB"
              min="1"
              max="500"
              class="input w-32"
            />
          </div>

          <!-- 开启压缩 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">开启压缩</label>
                <p class="text-xs text-gray-500 dark:text-gray-400">压缩上传的图片（默认不转换格式）</p>
              </div>
              <button
                type="button"
                @click="privateConfig.enableCompression = !privateConfig.enableCompression"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="privateConfig.enableCompression ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="privateConfig.enableCompression ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <!-- 压缩选项 -->
            <div v-if="privateConfig.enableCompression" class="ml-4 space-y-3">
              <!-- 压缩质量 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  压缩质量 ({{ privateConfig.compressionQuality }}%)
                </label>
                <input
                  type="range"
                  v-model.number="privateConfig.compressionQuality"
                  min="10"
                  max="100"
                  step="5"
                  class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <!-- 转换格式选项组（互斥） -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">转换格式（二选一，可都不选）</label>
                <!-- 转为 WebP -->
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">转为 WebP</label>
                    <p class="text-xs text-gray-500 dark:text-gray-400">将图片转换为 WebP 格式（不可与转为 PNG 同时开启）</p>
                  </div>
                  <button
                    type="button"
                    @click="togglePrivateConvertFormat('webp')"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="privateConfig.convertToWebp ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="privateConfig.convertToWebp ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </div>
                <!-- 转为 PNG -->
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">转为 PNG</label>
                    <p class="text-xs text-gray-500 dark:text-gray-400">将图片转换为 PNG 格式（不可与转为 WebP 同时开启）</p>
                  </div>
                  <button
                    type="button"
                    @click="togglePrivateConvertFormat('png')"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="privateConfig.convertToPng ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="privateConfig.convertToPng ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- API 文档 -->
    <div v-show="showDocs" class="space-y-4">
      <!-- 概述 -->
      <div class="card p-5">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-2">概述</h2>
        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li><strong>公共上传</strong>：无需认证，需管理员在「系统设置 → 公共配置」中开启；支持 multipart/form-data；单张大小受公共配置「最大文件大小」限制。若在公共配置中开启了<strong>内容安全</strong>，上传的图片将进入审核队列，检测到违规时会被标记为违规。</li>
          <li><strong>私有上传 / URL 上传 / 批量 URL</strong>：需在请求头携带 <code class="text-purple-600 dark:text-purple-400">X-API-Key</code>，或使用登录后的 Cookie。单张/单文件大小限制：若管理员在「用户管理」中为该用户单独设置了「可上传文件大小」则使用该值，否则使用「私有配置」中的最大文件大小。</li>
          <li><strong>API Key</strong>：在顶栏「我的」中创建、编辑名称、设为默认、刷新或删除；普通用户最多 2 个 Key，可自定义名称。管理员还可在「用户管理」编辑用户时查看与管理该用户的 ApiKey。</li>
          <li>上传成功后返回的 <code class="text-gray-700 dark:text-gray-300">data.url</code> 为相对路径，完整访问地址为：<code class="text-gray-700 dark:text-gray-300">{{ baseUrl }}/i/&#123;uuid&#125;.&#123;格式&#125;</code>，例如 <code class="text-gray-700 dark:text-gray-300">{{ baseUrl }}/i/xxx.webp</code>。</li>
        </ul>
      </div>

      <!-- 上传 API -->
      <div class="card p-5">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">上传 API</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">支持公共/私有上传、URL 拉取、批量 URL；未指定储存桶时使用默认储存桶。文件大小：公共受公共配置限制，私有受用户单独设置或私有配置限制。</p>
          </div>
        </div>

        <!-- API 端点列表 -->
        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Icon name="heroicons:globe-alt" class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">POST</span>
                <code class="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{{ baseUrl }}/api/upload/public</code>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">公共上传 - 无需认证</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Icon name="heroicons:lock-closed" class="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">POST</span>
                <code class="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{{ baseUrl }}/api/upload/private</code>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">私有上传 - 需要 <code class="text-purple-600 dark:text-purple-400">X-API-Key</code> 请求头</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <Icon name="heroicons:link" class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">POST</span>
                <code class="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{{ baseUrl }}/api/upload/url</code>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">URL 上传 - 从图片 URL 拉取并保存，需 <code class="text-amber-600 dark:text-amber-400">X-API-Key</code>（或登录 Cookie）</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <Icon name="heroicons:square-2-stack" class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">POST</span>
                <code class="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{{ baseUrl }}/api/upload/urls</code>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">批量 URL 上传 - 请求体 <code class="text-amber-600 dark:text-amber-400">{"urls": ["url1", "url2", ...]}</code>，需 API Key</p>
            </div>
          </div>
        </div>

        <!-- 请求参数 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">请求参数</h4>
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
            <div>
              <span class="text-xs font-medium text-blue-600 dark:text-blue-400">方式一：multipart/form-data（公共 / 私有）</span>
              <div class="mt-1">
                <code class="text-sm text-gray-700 dark:text-gray-300">Content-Type: multipart/form-data</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">file: 图片文件（必填）</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">bucketId: 储存桶 ID（可选，不传则使用默认储存桶）</code>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">文件大小：公共上传受「公共配置」限制；私有上传受「用户管理」该用户单独设置或「私有配置」限制。</p>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
              <span class="text-xs font-medium text-purple-600 dark:text-purple-400">方式二：JSON + Base64（仅私有 API）</span>
              <div class="mt-1">
                <code class="text-sm text-gray-700 dark:text-gray-300">Content-Type: application/json</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">base64: base64 编码的图片数据（支持 data:image/...;base64, 前缀）</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">filename: 文件名（可选）</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">bucketId: 储存桶 ID（可选）</code>
              </div>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
              <span class="text-xs font-medium text-amber-600 dark:text-amber-400">URL 上传：POST /api/upload/url</span>
              <div class="mt-1">
                <code class="text-sm text-gray-700 dark:text-gray-300">Content-Type: application/json</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">url: 图片地址（必填）</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">bucketId、returnBase64、showOnHomepage（可选）</code>
              </div>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
              <span class="text-xs font-medium text-amber-600 dark:text-amber-400">批量 URL：POST /api/upload/urls</span>
              <div class="mt-1">
                <code class="text-sm text-gray-700 dark:text-gray-300">Content-Type: application/json</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">urls: 图片地址数组 ["url1", "url2", ...]（必填）</code><br/>
                <code class="text-sm text-gray-700 dark:text-gray-300">bucketId、showOnHomepage（可选）</code>
              </div>
            </div>
          </div>
        </div>

        <!-- cURL 示例 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">cURL 示例</h4>
          <div class="relative">
            <pre class="bg-gray-900 text-gray-100 rounded-lg p-3 text-sm overflow-x-auto"><code><span class="text-gray-500"># 公共上传（仅支持 multipart/form-data）</span>
curl -X POST "{{ baseUrl }}/api/upload/public" -F "file=@image.jpg"

<span class="text-gray-500"># 私有上传 - multipart/form-data 方式</span>
curl -X POST "{{ baseUrl }}/api/upload/private" -H "X-API-Key: your-key" -F "file=@image.jpg"

<span class="text-gray-500"># 私有上传 - Base64 方式（带 data URI 前缀）</span>
curl -X POST "{{ baseUrl }}/api/upload/private" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"base64": "data:image/png;base64,iVBORw0KGgo...", "filename": "my-image.png"}'

<span class="text-gray-500"># 私有上传 - Base64 方式（纯 base64，默认识别为 PNG）</span>
curl -X POST "{{ baseUrl }}/api/upload/private" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"base64": "iVBORw0KGgo..."}'

<span class="text-gray-500"># URL 上传（需 X-API-Key）</span>
curl -X POST "{{ baseUrl }}/api/upload/url" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/image.png"}'

<span class="text-gray-500"># 批量 URL 上传</span>
curl -X POST "{{ baseUrl }}/api/upload/urls" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/1.jpg", "https://example.com/2.png"]}'</code></pre>
            <button
              @click="copyCode('curl-all')"
              class="absolute top-1.5 right-1.5 p-1.5 text-gray-400 hover:text-white transition-colors"
              title="复制代码"
            >
              <Icon name="heroicons:clipboard-document" class="w-4 h-4 icon-theme" />
            </button>
          </div>
        </div>

        <!-- JavaScript 示例 -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">JavaScript 示例</h4>
          <div class="relative">
            <pre class="bg-gray-900 text-gray-100 rounded-lg p-3 text-sm overflow-x-auto"><code><span class="text-gray-500">// ===== multipart/form-data 方式 =====</span>
const formData = new FormData();
formData.append('file', fileInput.files[0]);

<span class="text-gray-500">// 公共上传</span>
fetch('{{ baseUrl }}/api/upload/public', { method: 'POST', body: formData });

<span class="text-gray-500">// 私有上传</span>
fetch('{{ baseUrl }}/api/upload/private', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: formData
});

<span class="text-gray-500">// ===== Base64 方式（仅私有API支持）=====</span>
<span class="text-gray-500">// 将文件转换为 base64</span>
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

<span class="text-gray-500">// 使用 base64 上传</span>
const base64Data = await fileToBase64(fileInput.files[0]);
fetch('{{ baseUrl }}/api/upload/private', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    base64: base64Data,
    filename: 'my-image.png'
  })
});

<span class="text-gray-500">// URL 上传（需 API Key）</span>
fetch('{{ baseUrl }}/api/upload/url', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://example.com/image.png' })
});

<span class="text-gray-500">// 批量 URL 上传</span>
fetch('{{ baseUrl }}/api/upload/urls', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    urls: ['https://example.com/1.jpg', 'https://example.com/2.png']
  })
});</code></pre>
            <button
              @click="copyCode('js-all')"
              class="absolute top-1.5 right-1.5 p-1.5 text-gray-400 hover:text-white transition-colors"
              title="复制代码"
            >
              <Icon name="heroicons:clipboard-document" class="w-4 h-4 icon-theme" />
            </button>
          </div>
        </div>
      </div>

      <!-- 认证与 API Key -->
      <div class="card p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Icon name="heroicons:key" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">认证与 API Key</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">私有接口需在请求头携带 <code class="text-purple-600 dark:text-purple-400">X-API-Key: your-key</code>。Key 在顶栏「我的」中管理；普通用户最多 2 个，可自定义名称、设默认、刷新或删除。</p>
          </div>
        </div>
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">GET</span> <code class="font-mono">{{ baseUrl }}/api/apikeys</code> — 列出当前用户的 API Key（需登录）</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">POST</span> <code class="font-mono">{{ baseUrl }}/api/apikeys</code> — 创建新 Key，请求体 <code>{"name": "备注名"}</code>（可选，需登录）</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">PUT</span> <code class="font-mono">{{ baseUrl }}/api/apikeys/:id</code> — 更新 Key：<code>{"name": "新名称"}</code> 或 <code>{"isDefault": true}</code> 设为默认（需登录）</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">DELETE</span> <code class="font-mono">{{ baseUrl }}/api/apikeys/:id</code> — 删除指定 Key（需登录）</div>
        </div>
      </div>

      <!-- 响应格式与图片访问 -->
      <div class="card p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">响应格式与图片访问</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">上传成功后的返回数据结构；图片访问地址为 站点根地址 + data.url</p>
          </div>
        </div>

        <div class="relative mb-3">
          <pre class="bg-gray-900 text-gray-100 rounded-lg p-3 text-sm overflow-x-auto"><code>{
  "success": true,
  "message": "上传成功",
  "data": {
    "id": "image-doc-id",
    "uuid": "file-uuid",
    "filename": "file-uuid.webp",
    "format": "webp",
    "size": 123456,
    "width": 1920,
    "height": 1080,
    "url": "/i/file-uuid.webp",
    "uploadedAt": "2025-01-01T00:00:00.000Z"
  }
}</code></pre>
          <button
            @click="copyCode('response')"
            class="absolute top-1.5 right-1.5 p-1.5 text-gray-400 hover:text-white transition-colors"
            title="复制代码"
          >
            <Icon name="heroicons:clipboard-document" class="w-4 h-4 icon-theme" />
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>图片访问地址</strong>：<code class="text-gray-800 dark:text-gray-200">{{ baseUrl }}</code> + <code class="text-gray-800 dark:text-gray-200">data.url</code>，即 <code class="text-gray-800 dark:text-gray-200">{{ baseUrl }}/i/&#123;uuid&#125;.&#123;format&#125;</code>，例如 <code class="text-gray-800 dark:text-gray-200">{{ baseUrl }}/i/file-uuid.webp</code>。
        </p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'
import { copyToClipboard } from '../utils/clipboard'

/** 从系统设置嵌入时只显示指定面板：'public' | 'private' | 'docs'；不传则显示内部标签页 */
const props = defineProps({
  panel: { type: String, default: '' }
})

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const showPublic = computed(() => !props.panel || props.panel === 'public')
const showPrivate = computed(() => !props.panel || props.panel === 'private')
const showDocs = computed(() => !props.panel || props.panel === 'docs')

// 标签页：管理员显示全部，普通用户仅显示私有配置与 API 文档
const tabs = computed(() => {
  const base = [
    { id: 'private', label: '私有配置' },
    { id: 'docs', label: 'API文档' }
  ]
  if (authStore.isAdmin) {
    return [{ id: 'public', label: '公共配置' }, ...base]
  }
  return base
})
const activeTab = ref('private')

// 可用格式
const availableFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'apng', 'tiff', 'tif']

// 基础 URL
const baseUrl = computed(() => {
  if (import.meta.client) {
    return window.location.origin
  }
  return ''
})

// 状态
const saving = ref(false)

// IP 黑名单相关
const blacklist = ref([])
const blacklistPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const loadingBlacklist = ref(false)
const newBlacklistIp = ref('')
const newBlacklistReason = ref('')
const addingToBlacklist = ref(false)

// 默认的内容安全配置（与后端 moderation.js 保持一致）
const defaultContentSafetyConfig = {
  enabled: false,
  provider: 'elysiatools',  // 默认使用免费的 elysiatools
  autoBlacklistIp: false,  // 自动拉黑违规 IP
  providers: {
    nsfwdet: {
      name: 'NSFW Detector',
      apiUrl: 'https://nsfwdet.com/api/v1/detect-nsfw',
      apiKey: 'nsfw_2f7ab4f1d743d69ee242eec932b19671',  // 厂商开放的默认 API Key
      threshold: 0.5
    },
    elysiatools: {
      name: 'Elysia Tools',
      uploadUrl: 'https://elysiatools.com/upload/nsfw-image-detector',
      apiUrl: 'https://elysiatools.com/zh/api/tools/nsfw-image-detector'
    },
    'nsfw_detector': {
      name: 'nsfw_detector',
      apiUrl: '',  // 需在设置中自行配置
      apiKey: '',  // 如需认证需自行配置
      threshold: 0.8  // 违规阈值，默认80%
    }
  }
}

// 公共 API 配置
const publicConfig = reactive({
  enabled: true,
  allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'apng', 'tiff', 'tif'],
  maxFileSize: 10 * 1024 * 1024,
  enableCompression: false,
  compressionQuality: 80,
  convertToWebp: false,
  convertToPng: false,
  rateLimit: 10,
  allowConcurrent: false,
  contentSafety: { ...defaultContentSafetyConfig }
})

// 私有 API 配置（上传是否在首页展示以上传时勾选「上传后展示」为准，不在此配置）
const privateConfig = reactive({
  maxFileSize: 100 * 1024 * 1024,
  enableCompression: false,
  compressionQuality: 80,
  convertToWebp: false,
  convertToPng: false
})

// 文件大小转换（MB）
const publicConfigMaxSizeMB = computed({
  get: () => Math.round(publicConfig.maxFileSize / (1024 * 1024)),
  set: (val) => { publicConfig.maxFileSize = val * 1024 * 1024 }
})

const privateConfigMaxSizeMB = computed({
  get: () => Math.round(privateConfig.maxFileSize / (1024 * 1024)),
  set: (val) => { privateConfig.maxFileSize = val * 1024 * 1024 }
})

// 格式化日期
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

// 复制代码
function copyCode(type) {
  let code = ''
  switch (type) {
    case 'curl-all':
      code = `# 公共上传
curl -X POST "${baseUrl.value}/api/upload/public" -F "file=@image.jpg"

# 私有上传
curl -X POST "${baseUrl.value}/api/upload/private" -H "X-API-Key: your-key" -F "file=@image.jpg"`
      break
    case 'js-all':
      code = `const formData = new FormData();
formData.append('file', fileInput.files[0]);

// 公共上传
fetch('${baseUrl.value}/api/upload/public', { method: 'POST', body: formData });

// 私有上传
fetch('${baseUrl.value}/api/upload/private', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: formData
});`
      break
    case 'response':
      code = `{
  "success": true,
  "data": {
    "id": "image-uuid",
    "url": "${baseUrl.value}/i/image-uuid.webp",
    "filename": "original-filename.jpg",
    "size": 123456,
    "width": 1920,
    "height": 1080,
    "format": "webp",
    "isWebp": true
  }
}`
      break
  }

  copyToClipboard(code).then(() => {
    toastStore.success('代码已复制到剪贴板')
  }).catch(() => {
    toastStore.error('复制失败')
  })
}

// 切换内容安全开关（关闭时自动保存）
async function toggleContentSafety() {
  publicConfig.contentSafety.enabled = !publicConfig.contentSafety.enabled

  // 如果是关闭操作，自动保存配置
  if (!publicConfig.contentSafety.enabled) {
    await savePublicConfig()
  }
}

// 互斥切换公共配置格式转换
function togglePublicConvertFormat(format) {
  if (format === 'webp') {
    publicConfig.convertToWebp = !publicConfig.convertToWebp
    if (publicConfig.convertToWebp) publicConfig.convertToPng = false
  } else if (format === 'png') {
    publicConfig.convertToPng = !publicConfig.convertToPng
    if (publicConfig.convertToPng) publicConfig.convertToWebp = false
  }
}

// 互斥切换私有配置格式转换
function togglePrivateConvertFormat(format) {
  if (format === 'webp') {
    privateConfig.convertToWebp = !privateConfig.convertToWebp
    if (privateConfig.convertToWebp) privateConfig.convertToPng = false
  } else if (format === 'png') {
    privateConfig.convertToPng = !privateConfig.convertToPng
    if (privateConfig.convertToPng) privateConfig.convertToWebp = false
  }
}

// 保存公共 API 配置
async function savePublicConfig() {
  saving.value = true
  try {
    const result = await settingsStore.savePublicApiConfig({
      enabled: publicConfig.enabled,
      allowedFormats: publicConfig.allowedFormats,
      maxFileSize: publicConfig.maxFileSize,
      enableCompression: publicConfig.enableCompression,
      compressionQuality: publicConfig.compressionQuality,
      convertToWebp: publicConfig.convertToWebp,
      convertToPng: publicConfig.convertToPng,
      rateLimit: publicConfig.rateLimit,
      allowConcurrent: publicConfig.allowConcurrent,
      contentSafety: publicConfig.contentSafety
    })

    if (result.success) {
      toastStore.success('配置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存私有 API 配置
async function savePrivateConfig() {
  saving.value = true
  try {
    const result = await settingsStore.savePrivateApiConfig({
      maxFileSize: privateConfig.maxFileSize,
      enableCompression: privateConfig.enableCompression,
      compressionQuality: privateConfig.compressionQuality,
      convertToWebp: privateConfig.convertToWebp,
      convertToPng: privateConfig.convertToPng
    })

    if (result.success) {
      toastStore.success('配置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 获取黑名单列表
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

// 手动添加到黑名单
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
      // 刷新列表
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

// 从黑名单移除
async function removeFromBlacklist(item) {
  try {
    const response = await $fetch(`/api/blacklist/${item._id}`, {
      method: 'DELETE',
      headers: authStore.authHeader
    })

    if (response.success) {
      toastStore.success(`IP ${item.ip} 已从黑名单中移除`)
      // 刷新列表
      await fetchBlacklist(blacklistPagination.value.page)
    } else {
      toastStore.error(response.message || '移除失败')
    }
  } catch (error) {
    console.error('移除黑名单失败:', error)
    toastStore.error('移除失败')
  }
}

// 初始化
onMounted(async () => {
  if (authStore.isAdmin) {
    await Promise.all([
      settingsStore.fetchPublicApiConfig(),
      settingsStore.fetchPrivateApiConfig()
    ])
    const fetchedPublicConfig = settingsStore.publicApiConfig
    Object.assign(publicConfig, fetchedPublicConfig)
    if (!publicConfig.contentSafety) {
      publicConfig.contentSafety = { ...defaultContentSafetyConfig }
    }
    if (publicConfig.contentSafety.autoBlacklistIp === undefined) {
      publicConfig.contentSafety.autoBlacklistIp = false
    }
    if (!publicConfig.contentSafety.providers) {
      publicConfig.contentSafety.providers = { ...defaultContentSafetyConfig.providers }
    } else {
      if (!publicConfig.contentSafety.providers['nsfw_detector']) {
        publicConfig.contentSafety.providers['nsfw_detector'] = {
          name: 'nsfw_detector',
          apiUrl: '',
          apiKey: '',
          threshold: 0.8
        }
      } else if (publicConfig.contentSafety.providers['nsfw_detector'].threshold === undefined) {
        publicConfig.contentSafety.providers['nsfw_detector'].threshold = 0.8
      }
      if (publicConfig.contentSafety.providers.elysiatools && !publicConfig.contentSafety.providers.elysiatools.uploadUrl) {
        publicConfig.contentSafety.providers.elysiatools.uploadUrl = defaultContentSafetyConfig.providers.elysiatools.uploadUrl
      }
    }
    Object.assign(privateConfig, settingsStore.privateApiConfig)
    await fetchBlacklist()
  }
})
</script>