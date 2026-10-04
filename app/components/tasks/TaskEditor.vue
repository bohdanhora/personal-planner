<script setup lang="ts">
import { LoaderCircle, Sparkles, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'

import CaretTitle from '~/components/common/CaretTitle.vue'
import Field from '~/components/common/Field.vue'
import Segmented from '~/components/common/Segmented.vue'
import DatePicker from '~/components/tasks/DatePicker.vue'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { addDays, clockToMinutes, minutesToClock } from '~/lib/dates'
import type { TaskDraft, TaskPriority } from '~/lib/types'

const NO_PROJECT = 'none'
const DURATIONS = [15, 30, 45, 60, 90, 120] as const

const { t } = useI18n()
const ui = useUiStore()
const today = useToday()
const format = useFormat()
const errorMessage = useErrorMessage()
const actions = useTaskActions()
const assistant = useAssistant()
const assistantEnabled = useAssistantEnabled()
const { data: projects } = useProjects()

const form = reactive({
  title: '',
  notes: '',
  date: null as string | null,
  time: '',
  duration: null as number | null,
  priority: 'NORMAL' as TaskPriority,
  projectId: NO_PROJECT,
})

const titleError = ref<string | null>(null)
const isEditing = computed(() => ui.editorTask !== null)
const saving = computed(() => actions.create.isPending.value || actions.update.isPending.value)

watch(
  () => ui.editorOpen,
  (open) => {
    if (!open) {
      return
    }

    const source = ui.editorTask ?? ui.editorDefaults
    form.title = source.title ?? ''
    form.notes = source.notes ?? ''
    form.date = ui.editorTask
      ? ui.editorTask.date
      : source.date === undefined
        ? today.value
        : source.date
    form.time = source.startMinutes != null ? minutesToClock(source.startMinutes) : ''
    form.duration = source.durationMinutes ?? null
    form.priority = source.priority ?? 'NORMAL'
    form.projectId = source.projectId ?? NO_PROJECT
    titleError.value = null
  },
)

const durationOptions = computed(() => [
  { value: null, label: t('tasks.durationNone') },
  ...DURATIONS.map((value) => ({ value, label: format.duration(value).replace(/\s/g, '') })),
])

const priorityOptions = computed(() =>
  (['LOW', 'NORMAL', 'HIGH'] as const).map((value) => ({ value, label: t(`priority.${value}`) })),
)

const quickDates = computed(() => [
  { label: t('tasks.today'), value: today.value },
  { label: t('tasks.tomorrow'), value: addDays(today.value, 1) },
  { label: t('nav.inbox'), value: null },
])

const applyDraft = (draft: TaskDraft) => {
  form.title = draft.title
  form.notes = draft.notes ?? form.notes
  form.duration = draft.durationMinutes ?? form.duration
  form.priority = draft.priority
  form.projectId = draft.projectId ?? form.projectId

  if (draft.date && !isEditing.value) {
    form.date = draft.date
  }

  if (draft.startMinutes !== null && !form.time) {
    form.time = minutesToClock(draft.startMinutes)
  }
}

const polish = async () => {
  if (!form.title.trim()) {
    titleError.value = t('tasks.titleRequired')
    return
  }

  try {
    const { draft } = await assistant.suggest.mutateAsync({
      title: form.title,
      notes: form.notes || null,
      date: form.date ?? undefined,
    })
    applyDraft(draft)
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const save = async () => {
  if (!form.title.trim()) {
    titleError.value = t('tasks.titleRequired')
    return
  }

  const payload = {
    title: form.title.trim(),
    notes: form.notes.trim() || null,
    date: form.date,
    startMinutes: form.time ? clockToMinutes(form.time) : null,
    durationMinutes: form.duration,
    priority: form.priority,
    projectId: form.projectId === NO_PROJECT ? null : form.projectId,
  }

  try {
    if (ui.editorTask) {
      await actions.update.mutateAsync({ id: ui.editorTask.id, patch: payload })
    } else {
      await actions.create.mutateAsync(payload)
    }
    ui.editorOpen = false
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const remove = async () => {
  if (!ui.editorTask) {
    return
  }

  await actions.remove.mutateAsync(ui.editorTask.id).catch((error: unknown) => {
    toast.error(errorMessage(error))
  })
  ui.editorOpen = false
}
</script>

<template>
  <Dialog v-model:open="ui.editorOpen">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <p class="label">{{ isEditing ? t('tasks.editLabel') : t('tasks.newLabel') }}</p>
        <DialogTitle class="display text-xl">
          <CaretTitle :text="isEditing ? t('tasks.editTitle') : t('tasks.newTitle')" />
        </DialogTitle>
        <DialogDescription class="sr-only">{{ t('tasks.editorHint') }}</DialogDescription>
      </DialogHeader>

      <form class="grid gap-5" @submit.prevent="save">
        <Field :label="t('tasks.title')" for="task-title" :error="titleError">
          <template v-if="assistantEnabled" #aside>
            <button
              type="button"
              class="-my-1 flex items-center gap-1.5 px-1.5 py-1 font-mono text-2xs tracking-wider text-brand uppercase transition-colors hover:bg-brand hover:text-on-brand disabled:opacity-50"
              :disabled="assistant.suggest.isPending.value"
              @click="polish"
            >
              <LoaderCircle
                v-if="assistant.suggest.isPending.value"
                class="size-3.5 animate-spin"
              />
              <Sparkles v-else class="size-3.5" />
              {{ t('tasks.polish') }}
            </button>
          </template>
          <Input
            id="task-title"
            v-model="form.title"
            :placeholder="t('tasks.titlePlaceholder')"
            :aria-invalid="titleError ? true : undefined"
            maxlength="200"
            autocomplete="off"
            @input="titleError = null"
          />
        </Field>

        <Field :label="t('tasks.notes')" for="task-notes">
          <Textarea
            id="task-notes"
            v-model="form.notes"
            :placeholder="t('tasks.notesPlaceholder')"
            maxlength="2000"
            rows="2"
          />
        </Field>

        <div class="grid gap-5 sm:grid-cols-2">
          <Field :label="t('tasks.date')">
            <DatePicker v-model="form.date" />
            <div class="flex gap-1">
              <button
                v-for="item in quickDates"
                :key="item.label"
                type="button"
                class="border border-rule px-2 py-1 font-mono text-3xs tracking-wider text-ink-faint uppercase transition-colors hover:border-rule-strong hover:text-ink aria-pressed:border-ink aria-pressed:text-ink"
                :aria-pressed="form.date === item.value"
                @click="form.date = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </Field>
          <Field :label="t('tasks.start')" for="task-time" :hint="t('tasks.startHint')">
            <Input id="task-time" v-model="form.time" type="time" step="300" class="font-mono" />
          </Field>
        </div>

        <Field :label="t('tasks.duration')">
          <Segmented
            v-model="form.duration"
            :options="durationOptions"
            :label="t('tasks.duration')"
            stretch
          />
        </Field>

        <div class="grid gap-5 sm:grid-cols-2">
          <Field :label="t('tasks.priority')">
            <Segmented
              v-model="form.priority"
              :options="priorityOptions"
              :label="t('tasks.priority')"
              stretch
            />
          </Field>
          <Field :label="t('tasks.project')">
            <Select v-model="form.projectId">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="NO_PROJECT">{{ t('tasks.noProject') }}</SelectItem>
                <SelectItem v-for="project in projects" :key="project.id" :value="project.id">
                  <span class="w-12 border border-rule px-1 text-center font-mono text-3xs">{{
                    project.code
                  }}</span>
                  {{ project.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter
          class="-mx-5 mt-1 flex-row items-center gap-2 border-t border-rule px-5 pt-4 sm:-mx-6 sm:px-6"
        >
          <Button
            v-if="isEditing"
            type="button"
            variant="ghost"
            size="icon"
            class="mr-auto hover:bg-danger hover:text-white"
            :aria-label="t('common.delete')"
            @click="remove"
          >
            <Trash2 />
          </Button>
          <Button type="button" variant="outline" class="ml-auto" @click="ui.editorOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="animate-spin" />
            {{ isEditing ? t('common.save') : t('tasks.add') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
