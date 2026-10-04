export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuthStore()
  const i18n = nuxtApp.$i18n

  watch(
    () => auth.user?.locale,
    (locale) => {
      if (locale && locale !== i18n.locale.value) {
        void i18n.setLocale(locale)
      }
    },
    { immediate: true },
  )

  watch(
    () => auth.isAuthenticated,
    (authenticated) => {
      if (!authenticated) {
        nuxtApp.$queryClient.clear()
      }
    },
  )

  useHead({ htmlAttrs: { lang: i18n.locale } })
})
