<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { toast } from 'vue-sonner'

interface CredentialResponse {
  credential?: string
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: CredentialResponse) => void
      }) => void
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void
      cancel: () => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const MAX_WIDTH = 400

const emit = defineEmits<{ signedIn: [] }>()

const { t, locale } = useI18n()
const auth = useAuthStore()
const colorMode = useColorMode()
const errorMessage = useErrorMessage()
const { data: meta } = useMeta()

const frame = ref<HTMLElement | null>(null)
const target = ref<HTMLElement | null>(null)
const width = ref(0)
const ready = ref(false)

const clientId = computed(() => meta.value?.googleClientId ?? null)

useResizeObserver(frame, ([entry]) => {
  if (entry) {
    width.value = Math.min(Math.round(entry.contentRect.width), MAX_WIDTH)
  }
})

const loadScript = (lang: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gsi]')

    if (existing?.dataset.gsi === lang && window.google) {
      resolve()
      return
    }

    existing?.remove()
    delete window.google

    const script = document.createElement('script')
    script.src = `${SCRIPT_SRC}?hl=${lang}`
    script.async = true
    script.dataset.gsi = lang
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('gsi'))
    document.head.append(script)
  })

const handleCredential = async (response: CredentialResponse) => {
  if (!response.credential) {
    toast.error(t('errors.GOOGLE_REJECTED'))
    return
  }

  try {
    await auth.signInWithGoogle(response.credential, locale.value)
    emit('signedIn')
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

watchEffect(async () => {
  if (!clientId.value || !target.value || width.value === 0) {
    return
  }

  try {
    await loadScript(locale.value)
  } catch {
    toast.error(t('errors.GOOGLE_UNAVAILABLE'))
    return
  }

  const identity = window.google?.accounts.id
  if (!identity || !target.value) {
    return
  }

  identity.initialize({
    client_id: clientId.value,
    callback: (response) => void handleCredential(response),
  })
  target.value.replaceChildren()
  identity.renderButton(target.value, {
    type: 'standard',
    theme: colorMode.value === 'dark' ? 'filled_black' : 'outline',
    size: 'large',
    shape: 'rectangular',
    text: 'continue_with',
    logo_alignment: 'center',
    width: width.value,
  })
  ready.value = true
})

onBeforeUnmount(() => window.google?.accounts.id.cancel())
</script>

<template>
  <div v-if="clientId" class="space-y-5">
    <div class="flex items-center gap-3" aria-hidden="true">
      <span class="h-px flex-1 bg-rule" />
      <span class="label">{{ t('auth.or') }}</span>
      <span class="h-px flex-1 bg-rule" />
    </div>
    <div ref="frame" class="relative min-h-10">
      <div ref="target" :class="!ready && 'invisible'" />
      <div v-if="!ready" class="absolute inset-0 animate-pulse bg-surface-muted" />
    </div>
  </div>
</template>
