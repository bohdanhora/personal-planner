<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

import TaskCard from '~/components/tasks/TaskCard.vue'
import TaskRow from '~/components/tasks/TaskRow.vue'
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
  }>(),
  { filter: () => true, showDate: false, showProject: true, sortable: true, variant: 'row' },
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
      <TaskCard v-for="task in items" :key="task.id" :task="task" />
    </template>
    <template v-else>
      <TaskRow
        v-for="task in items"
        :key="task.id"
        :task="task"
        :draggable="sortable"
        :show-date="showDate"
        :show-project="showProject"
      />
    </template>
  </VueDraggable>
</template>
