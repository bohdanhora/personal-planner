<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { useVueOTPContext } from 'vue-input-otp'
import { cn } from '@/lib/utils'

const props = defineProps<{ index: number; class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)

const context = useVueOTPContext()

const slot = computed(() => context?.value.slots[props.index])
</script>

<template>
  <div
    v-bind="forwarded"
    data-slot="input-otp-slot"
    :data-active="slot?.isActive"
    :class="
      cn(
        'relative flex h-14 flex-1 items-center justify-center border-y border-r border-rule bg-surface font-mono text-xl transition-colors outline-none first:border-l aria-invalid:border-danger data-[active=true]:z-10 data-[active=true]:border data-[active=true]:border-brand data-[active=true]:outline-1 data-[active=true]:outline-brand',
        props.class,
      )
    "
  >
    {{ slot?.char }}
    <div
      v-if="slot?.hasFakeCaret"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div class="h-6 w-2.5 animate-blink bg-brand" />
    </div>
  </div>
</template>
