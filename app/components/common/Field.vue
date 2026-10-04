<script setup lang="ts">
defineProps<{ label: string; for?: string; error?: string | null; hint?: string }>()
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-baseline justify-between gap-3">
      <label :for="$props.for" class="label">{{ label }}</label>
      <slot name="aside" />
    </div>
    <slot />
    <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-ink-faint">{{ hint }}</p>
  </div>
</template>
