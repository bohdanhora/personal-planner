<script setup lang="ts">
import CaretTitle from '~/components/common/CaretTitle.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import ListSkeleton from '~/components/common/ListSkeleton.vue'
import QuickAdd from '~/components/day/QuickAdd.vue'
import TaskList from '~/components/tasks/TaskList.vue'
import type { Task } from '~/lib/types'

const { t } = useI18n()

useHead({ title: () => `${t('nav.inbox')} · Personal Planner` })

const { data: inbox, isPending } = useInboxTasks()
const { data: overdue } = useOverdueTasks()

const isOpen = (task: Task) => task.status === 'OPEN'
const openCount = computed(() => (inbox.value ?? []).filter(isOpen).length)
</script>

<template>
  <div>
    <header class="border-b border-rule px-4 pt-5 pb-5 sm:px-6 lg:px-8 lg:pt-8">
      <p class="label numeric">{{ t('inbox.label', { n: openCount }) }}</p>
      <h1 class="display mt-3 text-metric"><CaretTitle :text="t('nav.inbox')" /></h1>
      <p class="mt-4 max-w-xl text-sm text-ink-muted">{{ t('inbox.lead') }}</p>
    </header>

    <div class="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <QuickAdd :date="null" :placeholder="t('inbox.placeholder')" />

      <section>
        <div class="flex items-baseline justify-between border-b border-rule-strong pb-2">
          <h2 class="label">{{ t('inbox.unplanned') }}</h2>
          <span class="label numeric">{{ openCount }}</span>
        </div>
        <ListSkeleton v-if="isPending" />
        <TaskList v-else :tasks="inbox ?? []" :container="null" :filter="isOpen" />
        <EmptyState
          v-if="!isPending && openCount === 0"
          class="mt-4"
          code="IN-00"
          :title="t('inbox.emptyTitle')"
          :text="t('inbox.emptyText')"
        />
      </section>

      <section v-if="overdue?.length">
        <div class="flex items-baseline justify-between border-b border-rule-strong pb-2">
          <h2 class="label text-danger">{{ t('inbox.overdue') }}</h2>
          <span class="label numeric">{{ overdue.length }}</span>
        </div>
        <TaskList :tasks="overdue" :container="null" :sortable="false" show-date />
      </section>
    </div>
  </div>
</template>
