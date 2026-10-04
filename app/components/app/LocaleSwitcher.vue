<script setup lang="ts">
import type { Locale } from '~/lib/types'

withDefaults(defineProps<{ large?: boolean }>(), { large: false })

const { locale, locales, setLocale, t } = useI18n()
const auth = useAuthStore()

const change = async (code: Locale) => {
  if (code === locale.value) {
    return
  }

  await setLocale(code)

  if (auth.isAuthenticated) {
    await auth.updateProfile({ locale: code }).catch(() => undefined)
  }
}
</script>

<template>
  <div class="flex border border-rule" role="radiogroup" :aria-label="t('settings.language')">
    <button
      v-for="item in locales"
      :key="item.code"
      type="button"
      role="radio"
      :aria-checked="locale === item.code"
      :title="item.name"
      :class="large ? 'h-10' : 'h-8'"
      class="flex-1 border-r border-rule font-mono text-2xs text-ink-faint uppercase transition-colors last:border-r-0 hover:text-ink aria-checked:bg-ink aria-checked:text-paper"
      @click="change(item.code as Locale)"
    >
      {{ item.code }}
    </button>
  </div>
</template>
