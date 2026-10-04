<script setup lang="ts">
import type { DailyPoint } from '~/lib/types'

const props = defineProps<{ points: DailyPoint[] }>()

const { t } = useI18n()
const format = useFormat()
const showTable = ref(false)
const active = ref<number | null>(null)

const max = computed(() => {
  const peak = Math.max(1, ...props.points.map((point) => Math.max(point.planned, point.completed)))
  const step = peak <= 4 ? 1 : peak <= 10 ? 2 : 5
  return Math.ceil(peak / step) * step
})

const ticks = computed(() => [max.value, Math.round(max.value / 2), 0])
const dense = computed(() => props.points.length > 31)
const height = (value: number) => `${(value / max.value) * 100}%`

const labelEvery = computed(() =>
  props.points.length <= 7 ? 1 : props.points.length <= 31 ? 5 : 15,
)
const activePoint = computed(() => (active.value === null ? null : props.points[active.value]))
const tooltipShift = computed(() => {
  const ratio = active.value === null ? 0.5 : (active.value + 0.5) / props.points.length
  return ratio < 0.2
    ? 'translate-x-2'
    : ratio > 0.8
      ? '-translate-x-full -ml-2'
      : '-translate-x-1/2'
})
const tooltipLeft = computed(() =>
  active.value === null ? '0%' : `${((active.value + 0.5) / props.points.length) * 100}%`,
)
</script>

<template>
  <figure>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-4" role="list" :aria-label="t('insights.legend')">
        <span role="listitem" class="label flex items-center gap-2">
          <span class="size-2.5 bg-brand" />{{ t('insights.completed') }}
        </span>
        <span role="listitem" class="label flex items-center gap-2">
          <span class="size-2.5 border border-ink-muted" />{{ t('insights.planned') }}
        </span>
      </div>
      <button
        type="button"
        class="label underline-offset-4 hover:text-ink hover:underline"
        :aria-pressed="showTable"
        @click="showTable = !showTable"
      >
        {{ showTable ? t('insights.showChart') : t('insights.showTable') }}
      </button>
    </div>

    <div v-if="!showTable" class="mt-5 flex gap-3">
      <div class="flex h-56 flex-col justify-between py-0 text-right" aria-hidden="true">
        <span v-for="tick in ticks" :key="tick" class="label numeric -my-1.5">{{ tick }}</span>
      </div>

      <div class="relative flex-1">
        <div class="pointer-events-none absolute inset-x-0 top-0 h-56" aria-hidden="true">
          <div
            v-for="(tick, index) in ticks"
            :key="tick"
            class="absolute inset-x-0 border-t border-rule"
            :class="index === ticks.length - 1 && 'border-rule-strong'"
            :style="{ top: `${(index / (ticks.length - 1)) * 100}%` }"
          />
        </div>

        <div
          class="relative flex h-56 items-end"
          :class="dense ? 'gap-px' : 'gap-0.5 sm:gap-1'"
          role="img"
          :aria-label="t('insights.dailyAria')"
          @pointerleave="active = null"
        >
          <div
            v-for="(point, index) in points"
            :key="point.date"
            class="relative flex h-full flex-1 cursor-default items-end justify-center outline-none"
            tabindex="0"
            :aria-label="`${format.day(point.date, { day: 'numeric', month: 'long' })}: ${t('insights.completed')} ${point.completed}, ${t('insights.planned')} ${point.planned}`"
            @pointerenter="active = index"
            @focus="active = index"
            @blur="active = null"
          >
            <div class="relative flex h-full w-full max-w-8 items-end">
              <div
                v-if="point.planned"
                class="absolute inset-x-0 bottom-0 border border-ink-muted"
                :style="{ height: height(point.planned) }"
              />
              <div
                class="relative w-full bg-brand transition-opacity"
                :class="active !== null && active !== index && 'opacity-50'"
                :style="{ height: height(point.completed) }"
              />
            </div>
          </div>

          <div
            v-if="activePoint"
            class="pointer-events-none absolute top-0 z-10 w-40 border border-rule-strong bg-surface px-3 py-2"
            :class="tooltipShift"
            :style="{ left: tooltipLeft }"
          >
            <p class="label">
              {{
                format.day(activePoint.date, { weekday: 'short', day: 'numeric', month: 'short' })
              }}
            </p>
            <p class="mt-1.5 flex items-center justify-between text-sm">
              <span class="flex items-center gap-2"
                ><span class="h-0.5 w-3 bg-brand" />{{ t('insights.completed') }}</span
              >
              <span class="numeric font-mono font-medium">{{ activePoint.completed }}</span>
            </p>
            <p class="flex items-center justify-between text-sm text-ink-muted">
              <span class="flex items-center gap-2"
                ><span class="h-0.5 w-3 bg-ink-muted" />{{ t('insights.planned') }}</span
              >
              <span class="numeric font-mono">{{ activePoint.planned }}</span>
            </p>
            <p
              v-if="activePoint.focusMinutes"
              class="mt-1 font-mono text-3xs text-ink-faint uppercase"
            >
              {{ format.duration(activePoint.focusMinutes) }}
            </p>
          </div>
        </div>

        <div class="mt-2 flex" aria-hidden="true">
          <span
            v-for="(point, index) in points"
            :key="point.date"
            class="label numeric flex-1 overflow-visible text-center whitespace-nowrap"
          >
            {{
              index % labelEvery === 0
                ? points.length <= 7
                  ? format.day(point.date, { weekday: 'short' })
                  : format.day(point.date, { day: 'numeric', month: 'numeric' })
                : ''
            }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="mt-5 max-h-72 overflow-y-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-background">
          <tr class="border-b border-rule-strong">
            <th class="label py-2 text-left font-normal">{{ t('insights.date') }}</th>
            <th class="label py-2 text-right font-normal">{{ t('insights.planned') }}</th>
            <th class="label py-2 text-right font-normal">{{ t('insights.completed') }}</th>
            <th class="label py-2 text-right font-normal">{{ t('insights.focus') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="point in [...points].reverse()" :key="point.date" class="border-b border-rule">
            <td class="py-1.5">
              {{ format.day(point.date, { weekday: 'short', day: 'numeric', month: 'short' }) }}
            </td>
            <td class="numeric py-1.5 text-right font-mono">{{ point.planned }}</td>
            <td class="numeric py-1.5 text-right font-mono">{{ point.completed }}</td>
            <td class="numeric py-1.5 text-right font-mono text-ink-muted">
              {{ format.duration(point.focusMinutes) || '0' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>
