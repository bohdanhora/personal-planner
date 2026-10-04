import { useQuery } from '@tanstack/vue-query'

import type { Insights } from '~/lib/types'

export const useInsights = (days: MaybeRefOrGetter<number>) => {
  const api = useApi()

  return useQuery({
    queryKey: computed(() => ['insights', toValue(days)]),
    queryFn: () => api<Insights>('/insights', { query: { days: toValue(days) } }),
  })
}
