<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useEventListener, useRafFn, useWindowSize } from '@vueuse/core'
import { Check, LoaderCircle } from '@lucide/vue'

import CaretTitle from '~/components/common/CaretTitle.vue'
import { Button } from '~/components/ui/button'
import { TASK_CREATE_KEY } from '~/composables/useTasks'
import type { Task } from '~/lib/types'

interface TourStep {
  key: string
  target?: string
  interactive?: boolean
}

interface Box {
  top: number
  left: number
  width: number
  height: number
}

const STEPS: TourStep[] = [
  { key: 'welcome' },
  { key: 'nav', target: '[data-tour="nav"]' },
  { key: 'projects', target: '[data-tour="projects"]' },
  { key: 'quickAdd', target: '[data-tour="quick-add"]', interactive: true },
  { key: 'task', target: '[data-task-id]' },
  { key: 'weekStrip', target: '[data-tour="week-strip"]' },
  { key: 'views', target: '[data-tour="views"]' },
  { key: 'assistant', target: '[data-tour="assistant"]' },
  { key: 'settings', target: '[data-tour="settings"]' },
  { key: 'done' },
]

const HOLE_PADDING = 6
const CARD_GAP = 12
const EDGE = 16
const MOBILE_BREAKPOINT = 640
const TAB_BAR_OFFSET = 76
const HEADER_OFFSET = 64

const { t } = useI18n()
const tour = useTourStore()
const queryClient = useQueryClient()
const assistantEnabled = useAssistantEnabled()
const { width: viewportWidth, height: viewportHeight } = useWindowSize()

const card = ref<HTMLElement | null>(null)
const hole = ref<Box | null>(null)
const cardHeight = ref(0)
const created = ref(false)
const createdTaskId = ref<string | null>(null)

const current = computed(() => STEPS[tour.step] ?? STEPS[0]!)
const isFirst = computed(() => tour.step === 0)
const isLast = computed(() => tour.step === STEPS.length - 1)
const mobile = computed(() => viewportWidth.value < MOBILE_BREAKPOINT)

const isVisible = (element: Element) => {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden'
}

const findTarget = () => {
  const { key, target } = current.value

  if (!target) {
    return null
  }

  const selectors =
    key === 'task' && createdTaskId.value
      ? [`[data-task-id="${createdTaskId.value}"]`, target]
      : [target]

  for (const selector of selectors) {
    const element = [...document.querySelectorAll(selector)].find(isVisible)
    if (element) {
      return element
    }
  }

  return null
}

const measure = () => {
  const element = findTarget()

  if (!element) {
    hole.value = null
  } else {
    const rect = element.getBoundingClientRect()
    hole.value = {
      top: Math.max(rect.top - HOLE_PADDING, 0),
      left: Math.max(rect.left - HOLE_PADDING, 0),
      width: Math.min(rect.width + HOLE_PADDING * 2, viewportWidth.value),
      height: rect.height + HOLE_PADDING * 2,
    }
  }

  cardHeight.value = card.value?.offsetHeight ?? 0
}

const { pause, resume } = useRafFn(measure, { immediate: false })

const focusStep = async () => {
  await nextTick()
  const element = findTarget()

  if (element && !element.closest('.fixed')) {
    if (mobile.value) {
      const offset = element.getBoundingClientRect().top - HEADER_OFFSET - CARD_GAP
      window.scrollBy({ top: offset, behavior: 'smooth' })
    } else {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }

  measure()
}

watch(
  () => tour.active,
  (active) => {
    if (active) {
      resume()
      void focusStep()
    } else {
      pause()
    }
  },
  { immediate: true },
)

watch(
  () => tour.step,
  () => {
    created.value = false
    void focusStep()
  },
)

const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
  const mutation = event.mutation
  const isCreate = mutation?.options.mutationKey?.join('/') === TASK_CREATE_KEY.join('/')

  if (
    tour.active &&
    current.value.interactive &&
    !created.value &&
    isCreate &&
    mutation?.state.status === 'success'
  ) {
    const data = mutation.state.data as Task | Task[] | undefined
    createdTaskId.value = (Array.isArray(data) ? data[0]?.id : data?.id) ?? null
    created.value = true
    setTimeout(() => {
      if (tour.active && current.value.interactive) {
        tour.step += 1
      }
    }, 900)
  }
})

onBeforeUnmount(unsubscribe)

const next = () => {
  if (isLast.value) {
    void tour.finish()
  } else {
    tour.step += 1
  }
}

const back = () => {
  if (!isFirst.value) {
    tour.step -= 1
  }
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (!tour.active) {
    return
  }

  if (event.key === 'Escape') {
    void tour.finish()
  } else if (event.key === 'ArrowRight' && !current.value.interactive) {
    next()
  } else if (event.key === 'ArrowLeft') {
    back()
  }
})

const shades = computed(() => {
  const box = hole.value
  if (!box) {
    return [{ top: 0, left: 0, width: viewportWidth.value, height: viewportHeight.value }]
  }

  const bottom = box.top + box.height
  const right = box.left + box.width

  return [
    { top: 0, left: 0, width: viewportWidth.value, height: box.top },
    {
      top: bottom,
      left: 0,
      width: viewportWidth.value,
      height: Math.max(viewportHeight.value - bottom, 0),
    },
    { top: box.top, left: 0, width: box.left, height: box.height },
    {
      top: box.top,
      left: right,
      width: Math.max(viewportWidth.value - right, 0),
      height: box.height,
    },
  ]
})

const cardStyle = computed(() => {
  const box = hole.value
  const width = Math.min(384, viewportWidth.value - EDGE * 2)

  if (!box) {
    return {
      width: `${width}px`,
      top: `${Math.max((viewportHeight.value - cardHeight.value) / 2, EDGE)}px`,
      left: `${(viewportWidth.value - width) / 2}px`,
    }
  }

  if (mobile.value) {
    const below = box.top + box.height + CARD_GAP
    const above = box.top - CARD_GAP - cardHeight.value
    const side = { left: `${EDGE}px`, right: `${EDGE}px` }

    if (below + cardHeight.value <= viewportHeight.value - TAB_BAR_OFFSET) {
      return { ...side, top: `${below}px` }
    }

    if (above >= HEADER_OFFSET) {
      return { ...side, top: `${above}px` }
    }

    const targetLow = box.top + box.height / 2 > viewportHeight.value / 2
    return targetLow
      ? { ...side, top: `${HEADER_OFFSET}px` }
      : { ...side, bottom: `${TAB_BAR_OFFSET}px` }
  }

  const below = box.top + box.height + CARD_GAP
  const above = box.top - CARD_GAP - cardHeight.value
  const fitsBelow = below + cardHeight.value <= viewportHeight.value - EDGE
  const fitsAbove = above >= EDGE
  const fitsRight = box.left + box.width + CARD_GAP + width <= viewportWidth.value - EDGE
  const fitsLeft = box.left - CARD_GAP - width >= EDGE
  const sideTop = `${Math.min(Math.max(box.top, EDGE), viewportHeight.value - cardHeight.value - EDGE)}px`

  if (!fitsBelow && !fitsAbove && fitsRight) {
    return { width: `${width}px`, top: sideTop, left: `${box.left + box.width + CARD_GAP}px` }
  }

  if (!fitsBelow && !fitsAbove && fitsLeft) {
    return { width: `${width}px`, top: sideTop, left: `${box.left - CARD_GAP - width}px` }
  }

  const top = fitsBelow ? below : fitsAbove ? above : viewportHeight.value - cardHeight.value - EDGE
  const left = Math.min(Math.max(box.left, EDGE), viewportWidth.value - width - EDGE)

  return { width: `${width}px`, top: `${top}px`, left: `${left}px` }
})

const px = (box: Box) => ({
  top: `${box.top}px`,
  left: `${box.left}px`,
  width: `${box.width}px`,
  height: `${box.height}px`,
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="tour.active"
      class="fixed inset-0 z-60"
      role="dialog"
      aria-modal="true"
      :aria-label="t('tour.label')"
    >
      <div
        v-for="(shade, index) in shades"
        :key="index"
        class="absolute bg-paper/85 transition-all duration-200"
        :style="px(shade)"
      />

      <template v-if="hole">
        <div
          class="pointer-events-none absolute outline-2 outline-brand transition-all duration-200"
          :style="px(hole)"
        />
        <div v-if="!current.interactive" class="absolute" :style="px(hole)" />
      </template>

      <section
        ref="card"
        :key="current.key"
        class="absolute animate-rise border border-rule-strong bg-surface"
        :style="cardStyle"
      >
        <div class="flex items-center justify-between border-b border-rule px-4 py-2.5">
          <p class="label flex items-center gap-2">
            <span class="marker" />
            {{ t('tour.label') }}
          </p>
          <p class="label numeric">
            {{ String(tour.step + 1).padStart(2, '0') }} /
            {{ String(STEPS.length).padStart(2, '0') }}
          </p>
        </div>

        <div class="px-4 pt-4 pb-3">
          <h2 class="display text-lg leading-tight">
            <CaretTitle :text="t(`tour.${current.key}.title`)" />
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-ink-muted">
            {{
              t(
                `tour.${current.key}.${current.interactive && !assistantEnabled ? 'textPlain' : 'text'}`,
              )
            }}
          </p>

          <p
            v-if="current.interactive"
            class="mt-3 flex items-center gap-2 border border-rule px-3 py-2 font-mono text-2xs tracking-wider uppercase"
            :class="created ? 'border-brand text-brand' : 'text-ink-faint'"
            role="status"
          >
            <Check v-if="created" class="size-3.5" />
            <LoaderCircle v-else class="size-3.5 animate-spin" />
            {{ created ? t('tour.quickAdd.done') : t('tour.quickAdd.waiting') }}
          </p>
        </div>

        <div class="flex gap-1 px-4 pb-3" aria-hidden="true">
          <span
            v-for="(step, index) in STEPS"
            :key="step.key"
            class="h-0.5 flex-1 transition-colors"
            :class="index <= tour.step ? 'bg-brand' : 'bg-rule'"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2 border-t border-rule px-4 py-3">
          <button
            v-if="!isLast"
            type="button"
            class="label mr-auto whitespace-nowrap underline-offset-4 hover:text-ink hover:underline"
            @click="tour.finish()"
          >
            {{ t('tour.skip') }}
          </button>
          <span v-else class="mr-auto" />
          <Button v-if="!isFirst && !isLast" variant="outline" size="sm" @click="back">{{
            t('tour.back')
          }}</Button>
          <Button v-if="isFirst" size="sm" variant="brand" @click="next">{{
            t('tour.welcome.start')
          }}</Button>
          <Button v-else-if="isLast" size="sm" variant="brand" @click="next">{{
            t('tour.finish')
          }}</Button>
          <Button
            v-else-if="current.interactive && !created"
            size="sm"
            variant="outline"
            @click="next"
          >
            {{ t('tour.quickAdd.skip') }}
          </Button>
          <Button v-else size="sm" @click="next">{{ t('tour.next') }}</Button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
