// 无管理员时强制跳转初始化页，仅客户端执行
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/setup') return

  try {
    const res = await $fetch('/api/auth/setup-status')
    if (res?.needSetup) {
      return navigateTo('/setup')
    }
  } catch (_) {
    // 接口异常时不拦截，避免无法访问
  }
})
