<script setup lang="ts">
import type { Insights } from '~/lib/types'

const props = defineProps<{ rows: Insights['byProject'] }>()

const { t } = useI18n()
const projects = useProjectMap()

const max = computed(() => Math.max(1, ...props.rows.map((row) => row.completed + row.open)))

const describe = (projectId: string | null) => {
  const project = projectId ? projects.value.get(projectId) : undefined
  return project
    ? { code: project.code, name: project.name }
    : { code: '...', name: t('tasks.noProject') }
}
</script>

<template>
  <ul class="space-y-4" :aria-label="t('insights.byProject')">
    <li v-for="row in rows" :key="row.projectId ?? 'none'">
      <div class="flex items-baseline justify-between gap-3">
        <span class="flex min-w-0 items-baseline gap-2">
          <span class="w-12 shrink-0 border border-rule px-1 text-center font-mono text-3xs">{{
            describe(row.projectId).code
          }}</span>
          <span class="truncate text-sm">{{ describe(row.projectId).name }}</span>
        </span>
        <span class="numeric shrink-0 font-mono text-xs">
          {{ row.completed
          }}<span class="text-ink-faint"> / {{ row.open }} {{ t('insights.openShort') }}</span>
        </span>
      </div>
      <div class="mt-1.5 flex h-2 gap-0.5">
        <div
          class="h-full bg-brand"
          :style="{ width: `${(row.completed / max) * 100}%` }"
          :title="`${t('insights.completed')}: ${row.completed}`"
        />
        <div
          v-if="row.open"
          class="h-full border border-ink-muted"
          :style="{ width: `${(row.open / max) * 100}%` }"
          :title="`${t('insights.open')}: ${row.open}`"
        />
      </div>
    </li>
  </ul>
</template>
