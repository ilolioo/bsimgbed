// 管理员路由守卫：仅管理员可访问
export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
  if (!authStore.isAdmin) {
    const toast = useToastStore()
    toast.error('需要管理员权限')
    return navigateTo('/')
  }
})
