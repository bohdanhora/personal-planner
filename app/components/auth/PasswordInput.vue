<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'

import { Input } from '~/components/ui/input'

const model = defineModel<string>({ required: true })
defineProps<{ id: string; autocomplete: string; invalid?: boolean }>()

const { t } = useI18n()
const visible = ref(false)
</script>

<template>
  <div class="relative">
    <Input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :aria-invalid="invalid ? true : undefined"
      class="pr-11"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-faint hover:text-ink"
      :aria-label="visible ? t('auth.hidePassword') : t('auth.showPassword')"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" class="size-4" />
      <Eye v-else class="size-4" />
    </button>
  </div>
</template>
