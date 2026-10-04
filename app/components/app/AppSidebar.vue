<script setup lang="ts">
import { CalendarDays, CalendarRange, ChartColumn, Inbox, Plus, Settings } from '@lucide/vue'

import AppLogo from '~/components/app/AppLogo.vue'
import LocaleSwitcher from '~/components/app/LocaleSwitcher.vue'
import ThemeSwitcher from '~/components/app/ThemeSwitcher.vue'
import type { ProjectArea } from '~/lib/types'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()
const today = useToday()

const { data: projects } = useProjects()
const { data: todayTasks } = useDayTasks(today)
const { data: inbox } = useInboxTasks()

const openToday = computed(
  () => todayTasks.value?.filter((task) => task.status === 'OPEN').length ?? 0,
)
const openInbox = computed(() => inbox.value?.filter((task) => task.status === 'OPEN').length ?? 0)

const navigation = computed(() => [
  { to: '/', label: t('nav.today'), icon: CalendarDays, count: openToday.value },
  { to: '/week', label: t('nav.week'), icon: CalendarRange, count: null },
  { to: '/inbox', label: t('nav.inbox'), icon: Inbox, count: openInbox.value },
  { to: '/insights', label: t('nav.insights'), icon: ChartColumn, count: null },
])

const areas: ProjectArea[] = ['WORK', 'PERSONAL']

const projectsByArea = computed(() =>
  areas.map((area) => ({
    area,
    projects: (projects.value ?? []).filter((project) => project.area === area),
  })),
)

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <aside class="flex h-dvh flex-col bg-paper">
    <div class="flex h-14 shrink-0 items-center border-b border-rule px-5">
      <AppLogo />
    </div>

    <nav class="flex-1 overflow-y-auto py-4">
      <p class="label px-5 pb-2">{{ t('nav.plan') }}</p>
      <ul data-tour="nav">
        <li v-for="item in navigation" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="group flex h-9 items-center gap-3 px-5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            :class="isActive(item.to) && 'bg-surface-muted text-ink'"
          >
            <span
              class="marker transition-opacity"
              :class="isActive(item.to) ? 'opacity-100' : 'opacity-0'"
            />
            <component :is="item.icon" class="size-4" />
            <span class="flex-1 text-sm">{{ item.label }}</span>
            <span v-if="item.count" class="numeric font-mono text-2xs">{{ item.count }}</span>
          </NuxtLink>
        </li>
      </ul>

      <div data-tour="projects" class="mt-6">
        <div class="flex items-center justify-between pr-3 pl-5">
          <NuxtLink to="/projects" class="label hover:text-ink">{{ t('nav.projects') }}</NuxtLink>
          <button
            type="button"
            class="flex size-6 items-center justify-center text-ink-faint transition-colors hover:bg-ink hover:text-paper"
            :title="t('projects.new')"
            @click="ui.openProjectEditor()"
          >
            <Plus class="size-3.5" />
          </button>
        </div>

        <div v-for="group in projectsByArea" :key="group.area" class="mt-3">
          <p class="px-5 pb-1 font-mono text-3xs tracking-wider text-ink-faint uppercase">
            {{ t(`areas.${group.area}`) }}
          </p>
          <ul>
            <li v-for="project in group.projects" :key="project.id">
              <NuxtLink
                :to="`/projects/${project.id}`"
                class="flex h-8 items-center gap-3 px-5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                :class="route.path === `/projects/${project.id}` && 'bg-surface-muted text-ink'"
              >
                <span class="w-12 border border-rule px-1 text-center font-mono text-3xs">
                  {{ project.code }}
                </span>
                <span class="flex-1 truncate text-sm">{{ project.name }}</span>
                <span v-if="project.openTasks" class="numeric font-mono text-3xs text-ink-faint">
                  {{ project.openTasks }}
                </span>
              </NuxtLink>
            </li>
            <li v-if="group.projects.length === 0" class="px-5 py-1 text-xs text-ink-faint">
              {{ t('projects.emptyArea') }}
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="space-y-3 border-t border-rule p-4">
      <NuxtLink
        to="/settings"
        data-tour="settings"
        class="-mx-1 flex items-center gap-3 px-1 py-1 transition-colors hover:bg-surface-muted"
      >
        <span
          class="flex size-8 items-center justify-center bg-ink font-mono text-xs text-paper uppercase"
        >
          {{ (auth.user?.displayName || auth.user?.email || '?').slice(0, 1) }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm">{{
            auth.user?.displayName || t('settings.noName')
          }}</span>
          <span class="block truncate text-xs text-ink-faint">{{ auth.user?.email }}</span>
        </span>
        <Settings class="size-4 text-ink-faint" />
      </NuxtLink>
      <div class="grid grid-cols-2 gap-2">
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>
    </div>
  </aside>
</template>
