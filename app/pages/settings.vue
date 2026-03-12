<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">系统设置</h1>

    <!-- 标签页（与顶栏一致：横向滑动式菜单，半透明+毛玻璃，nav-link 风格） -->
    <div class="settings-tab-bar bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
      <nav class="flex items-center gap-0.5 sm:gap-2 overflow-x-auto scrollbar-hide py-2 px-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :ref="(el) => { if (el) tabRefs[tab.id] = el }"
          type="button"
          @click="activeTab = tab.id"
          class="settings-nav-link flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="activeTab === tab.id ? 'settings-nav-link-active' : ''"
        >
          {{ tab.label }}
        </button>
      </nav>
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
              <span v-if="logoError" class="text-sm text-red-500">图片加载失败</span>
            </div>
          </div>

          <!-- Favicon 图标 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Favicon 图标 URL
            </label>
            <input
              v-model="appSettings.favicon"
              type="text"
              class="input"
              placeholder="留空则使用默认图标"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              浏览器标签页图标，留空则使用默认 favicon
            </p>
            <div v-if="appSettings.favicon" class="mt-3 flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-gray-400">预览：</span>
              <img
                :src="appSettings.favicon"
                alt="Favicon 预览"
                class="h-6 w-6 object-contain"
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
              <span v-if="backgroundError" class="text-sm text-red-500">图片加载失败</span>
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

          <div class="flex items-center gap-3">
            <input
              id="registrationEnabled"
              v-model="appSettings.registrationEnabled"
              type="checkbox"
              class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            <label for="registrationEnabled" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              允许开放注册（访客可在注册页自行注册账号）
            </label>
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
          <Icon name="heroicons:megaphone" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
          公告设置
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">可为游客（未登录）与普通用户（已登录）分别设置多条公告；每条可单独选择展示形式（弹窗或横幅），横幅支持自动轮播与轮播速度配置。</p>

        <form @submit.prevent="saveAnnouncementSettings" class="space-y-8">
          <!-- 游客公告 -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">游客公告</h3>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700 dark:text-gray-300">启用</span>
              <button
                type="button"
                @click="announcementSettings.guest.enabled = !announcementSettings.guest.enabled"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="announcementSettings.guest.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="announcementSettings.guest.enabled ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
            <template v-if="announcementSettings.guest.enabled">
              <div class="text-xs text-gray-500 dark:text-gray-400">默认展示形式（用于新添加的公告）：</div>
              <div class="flex gap-4">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="announcementSettings.guest.displayType" value="modal" class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">弹窗</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="announcementSettings.guest.displayType" value="banner" class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">横幅</span>
                </label>
              </div>
              <div v-if="guestHasBannerItems" class="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">横幅选项</div>
                <div class="flex items-center justify-between gap-4">
                  <span class="text-sm text-gray-600 dark:text-gray-400">自动轮播</span>
                  <button type="button" @click="announcementSettings.guest.bannerAutoRotate = !announcementSettings.guest.bannerAutoRotate" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="announcementSettings.guest.bannerAutoRotate ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="announcementSettings.guest.bannerAutoRotate ? 'translate-x-6' : 'translate-x-1'" />
                  </button>
                </div>
                <div v-if="announcementSettings.guest.bannerAutoRotate" class="flex items-center gap-2">
                  <label class="text-sm text-gray-600 dark:text-gray-400">轮播间隔（秒）</label>
                  <input v-model.number="announcementSettings.guest.bannerRotateSpeed" type="number" min="1" max="120" class="input w-20 text-sm" />
                </div>
              </div>
              <div class="space-y-3">
                <div v-for="(item, idx) in announcementSettings.guest.items" :key="item.id" class="flex gap-2 items-start border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                  <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs text-gray-500 dark:text-gray-400">展示形式：</span>
                      <label class="inline-flex items-center gap-1 cursor-pointer">
                        <input type="radio" :value="'modal'" v-model="item.form" class="w-3.5 h-3.5 text-primary-600" />
                        <span class="text-sm">弹窗</span>
                      </label>
                      <label class="inline-flex items-center gap-1 cursor-pointer">
                        <input type="radio" :value="'banner'" v-model="item.form" class="w-3.5 h-3.5 text-primary-600" />
                        <span class="text-sm">横幅</span>
                      </label>
                    </div>
                    <textarea v-model="item.content" rows="3" class="input w-full font-mono text-sm" :placeholder="'公告 ' + (idx + 1) + '，支持 HTML'"></textarea>
                    <div v-if="item.content" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div v-html="item.content" class="prose prose-sm dark:prose-invert max-w-none"></div>
                    </div>
                  </div>
                  <button type="button" @click="removeAnnouncementItem('guest', idx)" class="btn-secondary p-2 shrink-0" title="删除本条" :disabled="announcementSettings.guest.items.length <= 1">
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </button>
                </div>
                <button type="button" @click="addAnnouncementItem('guest')" class="btn-secondary text-sm inline-flex items-center gap-1">
                  <Icon name="heroicons:plus" class="w-4 h-4" />
                  添加一条公告
                </button>
              </div>
            </template>
          </div>

          <!-- 普通用户公告 -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">普通用户公告</h3>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700 dark:text-gray-300">启用</span>
              <button
                type="button"
                @click="announcementSettings.user.enabled = !announcementSettings.user.enabled"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="announcementSettings.user.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="announcementSettings.user.enabled ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
            <template v-if="announcementSettings.user.enabled">
              <div class="text-xs text-gray-500 dark:text-gray-400">默认展示形式（用于新添加的公告）：</div>
              <div class="flex gap-4">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="announcementSettings.user.displayType" value="modal" class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">弹窗</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="announcementSettings.user.displayType" value="banner" class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">横幅</span>
                </label>
              </div>
              <div v-if="userHasBannerItems" class="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">横幅选项</div>
                <div class="flex items-center justify-between gap-4">
                  <span class="text-sm text-gray-600 dark:text-gray-400">自动轮播</span>
                  <button type="button" @click="announcementSettings.user.bannerAutoRotate = !announcementSettings.user.bannerAutoRotate" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="announcementSettings.user.bannerAutoRotate ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="announcementSettings.user.bannerAutoRotate ? 'translate-x-6' : 'translate-x-1'" />
                  </button>
                </div>
                <div v-if="announcementSettings.user.bannerAutoRotate" class="flex items-center gap-2">
                  <label class="text-sm text-gray-600 dark:text-gray-400">轮播间隔（秒）</label>
                  <input v-model.number="announcementSettings.user.bannerRotateSpeed" type="number" min="1" max="120" class="input w-20 text-sm" />
                </div>
              </div>
              <div class="space-y-3">
                <div v-for="(item, idx) in announcementSettings.user.items" :key="item.id" class="flex gap-2 items-start border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                  <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs text-gray-500 dark:text-gray-400">展示形式：</span>
                      <label class="inline-flex items-center gap-1 cursor-pointer">
                        <input type="radio" :value="'modal'" v-model="item.form" class="w-3.5 h-3.5 text-primary-600" />
                        <span class="text-sm">弹窗</span>
                      </label>
                      <label class="inline-flex items-center gap-1 cursor-pointer">
                        <input type="radio" :value="'banner'" v-model="item.form" class="w-3.5 h-3.5 text-primary-600" />
                        <span class="text-sm">横幅</span>
                      </label>
                    </div>
                    <textarea v-model="item.content" rows="3" class="input w-full font-mono text-sm" :placeholder="'公告 ' + (idx + 1) + '，支持 HTML'"></textarea>
                    <div v-if="item.content" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div v-html="item.content" class="prose prose-sm dark:prose-invert max-w-none"></div>
                    </div>
                  </div>
                  <button type="button" @click="removeAnnouncementItem('user', idx)" class="btn-secondary p-2 shrink-0" title="删除本条" :disabled="announcementSettings.user.items.length <= 1">
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </button>
                </div>
                <button type="button" @click="addAnnouncementItem('user')" class="btn-secondary text-sm inline-flex items-center gap-1">
                  <Icon name="heroicons:plus" class="w-4 h-4" />
                  添加一条公告
                </button>
              </div>
            </template>
          </div>

          <div class="pt-2">
            <button type="submit" class="btn-primary" :disabled="savingAnnouncement">
              {{ savingAnnouncement ? '保存中...' : '保存公告设置' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 关于设置 -->
    <div v-show="activeTab === 'about'" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:document-text" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
          关于设置
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">自定义关于页面中「关于项目」与「项目信息」的展示内容。留空将使用默认文案。</p>

        <form @submit.prevent="saveAboutSettings" class="space-y-6">
          <!-- 关于项目 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">关于项目</label>
            <textarea
              v-model="aboutSettings.aboutProject"
              rows="5"
              class="input w-full"
              placeholder="关于页「关于项目」区块的简介文字"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">展示在关于页的「关于项目」卡片中，支持多行。</p>
          </div>

          <!-- 项目信息（链接列表） -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">项目信息</label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">关于页「项目信息」区块中的链接列表，可添加多条（如项目地址、文档链接等）。图标填写 Iconify 图标名（如 <code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">simple-icons:github</code>、<code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">heroicons:link</code>），留空使用默认链接图标。</p>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in aboutSettings.projectInfo"
                :key="'pi-' + idx"
                class="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <input
                  v-model="item.icon"
                  type="text"
                  class="input w-48 shrink-0 font-mono text-sm"
                  placeholder="图标（如 simple-icons:github）"
                  title="Iconify 图标名，留空默认链接图标"
                />
                <span v-if="item.icon" class="shrink-0 flex items-center justify-center w-8 h-8 rounded bg-gray-200 dark:bg-gray-600">
                  <Icon :name="item.icon" class="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </span>
                <input
                  v-model="item.label"
                  type="text"
                  class="input flex-1 min-w-[100px]"
                  placeholder="标签（如：项目地址）"
                />
                <input
                  v-model="item.url"
                  type="url"
                  class="input flex-1 min-w-[180px]"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  class="btn-secondary p-2 shrink-0"
                  title="删除"
                  :disabled="aboutSettings.projectInfo.length <= 1"
                  @click="removeProjectInfoItem(idx)"
                >
                  <Icon name="heroicons:trash" class="w-4 h-4" />
                </button>
              </div>
              <button type="button" class="btn-secondary text-sm inline-flex items-center gap-1" @click="addProjectInfoItem">
                <Icon name="heroicons:plus" class="w-4 h-4" />
                添加一条链接
              </button>
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" class="btn-primary" :disabled="savingAbout">
              {{ savingAbout ? '保存中...' : '保存关于设置' }}
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
              <Icon name="heroicons:plus" class="w-4 h-4 icon-theme" />
              添加储存桶
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="b in storageBuckets"
              :key="getBucketKey(b)"
              class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-sm"
              :class="storageDefaultId === b.id ? 'ring-1 ring-primary-500/50 bg-primary-50/30 dark:bg-primary-900/10' : 'bg-gray-50/50 dark:bg-gray-800/30'"
            >
              <!-- 桶信息行 -->
              <div class="p-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3 flex-wrap min-w-0">
                  <span class="font-medium text-gray-900 dark:text-white truncate">{{ b.name }}</span>
                  <span class="px-2 py-0.5 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded shrink-0" :title="'储存桶 ID: ' + b.id">{{ b.id }}</span>
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
                    <Icon name="heroicons:star" class="w-4 h-4 icon-theme" />
                    设为默认
                  </button>
                  <button type="button" class="btn-secondary text-sm inline-flex items-center gap-1" @click="toggleEditBucket(getBucketKey(b))">
                    <Icon :name="editingBucketId === getBucketKey(b) ? 'heroicons:chevron-up' : 'heroicons:pencil-square'" class="w-4 h-4" />
                    {{ editingBucketId === getBucketKey(b) ? '收起' : '编辑' }}
                  </button>
                  <button v-if="storageBuckets.length > 1" type="button" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="删除" @click="removeBucket(b.id)">
                    <Icon name="heroicons:trash" class="w-4 h-4 icon-theme" />
                  </button>
                </div>
              </div>

              <!-- 编辑表单（可折叠） -->
              <div v-if="editingBucketId === getBucketKey(b)" class="px-4 pb-4 pt-0">
                <div class="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 p-4 space-y-4">
                  <!-- 储存桶 ID：新建或桶内无图片时可编辑 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">储存桶 ID</label>
                    <input
                      v-model="b.id"
                      type="text"
                      class="input w-full font-mono"
                      placeholder="如 backup、images，留空则自动生成"
                      :disabled="!canEditBucketId(b)"
                      maxlength="64"
                    />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {{ canEditBucketId(b) ? '新建或桶内无图片时可设置，保存后若有图片则不可修改；建议使用英文、数字、连字符' : '桶内已有图片，不可修改' }}
                    </p>
                  </div>
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
                  <!-- 游客可用 -->
                  <div class="flex items-center justify-between py-1">
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">游客可用</label>
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
                  <!-- 普通用户可用 -->
                  <div class="flex items-center justify-between py-1">
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">普通用户可用</label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">开启后，已登录普通用户可在首页或 API 中选择此储存桶上传；管理员始终可用全部储存桶</p>
                    </div>
                    <button
                      type="button"
                      @click="b.allowUser = !b.allowUser"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      :class="b.allowUser !== false ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        :class="b.allowUser !== false ? 'translate-x-6' : 'translate-x-1'"
                      />
                    </button>
                  </div>
                  <!-- 容量界面可见 -->
                  <div class="flex items-center justify-between py-1">
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">容量界面可见</label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">关闭后，该储存桶不会在「容量」页显示</p>
                    </div>
                    <button
                      type="button"
                      @click="b.showOnCapacity = !b.showOnCapacity"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      :class="b.showOnCapacity !== false ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        :class="b.showOnCapacity !== false ? 'translate-x-6' : 'translate-x-1'"
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

    <!-- 通知设置 -->
    <div v-show="activeTab === 'notification'" class="space-y-6">
      <NotificationSettings />
    </div>

    <!-- 邮箱设置 -->
    <div v-show="activeTab === 'email'" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:envelope" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
          邮箱设置
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          用于注册邮箱验证与通知方式为「Email 邮件」时的发信；通知方式在「通知设置」中选择。
        </p>

        <div class="space-y-6">
          <!-- 注册邮箱验证 -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">注册邮箱验证</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                开启后，新用户注册需填写邮箱，点击验证邮件中的链接后才能登录
              </p>
            </div>
            <button
              type="button"
              @click="emailSettings.registrationEmailVerification = !emailSettings.registrationEmailVerification"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
              :class="emailSettings.registrationEmailVerification ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="emailSettings.registrationEmailVerification ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <!-- 发信配置 -->
          <div class="space-y-4">
            <h3 class="font-medium text-gray-900 dark:text-white">发信配置</h3>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮件服务商 <span class="text-red-500">*</span></label>
              <input v-model="emailSettings.service" type="text" class="input w-full" placeholder="例如: QQ、126、163、Gmail" />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <a href="https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json" target="_blank" rel="noopener" class="text-primary-600 dark:text-primary-400 hover:underline">支持列表</a>
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">发件人邮箱 <span class="text-red-500">*</span></label>
              <input v-model="emailSettings.user" type="email" class="input w-full" placeholder="your-email@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱授权码/密码 <span class="text-red-500">*</span></label>
              <input
                v-model="emailSettings.pass"
                type="password"
                class="input w-full"
                :placeholder="emailSettings.hasPassword ? '留空则不修改' : '授权码或密码'"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">多数邮箱需使用授权码，请在邮箱设置中获取</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">收件人邮箱（可选）</label>
              <input v-model="emailSettings.to" type="email" class="input w-full" placeholder="通知收件人，留空则发给自己" />
            </div>
          </div>

          <!-- 自定义邮件内容 -->
          <div class="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <h3 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="heroicons:pencil-square" class="w-4 h-4 text-primary-500 dark:text-primary-400" />
              自定义邮件内容
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              以下为可选配置，留空则使用系统默认。支持占位符的字段会在说明中标注。
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮件主题前缀</label>
              <input v-model="emailSettings.subjectPrefix" type="text" class="input w-full" placeholder="[bsimgbed]" />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">所有邮件主题前都会加此前缀，如 [bsimgbed]</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">验证邮件主题</label>
                <input v-model="emailSettings.verificationSubject" type="text" class="input w-full" placeholder="请验证你的邮箱" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">测试邮件主题</label>
                <input v-model="emailSettings.testSubject" type="text" class="input w-full" placeholder="测试通知" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">验证邮件正文（HTML）</label>
              <textarea v-model="emailSettings.verificationBody" rows="4" class="input w-full font-mono text-sm" placeholder="留空使用默认。占位符：{{username}} {{verifyUrl}}" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">测试邮件正文（HTML）</label>
              <textarea v-model="emailSettings.testBody" rows="3" class="input w-full font-mono text-sm" placeholder="留空使用默认" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">通知类邮件主题模板</label>
              <input v-model="emailSettings.notificationSubjectTemplate" type="text" class="input w-full" placeholder="{{title}}" />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">占位符：{{title}}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">通知类邮件正文模板（HTML）</label>
              <textarea v-model="emailSettings.notificationBodyTemplate" rows="5" class="input w-full font-mono text-sm" placeholder="留空使用默认。占位符：{{title}} {{message}} {{dataTable}}" />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">占位符：{{title}} {{message}} {{dataTable}} {{imageHtml}}（标题、正文、详细信息表格、图片块）</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" class="btn-primary" :disabled="savingEmail" @click="saveEmailSettings">
              <Loading v-if="savingEmail" size="sm" class="mr-1" />
              {{ savingEmail ? '保存中...' : '保存' }}
            </button>
            <button
              type="button"
              class="btn-secondary"
              :disabled="testingEmail || !emailSettings.service || !emailSettings.user || (!emailSettings.pass && !emailSettings.hasPassword)"
              @click="testEmailSettings"
            >
              <Icon v-if="testingEmail" name="heroicons:arrow-path" class="w-4 h-4 mr-1 animate-spin" />
              {{ testingEmail ? '测试中...' : '发送测试邮件' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全设置 -->
    <div v-show="activeTab === 'security'" class="space-y-6">
      <SecuritySettings />
    </div>

    <!-- 上传设置（公共配置 + 私有配置） -->
    <div v-show="activeTab === 'upload'" class="space-y-6">
      <ApiManagement panel="public" />
      <ApiManagement panel="private" />
    </div>

    <!-- API 文档 -->
    <div v-show="activeTab === 'api-docs'" class="space-y-6">
      <ApiManagement panel="docs" />
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'
definePageMeta({
  middleware: ['auth', 'admin']
})

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// 标签页
const tabs = [
  { id: 'app', label: '应用设置' },
  { id: 'announcement', label: '公告设置' },
  { id: 'about', label: '关于设置' },
  { id: 'storage', label: '存储配置' },
  { id: 'notification', label: '通知设置' },
  { id: 'email', label: '邮箱设置' },
  { id: 'security', label: '安全设置' },
  { id: 'upload', label: '上传设置' },
  { id: 'api-docs', label: 'API文档' }
]
const route = useRoute()
const activeTab = ref(route.query.tab === 'notification' ? 'notification' : route.query.tab === 'email' ? 'email' : route.query.tab === 'security' ? 'security' : route.query.tab === 'upload' ? 'upload' : route.query.tab === 'api-docs' ? 'api-docs' : route.query.tab === 'about' ? 'about' : 'app')
const tabRefs = reactive({})
watch(() => route.query.tab, (tab) => {
  if (tab === 'notification') activeTab.value = 'notification'
  else if (tab === 'email') activeTab.value = 'email'
  else if (tab === 'security') activeTab.value = 'security'
  else if (tab === 'upload') activeTab.value = 'upload'
  else if (tab === 'api-docs') activeTab.value = 'api-docs'
  else if (tab === 'about') activeTab.value = 'about'
})
// 切换标签时将当前项滚动到可见区域（与顶栏滑动菜单一致）
watch(activeTab, (id) => {
  nextTick(() => {
    const el = tabRefs[id]
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
})

// 邮箱设置（独立于通知）
const emailSettings = reactive({
  registrationEmailVerification: false,
  service: '',
  user: '',
  pass: '',
  hasPassword: false,
  to: '',
  subjectPrefix: '[bsimgbed]',
  verificationSubject: '请验证你的邮箱',
  verificationBody: '',
  testSubject: '测试通知',
  testBody: '',
  notificationSubjectTemplate: '{{title}}',
  notificationBodyTemplate: ''
})
const savingEmail = ref(false)
const testingEmail = ref(false)

// 应用设置
const appSettings = reactive({
  appName: 'bsimgbed',
  appLogo: '',
  favicon: '',
  backgroundUrl: '',
  backgroundBlur: 0,
  siteUrl: '',
  registrationEnabled: true
})
const logoError = ref(false)
const faviconError = ref(false)
const backgroundError = ref(false)
const savingApp = ref(false)

const defaultAnnouncementBlock = () => ({
  enabled: false,
  displayType: 'modal',
  bannerAutoRotate: false,
  bannerRotateSpeed: 5,
  items: [{ id: '1', content: '', form: 'banner' }]
})
// 公告设置：游客与普通用户分开，每类支持多条公告（items），每条可设 form：modal/banner
const announcementSettings = reactive({
  guest: defaultAnnouncementBlock(),
  user: defaultAnnouncementBlock()
})

const guestHasBannerItems = computed(() => (announcementSettings.guest.items || []).some(it => (it.form || announcementSettings.guest.displayType) === 'banner'))
const userHasBannerItems = computed(() => (announcementSettings.user.items || []).some(it => (it.form || announcementSettings.user.displayType) === 'banner'))

function addAnnouncementItem(blockKey) {
  const block = announcementSettings[blockKey]
  if (!block.items) block.items = [{ id: '1', content: '', form: block.displayType || 'banner' }]
  block.items.push({ id: `item-${Date.now()}`, content: '', form: block.displayType || 'banner' })
}

function removeAnnouncementItem(blockKey, index) {
  const block = announcementSettings[blockKey]
  if (!block.items || block.items.length <= 1) return
  block.items.splice(index, 1)
}
const savingAnnouncement = ref(false)

// 关于设置
const defaultAboutProject = 'bsimgbed 是一个简单易用的个人图床应用，支持本地磁盘、WebDAV、Telegram 等多种存储方式，可自由切换无需重启。提供公共/私有 API、API Key 管理、内容安全（NSFW 检测、违规自动处理）与通知等能力，适合自建图床与图片管理。'
const defaultProjectInfo = [{ label: '项目地址', url: 'https://github.com/ilolioo/bsimgbed', icon: 'simple-icons:github' }]
const aboutSettings = reactive({
  aboutProject: defaultAboutProject,
  projectInfo: [...defaultProjectInfo.map(i => ({ ...i }))]
})
const savingAbout = ref(false)

function addProjectInfoItem() {
  aboutSettings.projectInfo.push({ label: '', url: '', icon: '' })
}

function removeProjectInfoItem(index) {
  if (aboutSettings.projectInfo.length <= 1) return
  aboutSettings.projectInfo.splice(index, 1)
}

async function saveAboutSettings() {
  savingAbout.value = true
  try {
    const result = await settingsStore.updateAppSetting({
      aboutProject: aboutSettings.aboutProject || defaultAboutProject,
      projectInfo: aboutSettings.projectInfo.filter(it => it && (it.url || it.label)).map(it => ({
        label: String(it.label || '').trim() || '链接',
        url: String(it.url || '').trim(),
        icon: String(it.icon || '').trim() || undefined
      }))
    })
    if (result.success) {
      toastStore.success('关于设置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '保存失败')
  } finally {
    savingAbout.value = false
  }
}

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

// 列表项与展开状态用稳定 key，避免编辑「储存桶 ID」时 key 变化导致收起
function getBucketKey(b) {
  return b._editKey ?? b.id
}

// 新建桶或旧桶无图片时可修改储存桶 ID
function canEditBucketId(b) {
  if (b._editKey) return true
  return (b.usedSize ?? 0) === 0
}

function addBucket() {
  const id = 'bs-' + Date.now()
  const _editKey = 'new-' + Date.now()
  storageBuckets.value.push({
    _editKey,
    id,
    name: '新储存桶',
    driver: 'local',
    sizeLimit: 1024 * 1024 * 1024,
    sizeLimitMB: 1024,
    usedSize: 0,
    allowGuest: true,
    allowUser: true,
    showOnCapacity: true,
    webdav: { baseUrl: '', username: '', password: '', hasPassword: false },
    telegram: { token: '', chatId: '', apiBaseUrl: '', hasToken: false }
  })
  editingBucketId.value = _editKey
}

function removeBucket(id) {
  const bucket = storageBuckets.value.find(b => b.id === id)
  if (bucket && getBucketKey(bucket) === editingBucketId.value) editingBucketId.value = null
  storageBuckets.value = storageBuckets.value.filter(b => b.id !== id)
  if (storageDefaultId.value === id) storageDefaultId.value = storageBuckets.value[0]?.id || 'default'
}

function toggleEditBucket(key) {
  editingBucketId.value = editingBucketId.value === key ? null : key
}

// 保存应用设置
async function saveAppSettings() {
  savingApp.value = true
  logoError.value = false
  backgroundError.value = false
  faviconError.value = false

  try {
    const result = await settingsStore.saveAppSettings({
      appName: appSettings.appName,
      appLogo: appSettings.appLogo,
      favicon: appSettings.favicon,
      backgroundUrl: appSettings.backgroundUrl,
      backgroundBlur: appSettings.backgroundBlur,
      siteUrl: appSettings.siteUrl,
      registrationEnabled: appSettings.registrationEnabled,
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
        guest: {
          enabled: announcementSettings.guest.enabled,
          displayType: announcementSettings.guest.displayType,
          bannerAutoRotate: !!announcementSettings.guest.bannerAutoRotate,
          bannerRotateSpeed: Math.min(120, Math.max(1, Number(announcementSettings.guest.bannerRotateSpeed) || 5)),
          items: (announcementSettings.guest.items || []).map(it => ({ id: it.id, content: it.content || '', form: (it.form === 'modal' || it.form === 'banner') ? it.form : undefined }))
        },
        user: {
          enabled: announcementSettings.user.enabled,
          displayType: announcementSettings.user.displayType,
          bannerAutoRotate: !!announcementSettings.user.bannerAutoRotate,
          bannerRotateSpeed: Math.min(120, Math.max(1, Number(announcementSettings.user.bannerRotateSpeed) || 5)),
          items: (announcementSettings.user.items || []).map(it => ({ id: it.id, content: it.content || '', form: (it.form === 'modal' || it.form === 'banner') ? it.form : undefined }))
        }
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
        _editKey: b.id,
        id: b.id,
        name: b.name || b.id,
        driver: (b.driver || 'local').toLowerCase(),
        sizeLimit: b.sizeLimit ?? 1024 * 1024 * 1024,
        sizeLimitMB: Math.round((b.sizeLimit ?? 1024 * 1024 * 1024) / 1024 / 1024),
        usedSize: b.usedSize ?? 0,
        allowGuest: b.allowGuest !== false,
        allowUser: b.allowUser !== false,
        showOnCapacity: b.showOnCapacity !== false,
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
      id: (b.id && String(b.id).trim()) || undefined,
      name: b.name,
      driver: b.driver,
      sizeLimit: (b.sizeLimitMB || 1024) * 1024 * 1024,
      allowGuest: b.allowGuest !== false,
      allowUser: b.allowUser !== false,
      showOnCapacity: b.showOnCapacity !== false,
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

async function fetchEmailConfig() {
  try {
    const res = await $fetch('/api/settings/email', { headers: authStore.authHeader })
    if (res.success && res.data) {
      emailSettings.registrationEmailVerification = !!res.data.registrationEmailVerification
      emailSettings.service = res.data.service || ''
      emailSettings.user = res.data.user || ''
      emailSettings.pass = ''
      emailSettings.hasPassword = !!res.data.hasPassword
      emailSettings.to = res.data.to || ''
      emailSettings.subjectPrefix = res.data.subjectPrefix ?? '[bsimgbed]'
      emailSettings.verificationSubject = res.data.verificationSubject ?? '请验证你的邮箱'
      emailSettings.verificationBody = res.data.verificationBody ?? ''
      emailSettings.testSubject = res.data.testSubject ?? '测试通知'
      emailSettings.testBody = res.data.testBody ?? ''
      emailSettings.notificationSubjectTemplate = res.data.notificationSubjectTemplate ?? '{{title}}'
      emailSettings.notificationBodyTemplate = res.data.notificationBodyTemplate ?? ''
    }
  } catch (_) {}
}

async function saveEmailSettings() {
  savingEmail.value = true
  try {
    const body = {
      registrationEmailVerification: emailSettings.registrationEmailVerification,
      service: emailSettings.service,
      user: emailSettings.user,
      to: emailSettings.to,
      subjectPrefix: emailSettings.subjectPrefix,
      verificationSubject: emailSettings.verificationSubject,
      verificationBody: emailSettings.verificationBody,
      testSubject: emailSettings.testSubject,
      testBody: emailSettings.testBody,
      notificationSubjectTemplate: emailSettings.notificationSubjectTemplate,
      notificationBodyTemplate: emailSettings.notificationBodyTemplate
    }
    if (emailSettings.pass) body.pass = emailSettings.pass
    const res = await $fetch('/api/settings/email', {
      method: 'PUT',
      body,
      headers: authStore.authHeader
    })
    if (res.success) {
      toastStore.success(res.message || '邮箱设置已保存')
      emailSettings.pass = ''
      emailSettings.hasPassword = true
    } else {
      toastStore.error(res.message || '保存失败')
    }
  } catch (e) {
    toastStore.error(e.data?.message || '保存失败')
  } finally {
    savingEmail.value = false
  }
}

async function testEmailSettings() {
  testingEmail.value = true
  try {
    const body = {
      service: emailSettings.service,
      user: emailSettings.user,
      to: emailSettings.to
    }
    if (emailSettings.pass) body.pass = emailSettings.pass
    const res = await $fetch('/api/settings/email/test', {
      method: 'POST',
      body,
      headers: authStore.authHeader
    })
    if (res.success) toastStore.success(res.message || '测试邮件已发送')
    else toastStore.error(res.message || '测试失败')
  } catch (e) {
    toastStore.error(e.data?.message || '测试失败')
  } finally {
    testingEmail.value = false
  }
}

// 初始化
onMounted(async () => {
  await settingsStore.fetchAppSettings()
  await fetchStorageConfig()
  await fetchEmailConfig()

  // 同步到本地状态
  appSettings.appName = settingsStore.appSettings.appName || 'bsimgbed'
  appSettings.appLogo = settingsStore.appSettings.appLogo || ''
  appSettings.favicon = settingsStore.appSettings.favicon || ''
  appSettings.backgroundUrl = settingsStore.appSettings.backgroundUrl || ''
  appSettings.backgroundBlur = settingsStore.appSettings.backgroundBlur || 0
  appSettings.siteUrl = settingsStore.appSettings.siteUrl || ''
  appSettings.registrationEnabled = settingsStore.appSettings.registrationEnabled !== false

  // 关于设置
  const ap = settingsStore.appSettings.aboutProject
  const pi = settingsStore.appSettings.projectInfo
  aboutSettings.aboutProject = (ap != null && ap !== '') ? String(ap) : defaultAboutProject
  aboutSettings.projectInfo = Array.isArray(pi) && pi.length > 0
    ? pi.map(it => ({ label: it.label || '', url: it.url || '', icon: it.icon || '' }))
    : [...defaultProjectInfo.map(i => ({ ...i }))]

  const announcement = settingsStore.appSettings.announcement || {}
  const def = defaultAnnouncementBlock()
  const toItems = (block) => {
    if (!block) return def.items
    if (Array.isArray(block.items) && block.items.length > 0) {
      return block.items.map(it => ({
        id: it.id || `item-${Date.now()}`,
        content: (it.content !== undefined && it.content !== null) ? String(it.content) : '',
        form: (it.form === 'modal' || it.form === 'banner') ? it.form : (block.displayType || 'banner')
      }))
    }
    if (block.content !== undefined && block.content !== null) return [{ id: '1', content: String(block.content), form: block.displayType || 'banner' }]
    return def.items
  }
  if (announcement.guest && announcement.user) {
    announcementSettings.guest.enabled = announcement.guest.enabled !== false
    announcementSettings.guest.displayType = announcement.guest.displayType || 'modal'
    announcementSettings.guest.bannerAutoRotate = !!announcement.guest.bannerAutoRotate
    announcementSettings.guest.bannerRotateSpeed = Math.min(120, Math.max(1, Number(announcement.guest.bannerRotateSpeed) || 5))
    announcementSettings.guest.items = toItems(announcement.guest)
    announcementSettings.user.enabled = announcement.user.enabled !== false
    announcementSettings.user.displayType = announcement.user.displayType || 'modal'
    announcementSettings.user.bannerAutoRotate = !!announcement.user.bannerAutoRotate
    announcementSettings.user.bannerRotateSpeed = Math.min(120, Math.max(1, Number(announcement.user.bannerRotateSpeed) || 5))
    announcementSettings.user.items = toItems(announcement.user)
  } else if (announcement.enabled !== undefined) {
    announcementSettings.guest.enabled = announcement.enabled !== false
    announcementSettings.guest.displayType = announcement.displayType || 'modal'
    announcementSettings.guest.bannerAutoRotate = false
    announcementSettings.guest.bannerRotateSpeed = 5
    announcementSettings.guest.items = toItems(announcement)
    announcementSettings.user = { ...def, items: [...def.items] }
    announcementSettings.user.bannerAutoRotate = false
    announcementSettings.user.bannerRotateSpeed = 5
  } else {
    announcementSettings.guest = { ...def, items: def.items.map(i => ({ ...i })) }
    announcementSettings.user = { ...def, items: def.items.map(i => ({ ...i })) }
  }
})
</script>

<style scoped>
/* 设置页标签栏：与顶栏一致的滑动式菜单样式 */
.settings-nav-link {
  @apply text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800;
}
.settings-nav-link-active {
  @apply bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
