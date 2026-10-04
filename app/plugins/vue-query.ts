import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import { ApiError } from '~/lib/api'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < 2,
      },
    },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  return { provide: { queryClient } }
})
