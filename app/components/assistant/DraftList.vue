<script setup lang="ts">
import { Check, LoaderCircle, Plus, X } from '@lucide/vue'
import { toast } from 'vue-sonner'

import { Button } from '~/components/ui/button'
import type { TaskDraft } from '~/lib/types'

const props = withDefaults(defineProps<{ drafts: TaskDraft[]; dismissible?: boolean }>(), {
  dismissible: false,
})
const emit = defineEmits<{ done: []; dismiss: [] }>()

const { t } = useI18n()
const format = useFormat()
const projects = useProjectMap()
const actions = useTaskActions()
const errorMessage = useErrorMessage()

const added = ref(new Set<number>())
const remaining = computed(() => props.drafts.filter((_, index) => !added.value.has(index)))

const toInput = (draft: TaskDraft) => ({ ...draft })

const addOne = async (index: number) => {
  const draft = props.drafts[index]
  if (!draft) {
    return
  }

  try {
    await actions.create.mutateAsync(toInput(draft))
    added.value = new Set([...added.value, index])
    if (remaining.value.length === 0) {
      emit('done')
    }
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const addAll = async () => {
  try {
    await actions.createMany.mutateAsync(remaining.value.map(toInput))
    toast.success(t('assistant.added', { n: remaining.value.length }))
    added.value = new Set(props.drafts.map((_, index) => index))
    emit('done')
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const dateLabel = (draft: TaskDraft) =>
  draft.date
    ? format.day(draft.date, { weekday: 'short', day: 'numeric', month: 'short' })
    : t('nav.inbox')
</script>

<template>
  <div class="border border-rule-strong bg-surface">
    <div class="flex items-center justify-between border-b border-rule px-3 py-2">
      <p class="label">{{ t('assistant.drafts', { n: drafts.length }) }}</p>
      <button
        v-if="dismissible"
        type="button"
        class="text-ink-faint hover:text-ink"
        :aria-label="t('common.dismiss')"
        @click="emit('dismiss')"
      >
        <X class="size-4" />
      </button>
    </div>
    <ul>
      <li
        v-for="(draft, index) in drafts"
        :key="index"
        class="flex items-start gap-3 border-b border-rule px-3 py-2.5 last:border-b-0"
        :class="added.has(index) && 'opacity-50'"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm leading-snug" :class="added.has(index) && 'line-through'">
            {{ draft.title }}
          </p>
          <p class="mt-1 flex flex-wrap gap-x-2 font-mono text-3xs text-ink-faint uppercase">
            <span>{{ dateLabel(draft) }}</span>
            <span v-if="draft.startMinutes !== null">{{ format.clock(draft.startMinutes) }}</span>
            <span v-if="draft.durationMinutes">{{ format.duration(draft.durationMinutes) }}</span>
            <span v-if="draft.projectId && projects.get(draft.projectId)">{{
              projects.get(draft.projectId)?.code
            }}</span>
            <span
              v-if="draft.priority !== 'NORMAL'"
              :class="draft.priority === 'HIGH' && 'text-brand'"
            >
              {{ t(`priority.${draft.priority}`) }}
            </span>
          </p>
          <p v-if="draft.notes" class="mt-1 text-xs text-ink-faint">{{ draft.notes }}</p>
        </div>
        <button
          type="button"
          class="flex size-7 shrink-0 items-center justify-center border border-rule transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none"
          :disabled="added.has(index)"
          :aria-label="t('tasks.add')"
          @click="addOne(index)"
        >
          <Check v-if="added.has(index)" class="size-3.5" />
          <Plus v-else class="size-3.5" />
        </button>
      </li>
    </ul>
    <div v-if="remaining.length > 1" class="border-t border-rule p-2">
      <Button
        size="sm"
        class="w-full"
        :disabled="actions.createMany.isPending.value"
        @click="addAll"
      >
        <LoaderCircle v-if="actions.createMany.isPending.value" class="animate-spin" />
        {{ t('assistant.addAll', { n: remaining.length }) }}
      </Button>
    </div>
  </div>
</template>
