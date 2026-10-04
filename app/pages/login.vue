<script setup lang="ts">
import { ArrowRight, LoaderCircle } from '@lucide/vue'

import GoogleButton from '~/components/auth/GoogleButton.vue'
import PasswordInput from '~/components/auth/PasswordInput.vue'
import CaretTitle from '~/components/common/CaretTitle.vue'
import Field from '~/components/common/Field.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { ApiError } from '~/lib/api'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const errorMessage = useErrorMessage()

useHead({ title: () => `${t('auth.loginTitle')} · Personal Planner` })

const form = reactive({ email: '', password: '' })
const error = ref<string | null>(null)
const pending = ref(false)

const next = computed(() => {
  const value = route.query.next
  return typeof value === 'string' && value.startsWith('/') ? value : '/'
})

const finish = () => navigateTo(next.value)

const submit = async () => {
  error.value = null
  pending.value = true

  try {
    await auth.login(form.email.trim(), form.password)
    await finish()
  } catch (cause) {
    if (cause instanceof ApiError && cause.code === 'EMAIL_NOT_VERIFIED') {
      await navigateTo({ path: '/verify', query: { email: form.email.trim().toLowerCase() } })
      return
    }

    error.value = errorMessage(cause)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="animate-rise">
    <p class="label">{{ t('auth.loginLabel') }}</p>
    <h1 class="display mt-3 text-3xl"><CaretTitle :text="t('auth.loginTitle')" /></h1>
    <p class="mt-3 text-ink-muted">{{ t('auth.loginLead') }}</p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
      <Field :label="t('auth.email')" for="email">
        <Input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
        />
      </Field>
      <Field :label="t('auth.password')" for="password">
        <PasswordInput id="password" v-model="form.password" autocomplete="current-password" />
      </Field>

      <p
        v-if="error"
        class="border border-danger bg-danger-soft px-3 py-2 text-sm text-danger"
        role="alert"
      >
        {{ error }}
      </p>

      <Button
        type="submit"
        size="lg"
        class="w-full justify-between"
        :disabled="pending || !form.email || !form.password"
      >
        {{ t('auth.signIn') }}
        <LoaderCircle v-if="pending" class="animate-spin" />
        <ArrowRight v-else />
      </Button>
    </form>

    <GoogleButton class="mt-6" @signed-in="finish" />

    <p class="mt-8 text-sm text-ink-muted">
      {{ t('auth.noAccount') }}
      <NuxtLink to="/register" class="link text-ink">{{ t('auth.createAccount') }}</NuxtLink>
    </p>
  </div>
</template>
