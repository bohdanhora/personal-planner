<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

import TaskCard from '~/components/tasks/TaskCard.vue'
import TaskRow from '~/components/tasks/TaskRow.vue'
import { timelineAt } from '~/lib/timeline'
import type { Task } from '~/lib/types'

const props = withDefaults(
  defineProps<{
    tasks: Task[]
    container: string | null
    filter?: (task: Task) => boolean
    showDate?: boolean
    showProject?: boolean
    sortable?: boolean
    variant?: 'row' | 'card'
    now?: number | null
    groupUntimed?: boolean
  }>(),
  {
    filter: () => true,
    showDate: false,
    showProject: true,
    sortable: true,
    variant: 'row',
    now: null,
    groupUntimed: false,
  },
)

const actions = useTaskActions()
const ui = useUiStore()

const items = ref<Task[]>([])
const dragging = ref(false)

watch(
  () => [props.tasks, props.filter] as const,
  () => {
    if (!dragging.value) {
      items.value = props.tasks.filter(props.filter)
    }
  },
  { immediate: true, deep: true },
)

const timeline = computed(() => (props.now === null ? null : timelineAt(items.value, props.now)))

const firstUntimed = computed(() => {
  if (!props.groupUntimed) return null
  const index = items.value.findIndex((task) => task.startMinutes === null)
  return index > 0 ? (items.value[index]?.id ?? null) : null
})

const nowLine = (task: Task) => {
  if (task.id === timeline.value?.lineBefore) return 'before'
  if (task.id === timeline.value?.lineAfter) return 'after'
  return null
}

const mergedOrder = () => {
  const result = items.value.map((task) => task.id)

  props.tasks.forEach((task, index) => {
    if (!props.filter(task)) {
      result.splice(Math.min(index, result.length), 0, task.id)
    }
  })

  return result
}

const onStart = () => {
  dragging.value = true
  ui.dragging = true
}

const onEnd = () => {
  dragging.value = false
  ui.dragging = false
}

const persist = () => {
  dragging.value = false
  actions.order.mutate({ date: props.container, taskIds: mergedOrder() })
}
</script>

<template>
  <VueDraggable
    v-model="items"
    :disabled="!sortable"
    :animation="160"
    :handle="variant === 'row' ? '.drag-handle' : undefined"
    :delay="variant === 'card' ? 120 : 0"
    :delay-on-touch-only="true"
    :fallback-tolerance="4"
    filter=".no-drag"
    :prevent-on-filter="false"
    :group="sortable ? 'tasks' : { name: 'tasks', pull: false, put: false }"
    ghost-class="sortable-ghost"
    fallback-class="sortable-fallback"
    :force-fallback="true"
    :fallback-on-body="true"
    chosen-class="sortable-chosen"
    drag-class="sortable-drag"
    :class="variant === 'card' ? 'flex min-h-24 flex-col gap-1.5' : 'min-h-12'"
    @start="onStart"
    @end="onEnd"
    @update="persist"
    @add="persist"
  >
    <template v-if="variant === 'card'">
      <TaskCard
        v-for="task in items"
        :key="task.id"
        :task="task"
        :now="now"
        :now-line="nowLine(task)"
        :active="task.id === timeline?.activeId"
        :anytime-start="task.id === firstUntimed"
      />
    </template>
    <template v-else>
      <TaskRow
        v-for="task in items"
        :key="task.id"
        :task="task"
        :draggable="sortable"
        :show-date="showDate"
        :show-project="showProject"
        :now="now"
        :now-line="nowLine(task)"
        :active="task.id === timeline?.activeId"
        :anytime-start="task.id === firstUntimed"
      />
    </template>
  </VueDraggable>
</template>
