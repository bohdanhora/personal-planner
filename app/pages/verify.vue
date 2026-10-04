<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { LoaderCircle, MailCheck } from '@lucide/vue'
import { toast } from 'vue-sonner'

import CaretTitle from '~/components/common/CaretTitle.vue'
import { Button } from '~/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '~/components/ui/input-otp'

definePageMeta({ layout: 'auth' })

const CODE_LENGTH = 6

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const errorMessage = useErrorMessage()

useHead({ title: () => `${t('auth.verifyTitle')} · Personal Planner` })

const email = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))
const code = ref('')
const error = ref<string | null>(null)
const pending = ref(false)
const resending = ref(false)
const wait = ref(Number(route.query.wait ?? 0) || 0)

useIntervalFn(() => {
  if (wait.value > 0) {
    wait.value -= 1
  }
}, 1000)

if (!email.value) {
  await navigateTo('/register')
}

const submit = async () => {
  if (code.value.length !== CODE_LENGTH || pending.value) {
    return
  }

  error.value = null
  pending.value = true

  try {
    await auth.verifyEmail(email.value, code.value)
    toast.success(t('auth.verified'))
    await navigateTo('/')
  } catch (cause) {
    error.value = errorMessage(cause)
    code.value = ''
  } finally {
    pending.value = false
  }
}

const resend = async () => {
  resending.value = true
  error.value = null

  try {
    const result = await auth.resendCode(email.value)
    wait.value = result.resendAfterSeconds
    toast.success(t('auth.codeSent'))
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    resending.value = false
  }
}

watch(code, (value) => {
  if (value.length === CODE_LENGTH) {
    void submit()
  }
})
</script>

<template>
  <div class="animate-rise">
    <div class="mb-8 flex size-12 items-center justify-center border border-rule-strong">
      <MailCheck class="size-5 text-brand" />
    </div>
    <p class="label">{{ t('auth.verifyLabel') }}</p>
    <h1 class="display mt-3 text-3xl"><CaretTitle :text="t('auth.verifyTitle')" /></h1>
    <p class="mt-3 text-ink-muted">
      {{ t('auth.verifyLead') }} <span class="font-medium break-words text-ink">{{ email }}</span>
    </p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <InputOTP
        v-model="code"
        :maxlength="CODE_LENGTH"
        inputmode="numeric"
        autocomplete="one-time-code"
        class="w-full"
      >
        <InputOTPGroup class="w-full">
          <InputOTPSlot v-for="index in CODE_LENGTH" :key="index" :index="index - 1" />
        </InputOTPGroup>
      </InputOTP>

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
        class="w-full"
        :disabled="pending || code.length !== CODE_LENGTH"
      >
        <LoaderCircle v-if="pending" class="animate-spin" />
        {{ t('auth.confirm') }}
      </Button>
    </form>

    <div class="mt-8 flex items-center justify-between gap-4 border-t border-rule pt-5 text-sm">
      <span class="text-ink-muted">{{ t('auth.noCode') }}</span>
      <Button variant="link" size="sm" :disabled="wait > 0 || resending" @click="resend">
        {{ wait > 0 ? t('auth.resendIn', { s: wait }) : t('auth.resend') }}
      </Button>
    </div>
    <p class="mt-4 text-sm text-ink-muted">
      <NuxtLink to="/register" class="link">{{ t('auth.changeEmail') }}</NuxtLink>
    </p>
  </div>
</template>
