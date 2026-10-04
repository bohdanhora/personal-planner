<script setup lang="ts">
import AppLogo from '~/components/app/AppLogo.vue'
import LocaleSwitcher from '~/components/app/LocaleSwitcher.vue'
import ThemeSwitcher from '~/components/app/ThemeSwitcher.vue'
import CaretTitle from '~/components/common/CaretTitle.vue'

const { t } = useI18n()
const format = useFormat()
const today = useToday()

const spec = computed(() => [
  { key: t('auth.spec.mode'), value: t('auth.spec.modeValue') },
  { key: t('auth.spec.assistant'), value: t('auth.spec.assistantValue') },
  { key: t('auth.spec.drag'), value: t('auth.spec.dragValue') },
  { key: t('auth.spec.lang'), value: 'EN / RU / UK' },
  { key: t('auth.spec.theme'), value: t('auth.spec.themeValue') },
])

const sample = computed(() => [
  { time: '09:30', title: t('auth.sample.one'), code: 'WORK', done: true },
  { time: '11:00', title: t('auth.sample.two'), code: 'WEB', done: false },
  { time: '19:00', title: t('auth.sample.three'), code: 'LIFE', done: false },
])
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background lg:grid lg:grid-cols-2">
    <section
      class="relative hidden flex-col justify-between border-r border-rule p-10 lg:flex xl:p-14"
    >
      <div class="flex items-center justify-between">
        <AppLogo />
        <span class="label numeric">{{
          format.day(today, { day: '2-digit', month: '2-digit', year: 'numeric' })
        }}</span>
      </div>

      <div class="py-12">
        <p class="label mb-6">{{ t('auth.posterLabel') }}</p>
        <h1 class="display text-hero">
          <CaretTitle :text="t('auth.posterTitle')" />
        </h1>
        <p class="mt-6 max-w-md text-lg text-ink-muted">{{ t('auth.posterLead') }}</p>
      </div>

      <div class="grid gap-8 xl:grid-cols-2">
        <dl class="border-t border-rule-strong">
          <div
            v-for="(row, index) in spec"
            :key="row.key"
            class="grid grid-cols-12 gap-2 border-b border-rule py-2"
          >
            <dt class="label col-span-1">{{ String(index + 1).padStart(2, '0') }}</dt>
            <dt class="label col-span-4">{{ row.key }}</dt>
            <dd class="col-span-7 font-mono text-2xs uppercase">{{ row.value }}</dd>
          </div>
        </dl>
        <div class="border border-rule-strong bg-surface" aria-hidden="true">
          <div class="flex items-center justify-between border-b border-rule px-3 py-2">
            <span class="label">{{ t('tasks.today') }}</span>
            <span class="label numeric">1 / 3</span>
          </div>
          <div
            v-for="row in sample"
            :key="row.time"
            class="flex items-center gap-3 border-b border-rule px-3 py-2.5 last:border-b-0"
          >
            <span
              class="flex size-3.5 shrink-0 items-center justify-center border"
              :class="row.done ? 'border-brand bg-brand' : 'border-rule-strong'"
            />
            <span
              class="flex-1 truncate text-sm"
              :class="row.done && 'text-ink-faint line-through'"
              >{{ row.title }}</span
            >
            <span class="font-mono text-3xs text-ink-faint">{{ row.code }}</span>
            <span class="numeric font-mono text-3xs text-ink-muted">{{ row.time }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="flex flex-1 flex-col">
      <header
        class="flex h-14 items-center justify-between border-b border-rule px-4 sm:px-6 lg:justify-end lg:border-b-0 lg:px-10"
      >
        <AppLogo class="lg:hidden" />
        <div class="flex w-48 gap-2">
          <ThemeSwitcher class="flex-1" />
          <LocaleSwitcher class="flex-1" />
        </div>
      </header>
      <div class="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div class="w-full max-w-sm">
          <slot />
        </div>
      </div>
    </section>
  </div>
</template>
