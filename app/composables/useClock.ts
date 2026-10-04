import { useIntervalFn, useNow } from '@vueuse/core'

const MINUTE_MS = 60_000

export const useClock = () =>
  useNow({ scheduler: (callback) => useIntervalFn(callback, MINUTE_MS) })
