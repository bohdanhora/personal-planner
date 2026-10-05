<script setup lang="ts">
defineProps<{ minutes: number }>()

const format = useFormat()
</script>

<template>
  <div class="pointer-events-none flex items-center gap-1.5" aria-hidden="true">
    <span class="size-1.5 shrink-0 bg-brand" />
    <span class="h-px flex-1 bg-brand" />
    <span class="numeric font-mono text-3xs leading-none text-brand">{{
      format.clock(minutes)
    }}</span>
  </div>
</template>
