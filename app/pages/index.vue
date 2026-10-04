<script setup lang="ts">
import { ChevronDown, History, LoaderCircle } from '@lucide/vue'
import { toast } from 'vue-sonner'

import EmptyState from '~/components/common/EmptyState.vue'
import ListSkeleton from '~/components/common/ListSkeleton.vue'
import Segmented from '~/components/common/Segmented.vue'
import DayHeader from '~/components/day/DayHeader.vue'
import DaySchedule from '~/components/day/DaySchedule.vue'
import QuickAdd from '~/components/day/QuickAdd.vue'
import WeekStrip from '~/components/day/WeekStrip.vue'
import TaskList from '~/components/tasks/TaskList.vue'
import { isDay } from '~/lib/dates'
import type { Task } from '~/lib/types'
import type { AreaFilter } from '~/stores/ui'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const today = useToday()
const format = useFormat()
const projects = useProjectMap()
const actions = useTaskActions()
const errorMessage = useErrorMessage()

const date = computed(() => (isDay(route.query.date) ? route.query.date : today.value))
const view = ref<'list' | 'schedule'>('list')
const showDone = ref(true)

watch(date, (value) => (ui.focusDate = value), { immediate: true })
onBeforeUnmount(() => (ui.focusDate = null))

useHead({
  title: () => `${format.day(date.value, { day: 'numeric', month: 'long' })} · Personal Planner`,
})

const { data: tasks, isPending } = useDayTasks(date)
const { data: overdue } = useOverdueTasks()

const changeDate = (value: string) =>
  router.replace({ query: value === today.value ? {} : { date: value } })

const matchesArea = (task: Task) => {
  if (ui.areaFilter === 'ALL') return true
  const project = task.projectId ? projects.value.get(task.projectId) : undefined
  return project?.area === ui.areaFilter
}

const openFilter = (task: Task) => task.status === 'OPEN' && matchesArea(task)
const doneFilter = (task: Task) => task.status === 'DONE' && matchesArea(task)

const all = computed(() => tasks.value ?? [])
const openCount = computed(() => all.value.filter(openFilter).length)
const doneCount = computed(() => all.value.filter(doneFilter).length)
const overdueCount = computed(() => (date.value === today.value ? (overdue.value?.length ?? 0) : 0))

const areaOptions = computed<{ value: AreaFilter; label: string }[]>(() => [
  { value: 'ALL', label: t('areas.ALL') },
  { value: 'WORK', label: t('areas.WORK') },
  { value: 'PERSONAL', label: t('areas.PERSONAL') },
])

const viewOptions = computed(() => [
  { value: 'list' as const, label: t('day.list') },
  { value: 'schedule' as const, label: t('day.schedule') },
])

const carryOver = async () => {
  try {
    const { moved } = await actions.carryOver.mutateAsync(today.value)
    toast.success(t('day.carried', { n: moved }))
  } catch (error) {
    toast.error(errorMessage(error))
  }
}
</script>

<template>
  <div>
    <DayHeader :date="date" :tasks="all" @change="changeDate" />
    <WeekStrip :date="date" @change="changeDate" />

    <div class="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <QuickAdd :date="date" />

      <div
        v-if="overdueCount > 0"
        class="flex flex-col gap-3 border border-rule-strong p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="flex items-center gap-3 text-sm">
          <History class="size-4 shrink-0 text-danger" />
          {{ t('day.overdue', { n: overdueCount }) }}
        </p>
        <button
          type="button"
          class="flex h-8 items-center justify-center gap-2 bg-ink px-3 font-mono text-2xs tracking-wider text-paper uppercase transition-colors hover:bg-brand hover:text-on-brand disabled:opacity-50"
          :disabled="actions.carryOver.isPending.value"
          @click="carryOver"
        >
          <LoaderCircle v-if="actions.carryOver.isPending.value" class="size-3.5 animate-spin" />
          {{ t('day.carryOver') }}
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3" data-tour="views">
        <Segmented
          v-model="ui.areaFilter"
          :options="areaOptions"
          :label="t('day.area')"
          size="sm"
        />
        <Segmented v-model="view" :options="viewOptions" :label="t('day.view')" size="sm" />
      </div>

      <ListSkeleton v-if="isPending" />

      <template v-else-if="view === 'list'">
        <section>
          <div class="flex items-baseline justify-between border-b border-rule-strong pb-2">
            <h2 class="label">{{ t('day.open') }}</h2>
            <span class="label numeric">{{ openCount }}</span>
          </div>
          <TaskList :tasks="all" :container="date" :filter="openFilter" />
          <EmptyState
            v-if="openCount === 0"
            class="mt-4"
            code="00"
            :title="doneCount > 0 ? t('day.allDone') : t('day.emptyTitle')"
            :text="doneCount > 0 ? t('day.allDoneText') : t('day.emptyText')"
          />
        </section>

        <section v-if="doneCount > 0">
          <button
            type="button"
            class="flex w-full items-baseline justify-between border-b border-rule pb-2"
            :aria-expanded="showDone"
            @click="showDone = !showDone"
          >
            <span class="label flex items-center gap-2">
              <ChevronDown
                class="size-3.5 transition-transform"
                :class="!showDone && '-rotate-90'"
              />
              {{ t('day.completed') }}
            </span>
            <span class="label numeric">{{ doneCount }}</span>
          </button>
          <TaskList
            v-if="showDone"
            :tasks="all"
            :container="date"
            :filter="doneFilter"
            :sortable="false"
          />
        </section>
      </template>

      <DaySchedule v-else :date="date" :tasks="all.filter(matchesArea)" />
    </div>
  </div>
</template>
