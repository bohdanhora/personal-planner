<script setup lang="ts">
import { addDays } from '~/lib/dates'

const props = defineProps<{ values: number[] }>()

const MONDAY = '2026-01-05'

const { t } = useI18n()
const format = useFormat()
const active = ref<number | null>(null)

const max = computed(() => Math.max(1, ...props.values))
const best = computed(() => props.values.indexOf(Math.max(...props.values)))
const labels = computed(() =>
  props.values.map((_, index) => format.day(addDays(MONDAY, index), { weekday: 'short' })),
)
</script>

<template>
  <figure>
    <div class="flex h-40 items-end gap-2" role="img" :aria-label="t('insights.weekdayAria')">
      <div
        v-for="(value, index) in values"
        :key="index"
        class="flex h-full flex-1 flex-col items-center justify-end gap-1.5 outline-none"
        tabindex="0"
        :aria-label="`${labels[index]}: ${value}`"
        @pointerenter="active = index"
        @pointerleave="active = null"
        @focus="active = index"
        @blur="active = null"
      >
        <span
          class="numeric font-mono text-2xs transition-colors"
          :class="active === index || index === best ? 'text-ink' : 'text-ink-faint'"
        >
          {{ value }}
        </span>
        <div
          class="w-full max-w-10 transition-colors"
          :class="index === best || active === index ? 'bg-brand' : 'bg-ink-muted'"
          :style="{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? '2px' : '0' }"
        />
      </div>
    </div>
    <div class="mt-0 flex gap-2 border-t border-rule-strong pt-2" aria-hidden="true">
      <span
        v-for="(label, index) in labels"
        :key="index"
        class="label flex-1 text-center"
        :class="index === best && 'text-brand'"
      >
        {{ label }}
      </span>
    </div>
  </figure>
</template>
