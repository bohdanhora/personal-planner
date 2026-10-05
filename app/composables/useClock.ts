import { useIntervalFn, useNow } from '@vueuse/core'

const MINUTE_MS = 60_000

export const useClock = () =>
  useNow({ scheduler: (callback) => useIntervalFn(callback, MINUTE_MS) })

export const useNowMinutes = () => {
  const auth = useAuthStore()
  const now = useClock()

  return computed(() => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: auth.user?.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now.value)
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
    return read('hour') * 60 + read('minute')
  })
}
