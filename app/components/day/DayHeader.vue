<script setup lang="ts">
import { parseDate, type DateValue } from '@internationalized/date'
import { CalendarDays, ChevronLeft, ChevronRight } from '@lucide/vue'

import CaretTitle from '~/components/common/CaretTitle.vue'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { addDays, dayOfYear, isoWeek } from '~/lib/dates'
import type { Task } from '~/lib/types'

const props = defineProps<{ date: string; tasks: Task[] }>()
const emit = defineEmits<{ change: [date: string] }>()

const { t, locale } = useI18n()
const format = useFormat()
const today = useToday()
const auth = useAuthStore()
const pickerOpen = ref(false)

const calendarValue = computed({
  get: () => parseDate(props.date),
  set: (value: DateValue | undefined) => {
    if (value) {
      emit('change', value.toString())
      pickerOpen.value = false
    }
  },
})

const done = computed(() => props.tasks.filter((task) => task.status === 'DONE').length)
const plannedMinutes = computed(() =>
  props.tasks
    .filter((task) => task.status === 'OPEN')
    .reduce((sum, task) => sum + (task.durationMinutes ?? 0), 0),
)
const capacity = computed(() =>
  auth.user ? auth.user.dayEndMinutes - auth.user.dayStartMinutes : 540,
)
const freeMinutes = computed(() => Math.max(capacity.value - plannedMinutes.value, 0))
const progress = computed(() =>
  props.tasks.length === 0 ? 0 : Math.round((done.value / props.tasks.length) * 100),
)
const overloaded = computed(() => plannedMinutes.value > capacity.value)

const relative = computed(() => {
  if (props.date === today.value) return t('tasks.today')
  if (props.date === addDays(today.value, 1)) return t('tasks.tomorrow')
  if (props.date === addDays(today.value, -1)) return t('tasks.yesterday')
  return format.day(props.date, { weekday: 'long' })
})
</script>

<template>
  <header class="border-b border-rule">
    <div
      class="flex flex-wrap items-end justify-between gap-x-4 gap-y-4 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8"
    >
      <div class="min-w-0">
        <p class="label numeric flex flex-wrap gap-x-3">
          <span>{{ t('day.dayOfYear', { n: dayOfYear(date) }) }}</span>
          <span>{{ t('day.week', { n: isoWeek(date) }) }}</span>
          <span class="text-brand">{{ relative }}</span>
        </p>
        <h1 class="display mt-3 text-metric">
          <CaretTitle :text="format.day(date, { day: '2-digit', month: 'long' })" />
        </h1>
      </div>

      <div class="flex shrink-0 items-center">
        <button
          type="button"
          class="flex size-9 items-center justify-center border border-rule transition-colors hover:bg-ink hover:text-paper"
          :aria-label="t('day.previous')"
          @click="emit('change', addDays(date, -1))"
        >
          <ChevronLeft class="size-4" />
        </button>
        <button
          type="button"
          class="hidden h-9 border-y border-rule px-3 font-mono text-2xs tracking-wider uppercase transition-colors hover:bg-ink hover:text-paper aria-pressed:bg-ink aria-pressed:text-paper sm:block"
          :aria-pressed="date === today"
          @click="emit('change', today)"
        >
          {{ t('tasks.today') }}
        </button>
        <Popover v-model:open="pickerOpen">
          <PopoverTrigger as-child>
            <button
              type="button"
              class="flex size-9 items-center justify-center border border-l-0 border-rule transition-colors hover:bg-ink hover:text-paper sm:border-l-0"
              :aria-label="t('day.pick')"
            >
              <CalendarDays class="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-2" align="end">
            <Calendar
              v-model="calendarValue"
              :locale="locale"
              :week-starts-on="1"
              weekday-format="short"
            />
          </PopoverContent>
        </Popover>
        <button
          type="button"
          class="flex size-9 items-center justify-center border border-l-0 border-rule transition-colors hover:bg-ink hover:text-paper"
          :aria-label="t('day.next')"
          @click="emit('change', addDays(date, 1))"
        >
          <ChevronRight class="size-4" />
        </button>
      </div>
    </div>

    <dl class="mt-5 grid grid-cols-3 border-t border-rule lg:mt-6">
      <div class="border-r border-rule px-4 py-3 sm:px-6 lg:px-8">
        <dt class="label">{{ t('day.done') }}</dt>
        <dd class="numeric mt-1 font-mono text-sm">
          {{ done }}<span class="text-ink-faint"> / {{ tasks.length }}</span>
        </dd>
      </div>
      <div class="border-r border-rule px-4 py-3 sm:px-6">
        <dt class="label">{{ t('day.planned') }}</dt>
        <dd class="numeric mt-1 font-mono text-sm" :class="overloaded && 'text-danger'">
          {{ format.duration(plannedMinutes) || '0' }}
        </dd>
      </div>
      <div class="px-4 py-3 sm:px-6">
        <dt class="label">{{ t('day.free') }}</dt>
        <dd class="numeric mt-1 font-mono text-sm">{{ format.duration(freeMinutes) || '0' }}</dd>
      </div>
    </dl>
    <div
      class="h-0.5 bg-rule"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="t('day.progress')"
    >
      <div class="h-full bg-brand transition-all duration-500" :style="{ width: `${progress}%` }" />
    </div>
  </header>
</template>
