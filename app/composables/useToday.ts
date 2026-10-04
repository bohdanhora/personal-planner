import { todayIn } from '~/lib/dates'

export const useToday = () => {
  const auth = useAuthStore()
  const now = useClock()

  return computed(() =>
    todayIn(auth.user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, now.value),
  )
}
