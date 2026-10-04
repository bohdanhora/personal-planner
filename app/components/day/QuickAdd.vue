<script setup lang="ts">
import { CornerDownLeft, LoaderCircle, Plus, Sparkles } from '@lucide/vue'
import { toast } from 'vue-sonner'

import DraftList from '~/components/assistant/DraftList.vue'
import type { TaskDraft } from '~/lib/types'

const props = withDefaults(
  defineProps<{ date: string | null; projectId?: string | null; placeholder?: string }>(),
  {
    projectId: null,
    placeholder: undefined,
  },
)

const { t } = useI18n()
const actions = useTaskActions()
const assistant = useAssistant()
const assistantEnabled = useAssistantEnabled()
const errorMessage = useErrorMessage()
const today = useToday()

const text = ref('')
const drafts = ref<TaskDraft[] | null>(null)
const input = ref<HTMLInputElement | null>(null)

const add = async () => {
  const title = text.value.trim()
  if (!title) {
    return
  }

  try {
    await actions.create.mutateAsync({ title, date: props.date, projectId: props.projectId })
    text.value = ''
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const ask = async () => {
  const note = text.value.trim()
  if (!note) {
    input.value?.focus()
    return
  }

  try {
    const result = await assistant.parse.mutateAsync({
      text: note,
      date: props.date ?? today.value,
    })
    drafts.value = result.drafts.map((draft) => ({
      ...draft,
      projectId: draft.projectId ?? props.projectId,
    }))
    if (result.drafts.length === 0) {
      toast(t('assistant.noDrafts'))
    } else {
      text.value = ''
    }
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && assistantEnabled.value) {
    event.preventDefault()
    void ask()
  }
}
</script>

<template>
  <div class="space-y-3" data-tour="quick-add">
    <form
      class="flex items-center border border-rule bg-surface transition-colors focus-within:border-rule-strong"
      @submit.prevent="add"
    >
      <Plus class="ml-3 size-4 shrink-0 text-ink-faint" />
      <input
        ref="input"
        v-model="text"
        type="text"
        class="h-12 min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-ink-faint"
        :placeholder="placeholder ?? t('quickAdd.placeholder')"
        :aria-label="placeholder ?? t('quickAdd.placeholder')"
        maxlength="2000"
        enterkeyhint="done"
        @keydown="onKeydown"
      />
      <button
        v-if="text.trim()"
        type="submit"
        class="hidden h-12 items-center gap-2 px-3 font-mono text-3xs tracking-wider text-ink-faint uppercase transition-colors hover:bg-ink hover:text-paper sm:flex"
      >
        <CornerDownLeft class="size-3.5" />
        {{ t('quickAdd.add') }}
      </button>
      <button
        v-if="assistantEnabled"
        type="button"
        class="flex h-12 items-center gap-2 border-l border-rule px-3 font-mono text-2xs tracking-wider text-brand uppercase transition-colors hover:bg-brand hover:text-on-brand disabled:opacity-50 sm:px-4"
        :disabled="assistant.parse.isPending.value"
        :title="t('quickAdd.assistantHint')"
        @click="ask"
      >
        <LoaderCircle v-if="assistant.parse.isPending.value" class="size-4 animate-spin" />
        <Sparkles v-else class="size-4" />
        <span class="hidden sm:inline">{{ t('quickAdd.assistant') }}</span>
      </button>
    </form>
    <p class="hidden font-mono text-3xs tracking-wider text-ink-faint uppercase sm:block">
      {{ assistantEnabled ? t('quickAdd.hintAssistant') : t('quickAdd.hint') }}
    </p>
    <DraftList
      v-if="drafts?.length"
      :drafts="drafts"
      dismissible
      class="animate-rise"
      @done="drafts = null"
      @dismiss="drafts = null"
    />
  </div>
</template>
