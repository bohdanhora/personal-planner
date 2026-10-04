const DAY_MS = 86_400_000

const pad = (value: number) => String(value).padStart(2, '0')

export const parseDay = (value: string) => new Date(`${value}T00:00:00.000Z`)

export const formatDay = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`

export const isDay = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  formatDay(parseDay(value)) === value

export const todayIn = (timeZone: string, now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

export const addDays = (value: string, days: number) =>
  formatDay(new Date(parseDay(value).getTime() + days * DAY_MS))

export const diffDays = (from: string, to: string) =>
  Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS)

export const weekdayIndex = (value: string) => (parseDay(value).getUTCDay() + 6) % 7

export const startOfWeek = (value: string) => addDays(value, -weekdayIndex(value))

export const weekDays = (start: string) => Array.from({ length: 7 }, (_, i) => addDays(start, i))

export const isoWeek = (value: string) => {
  const date = parseDay(value)
  const thursday = new Date(date.getTime() + (3 - weekdayIndex(value)) * DAY_MS)
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.ceil(((thursday.getTime() - yearStart) / DAY_MS + 1) / 7)
}

export const dayOfYear = (value: string) => {
  const date = parseDay(value)
  return Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / DAY_MS) + 1
}

export const formatDate = (value: string, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(parseDay(value))

export const minutesToClock = (minutes: number) =>
  `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`

export const clockToMinutes = (value: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}
