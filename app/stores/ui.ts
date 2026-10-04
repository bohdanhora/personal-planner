import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

import type { ChatMessage, Task, TaskInput } from '~/lib/types'

export type AreaFilter = 'ALL' | 'WORK' | 'PERSONAL'

export const useUiStore = defineStore('ui', () => {
  const assistantPinned = useLocalStorage('pp-assistant-pinned', true)
  const assistantSheetOpen = ref(false)
  const areaFilter = useLocalStorage<AreaFilter>('pp-area-filter', 'ALL')

  const editorOpen = ref(false)
  const editorTask = ref<Task | null>(null)
  const editorDefaults = ref<Partial<TaskInput>>({})

  const focusDate = ref<string | null>(null)
  const dragging = ref(false)
  const chat = ref<ChatMessage[]>([])

  const projectEditorOpen = ref(false)
  const projectEditorId = ref<string | null>(null)

  const openEditor = (task: Task | null = null, defaults: Partial<TaskInput> = {}) => {
    editorTask.value = task
    editorDefaults.value = defaults
    editorOpen.value = true
  }

  const openProjectEditor = (projectId: string | null = null) => {
    projectEditorId.value = projectId
    projectEditorOpen.value = true
  }

  return {
    assistantPinned,
    assistantSheetOpen,
    areaFilter,
    editorOpen,
    focusDate,
    dragging,
    chat,
    editorTask,
    editorDefaults,
    projectEditorOpen,
    projectEditorId,
    openEditor,
    openProjectEditor,
  }
})
