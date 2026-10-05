<script setup lang="ts">
import {
  ArrowUp,
  CalendarClock,
  Eraser,
  Lightbulb,
  LoaderCircle,
  Mic,
  PanelRightClose,
  Settings2,
  Square,
} from '@lucide/vue'
import { toast } from 'vue-sonner'

import DraftList from '~/components/assistant/DraftList.vue'
import PlanPreview from '~/components/assistant/PlanPreview.vue'
import CaretTitle from '~/components/common/CaretTitle.vue'
import { Button } from '~/components/ui/button'
import type { Plan, Tip } from '~/lib/types'

withDefaults(defineProps<{ closable?: boolean }>(), { closable: false })
defineEmits<{ close: [] }>()

const { t } = useI18n()
const ui = useUiStore()
const today = useToday()
const format = useFormat()
const errorMessage = useErrorMessage()
const assistant = useAssistant()
const enabled = useAssistantEnabled()

const date = computed(() => ui.focusDate ?? today.value)
const dateLabel = computed(() =>
  date.value === today.value
    ? t('tasks.today')
    : format.day(date.value, { weekday: 'short', day: 'numeric', month: 'short' }),
)

const plan = ref<Plan | null>(null)
const tips = ref<Tip[] | null>(null)
const message = ref('')
const thread = ref<HTMLElement | null>(null)
const speech = useSpeech(message)

watch(speech.error, (code) => {
  if (code) toast.error(t(code === 'not-allowed' ? 'voice.denied' : 'voice.failed'))
})

const scrollToEnd = () =>
  nextTick(() => thread.value?.scrollTo({ top: thread.value.scrollHeight, behavior: 'smooth' }))

const requestPlan = async () => {
  tips.value = null
  try {
    plan.value = await assistant.plan.mutateAsync(date.value)
    if (plan.value.items.length === 0 && plan.value.unscheduled.length === 0) {
      toast(t('assistant.nothingToPlan'))
      plan.value = null
    }
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const requestTips = async () => {
  plan.value = null
  try {
    tips.value = (await assistant.tips.mutateAsync(date.value)).tips
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const send = async () => {
  speech.stop()
  const content = message.value.trim()
  if (!content || assistant.chat.isPending.value) {
    return
  }

  ui.chat.push({ role: 'user', content })
  message.value = ''
  scrollToEnd()

  try {
    const reply = await assistant.chat.mutateAsync({
      date: date.value,
      messages: ui.chat.slice(-20),
    })
    ui.chat.push({ role: 'assistant', content: reply.reply, drafts: reply.drafts })
  } catch (error) {
    ui.chat.pop()
    message.value = content
    toast.error(errorMessage(error))
  }

  scrollToEnd()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void send()
  }
}

const suggestions = computed(() => [
  t('assistant.prompt1'),
  t('assistant.prompt2'),
  t('assistant.prompt3'),
])

watch(date, () => {
  plan.value = null
  tips.value = null
})
</script>

<template>
  <section class="flex h-full min-h-0 flex-col bg-paper">
    <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-rule px-4">
      <div class="min-w-0">
        <p class="display text-sm leading-none"><CaretTitle :text="t('assistant.title')" /></p>
        <p class="label mt-1 truncate">{{ t('assistant.context', { day: dateLabel }) }}</p>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="ui.chat.length"
          type="button"
          class="flex size-8 items-center justify-center text-ink-faint transition-colors hover:bg-ink hover:text-paper"
          :title="t('assistant.clear')"
          @click="ui.chat = []"
        >
          <Eraser class="size-4" />
        </button>
        <button
          v-if="closable"
          type="button"
          class="flex size-8 items-center justify-center text-ink-faint transition-colors hover:bg-ink hover:text-paper"
          :title="t('assistant.hide')"
          @click="$emit('close')"
        >
          <PanelRightClose class="size-4" />
        </button>
      </div>
    </header>

    <div v-if="!enabled" class="p-4">
      <div class="border border-rule p-4">
        <p class="label">{{ t('assistant.offLabel') }}</p>
        <p class="mt-2 text-sm">{{ t('assistant.offTitle') }}</p>
        <p class="mt-1 text-xs text-ink-faint">{{ t('assistant.offHint') }}</p>
        <Button as-child size="sm" variant="brand" class="mt-4">
          <NuxtLink to="/settings#assistant" @click="ui.assistantSheetOpen = false">
            <Settings2 />
            {{ t('assistant.offAction') }}
          </NuxtLink>
        </Button>
      </div>
    </div>

    <template v-else>
      <div class="grid shrink-0 grid-cols-2 border-b border-rule">
        <button
          type="button"
          class="group flex items-center gap-2 border-r border-rule px-4 py-3 text-left transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
          :disabled="assistant.plan.isPending.value"
          @click="requestPlan"
        >
          <LoaderCircle v-if="assistant.plan.isPending.value" class="size-4 animate-spin" />
          <CalendarClock v-else class="size-4 text-brand group-hover:text-current" />
          <span class="font-mono text-2xs tracking-wider uppercase">{{ t('assistant.plan') }}</span>
        </button>
        <button
          type="button"
          class="group flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
          :disabled="assistant.tips.isPending.value"
          @click="requestTips"
        >
          <LoaderCircle v-if="assistant.tips.isPending.value" class="size-4 animate-spin" />
          <Lightbulb v-else class="size-4 text-brand group-hover:text-current" />
          <span class="font-mono text-2xs tracking-wider uppercase">{{ t('assistant.tips') }}</span>
        </button>
      </div>

      <div ref="thread" class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <PlanPreview v-if="plan" :plan="plan" @close="plan = null" />

        <div v-if="tips" class="border border-rule-strong">
          <div class="flex items-center justify-between border-b border-rule px-3 py-2">
            <p class="label">{{ t('assistant.tipsFor', { day: dateLabel }) }}</p>
            <button type="button" class="label hover:text-ink" @click="tips = null">
              {{ t('common.dismiss') }}
            </button>
          </div>
          <ol>
            <li
              v-for="(tip, index) in tips"
              :key="index"
              class="flex gap-3 border-b border-rule p-3 last:border-b-0"
            >
              <span class="font-mono text-2xs text-brand">{{
                String(index + 1).padStart(2, '0')
              }}</span>
              <div>
                <p class="text-sm font-medium">{{ tip.title }}</p>
                <p class="mt-0.5 text-sm text-ink-muted">{{ tip.body }}</p>
              </div>
            </li>
          </ol>
        </div>

        <div v-if="ui.chat.length === 0 && !plan && !tips" class="space-y-3 pt-2">
          <p class="text-sm text-ink-muted">{{ t('assistant.intro') }}</p>
          <div class="space-y-2">
            <button
              v-for="prompt in suggestions"
              :key="prompt"
              type="button"
              class="block w-full border border-rule px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:border-rule-strong hover:text-ink"
              @click="message = prompt"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <div v-for="(entry, index) in ui.chat" :key="index" class="animate-rise">
          <div v-if="entry.role === 'user'" class="flex justify-end">
            <p class="max-w-5/6 bg-ink px-3 py-2 text-sm whitespace-pre-wrap text-paper">
              {{ entry.content }}
            </p>
          </div>
          <div v-else class="space-y-3">
            <p class="label flex items-center gap-2">
              <span class="marker" />{{ t('assistant.title') }}
            </p>
            <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ entry.content }}</p>
            <DraftList v-if="entry.drafts?.length" :drafts="entry.drafts" />
          </div>
        </div>

        <p v-if="assistant.chat.isPending.value" class="label flex items-center gap-2">
          <span class="marker animate-blink" />{{ t('assistant.thinking') }}
        </p>
      </div>

      <form class="shrink-0 border-t border-rule p-3" @submit.prevent="send">
        <div
          class="flex items-end gap-2 border border-rule bg-surface p-1.5 transition-colors focus-within:border-rule-strong"
        >
          <textarea
            v-model="message"
            rows="1"
            class="field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink-faint"
            :placeholder="
              speech.listening.value ? t('voice.listening') : t('assistant.placeholder')
            "
            :aria-label="t('assistant.placeholder')"
            maxlength="4000"
            @keydown="onKeydown"
          />
          <Button
            v-if="speech.supported"
            type="button"
            size="icon-sm"
            :variant="speech.listening.value ? 'brand' : 'ghost'"
            :aria-label="speech.listening.value ? t('voice.stop') : t('voice.start')"
            :aria-pressed="speech.listening.value"
            :title="speech.listening.value ? t('voice.stop') : t('voice.start')"
            @click="speech.toggle"
          >
            <Square v-if="speech.listening.value" class="size-3 animate-blink fill-current" />
            <Mic v-else />
          </Button>
          <Button
            type="submit"
            size="icon-sm"
            :disabled="!message.trim() || assistant.chat.isPending.value"
            :aria-label="t('assistant.send')"
          >
            <ArrowUp />
          </Button>
        </div>
      </form>
    </template>
  </section>
</template>
