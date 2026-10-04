<script setup lang="ts">
import { ArrowRight, LoaderCircle } from '@lucide/vue'

import GoogleButton from '~/components/auth/GoogleButton.vue'
import PasswordInput from '~/components/auth/PasswordInput.vue'
import CaretTitle from '~/components/common/CaretTitle.vue'
import Field from '~/components/common/Field.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

definePageMeta({ layout: 'auth' })

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

const { t, locale } = useI18n()
const auth = useAuthStore()
const errorMessage = useErrorMessage()

useHead({ title: () => `${t('auth.registerTitle')} · Personal Planner` })

const form = reactive({ displayName: '', email: '', password: '' })
const errors = reactive({
  displayName: null as string | null,
  email: null as string | null,
  password: null as string | null,
})
const error = ref<string | null>(null)
const pending = ref(false)

const strength = computed(() => {
  const value = form.password
  return [
    value.length >= MIN_PASSWORD,
    /[A-Z]/.test(value) && /[a-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length
})

const validate = () => {
  errors.displayName = form.displayName.trim() ? null : t('auth.nameRequired')
  errors.email = EMAIL_PATTERN.test(form.email.trim()) ? null : t('auth.emailInvalid')
  errors.password =
    form.password.length >= MIN_PASSWORD ? null : t('auth.passwordShort', { n: MIN_PASSWORD })
  return !errors.displayName && !errors.email && !errors.password
}

const submit = async () => {
  error.value = null

  if (!validate()) {
    return
  }

  pending.value = true

  try {
    const result = await auth.register(
      { displayName: form.displayName.trim(), email: form.email.trim(), password: form.password },
      locale.value,
    )
    await navigateTo({
      path: '/verify',
      query: { email: result.email, wait: result.resendAfterSeconds },
    })
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="animate-rise">
    <p class="label">{{ t('auth.registerLabel') }}</p>
    <h1 class="display mt-3 text-3xl"><CaretTitle :text="t('auth.registerTitle')" /></h1>
    <p class="mt-3 text-ink-muted">{{ t('auth.registerLead') }}</p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
      <Field :label="t('auth.name')" for="name" :error="errors.displayName">
        <Input
          id="name"
          v-model="form.displayName"
          autocomplete="name"
          maxlength="80"
          :aria-invalid="errors.displayName ? true : undefined"
        />
      </Field>
      <Field :label="t('auth.email')" for="email" :error="errors.email">
        <Input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          inputmode="email"
          :aria-invalid="errors.email ? true : undefined"
        />
      </Field>
      <Field
        :label="t('auth.password')"
        for="password"
        :error="errors.password"
        :hint="t('auth.passwordHint', { n: MIN_PASSWORD })"
      >
        <PasswordInput
          id="password"
          v-model="form.password"
          autocomplete="new-password"
          :invalid="Boolean(errors.password)"
        />
        <div class="grid grid-cols-4 gap-1" aria-hidden="true">
          <span
            v-for="index in 4"
            :key="index"
            class="h-0.5 transition-colors"
            :class="index <= strength ? 'bg-brand' : 'bg-rule'"
          />
        </div>
      </Field>

      <p
        v-if="error"
        class="border border-danger bg-danger-soft px-3 py-2 text-sm text-danger"
        role="alert"
      >
        {{ error }}
      </p>

      <Button type="submit" size="lg" class="w-full justify-between" :disabled="pending">
        {{ t('auth.createAccount') }}
        <LoaderCircle v-if="pending" class="animate-spin" />
        <ArrowRight v-else />
      </Button>
    </form>

    <GoogleButton class="mt-6" @signed-in="navigateTo('/')" />

    <p class="mt-8 text-sm text-ink-muted">
      {{ t('auth.haveAccount') }}
      <NuxtLink to="/login" class="link text-ink">{{ t('auth.signIn') }}</NuxtLink>
    </p>
  </div>
</template>
