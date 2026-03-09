import { readFileSync } from 'fs'
import { resolve } from 'path'

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
const appVersion = packageJson.version || '1.0.0'

export default defineNuxtConfig({
  ssr: false, // 关闭服务端渲染，变成纯 SPA

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2025-12-12',

  modules: [
    '@pinia/nuxt',
    '@nuxt/icon'
  ],

  // 仅打包实际使用的图标，减小客户端体积
  icon: {
    clientBundle: {
      scan: true
    }
  },

  // 构建与运行时优化
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pinia') || id.includes('vue')) return 'vendor-vue'
              if (id.includes('@iconify') || id.includes('@nuxt/icon')) return 'vendor-icon'
            }
          }
        }
      },
      chunkSizeWarningLimit: 400
    },
    optimizeDeps: {
      include: ['pinia', 'vue']
    }
  },

  experimental: {
    payloadExtraction: false,
    // 预取：改为交互时预取，减少首屏并发请求
    defaults: {
      nuxtLink: {
        prefetch: false
      }
    }
  },

  css: [
    '~/assets/css/main.css'
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  app: {
    head: {
      title: 'bsimgbed',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '简单易用的个人图床' }
      ]
      // favicon 由客户端动态设置，避免页面刷新时闪动
    }
  },

  nitro: {
    // 设置最大请求体大小为 500MB（支持大文件 base64 上传）
    experimental: {
      bodySizeLimit: 500 * 1024 * 1024 // 500MB
    },
    // CORS 配置
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
        }
      }
    },
    // 预渲染完成后强制退出进程
    // 这是为了解决某些模块（如数据库连接、定时器）可能保持进程活跃的问题
    hooks: {
      'prerender:done'() {
        console.log('[Nitro] 预渲染完成，退出进程...')
        setTimeout(() => {
          process.exit(0)
        }, 1000)
      }
    }
  },

  runtimeConfig: {
    public: {
      apiBase: '',
      appVersion
    }
  }
})