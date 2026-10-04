<script setup lang="ts">
import { Check, ChevronDown, LoaderCircle, Plus } from '@lucide/vue'

import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

const props = defineProps<{
  options: string[]
  loading?: boolean
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  useCustomText: (value: string) => string
  id?: string
}>()

const model = defineModel<string>({ required: true })

const open = ref(false)
const query = ref('')
const search = ref<HTMLInputElement | null>(null)

const OPTION_LIMIT = 200

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  const matches = needle
    ? props.options.filter((option) => option.toLowerCase().includes(needle))
    : props.options
  return matches.slice(0, OPTION_LIMIT)
})

const custom = computed(() => {
  const value = query.value.trim()
  return value && !props.options.includes(value) ? value : null
})

const pick = (value: string) => {
  model.value = value
  open.value = false
}

const onEnter = () => {
  const value = custom.value ?? filtered.value[0]
  if (value) {
    pick(value)
  }
}

watch(open, async (value) => {
  if (value) {
    query.value = ''
    await nextTick()
    search.value?.focus()
  }
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        :id="id"
        type="button"
        class="flex h-10 w-full items-center justify-between gap-2 border border-rule bg-surface px-3 text-left font-mono text-sm transition-colors outline-none hover:border-ink-faint focus-visible:border-rule-strong"
        :class="model ? 'text-ink' : 'text-ink-faint'"
      >
        <span class="truncate">{{ model || placeholder }}</span>
        <LoaderCircle v-if="loading" class="size-4 shrink-0 animate-spin text-ink-faint" />
        <ChevronDown v-else class="size-4 shrink-0 text-ink-faint" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-(--reka-popover-trigger-width) p-0">
      <input
        ref="search"
        v-model="query"
        class="h-10 w-full border-b border-rule bg-transparent px-3 text-sm outline-none placeholder:text-ink-faint"
        :placeholder="searchPlaceholder"
        :aria-label="searchPlaceholder"
        autocomplete="off"
        spellcheck="false"
        @keydown.enter.prevent="onEnter"
      />
      <ul class="max-h-64 overflow-y-auto py-1" role="listbox">
        <li v-if="custom">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand transition-colors hover:bg-ink hover:text-paper"
            @click="pick(custom)"
          >
            <Plus class="size-3.5 shrink-0" />
            <span class="truncate">{{ useCustomText(custom) }}</span>
          </button>
        </li>
        <li
          v-for="option in filtered"
          :key="option"
          role="option"
          :aria-selected="option === model"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-ink hover:text-paper"
            @click="pick(option)"
          >
            <span class="truncate">{{ option }}</span>
            <Check v-if="option === model" class="size-3.5 shrink-0 text-brand" />
          </button>
        </li>
        <li v-if="!custom && filtered.length === 0" class="px-3 py-3 text-xs text-ink-faint">
          {{ emptyText }}
        </li>
      </ul>
    </PopoverContent>
  </Popover>
</template>
