<template>
  <div
    class="group relative overflow-hidden cursor-pointer rounded-xl transition-shadow duration-300"
    :class="[
      imageLoaded ? 'card-loaded hover:shadow-lg' : '',
      { 'ring-2 ring-primary-500': selected },
      { 'ring-2 ring-red-500': image.isNsfw }
    ]"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- NSFW 标记 (管理员可见) -->
    <div
      v-if="image.isNsfw && selectable"
      class="absolute top-2 left-2 z-20 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1"
    >
      <Icon name="heroicons:exclamation-triangle" class="w-3 h-3" />
      违规
    </div>

    <!-- 已删除标记 (管理员可见) -->
    <div
      v-if="image.isDeleted && selectable"
      class="absolute top-2 right-10 z-20 px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded"
    >
      已删除
    </div>

    <!-- 选择框 -->
    <div
      v-if="selectable && imageLoaded && !image.isNsfw"
      class="absolute top-2 left-2 z-10"
      @click.stop="$emit('select')"
    >
      <div
        class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
        :class="selected
          ? 'bg-primary-500 border-primary-500'
          : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 hover:border-primary-400'"
      >
        <Icon
          v-if="selected"
          name="heroicons:check-solid"
          class="w-4 h-4 text-white"
        />
      </div>
    </div>

    <!-- 图片 -->
    <div
      class="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden"
      :style="{ paddingBottom: aspectRatioPadding }"
      @click="handleImageClick"
    >
      <!-- 图片元素 - 使用 CSS 过渡实现淡入 -->
      <img
        :src="image.url"
        :alt="image.filename"
        class="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        loading="lazy"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- 加载占位 - 骨架屏效果 -->
      <div
        class="absolute inset-0 transition-opacity duration-300"
        :class="imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      >
        <div class="skeleton-shimmer absolute inset-0"></div>
      </div>

      <!-- 加载失败 - 显示裂开的图片图标 -->
      <div
        v-if="imageError"
        class="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center gap-2"
      >
        <Icon name="heroicons:photo" class="w-12 h-12 text-gray-400 dark:text-gray-500" />
        <span class="text-xs text-gray-400">加载失败</span>
      </div>
    </div>

    <!-- 悬浮信息栏 -->
    <div
      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
    >
      <!-- 图片信息 -->
      <div class="text-white text-xs truncate">
        {{ image.filename }}
      </div>
      <div class="text-white/70 text-xs mt-1">
        {{ image.width }}×{{ image.height }} · {{ formatFileSize(image.size) }}
      </div>
    </div>

    <!-- 图片格式标签 -->
    <div
      v-if="image.isWebp"
      class="absolute top-2 right-2 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded font-medium"
      :class="{ 'right-20': image.isDeleted && selectable }"
    >
      WebP
    </div>

    <!-- 审核状态指示器 (管理员可见) -->
    <div
      v-if="selectable && image.moderationStatus && image.moderationStatus !== 'completed'"
      class="absolute bottom-2 left-2 z-10"
    >
      <div
        v-if="image.moderationStatus === 'pending'"
        class="px-2 py-1 bg-yellow-500/80 text-white text-xs rounded flex items-center gap-1"
      >
        <Icon name="heroicons:arrow-path" class="w-3 h-3 animate-spin" />
        待审核
      </div>
      <div
        v-else-if="image.moderationStatus === 'processing'"
        class="px-2 py-1 bg-blue-500/80 text-white text-xs rounded flex items-center gap-1"
      >
        <Icon name="heroicons:arrow-path" class="w-3 h-3 animate-spin" />
        审核中
      </div>
      <div
        v-else-if="image.moderationStatus === 'failed'"
        class="px-2 py-1 bg-orange-500/80 text-white text-xs rounded flex items-center gap-1"
      >
        <Icon name="heroicons:exclamation-circle" class="w-3 h-3" />
        审核失败
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useImagesStore } from '~/stores/images'

const props = defineProps({
  image: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  selectable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'select', 'delete', 'contextmenu'])

const imagesStore = useImagesStore()

// 图片加载状态
const imageLoaded = ref(false)
const imageError = ref(false)

// 计算图片宽高比的 padding（用于占位）
const aspectRatioPadding = computed(() => {
  if (props.image.width && props.image.height) {
    return `${(props.image.height / props.image.width) * 100}%`
  }
  // 默认 4:3 比例
  return '75%'
})

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function onImageLoad() {
  imageLoaded.value = true
}

function onImageError() {
  imageLoaded.value = true
  imageError.value = true
}

// 处理右键菜单 - 触发事件让父组件处理
function handleContextMenu(event) {
  emit('contextmenu', event, props.image)
}

// 处理图片点击
function handleImageClick() {
  // 如果有选中的图片且当前可选择，则切换选中状态而不是打开查看器
  if (props.selectable && imagesStore.hasSelection) {
    emit('select')
  } else {
    emit('click')
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 卡片加载完成后的样式 */
.card-loaded {
  @apply bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700;
}

/* 骨架屏闪烁效果 */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.dark .skeleton-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>