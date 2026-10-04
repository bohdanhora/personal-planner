<script setup lang="ts">
import { Settings, Sparkles } from '@lucide/vue'

import AppLogo from '~/components/app/AppLogo.vue'

const { t } = useI18n()
const ui = useUiStore()
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-paper/95 px-4 backdrop-blur-sm"
  >
    <AppLogo />
    <div class="flex items-center gap-1">
      <button
        data-tour="assistant"
        type="button"
        class="flex h-9 items-center gap-2 px-2 font-mono text-2xs tracking-wider text-ink uppercase transition-colors hover:bg-ink hover:text-paper"
        @click="ui.assistantSheetOpen = true"
      >
        <Sparkles class="size-4 text-brand" />
        {{ t('assistant.short') }}
      </button>
      <NuxtLink
        to="/settings"
        data-tour="settings"
        class="flex size-9 items-center justify-center text-ink-faint transition-colors hover:bg-ink hover:text-paper"
        :aria-label="t('nav.settings')"
      >
        <Settings class="size-4" />
      </NuxtLink>
    </div>
  </header>
</template>
