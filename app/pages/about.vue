<template>
  <div class="min-w-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8 truncate">关于</h1>

    <div class="space-y-6 min-w-0">
      <!-- 项目简介 -->
      <div class="card p-4 sm:p-6 min-w-0 overflow-hidden">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 min-w-0">
          <Icon name="heroicons:photo" class="w-5 h-5 flex-shrink-0 text-primary-500 dark:text-primary-400" />
          <span class="truncate">关于项目</span>
        </h2>
        <p class="text-gray-600 dark:text-gray-400 leading-relaxed break-words">
          bsimgbed 是一个简单易用的个人图床应用，支持本地磁盘、WebDAV、Telegram 等多种存储方式，可自由切换无需重启。提供公共/私有 API、API Key 管理、内容安全与通知等能力，适合自建图床与图片管理。
        </p>
      </div>

      <!-- 项目信息 -->
      <div class="card p-4 sm:p-6 min-w-0 overflow-hidden">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 min-w-0">
          <Icon name="heroicons:link" class="w-5 h-5 flex-shrink-0 text-primary-500 dark:text-primary-400" />
          <span class="truncate">项目信息</span>
        </h2>
        <div class="space-y-4 min-w-0">
          <div class="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <Icon name="simple-icons:github" class="w-5 h-5 flex-shrink-0 text-gray-800 dark:text-gray-200" />
            <span class="text-gray-700 dark:text-gray-300 flex-shrink-0">项目地址:</span>
            <a
              href="https://github.com/ilolioo/bsimgbed"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline break-all min-w-0"
            >
              https://github.com/ilolioo/bsimgbed
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 页面元数据
definePageMeta({
  title: '关于'
})
</script>
