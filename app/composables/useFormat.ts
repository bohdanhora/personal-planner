import { formatDate, minutesToClock } from '~/lib/dates'

export const useFormat = () => {
  const { t, locale } = useI18n()

  const duration = (minutes: number | null | undefined) => {
    if (!minutes) {
      return ''
    }

    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60

    if (hours === 0) {
      return t('units.minutes', { n: rest })
    }

    return rest === 0
      ? t('units.hours', { n: hours })
      : `${t('units.hours', { n: hours })} ${t('units.minutes', { n: rest })}`
  }

  const timeRange = (start: number | null, length: number | null) => {
    if (start === null) {
      return ''
    }

    return length
      ? `${minutesToClock(start)}-${minutesToClock(start + length)}`
      : minutesToClock(start)
  }

  const day = (value: string, options: Intl.DateTimeFormatOptions) =>
    formatDate(value, locale.value, options)

  const number = (value: number) => new Intl.NumberFormat(locale.value).format(value)

  return { duration, timeRange, day, number, clock: minutesToClock }
}
