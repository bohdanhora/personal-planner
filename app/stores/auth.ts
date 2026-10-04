import { defineStore } from 'pinia'

import { createApiClient } from '~/lib/api'
import type { Locale, Session, User, VerificationPending } from '~/lib/types'

const REFRESH_LEAD_SECONDS = 60

const clientContext = (locale: string) => ({
  locale: locale as Locale,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiUrl

  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const ready = ref(false)

  let refreshing: Promise<boolean> | null = null
  let refreshTimer: ReturnType<typeof setTimeout> | null = null

  const isAuthenticated = computed(() => user.value !== null && accessToken.value !== null)

  const clear = () => {
    accessToken.value = null
    user.value = null

    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  const applySession = (session: Session) => {
    accessToken.value = session.accessToken
    user.value = session.user

    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    const delay = Math.max(session.expiresIn - REFRESH_LEAD_SECONDS, 30) * 1000
    refreshTimer = setTimeout(() => void refresh(), delay)
  }

  const refresh = (): Promise<boolean> => {
    refreshing ??= $fetch<Session>('/auth/refresh', {
      method: 'POST',
      baseURL,
      credentials: 'include',
      body: {},
    })
      .then((session) => {
        applySession(session)
        return true
      })
      .catch(() => {
        clear()
        return false
      })
      .finally(() => {
        refreshing = null
      })

    return refreshing
  }

  const api = createApiClient({ baseURL, getToken: () => accessToken.value, refresh })

  const init = async () => {
    if (!ready.value) {
      await refresh()
      ready.value = true
    }
  }

  const login = async (email: string, password: string) => {
    applySession(await api<Session>('/auth/login', { method: 'POST', body: { email, password } }))
  }

  const register = (
    input: { email: string; password: string; displayName: string },
    locale: string,
  ) =>
    api<VerificationPending>('/auth/register', {
      method: 'POST',
      body: { ...input, ...clientContext(locale) },
    })

  const verifyEmail = async (email: string, code: string) => {
    applySession(
      await api<Session>('/auth/verify-email', { method: 'POST', body: { email, code } }),
    )
  }

  const resendCode = (email: string) =>
    api<VerificationPending>('/auth/resend-code', { method: 'POST', body: { email } })

  const signInWithGoogle = async (idToken: string, locale: string) => {
    applySession(
      await api<Session>('/auth/google', {
        method: 'POST',
        body: { idToken, ...clientContext(locale) },
      }),
    )
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST', body: {} }).catch(() => undefined)
    clear()
  }

  const updateProfile = async (patch: Partial<User>) => {
    user.value = await api<User>('/me', { method: 'PATCH', body: patch })
    return user.value
  }

  const deleteAccount = async () => {
    await api('/me', { method: 'DELETE' })
    clear()
  }

  return {
    accessToken,
    user,
    ready,
    isAuthenticated,
    api,
    init,
    refresh,
    login,
    register,
    verifyEmail,
    resendCode,
    signInWithGoogle,
    logout,
    updateProfile,
    deleteAccount,
  }
})
