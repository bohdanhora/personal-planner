<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

import { startOfWeek, weekDays } from '~/lib/dates'
import type { Task } from '~/lib/types'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ change: [date: string] }>()

const { t } = useI18n()
const format = useFormat()
const today = useToday()
const actions = useTaskActions()
const ui = useUiStore()

const days = computed(() => weekDays(startOfWeek(props.date)))
const { data: tasks } = useRangeTasks(
  () => days.value[0] ?? props.date,
  () => days.value[6] ?? props.date,
)

const counts = computed(() => {
  const map = new Map<string, { open: number; done: number }>()
  for (const task of tasks.value ?? []) {
    if (!task.date) continue
    const entry = map.get(task.date) ?? { open: 0, done: 0 }
    entry[task.status === 'DONE' ? 'done' : 'open'] += 1
    map.set(task.date, entry)
  }
  return map
})

const drops = reactive<Record<string, Task[]>>({})

watch(
  days,
  (list) => {
    for (const day of list) {
      drops[day] ??= []
    }
  },
  { immediate: true },
)

const onDrop = (day: string) => {
  const dropped = drops[day] ?? []
  drops[day] = []

  for (const task of dropped) {
    if (task.date !== day) {
      actions.update.mutate({ id: task.id, patch: { date: day, startMinutes: null } })
    }
  }
}
</script>

<template>
  <div class="grid grid-cols-7 border-b border-rule" data-tour="week-strip">
    <div v-for="day in days" :key="day" class="relative border-r border-rule last:border-r-0">
      <button
        type="button"
        class="group flex w-full flex-col items-center gap-1 py-2.5 transition-colors"
        :class="day === date ? 'bg-ink text-paper' : 'hover:bg-surface-muted'"
        :aria-label="format.day(day, { weekday: 'long', day: 'numeric', month: 'long' })"
        :aria-current="day === date ? 'date' : undefined"
        @click="emit('change', day)"
      >
        <span
          class="font-mono text-3xs uppercase"
          :class="day === date ? 'text-paper' : 'text-ink-faint'"
        >
          {{ format.day(day, { weekday: 'short' }) }}
        </span>
        <span
          class="numeric font-mono text-sm"
          :class="day === today && day !== date && 'text-brand'"
        >
          {{ format.day(day, { day: '2-digit' }) }}
        </span>
        <span class="flex h-1 items-center gap-0.5">
          <span
            v-for="index in Math.min(
              (counts.get(day)?.open ?? 0) + (counts.get(day)?.done ?? 0),
              6,
            )"
            :key="index"
            class="size-1"
            :class="
              index <= (counts.get(day)?.done ?? 0)
                ? 'bg-brand'
                : day === date
                  ? 'bg-paper'
                  : 'bg-ink-faint'
            "
          />
        </span>
      </button>
      <VueDraggable
        :model-value="drops[day] ?? []"
        :group="{ name: 'tasks', pull: false, put: true }"
        :sort="false"
        ghost-class="hidden"
        :class="[
          'absolute inset-0 overflow-hidden',
          ui.dragging
            ? 'pointer-events-auto hover:bg-brand-soft hover:outline hover:outline-brand'
            : 'pointer-events-none',
        ]"
        :title="t('day.dropHere')"
        @update:model-value="(value: Task[]) => (drops[day] = value)"
        @add="onDrop(day)"
      />
    </div>
  </div>
</template>
