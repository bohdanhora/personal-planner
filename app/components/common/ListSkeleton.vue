<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <div aria-hidden="true">
    <div
      v-for="index in rows"
      :key="index"
      class="flex items-center gap-3 border-b border-rule py-4 pl-9"
    >
      <span class="size-4 animate-pulse bg-surface-muted" />
      <span
        class="h-3 animate-pulse bg-surface-muted"
        :style="{ width: `${40 + ((index * 17) % 45)}%` }"
      />
    </div>
  </div>
</template>
