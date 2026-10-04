<script setup lang="ts">
import { Plus } from '@lucide/vue'

import CaretTitle from '~/components/common/CaretTitle.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import Segmented from '~/components/common/Segmented.vue'
import { Button } from '~/components/ui/button'
import type { Project, ProjectArea } from '~/lib/types'

const { t } = useI18n()
const ui = useUiStore()

useHead({ title: () => `${t('nav.projects')} · Personal Planner` })

const showArchived = ref(false)
const { data: projects, isPending } = useProjects(showArchived)

const filterOptions = computed(() => [
  { value: false, label: t('projects.active') },
  { value: true, label: t('projects.all') },
])

const areas: ProjectArea[] = ['WORK', 'PERSONAL']

const grouped = computed(() =>
  areas.map((area) => ({
    area,
    projects: (projects.value ?? []).filter((project) => project.area === area),
  })),
)

const progress = (project: Project) => {
  const total = project.openTasks + project.doneTasks
  return total === 0 ? 0 : Math.round((project.doneTasks / total) * 100)
}
</script>

<template>
  <div>
    <header class="border-b border-rule px-4 pt-5 pb-5 sm:px-6 lg:px-8 lg:pt-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="label numeric">{{ t('projects.count', { n: projects?.length ?? 0 }) }}</p>
          <h1 class="display mt-3 text-metric"><CaretTitle :text="t('nav.projects')" /></h1>
        </div>
        <Button @click="ui.openProjectEditor()">
          <Plus />
          <span class="hidden sm:inline">{{ t('projects.new') }}</span>
        </Button>
      </div>
      <p class="mt-4 max-w-xl text-sm text-ink-muted">{{ t('projects.lead') }}</p>
    </header>

    <div class="space-y-10 px-4 py-6 sm:px-6 lg:px-8">
      <Segmented
        v-model="showArchived"
        :options="filterOptions"
        :label="t('projects.filter')"
        size="sm"
      />

      <section v-for="group in grouped" :key="group.area">
        <div class="mb-4 flex items-baseline justify-between border-b border-rule-strong pb-2">
          <h2 class="label">{{ t(`areas.${group.area}`) }}</h2>
          <span class="label numeric">{{ group.projects.length }}</span>
        </div>

        <div v-if="isPending" class="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
          <div v-for="index in 2" :key="index" class="h-40 animate-pulse bg-surface-muted" />
        </div>

        <div
          v-else-if="group.projects.length"
          class="grid border-t border-l border-rule sm:grid-cols-2 2xl:grid-cols-3"
        >
          <NuxtLink
            v-for="project in group.projects"
            :key="project.id"
            :to="`/projects/${project.id}`"
            class="group flex flex-col justify-between gap-6 border-r border-b border-rule p-5 transition-colors hover:bg-surface"
            :class="project.archived && 'opacity-60'"
          >
            <div class="flex items-start justify-between gap-3">
              <span
                class="display text-2xl leading-none transition-colors group-hover:text-brand"
                >{{ project.code }}</span
              >
              <span v-if="project.archived" class="label">{{ t('projects.archived') }}</span>
            </div>
            <div>
              <p class="truncate font-medium">{{ project.name }}</p>
              <p v-if="project.description" class="mt-1 line-clamp-2 text-sm text-ink-faint">
                {{ project.description }}
              </p>
            </div>
            <div>
              <dl class="flex gap-6">
                <div>
                  <dt class="label">{{ t('projects.open') }}</dt>
                  <dd class="numeric mt-0.5 font-mono text-sm">{{ project.openTasks }}</dd>
                </div>
                <div>
                  <dt class="label">{{ t('projects.done') }}</dt>
                  <dd class="numeric mt-0.5 font-mono text-sm">{{ project.doneTasks }}</dd>
                </div>
                <div class="ml-auto text-right">
                  <dt class="label">%</dt>
                  <dd class="numeric mt-0.5 font-mono text-sm">{{ progress(project) }}</dd>
                </div>
              </dl>
              <div class="mt-3 h-0.5 bg-rule">
                <div class="h-full bg-brand" :style="{ width: `${progress(project)}%` }" />
              </div>
            </div>
          </NuxtLink>
        </div>

        <EmptyState
          v-else
          :code="group.area === 'WORK' ? 'WRK-00' : 'LIF-00'"
          :title="t('projects.emptyTitle')"
          :text="t('projects.emptyText')"
        >
          <Button variant="outline" size="sm" @click="ui.openProjectEditor()">
            <Plus />
            {{ t('projects.new') }}
          </Button>
        </EmptyState>
      </section>
    </div>
  </div>
</template>
