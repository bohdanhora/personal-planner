<script setup lang="ts">
const props = withDefaults(defineProps<{ text: string; as?: string }>(), { as: 'span' })

const parts = computed(() => {
  const trimmed = props.text.trim()
  const index = trimmed.lastIndexOf(' ')
  return index === -1
    ? { head: '', tail: trimmed }
    : { head: trimmed.slice(0, index + 1), tail: trimmed.slice(index + 1) }
})
</script>

<template>
  <component :is="as"
    >{{ parts.head }}<span class="whitespace-nowrap">{{ parts.tail }}<span class="caret" /></span
  ></component>
</template>
