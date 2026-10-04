<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'

import EmptyState from '~/components/common/EmptyState.vue'
import ListSkeleton from '~/components/common/ListSkeleton.vue'
import QuickAdd from '~/components/day/QuickAdd.vue'
import TaskList from '~/components/tasks/TaskList.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'

const { t } = useI18n()
const route = useRoute()
const ui = useUiStore()
const today = useToday()
const errorMessage = useErrorMessage()
const projects = useProjectMap()
const projectActions = useProjectActions()

const id = computed(() => String(route.params.id))
const project = computed(() => projects.value.get(id.value))
const { data: tasks, isPending } = useProjectTasks(id)
const confirmDelete = ref(false)

useHead({ title: () => `${project.value?.name ?? t('nav.projects')} · Personal Planner` })

const all = computed(() => tasks.value ?? [])
const open = computed(() => all.value.filter((task) => task.status === 'OPEN'))
const done = computed(() => all.value.filter((task) => task.status === 'DONE').reverse())

const sections = computed(() => [
  {
    key: 'overdue',
    label: t('projects.overdue'),
    tasks: open.value.filter((task) => task.date !== null && task.date < today.value),
  },
  {
    key: 'upcoming',
    label: t('projects.upcoming'),
    tasks: open.value.filter((task) => task.date !== null && task.date >= today.value),
  },
  {
    key: 'someday',
    label: t('projects.someday'),
    tasks: open.value.filter((task) => task.date === null),
  },
])

const progress = computed(() =>
  all.value.length === 0 ? 0 : Math.round((done.value.length / all.value.length) * 100),
)

const remove = async () => {
  try {
    await projectActions.remove.mutateAsync(id.value)
    toast.success(t('projects.deleted'))
    await navigateTo('/projects')
  } catch (error) {
    toast.error(errorMessage(error))
  }
}
</script>

<template>
  <div>
    <header class="border-b border-rule px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
      <NuxtLink to="/projects" class="label inline-flex items-center gap-2 hover:text-ink">
        <ArrowLeft class="size-3.5" />
        {{ t('nav.projects') }}
      </NuxtLink>
      <div class="mt-4 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="label">
            {{ project ? t(`areas.${project.area}`) : ''
            }}<template v-if="project?.archived"> · {{ t('projects.archived') }}</template>
          </p>
          <h1 class="display mt-3 flex items-baseline gap-4 text-metric">
            <span class="text-brand">{{ project?.code }}</span>
            <span class="truncate">{{ project?.name }}</span>
          </h1>
          <p v-if="project?.description" class="mt-3 max-w-xl text-sm text-ink-muted">
            {{ project.description }}
          </p>
        </div>
        <div class="flex shrink-0 gap-1">
          <Button
            variant="outline"
            size="icon"
            :aria-label="t('common.edit')"
            @click="ui.openProjectEditor(id)"
          >
            <Pencil />
          </Button>
          <Button
            variant="outline"
            size="icon"
            class="hover:border-danger hover:bg-danger hover:text-white"
            :aria-label="t('common.delete')"
            @click="confirmDelete = true"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <dl class="-mx-4 mt-6 grid grid-cols-3 border-t border-rule sm:-mx-6 lg:-mx-8">
        <div class="border-r border-rule px-4 py-3 sm:px-6 lg:px-8">
          <dt class="label">{{ t('projects.open') }}</dt>
          <dd class="numeric mt-1 font-mono text-sm">{{ open.length }}</dd>
        </div>
        <div class="border-r border-rule px-4 py-3 sm:px-6">
          <dt class="label">{{ t('projects.done') }}</dt>
          <dd class="numeric mt-1 font-mono text-sm">{{ done.length }}</dd>
        </div>
        <div class="px-4 py-3 sm:px-6">
          <dt class="label">{{ t('projects.progress') }}</dt>
          <dd class="numeric mt-1 font-mono text-sm">{{ progress }}%</dd>
        </div>
      </dl>
      <div class="-mx-4 h-0.5 bg-rule sm:-mx-6 lg:-mx-8">
        <div class="h-full bg-brand transition-all" :style="{ width: `${progress}%` }" />
      </div>
    </header>

    <div class="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <QuickAdd :date="null" :project-id="id" :placeholder="t('projects.addPlaceholder')" />

      <ListSkeleton v-if="isPending" />

      <template v-else>
        <template v-for="section in sections" :key="section.key">
          <section v-if="section.tasks.length">
            <div class="flex items-baseline justify-between border-b border-rule-strong pb-2">
              <h2 class="label" :class="section.key === 'overdue' && 'text-danger'">
                {{ section.label }}
              </h2>
              <span class="label numeric">{{ section.tasks.length }}</span>
            </div>
            <TaskList
              :tasks="section.tasks"
              :container="null"
              :sortable="false"
              show-date
              :show-project="false"
            />
          </section>
        </template>

        <EmptyState
          v-if="open.length === 0"
          code="00"
          :title="all.length ? t('projects.noOpenTitle') : t('projects.noTasksTitle')"
          :text="all.length ? t('projects.noOpenText') : t('projects.noTasksText')"
        />

        <section v-if="done.length">
          <div class="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 class="label">{{ t('day.completed') }}</h2>
            <span class="label numeric">{{ done.length }}</span>
          </div>
          <TaskList
            :tasks="done.slice(0, 30)"
            :container="null"
            :sortable="false"
            show-date
            :show-project="false"
          />
        </section>
      </template>
    </div>

    <AlertDialog v-model:open="confirmDelete">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="display text-lg">{{
            t('projects.deleteTitle')
          }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('projects.deleteText') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction class="bg-danger text-white hover:bg-ink" @click="remove">{{
            t('common.delete')
          }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
