<script setup lang="ts">
import { ExternalLink, LoaderCircle, RefreshCw, Unplug, Zap } from '@lucide/vue'
import { watchDebounced } from '@vueuse/core'
import { toast } from 'vue-sonner'

import Field from '~/components/common/Field.vue'
import ModelCombobox from '~/components/common/ModelCombobox.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { ApiError } from '~/lib/api'

defineProps<{ index: string }>()

const CUSTOM = 'custom'

const { t } = useI18n()
const errorMessage = useErrorMessage()
const provider = useAiProvider()
const catalog = useProviderCatalog()
const { save, remove, refreshModels, previewModels, check } = useAiProviderMutations()

const form = reactive({ providerId: '', baseUrl: '', modelName: '', apiKey: '' })
const errors = reactive<{
  baseUrl: string | null
  modelName: string | null
  apiKey: string | null
}>({ baseUrl: null, modelName: null, apiKey: null })

const normalise = (url: string) => url.trim().replace(/\/+$/, '').toLowerCase()

const providers = computed(() => catalog.data.value ?? [])
const known = computed(() => providers.value.find((entry) => entry.id === form.providerId))
const isConfigured = computed(() => provider.data.value?.isConfigured ?? false)
const connectedHere = computed(
  () =>
    isConfigured.value &&
    !!provider.data.value?.baseUrl &&
    normalise(provider.data.value.baseUrl) === normalise(form.baseUrl),
)

const models = useProviderModels(connectedHere)

const preview = reactive<{ models: string[] | null; error: string | null; loading: boolean }>({
  models: null,
  error: null,
  loading: false,
})
let previewRequest = 0

const MIN_KEY_LENGTH = 8
const PREVIEW_DELAY_MS = 600

const isUrl = (value: string) => /^https?:\/\/\S+$/.test(value.trim())
const typedKey = computed(() => form.apiKey.trim())
const canPreview = computed(
  () => isUrl(form.baseUrl) && (typedKey.value.length >= MIN_KEY_LENGTH || connectedHere.value),
)

const resetPreview = () => {
  previewRequest += 1
  preview.models = null
  preview.error = null
  preview.loading = false
}

const loadModels = async () => {
  if (!canPreview.value) {
    return
  }

  const request = ++previewRequest
  preview.loading = true
  preview.error = null

  try {
    const result = await previewModels.mutateAsync({
      baseUrl: form.baseUrl.trim(),
      ...(typedKey.value ? { apiKey: typedKey.value } : {}),
    })
    if (request === previewRequest) {
      preview.models = result.models
    }
  } catch (error) {
    if (request === previewRequest) {
      preview.models = null
      preview.error = errorMessage(error)
    }
  } finally {
    if (request === previewRequest) {
      preview.loading = false
    }
  }
}

watchDebounced(
  () => [form.baseUrl, form.apiKey],
  () => {
    resetPreview()
    if (typedKey.value.length >= MIN_KEY_LENGTH && isUrl(form.baseUrl)) {
      void loadModels()
    }
  },
  { debounce: PREVIEW_DELAY_MS },
)

const liveModels = computed(() => (connectedHere.value ? models.data.value?.models : undefined))
const options = computed(() => preview.models ?? liveModels.value ?? known.value?.models ?? [])
const modelsLoading = computed(
  () =>
    preview.loading ||
    (connectedHere.value && (models.isFetching.value || refreshModels.isPending.value)),
)

const modelsHint = computed(() => {
  if (preview.loading) {
    return t('provider.modelsLoading')
  }
  if (preview.error) {
    return `${preview.error} ${t('provider.modelsManual')}`
  }
  if (preview.models) {
    return t('provider.modelsCount', { count: preview.models.length })
  }
  if (!connectedHere.value) {
    return known.value ? t('provider.modelsPopular') : t('provider.modelsCustom')
  }
  if (models.isError.value && !models.data.value) {
    return t('provider.modelsUnavailable')
  }
  if (!models.data.value) {
    return t('provider.modelsLoading')
  }
  return t('provider.modelsCount', { count: options.value.length })
})

const keyHint = computed(() =>
  connectedHere.value && provider.data.value?.apiKeyHint
    ? t('provider.keyStored', { hint: provider.data.value.apiKeyHint })
    : t('provider.keyHint'),
)

const statusText = computed(() => {
  const data = provider.data.value
  if (!data?.isConfigured) {
    return t('provider.notConnected')
  }
  const label =
    providers.value.find((entry) => normalise(entry.baseUrl) === normalise(data.baseUrl ?? ''))
      ?.label ?? t('provider.custom')
  return `${label} · ${data.modelName}`
})

const fill = () => {
  const data = provider.data.value
  if (!data || !catalog.data.value) {
    return
  }

  const first = providers.value[0]
  const baseUrl = data.baseUrl ?? first?.baseUrl ?? ''
  const match = providers.value.find((entry) => normalise(entry.baseUrl) === normalise(baseUrl))

  form.providerId = match?.id ?? CUSTOM
  form.baseUrl = baseUrl
  form.modelName = data.modelName ?? match?.defaultModel ?? ''
  form.apiKey = ''
}

watch([() => provider.data.value, () => catalog.data.value], fill, { immediate: true })

const onProviderChange = (id: unknown) => {
  const entry = providers.value.find((item) => item.id === id)
  form.providerId = String(id)
  form.baseUrl = entry?.baseUrl ?? ''
  form.modelName =
    entry &&
    provider.data.value?.baseUrl &&
    normalise(entry.baseUrl) === normalise(provider.data.value.baseUrl)
      ? (provider.data.value.modelName ?? entry.defaultModel)
      : (entry?.defaultModel ?? '')
  form.apiKey = ''
  errors.baseUrl = null
  errors.modelName = null
  errors.apiKey = null
}

const validate = () => {
  errors.baseUrl = isUrl(form.baseUrl) ? null : t('provider.urlInvalid')
  errors.modelName = form.modelName.trim() ? null : t('provider.modelRequired')
  errors.apiKey =
    connectedHere.value || typedKey.value.length >= MIN_KEY_LENGTH
      ? null
      : t('provider.keyRequired')
  return !errors.baseUrl && !errors.modelName && !errors.apiKey
}

const submit = async () => {
  if (!validate()) {
    return
  }

  const apiKey = form.apiKey.trim()
  const wasConfigured = isConfigured.value

  try {
    await save.mutateAsync({
      baseUrl: form.baseUrl.trim(),
      modelName: form.modelName.trim(),
      ...(apiKey ? { apiKey } : {}),
    })
    resetPreview()
    toast.success(wasConfigured ? t('provider.saved') : t('provider.connected'))
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const runCheck = async () => {
  try {
    const result = await check.mutateAsync()
    if (result.ok) {
      toast.success(t('provider.checkOk'))
    } else {
      toast.error(errorMessage(new ApiError(502, result.code, result.message ?? '')))
    }
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const refresh = async () => {
  if (typedKey.value || !connectedHere.value) {
    await loadModels()
    return
  }

  resetPreview()
  try {
    await refreshModels.mutateAsync()
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const disconnect = async () => {
  try {
    await remove.mutateAsync()
    toast.success(t('provider.disconnected'))
  } catch (error) {
    toast.error(errorMessage(error))
  }
}
</script>

<template>
  <section id="assistant" class="scroll-mt-20">
    <div class="flex items-baseline justify-between gap-3 border-b border-rule-strong pb-2">
      <h2 class="label">{{ index }} · {{ t('provider.title') }}</h2>
      <p
        class="label flex min-w-0 items-center gap-2"
        :class="isConfigured ? 'text-brand' : 'text-ink-faint'"
      >
        <span v-if="isConfigured" class="marker shrink-0" />
        <span class="truncate normal-case">{{ statusText }}</span>
      </p>
    </div>

    <p class="mt-4 text-sm text-ink-muted">{{ t('provider.description') }}</p>

    <div v-if="provider.isPending.value || catalog.isPending.value" class="mt-5 space-y-3">
      <Skeleton v-for="row in 3" :key="row" class="h-10 w-full" />
    </div>

    <form v-else class="mt-5 grid gap-5" novalidate @submit.prevent="submit">
      <Field :label="t('provider.provider')" :hint="known?.baseUrl">
        <Select :model-value="form.providerId" @update:model-value="onProviderChange">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="entry in providers" :key="entry.id" :value="entry.id">{{
              entry.label
            }}</SelectItem>
            <SelectItem :value="CUSTOM">{{ t('provider.custom') }}</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field
        v-if="!known"
        :label="t('provider.baseUrl')"
        for="provider-url"
        :error="errors.baseUrl"
        :hint="t('provider.baseUrlHint')"
      >
        <Input
          id="provider-url"
          v-model="form.baseUrl"
          name="provider-base-url"
          type="url"
          inputmode="url"
          autocomplete="off"
          data-1p-ignore
          data-lpignore="true"
          spellcheck="false"
          placeholder="https://api.example.com/v1"
          class="font-mono text-sm"
          :aria-invalid="!!errors.baseUrl"
        />
      </Field>

      <Field :label="t('provider.key')" for="provider-key" :error="errors.apiKey" :hint="keyHint">
        <template v-if="known" #aside>
          <a
            :href="known.apiKeysUrl"
            target="_blank"
            rel="noreferrer noopener"
            class="label inline-flex items-center gap-1 text-brand underline-offset-4 hover:underline"
          >
            {{ t('provider.getKey') }}
            <ExternalLink class="size-3" />
          </a>
        </template>
        <Input
          id="provider-key"
          v-model="form.apiKey"
          name="provider-api-key"
          type="password"
          autocomplete="new-password"
          data-1p-ignore
          data-lpignore="true"
          spellcheck="false"
          :placeholder="connectedHere ? '••••••••' : (known?.keyHint ?? 'sk-...')"
          class="font-mono text-sm"
          :aria-invalid="!!errors.apiKey"
        />
      </Field>

      <Field
        :label="t('provider.model')"
        for="provider-model"
        :error="errors.modelName"
        :hint="modelsHint"
      >
        <template #aside>
          <button
            type="button"
            class="label inline-flex items-center gap-1.5 underline-offset-4 hover:text-ink hover:underline disabled:opacity-40 disabled:hover:no-underline"
            :disabled="modelsLoading || !canPreview"
            :title="canPreview ? undefined : t('provider.loadModelsHint')"
            @click="refresh"
          >
            <RefreshCw class="size-3" :class="modelsLoading && 'animate-spin'" />
            {{
              preview.models || (connectedHere && !typedKey)
                ? t('provider.refresh')
                : t('provider.loadModels')
            }}
          </button>
        </template>
        <ModelCombobox
          id="provider-model"
          v-model="form.modelName"
          :options="options"
          :loading="modelsLoading"
          :placeholder="t('provider.modelPlaceholder')"
          :search-placeholder="t('provider.modelSearch')"
          :empty-text="t('provider.modelEmpty')"
          :use-custom-text="(value: string) => t('provider.modelUse', { model: value })"
        />
      </Field>

      <div class="flex flex-wrap gap-2">
        <Button type="submit" :disabled="save.isPending.value">
          <LoaderCircle v-if="save.isPending.value" class="animate-spin" />
          {{ isConfigured ? t('common.save') : t('provider.connect') }}
        </Button>
        <template v-if="isConfigured">
          <Button
            type="button"
            variant="outline"
            :disabled="check.isPending.value"
            @click="runCheck"
          >
            <LoaderCircle v-if="check.isPending.value" class="animate-spin" />
            <Zap v-else />
            {{ t('provider.check') }}
          </Button>
          <Button
            type="button"
            variant="ghost"
            class="text-danger hover:bg-danger hover:text-white"
            :disabled="remove.isPending.value"
            @click="disconnect"
          >
            <Unplug />
            {{ t('provider.disconnect') }}
          </Button>
        </template>
      </div>

      <p class="border-l-2 border-brand pl-3 text-xs text-ink-faint">
        {{ t('provider.privacy') }}
      </p>
    </form>
  </section>
</template>
