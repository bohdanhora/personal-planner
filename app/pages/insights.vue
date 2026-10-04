<script setup lang="ts">
import CaretTitle from '~/components/common/CaretTitle.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import Segmented from '~/components/common/Segmented.vue'
import DailyChart from '~/components/insights/DailyChart.vue'
import ProjectBreakdown from '~/components/insights/ProjectBreakdown.vue'
import WeekdayChart from '~/components/insights/WeekdayChart.vue'

const { t } = useI18n()
const format = useFormat()

useHead({ title: () => `${t('nav.insights')} · Personal Planner` })

const days = ref<7 | 30 | 90>(30)
const { data, isPending, isFetching } = useInsights(days)

const rangeOptions = computed(() =>
  ([7, 30, 90] as const).map((value) => ({ value, label: t('insights.days', { n: value }) })),
)

const hours = computed(() => Math.round(((data.value?.focusMinutes ?? 0) / 60) * 10) / 10)

const tiles = computed(() =>
  data.value
    ? [
        {
          key: 'completed',
          label: t('insights.completed'),
          value: format.number(data.value.completed),
          note: t('insights.ofPlanned', { n: data.value.planned }),
        },
        {
          key: 'rate',
          label: t('insights.rate'),
          value: `${data.value.completionRate}%`,
          note: t('insights.rateNote'),
        },
        {
          key: 'focus',
          label: t('insights.focus'),
          value: t('units.hoursShort', { n: format.number(hours.value) }),
          note: t('insights.focusNote'),
        },
        {
          key: 'streak',
          label: t('insights.streak'),
          value: String(data.value.currentStreak),
          note: t('insights.best', { n: data.value.bestStreak }),
        },
      ]
    : [],
)

const hasHistory = computed(
  () => (data.value?.completed ?? 0) > 0 || (data.value?.planned ?? 0) > 0,
)
</script>

<template>
  <div>
    <header class="border-b border-rule px-4 pt-5 pb-5 sm:px-6 lg:px-8 lg:pt-8">
      <p class="label numeric">
        <template v-if="data"
          >{{ format.day(data.from, { day: '2-digit', month: 'short' }) }} /
          {{ format.day(data.to, { day: '2-digit', month: 'short' }) }}</template
        >
        <template v-else>{{ t('insights.label') }}</template>
      </p>
      <h1 class="display mt-3 text-metric"><CaretTitle :text="t('nav.insights')" /></h1>
      <div class="mt-5">
        <Segmented v-model="days" :options="rangeOptions" :label="t('insights.range')" size="sm" />
      </div>
    </header>

    <div v-if="isPending" class="grid grid-cols-2 lg:grid-cols-4">
      <div
        v-for="index in 4"
        :key="index"
        class="h-28 animate-pulse border-r border-b border-rule"
      />
    </div>

    <div v-else-if="data" class="transition-opacity" :class="isFetching && 'opacity-60'">
      <dl class="grid grid-cols-2 border-b border-rule lg:grid-cols-4">
        <div
          v-for="(tile, index) in tiles"
          :key="tile.key"
          class="border-rule px-4 py-5 sm:px-6 lg:px-8"
          :class="[
            index % 2 === 0 && 'border-r',
            index < 2 && 'border-b lg:border-b-0',
            index === 1 && 'lg:border-r',
            index === 2 && 'lg:border-r',
          ]"
        >
          <dt class="label">{{ tile.label }}</dt>
          <dd
            class="display numeric mt-3 text-3xl"
            :class="tile.key === 'streak' && data.currentStreak > 0 && 'text-brand'"
          >
            {{ tile.value }}
          </dd>
          <dd class="mt-1 text-xs text-ink-faint">{{ tile.note }}</dd>
        </div>
      </dl>

      <div class="space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          v-if="!hasHistory"
          code="ST-00"
          :title="t('insights.emptyTitle')"
          :text="t('insights.emptyText')"
        />

        <template v-else>
          <section>
            <div class="mb-5 flex items-baseline justify-between border-b border-rule-strong pb-2">
              <h2 class="label">{{ t('insights.daily') }}</h2>
              <span class="label">{{ t('insights.days', { n: days }) }}</span>
            </div>
            <DailyChart :points="data.daily" />
          </section>

          <div class="grid gap-10 xl:grid-cols-2">
            <section>
              <div
                class="mb-5 flex items-baseline justify-between border-b border-rule-strong pb-2"
              >
                <h2 class="label">{{ t('insights.byWeekday') }}</h2>
                <span class="label">{{ t('insights.average') }}</span>
              </div>
              <WeekdayChart :values="data.byWeekday" />
            </section>

            <section>
              <div
                class="mb-5 flex items-baseline justify-between border-b border-rule-strong pb-2"
              >
                <h2 class="label">{{ t('insights.byProject') }}</h2>
                <span class="label">{{ t('insights.doneVsOpen') }}</span>
              </div>
              <ProjectBreakdown :rows="data.byProject" />
            </section>
          </div>

          <dl class="grid grid-cols-2 border border-rule">
            <div class="border-r border-rule p-4">
              <dt class="label">{{ t('insights.overdue') }}</dt>
              <dd class="numeric mt-2 font-mono text-xl" :class="data.overdue > 0 && 'text-danger'">
                {{ data.overdue }}
              </dd>
            </div>
            <div class="p-4">
              <dt class="label">{{ t('nav.inbox') }}</dt>
              <dd class="numeric mt-2 font-mono text-xl">{{ data.inbox }}</dd>
            </div>
          </dl>
        </template>
      </div>
    </div>
  </div>
</template>
