import { defineStore } from 'pinia'

export const useTourStore = defineStore('tour', () => {
  const auth = useAuthStore()

  const active = ref(false)
  const step = ref(0)
  const dismissed = ref(false)

  const start = async () => {
    step.value = 0
    dismissed.value = false
    await navigateTo('/')
    active.value = true
  }

  const finish = async () => {
    active.value = false
    dismissed.value = true

    if (auth.user && !auth.user.onboarded) {
      await auth.updateProfile({ onboarded: true }).catch(() => undefined)
    }
  }

  return { active, step, dismissed, start, finish }
})
