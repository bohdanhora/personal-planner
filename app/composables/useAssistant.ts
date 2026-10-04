import { useMutation, useQuery } from '@tanstack/vue-query'

import type { ChatMessage, Meta, Plan, TaskDraft, Tip } from '~/lib/types'

export const useMeta = () => {
  const config = useRuntimeConfig()

  return useQuery({
    queryKey: ['meta'],
    queryFn: () => $fetch<Meta>('/meta', { baseURL: config.public.apiUrl }),
    staleTime: Infinity,
  })
}

export const useAssistantEnabled = () => {
  const { data } = useMeta()
  return computed(() => data.value?.assistantEnabled ?? false)
}

export const useAssistant = () => {
  const api = useApi()

  const parse = useMutation({
    mutationFn: (input: { text: string; date?: string }) =>
      api<{ drafts: TaskDraft[] }>('/assistant/parse', { method: 'POST', body: input }),
  })

  const suggest = useMutation({
    mutationFn: (input: { title: string; notes?: string | null; date?: string }) =>
      api<{ draft: TaskDraft }>('/assistant/suggest', { method: 'POST', body: input }),
  })

  const plan = useMutation({
    mutationFn: (date: string) => api<Plan>('/assistant/plan', { method: 'POST', body: { date } }),
  })

  const tips = useMutation({
    mutationFn: (date: string) =>
      api<{ tips: Tip[] }>('/assistant/tips', { method: 'POST', body: { date } }),
  })

  const chat = useMutation({
    mutationFn: (input: { date: string; messages: ChatMessage[] }) =>
      api<{ reply: string; drafts: TaskDraft[] }>('/assistant/chat', {
        method: 'POST',
        body: {
          date: input.date,
          messages: input.messages.map(({ role, content }) => ({ role, content })),
        },
      }),
  })

  return { parse, suggest, plan, tips, chat }
}
