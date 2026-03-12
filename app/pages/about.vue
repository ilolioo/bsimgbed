<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">关于</h1>

    <div class="space-y-6">
      <!-- 项目简介（来自关于设置） -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:photo" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
          关于项目
        </h2>
        <p class="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
          {{ aboutProject }}
        </p>
      </div>

      <!-- 项目信息（来自关于设置） -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:link" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
          项目信息
        </h2>
        <div class="space-y-4">
          <div
            v-for="(item, idx) in projectInfo"
            :key="idx"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0"
          >
            <Icon name="heroicons:link" class="w-5 h-5 text-gray-800 dark:text-gray-200 shrink-0" />
            <span class="text-gray-700 dark:text-gray-300 shrink-0">{{ item.label }}:</span>
            <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline break-all min-w-0"
            >
              {{ item.url }}
            </a>
            <span v-else class="text-gray-500 dark:text-gray-400">—</span>
          </div>
        </div>
      </div>

      <!-- 版本信息 -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
          版本信息
        </h2>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-gray-700 dark:text-gray-300">当前版本</span>
          <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
            v{{ appVersion }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  title: '关于'
})

const { public: publicConfig } = useRuntimeConfig()
const appVersion = publicConfig.appVersion || '1.0.0'

const defaultAboutProject = 'bsimgbed 是一个简单易用的个人图床应用，支持本地磁盘、WebDAV、Telegram 等多种存储方式，可自由切换无需重启。提供公共/私有 API、API Key 管理、内容安全（NSFW 检测、违规自动处理）与通知等能力，适合自建图床与图片管理。'
const defaultProjectInfo = [{ label: '项目地址', url: 'https://github.com/ilolioo/bsimgbed' }]

const aboutProject = ref(defaultAboutProject)
const projectInfo = ref([...defaultProjectInfo])

// 从公开设置拉取关于页内容（无需登录）
onMounted(async () => {
  try {
    const res = await $fetch('/api/settings/public')
    if (res?.success && res.data) {
      if (res.data.aboutProject != null && res.data.aboutProject !== '') {
        aboutProject.value = res.data.aboutProject
      }
      if (Array.isArray(res.data.projectInfo) && res.data.projectInfo.length > 0) {
        projectInfo.value = res.data.projectInfo
      }
    }
  } catch (_) {}
})
</script>
