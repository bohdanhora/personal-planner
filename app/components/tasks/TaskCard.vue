<script setup lang="ts">
import NowLine from '~/components/tasks/NowLine.vue'
import type { Task } from '~/lib/types'

const props = withDefaults(
  defineProps<{
    task: Task
    now?: number | null
    nowLine?: 'before' | 'after' | null
    active?: boolean
    anytimeStart?: boolean
  }>(),
  { now: null, nowLine: null, active: false, anytimeStart: false },
)

const { t } = useI18n()
const ui = useUiStore()
const format = useFormat()
const projects = useProjectMap()
const actions = useTaskActions()

const project = computed(() =>
  props.task.projectId ? projects.value.get(props.task.projectId) : undefined,
)
const done = computed(() => props.task.status === 'DONE')
</script>

<template>
  <div
    class="group relative cursor-grab border bg-surface p-2 transition-colors hover:border-rule-strong active:cursor-grabbing"
    :class="[
      active ? 'border-brand bg-brand-soft' : 'border-rule',
      task.priority === 'HIGH' && !done && 'border-l-2 border-l-brand',
      (nowLine === 'before' || anytimeStart) && 'mt-5',
      nowLine === 'after' && 'mb-5',
    ]"
    :data-task-id="task.id"
    @click="ui.openEditor(task)"
  >
    <NowLine
      v-if="nowLine && now !== null"
      :minutes="now"
      class="absolute inset-x-0"
      :class="nowLine === 'before' ? '-top-3.5' : '-bottom-3.5'"
    />
    <p
      v-else-if="anytimeStart"
      class="pointer-events-none absolute inset-x-0 -top-4.5 font-mono text-3xs tracking-wider text-ink-faint uppercase"
    >
      {{ t('tasks.anyTime') }}
    </p>
    <div class="flex items-start gap-2">
      <button
        type="button"
        role="checkbox"
        :aria-checked="done"
        :aria-label="done ? t('tasks.reopen') : t('tasks.complete')"
        class="no-drag group/check -m-1.5 shrink-0 cursor-pointer p-1.5"
        @click.stop="actions.toggle(task)"
      >
        <span
          class="mt-0.5 flex size-3.5 items-center justify-center border transition-colors"
          :class="
            done ? 'border-brand bg-brand' : 'border-rule-strong group-hover/check:border-brand'
          "
        />
      </button>
      <span
        class="min-w-0 text-sm leading-snug break-words"
        :class="done && 'text-ink-faint line-through'"
      >
        {{ task.title }}
      </span>
    </div>
    <div
      v-if="project || task.startMinutes !== null || task.durationMinutes"
      class="mt-1.5 flex flex-wrap gap-x-2 pl-5.5 font-mono text-3xs text-ink-faint uppercase"
    >
      <span v-if="task.startMinutes !== null" class="numeric text-ink-muted">{{
        format.timeRange(task.startMinutes, task.durationMinutes)
      }}</span>
      <span v-else-if="task.durationMinutes">{{ format.duration(task.durationMinutes) }}</span>
      <span v-if="project">{{ project.code }}</span>
    </div>
  </div>
</template>
