<script setup lang="ts">
import { parseDate, type DateValue } from '@internationalized/date'
import { CalendarDays } from '@lucide/vue'

import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

const model = defineModel<string | null>({ required: true })

const { t, locale } = useI18n()
const format = useFormat()
const open = ref(false)

const calendarValue = computed({
  get: () => (model.value ? parseDate(model.value) : undefined),
  set: (value: DateValue | undefined) => {
    model.value = value ? value.toString() : null
    open.value = false
  },
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="flex h-10 w-full items-center gap-2 border border-rule bg-surface px-3 text-left transition-colors hover:border-ink-faint"
      >
        <CalendarDays class="size-4 text-ink-faint" />
        <span class="flex-1 truncate" :class="!model && 'text-ink-faint'">
          {{
            model
              ? format.day(model, { weekday: 'short', day: 'numeric', month: 'long' })
              : t('tasks.noDate')
          }}
        </span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-2" align="start">
      <Calendar
        v-model="calendarValue"
        :locale="locale"
        :week-starts-on="1"
        weekday-format="short"
      />
    </PopoverContent>
  </Popover>
</template>
