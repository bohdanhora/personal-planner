<script setup lang="ts">
import type { Task } from '~/lib/types'

const props = defineProps<{ task: Task }>()

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
    class="group relative cursor-grab border border-rule bg-surface p-2 transition-colors hover:border-rule-strong active:cursor-grabbing"
    :class="task.priority === 'HIGH' && !done && 'border-l-2 border-l-brand'"
    :data-task-id="task.id"
    @click="ui.openEditor(task)"
  >
    <div class="flex items-start gap-2">
      <button
        type="button"
        role="checkbox"
        :aria-checked="done"
        :aria-label="done ? t('tasks.reopen') : t('tasks.complete')"
        class="mt-0.5 flex size-3.5 shrink-0 items-center justify-center border transition-colors"
        :class="done ? 'border-brand bg-brand' : 'border-rule-strong hover:border-brand'"
        @click.stop="actions.toggle(task)"
      />
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
        format.clock(task.startMinutes)
      }}</span>
      <span v-else-if="task.durationMinutes">{{ format.duration(task.durationMinutes) }}</span>
      <span v-if="project">{{ project.code }}</span>
    </div>
  </div>
</template>
