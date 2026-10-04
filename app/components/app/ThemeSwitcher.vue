<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue'

withDefaults(defineProps<{ large?: boolean }>(), { large: false })

const colorMode = useColorMode()
const { t } = useI18n()

const options = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const
</script>

<template>
  <div class="flex border border-rule" role="radiogroup" :aria-label="t('settings.theme')">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="colorMode.preference === option.value"
      :title="t(`theme.${option.value}`)"
      :class="large ? 'h-10' : 'h-8'"
      class="flex flex-1 items-center justify-center border-r border-rule text-ink-faint transition-colors last:border-r-0 hover:text-ink aria-checked:bg-ink aria-checked:text-paper"
      @click="colorMode.preference = option.value"
    >
      <component :is="option.icon" class="size-3.5" />
      <span class="sr-only">{{ t(`theme.${option.value}`) }}</span>
    </button>
  </div>
</template>
