<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :class="
      cn(
        'flex field-sizing-content min-h-20 w-full border border-rule bg-surface px-3 py-2 text-body transition-colors outline-none placeholder:text-ink-faint hover:border-ink-faint focus-visible:border-rule-strong focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger',
        props.class,
      )
    "
  />
</template>
