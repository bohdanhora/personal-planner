<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <NuxtLink to="/" class="group inline-flex items-baseline gap-2" aria-label="Personal Planner">
    <span class="display text-base leading-none tracking-tight">
      {{ compact ? 'PP' : 'Planner' }}<span class="caret" />
    </span>
    <span v-if="!compact" class="label text-3xs">v0.1</span>
  </NuxtLink>
</template>
