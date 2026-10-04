<script setup lang="ts">
import { Check } from '@lucide/vue'

defineProps<{ checked: boolean; label: string }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :aria-label="label"
    class="group flex size-10 shrink-0 items-center justify-center sm:size-8"
    @click.stop="$emit('toggle')"
  >
    <span
      class="flex size-4.5 items-center justify-center border transition-colors"
      :class="
        checked
          ? 'border-brand bg-brand text-on-brand'
          : 'border-rule-strong group-hover:border-brand group-hover:bg-brand-soft'
      "
    >
      <Check v-if="checked" class="size-3.5" :stroke-width="3" />
    </span>
  </button>
</template>
