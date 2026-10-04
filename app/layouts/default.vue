<script setup lang="ts">
import { Sparkles } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'

import AppSidebar from '~/components/app/AppSidebar.vue'
import MobileHeader from '~/components/app/MobileHeader.vue'
import MobileTabBar from '~/components/app/MobileTabBar.vue'
import AssistantPanel from '~/components/assistant/AssistantPanel.vue'
import ProjectEditor from '~/components/projects/ProjectEditor.vue'
import OnboardingTour from '~/components/tour/OnboardingTour.vue'
import TaskEditor from '~/components/tasks/TaskEditor.vue'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '~/components/ui/sheet'

const { t } = useI18n()
const ui = useUiStore()
const auth = useAuthStore()
const tour = useTourStore()
const wide = useMediaQuery('(min-width: 1280px)')

const panelDocked = computed(() => wide.value && ui.assistantPinned)

const openAssistant = () => {
  if (wide.value) {
    ui.assistantPinned = true
  } else {
    ui.assistantSheetOpen = true
  }
}

watch(
  () => auth.user?.onboarded,
  (onboarded) => {
    if (onboarded === false && !tour.active && !tour.dismissed) {
      void tour.start()
    }
  },
  { immediate: true },
)

watch(wide, (isWide) => {
  if (isWide) {
    ui.assistantSheetOpen = false
  }
})
</script>

<template>
  <div class="min-h-dvh bg-background">
    <AppSidebar class="fixed inset-y-0 left-0 z-30 hidden w-sidebar border-r border-rule lg:flex" />

    <div class="lg:pl-sidebar" :class="panelDocked && 'xl:pr-panel'">
      <MobileHeader class="lg:hidden" />
      <main class="pb-tabbar lg:pb-0">
        <slot />
      </main>
    </div>

    <aside
      v-if="panelDocked"
      data-tour="assistant"
      class="fixed inset-y-0 right-0 z-30 hidden w-panel border-l border-rule xl:block"
    >
      <AssistantPanel closable @close="ui.assistantPinned = false" />
    </aside>

    <button
      v-if="!panelDocked"
      data-tour="assistant"
      type="button"
      class="fixed right-6 bottom-6 z-30 hidden h-11 items-center gap-2 bg-ink px-4 font-mono text-2xs tracking-wider text-paper uppercase transition-colors hover:bg-brand hover:text-on-brand lg:flex"
      @click="openAssistant"
    >
      <Sparkles class="size-4" />
      {{ t('assistant.title') }}
    </button>

    <Sheet v-model:open="ui.assistantSheetOpen">
      <SheetContent side="right" :show-close-button="false" class="w-full gap-0 p-0 sm:max-w-md">
        <SheetTitle class="sr-only">{{ t('assistant.title') }}</SheetTitle>
        <SheetDescription class="sr-only">{{ t('assistant.intro') }}</SheetDescription>
        <AssistantPanel closable @close="ui.assistantSheetOpen = false" />
      </SheetContent>
    </Sheet>

    <MobileTabBar class="lg:hidden" />
    <TaskEditor />
    <ProjectEditor />
    <OnboardingTour />
  </div>
</template>
