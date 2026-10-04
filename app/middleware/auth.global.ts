const GUEST_ROUTES = new Set(['/login', '/register', '/verify'])

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  const isGuestRoute = GUEST_ROUTES.has(to.path)

  if (!auth.isAuthenticated && !isGuestRoute) {
    return navigateTo({ path: '/login', query: to.fullPath === '/' ? {} : { next: to.fullPath } })
  }

  if (auth.isAuthenticated && isGuestRoute) {
    return navigateTo('/')
  }
})
