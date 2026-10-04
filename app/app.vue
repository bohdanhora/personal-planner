<script setup lang="ts">
import 'vue-sonner/style.css'

import { Toaster } from '~/components/ui/sonner'

const colorMode = useColorMode()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster
    position="top-center"
    :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
    :toast-options="{ class: 'font-sans' }"
  />
</template>
