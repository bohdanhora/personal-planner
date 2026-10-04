<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { toast } from 'vue-sonner'

import { Button } from '~/components/ui/button'
import type { Plan } from '~/lib/types'

const props = defineProps<{ plan: Plan }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const format = useFormat()
const errorMessage = useErrorMessage()
const actions = useTaskActions()
const { data: tasks } = useDayTasks(() => props.plan.date)

const titles = computed(() => new Map((tasks.value ?? []).map((task) => [task.id, task.title])))

const apply = async () => {
  try {
    await actions.schedule.mutateAsync({
      date: props.plan.date,
      items: props.plan.items.map(({ taskId, startMinutes, durationMinutes }) => ({
        taskId,
        startMinutes,
        durationMinutes,
      })),
    })
    toast.success(t('assistant.planApplied'))
    emit('close')
  } catch (error) {
    toast.error(errorMessage(error))
  }
}
</script>

<template>
  <div class="animate-rise border border-rule-strong">
    <div class="flex items-center justify-between border-b border-rule px-3 py-2">
      <p class="label">{{ t('assistant.proposedPlan') }}</p>
      <button type="button" class="label hover:text-ink" @click="emit('close')">
        {{ t('common.dismiss') }}
      </button>
    </div>
    <p v-if="plan.summary" class="border-b border-rule px-3 py-2.5 text-sm text-ink-muted">
      {{ plan.summary }}
    </p>
    <ol>
      <li
        v-for="item in plan.items"
        :key="item.taskId"
        class="grid grid-cols-12 gap-2 border-b border-rule px-3 py-2 last:border-b-0"
      >
        <span class="numeric col-span-3 font-mono text-2xs leading-5 text-brand">
          {{ format.clock(item.startMinutes) }}
        </span>
        <span class="col-span-9">
          <span class="block text-sm leading-5">{{ titles.get(item.taskId) ?? '...' }}</span>
          <span class="block font-mono text-3xs text-ink-faint uppercase">
            {{ format.duration(item.durationMinutes)
            }}<template v-if="item.note"> · {{ item.note }}</template>
          </span>
        </span>
      </li>
    </ol>
    <div v-if="plan.unscheduled.length" class="border-t border-rule px-3 py-2">
      <p class="label">{{ t('assistant.unscheduled') }}</p>
      <ul class="mt-1 space-y-1">
        <li v-for="entry in plan.unscheduled" :key="entry.taskId" class="text-xs text-ink-muted">
          {{ titles.get(entry.taskId) }}: {{ entry.reason }}
        </li>
      </ul>
    </div>
    <div class="border-t border-rule p-2">
      <Button
        size="sm"
        variant="brand"
        class="w-full"
        :disabled="actions.schedule.isPending.value || plan.items.length === 0"
        @click="apply"
      >
        <LoaderCircle v-if="actions.schedule.isPending.value" class="animate-spin" />
        {{ t('assistant.applyPlan') }}
      </Button>
    </div>
  </div>
</template>
