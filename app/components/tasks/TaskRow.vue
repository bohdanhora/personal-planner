<script setup lang="ts">
import {
  ArrowRight,
  CalendarCheck,
  EllipsisVertical,
  GripVertical,
  Inbox,
  Pencil,
  Trash2,
} from '@lucide/vue'

import TaskCheck from '~/components/tasks/TaskCheck.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { addDays } from '~/lib/dates'
import type { Task } from '~/lib/types'

const props = withDefaults(
  defineProps<{ task: Task; draggable?: boolean; showDate?: boolean; showProject?: boolean }>(),
  { draggable: true, showDate: false, showProject: true },
)

const { t } = useI18n()
const ui = useUiStore()
const today = useToday()
const format = useFormat()
const projects = useProjectMap()
const actions = useTaskActions()

const project = computed(() =>
  props.task.projectId ? projects.value.get(props.task.projectId) : undefined,
)
const done = computed(() => props.task.status === 'DONE')
const overdue = computed(
  () => !done.value && props.task.date !== null && props.task.date < today.value,
)

const moveTo = (date: string | null) =>
  actions.update.mutate({ id: props.task.id, patch: { date, startMinutes: null } })

const edit = () => ui.openEditor(props.task)
</script>

<template>
  <div
    class="group/row relative flex items-start gap-1 border-b border-rule bg-background pr-2 transition-colors hover:bg-surface sm:pr-3"
    :data-task-id="task.id"
  >
    <span
      v-if="draggable"
      class="drag-handle flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-ink-faint hover:text-ink active:cursor-grabbing sm:h-12 sm:opacity-0 sm:group-hover/row:opacity-100"
      :aria-label="t('tasks.drag')"
    >
      <GripVertical class="size-4" />
    </span>
    <span v-else class="w-3 shrink-0" />

    <div class="flex h-10 items-center sm:h-12">
      <TaskCheck
        :checked="done"
        :label="done ? t('tasks.reopen') : t('tasks.complete')"
        @toggle="actions.toggle(task)"
      />
    </div>

    <button type="button" class="min-w-0 flex-1 py-2.5 text-left sm:py-3" @click="edit">
      <span class="flex items-start gap-2">
        <span
          v-if="task.priority === 'HIGH' && !done"
          class="marker mt-2 shrink-0"
          :title="t('priority.HIGH')"
        />
        <span
          class="text-body leading-snug break-words"
          :class="done ? 'text-ink-faint line-through decoration-ink-faint' : 'text-ink'"
        >
          {{ task.title }}
        </span>
      </span>
      <span
        v-if="
          task.notes ||
          project ||
          task.startMinutes !== null ||
          task.durationMinutes ||
          showDate ||
          task.priority === 'LOW'
        "
        class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-2xs text-ink-faint uppercase"
      >
        <span v-if="showProject && project" class="border border-rule px-1 leading-4">{{
          project.code
        }}</span>
        <span v-if="showDate && task.date" :class="overdue && 'text-danger'">
          {{ format.day(task.date, { day: '2-digit', month: 'short' }) }}
        </span>
        <span v-else-if="showDate" class="normal-case">{{ t('tasks.noDate') }}</span>
        <span v-if="task.startMinutes !== null" class="numeric text-ink-muted">
          {{ format.timeRange(task.startMinutes, task.durationMinutes) }}
        </span>
        <span v-else-if="task.durationMinutes" class="numeric">{{
          format.duration(task.durationMinutes)
        }}</span>
        <span v-if="task.priority === 'LOW'">{{ t('priority.LOW') }}</span>
        <span v-if="task.notes" class="max-w-full truncate font-sans text-xs normal-case">{{
          task.notes
        }}</span>
      </span>
    </button>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="mt-1 flex size-8 shrink-0 items-center justify-center text-ink-faint transition-colors hover:bg-ink hover:text-paper data-[state=open]:bg-ink data-[state=open]:text-paper sm:mt-2 sm:opacity-0 sm:group-hover/row:opacity-100 sm:data-[state=open]:opacity-100"
          :aria-label="t('tasks.actions')"
        >
          <EllipsisVertical class="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-52">
        <DropdownMenuItem @select="edit">
          <Pencil />
          {{ t('common.edit') }}
        </DropdownMenuItem>
        <DropdownMenuItem v-if="task.date !== today" @select="moveTo(today)">
          <CalendarCheck />
          {{ t('tasks.moveToday') }}
        </DropdownMenuItem>
        <DropdownMenuItem
          @select="moveTo(addDays(task.date && task.date > today ? task.date : today, 1))"
        >
          <ArrowRight />
          {{ task.date && task.date >= today ? t('tasks.moveNextDay') : t('tasks.moveTomorrow') }}
        </DropdownMenuItem>
        <DropdownMenuItem v-if="task.date !== null" @select="moveTo(null)">
          <Inbox />
          {{ t('tasks.moveInbox') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" @select="actions.remove.mutate(task.id)">
          <Trash2 />
          {{ t('common.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
