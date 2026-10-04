<script setup lang="ts">
import CaretTitle from '~/components/common/CaretTitle.vue'

defineProps<{ code: string; title: string; text?: string }>()
</script>

<template>
  <div class="flex flex-col items-start gap-3 border border-dashed border-rule p-6 sm:p-8">
    <span class="label">{{ code }}</span>
    <p class="display text-lg"><CaretTitle :text="title" /></p>
    <p v-if="text" class="max-w-md text-sm text-ink-muted">{{ text }}</p>
    <slot />
  </div>
</template>
