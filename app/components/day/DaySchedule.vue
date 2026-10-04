<script setup lang="ts">
import type { Task } from '~/lib/types'

const HOUR_REM = 3.5
const DEFAULT_LENGTH = 30
const SHORT_BLOCK = 45

const props = defineProps<{ date: string; tasks: Task[] }>()

const { t } = useI18n()
const ui = useUiStore()
const auth = useAuthStore()
const format = useFormat()
const today = useToday()
const projects = useProjectMap()
const now = useClock()

const timed = computed(() =>
  props.tasks
    .filter((task) => task.startMinutes !== null)
    .sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0)),
)
const untimed = computed(() => props.tasks.filter((task) => task.startMinutes === null))

const range = computed(() => {
  const starts = timed.value.map((task) => task.startMinutes ?? 0)
  const ends = timed.value.map(
    (task) => (task.startMinutes ?? 0) + (task.durationMinutes ?? DEFAULT_LENGTH),
  )
  const from = Math.floor(Math.min(auth.user?.dayStartMinutes ?? 540, ...starts) / 60)
  const to = Math.ceil(Math.max(auth.user?.dayEndMinutes ?? 1080, ...ends) / 60)
  return { from, to: Math.min(to, 24) }
})

const hours = computed(() =>
  Array.from({ length: range.value.to - range.value.from }, (_, i) => range.value.from + i),
)

const blocks = computed(() => {
  const laneEnds: number[] = []

  return timed.value.map((task) => {
    const start = task.startMinutes ?? 0
    const end = start + (task.durationMinutes ?? DEFAULT_LENGTH)
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)

    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }

    return { task, start, end, lane }
  })
})

const lanes = computed(() => Math.max(1, ...blocks.value.map((block) => block.lane + 1)))

const offset = (minutes: number) => `${((minutes - range.value.from * 60) / 60) * HOUR_REM}rem`

const nowMinutes = computed(() => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: auth.user?.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now.value)
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return read('hour') * 60 + read('minute')
})

const showNow = computed(
  () =>
    props.date === today.value &&
    nowMinutes.value >= range.value.from * 60 &&
    nowMinutes.value <= range.value.to * 60,
)
</script>

<template>
  <div>
    <div
      class="relative ml-14 border-l border-rule"
      :style="{ height: `${hours.length * HOUR_REM}rem` }"
    >
      <div
        v-for="hour in hours"
        :key="hour"
        class="absolute inset-x-0 border-t border-rule"
        :style="{ top: offset(hour * 60) }"
      >
        <span class="label numeric absolute -top-2 -left-14 w-12 text-right">{{
          format.clock(hour * 60)
        }}</span>
      </div>

      <button
        v-for="block in blocks"
        :key="block.task.id"
        type="button"
        class="absolute flex overflow-hidden border border-l-2 bg-surface px-2 text-left transition-colors hover:bg-surface-muted"
        :class="[
          block.end - block.start < SHORT_BLOCK ? 'items-center gap-3' : 'flex-col py-1',
          block.task.status === 'DONE'
            ? 'border-rule border-l-ink-faint'
            : 'border-rule border-l-brand',
        ]"
        :style="{
          top: offset(block.start),
          height: `calc(${offset(block.end)} - ${offset(block.start)})`,
          left: `calc(${(block.lane / lanes) * 100}% + 0.25rem)`,
          width: `calc(${100 / lanes}% - 0.5rem)`,
        }"
        @click="ui.openEditor(block.task)"
      >
        <span
          class="min-w-0 truncate text-sm leading-tight"
          :class="block.task.status === 'DONE' && 'text-ink-faint line-through'"
        >
          {{ block.task.title }}
        </span>
        <span class="shrink-0 truncate font-mono text-3xs text-ink-faint uppercase">
          {{ format.timeRange(block.start, block.end - block.start) }}
          <template v-if="block.task.projectId && projects.get(block.task.projectId)">
            · {{ projects.get(block.task.projectId)?.code }}</template
          >
        </span>
      </button>

      <div
        v-if="showNow"
        class="pointer-events-none absolute inset-x-0 z-10 flex items-center"
        :style="{ top: offset(nowMinutes) }"
      >
        <span class="-ml-1 size-2 bg-brand" />
        <span class="h-px flex-1 bg-brand" />
      </div>
    </div>

    <div v-if="untimed.length" class="mt-6 border-t border-rule pt-4">
      <p class="label">{{ t('day.unscheduled', { n: untimed.length }) }}</p>
      <ul class="mt-2 flex flex-wrap gap-2">
        <li v-for="task in untimed" :key="task.id">
          <button
            type="button"
            class="border border-rule px-2 py-1 text-sm transition-colors hover:border-rule-strong"
            :class="task.status === 'DONE' && 'text-ink-faint line-through'"
            @click="ui.openEditor(task)"
          >
            {{ task.title }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
