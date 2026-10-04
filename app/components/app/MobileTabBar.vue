<script setup lang="ts">
import { CalendarDays, CalendarRange, ChartColumn, FolderKanban, Inbox } from '@lucide/vue'

const { t } = useI18n()
const route = useRoute()

const items = computed(() => [
  { to: '/', label: t('nav.today'), icon: CalendarDays },
  { to: '/week', label: t('nav.week'), icon: CalendarRange },
  { to: '/inbox', label: t('nav.inbox'), icon: Inbox },
  { to: '/projects', label: t('nav.projects'), icon: FolderKanban },
  { to: '/insights', label: t('nav.insights'), icon: ChartColumn },
])

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-rule-strong bg-paper pb-safe">
    <ul data-tour="nav" class="grid h-tabbar grid-cols-5">
      <li
        v-for="item in items"
        :key="item.to"
        :data-tour="item.to === '/projects' ? 'projects' : undefined"
      >
        <NuxtLink
          :to="item.to"
          class="relative flex h-full flex-col items-center justify-center gap-1 transition-colors"
          :class="isActive(item.to) ? 'text-ink' : 'text-ink-faint'"
        >
          <span
            class="absolute inset-x-4 top-0 h-0.5 bg-brand transition-opacity"
            :class="isActive(item.to) ? 'opacity-100' : 'opacity-0'"
          />
          <component :is="item.icon" class="size-5" />
          <span class="font-mono text-3xs tracking-wide uppercase">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
