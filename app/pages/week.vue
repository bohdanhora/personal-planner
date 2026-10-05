<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from '@lucide/vue'

import TaskList from '~/components/tasks/TaskList.vue'
import { addDays, isDay, isoWeek, startOfWeek, weekDays } from '~/lib/dates'
import { sortByTime } from '~/lib/timeline'
import type { Task } from '~/lib/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const today = useToday()
const format = useFormat()
const nowMinutes = useNowMinutes()

const start = computed(() =>
  startOfWeek(isDay(route.query.start) ? route.query.start : today.value),
)
const days = computed(() => weekDays(start.value))
const end = computed(() => days.value[6] ?? start.value)

useHead({ title: () => `${t('week.title', { n: isoWeek(start.value) })} · Personal Planner` })

const { data: tasks } = useRangeTasks(start, end)
const { data: inbox } = useInboxTasks()

const byDay = computed(() => {
  const map = new Map<string, Task[]>(days.value.map((day) => [day, []]))
  for (const task of tasks.value ?? []) {
    if (task.date) map.get(task.date)?.push(task)
  }
  for (const [day, list] of map) map.set(day, sortByTime(list))
  return map
})

const capacity = computed(() =>
  auth.user ? auth.user.dayEndMinutes - auth.user.dayStartMinutes : 540,
)

const load = (day: string) => {
  const minutes = (byDay.value.get(day) ?? [])
    .filter((task) => task.status === 'OPEN')
    .reduce((sum, task) => sum + (task.durationMinutes ?? 0), 0)
  return { minutes, ratio: Math.min(minutes / capacity.value, 1), over: minutes > capacity.value }
}

const totals = computed(() => {
  const all = tasks.value ?? []
  return { total: all.length, done: all.filter((task) => task.status === 'DONE').length }
})

const openInbox = computed(() => (inbox.value ?? []).filter((task) => task.status === 'OPEN'))

const shift = (weeks: number) =>
  router.replace({ query: { start: addDays(start.value, weeks * 7) } })
const goToday = () => router.replace({ query: {} })
const openDay = (day: string) =>
  navigateTo({ path: '/', query: day === today.value ? {} : { date: day } })
</script>

<template>
  <div>
    <header class="border-b border-rule px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="label numeric">
            {{ t('week.title', { n: isoWeek(start) }) }} · {{ totals.done }} / {{ totals.total }}
          </p>
          <h1 class="display mt-3 text-metric">
            {{ format.day(start, { day: '2-digit', month: 'short' }) }}
            <span class="text-ink-faint">/</span>
            {{ format.day(end, { day: '2-digit', month: 'short' }) }}<span class="caret" />
          </h1>
        </div>
        <div class="flex shrink-0">
          <button
            type="button"
            class="flex size-9 items-center justify-center border border-rule transition-colors hover:bg-ink hover:text-paper"
            :aria-label="t('week.previous')"
            @click="shift(-1)"
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            type="button"
            class="h-9 border-y border-rule px-3 font-mono text-2xs tracking-wider uppercase transition-colors hover:bg-ink hover:text-paper aria-pressed:bg-ink aria-pressed:text-paper"
            :aria-pressed="days.includes(today)"
            @click="goToday"
          >
            {{ t('week.current') }}
          </button>
          <button
            type="button"
            class="flex size-9 items-center justify-center border border-rule transition-colors hover:bg-ink hover:text-paper"
            :aria-label="t('week.next')"
            @click="shift(1)"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
      <p class="mt-4 pb-5 text-sm text-ink-muted">{{ t('week.hint') }}</p>
    </header>

    <section v-if="openInbox.length" class="border-b border-rule px-4 py-4 sm:px-6 lg:px-8">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="label">{{ t('nav.inbox') }}</h2>
        <span class="label numeric">{{ openInbox.length }}</span>
      </div>
      <div class="max-h-56 overflow-y-auto">
        <TaskList
          :tasks="inbox ?? []"
          :container="null"
          :filter="(task) => task.status === 'OPEN'"
          :show-date="false"
        />
      </div>
    </section>

    <div class="hidden lg:grid lg:grid-cols-7">
      <section
        v-for="day in days"
        :key="day"
        class="flex min-h-96 flex-col border-r border-rule last:border-r-0"
      >
        <header class="border-b border-rule px-2 py-2.5" :class="day === today && 'bg-surface'">
          <button
            type="button"
            class="flex w-full items-baseline justify-between text-left transition-colors hover:text-brand"
            @click="openDay(day)"
          >
            <span
              class="font-mono text-2xs uppercase"
              :class="day === today ? 'text-brand' : 'text-ink-faint'"
            >
              {{ format.day(day, { weekday: 'short' }) }}
            </span>
            <span class="numeric font-mono text-base">{{
              format.day(day, { day: '2-digit' })
            }}</span>
          </button>
          <div class="mt-2 h-0.5 bg-rule" :title="format.duration(load(day).minutes)">
            <div
              class="h-full"
              :class="load(day).over ? 'bg-danger' : 'bg-brand'"
              :style="{ width: `${load(day).ratio * 100}%` }"
            />
          </div>
        </header>
        <div class="flex-1 p-1.5">
          <TaskList
            :tasks="byDay.get(day) ?? []"
            :container="day"
            variant="card"
            :now="day === today ? nowMinutes : null"
            group-untimed
          />
        </div>
        <button
          type="button"
          class="flex h-9 items-center justify-center gap-1 border-t border-rule font-mono text-3xs tracking-wider text-ink-faint uppercase transition-colors hover:bg-ink hover:text-paper"
          @click="ui.openEditor(null, { date: day })"
        >
          <Plus class="size-3" />
          {{ t('tasks.add') }}
        </button>
      </section>
    </div>

    <div class="lg:hidden">
      <section v-for="day in days" :key="day" class="border-b border-rule">
        <header
          class="flex items-center justify-between px-4 py-3 sm:px-6"
          :class="day === today && 'bg-surface'"
        >
          <button type="button" class="flex items-baseline gap-3 text-left" @click="openDay(day)">
            <span class="numeric font-mono text-lg" :class="day === today && 'text-brand'">{{
              format.day(day, { day: '2-digit' })
            }}</span>
            <span class="label">{{ format.day(day, { weekday: 'long' }) }}</span>
          </button>
          <span class="flex items-center gap-3">
            <span class="label numeric" :class="load(day).over && 'text-danger'">{{
              format.duration(load(day).minutes)
            }}</span>
            <button
              type="button"
              class="flex size-8 items-center justify-center border border-rule transition-colors hover:bg-ink hover:text-paper"
              :aria-label="t('tasks.add')"
              @click="ui.openEditor(null, { date: day })"
            >
              <Plus class="size-3.5" />
            </button>
          </span>
        </header>
        <div class="border-t border-rule">
          <TaskList
            :tasks="byDay.get(day) ?? []"
            :container="day"
            :now="day === today ? nowMinutes : null"
            group-untimed
          />
        </div>
      </section>
    </div>
  </div>
</template>
