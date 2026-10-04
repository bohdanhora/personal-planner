<script setup lang="ts" generic="T extends string | number | boolean | null">
import { cn } from '~/lib/utils'

const model = defineModel<T>({ required: true })

withDefaults(
  defineProps<{
    options: { value: T; label: string }[]
    label: string
    size?: 'sm' | 'md'
    stretch?: boolean
  }>(),
  { size: 'md', stretch: false },
)
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :class="cn('inline-flex border border-rule', stretch && 'flex w-full')"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :class="
        cn(
          'border-r border-rule px-3 font-mono text-2xs tracking-wider whitespace-nowrap text-ink-faint uppercase transition-colors last:border-r-0 hover:text-ink aria-checked:bg-ink aria-checked:text-paper',
          size === 'sm' ? 'h-8' : 'h-10',
          stretch && 'flex-1 px-1',
        )
      "
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
