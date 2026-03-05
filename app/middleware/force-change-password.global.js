// 全局中间件：首次登录未改密时，仅允许访问改密页和登录页
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const token = localStorage.getItem('token')
  const mustChange = localStorage.getItem('mustChangePassword') === 'true'

  if (!token || !mustChange) return

  if (to.path === '/change-password' || to.path === '/login') return

  return navigateTo('/change-password')
})
