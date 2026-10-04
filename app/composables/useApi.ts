import { ApiError } from '~/lib/api'

export const useApi = () => useAuthStore().api

export const useErrorMessage = () => {
  const { t, te } = useI18n()

  return (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.code === 'PROVIDER_FAILED' && error.message) {
        return `${t('errors.PROVIDER_FAILED')} ${error.message}`
      }

      if (error.code && te(`errors.${error.code}`)) {
        return t(`errors.${error.code}`)
      }

      if (error.status === 0) {
        return t('errors.NETWORK')
      }
    }

    return t('errors.UNKNOWN')
  }
}
