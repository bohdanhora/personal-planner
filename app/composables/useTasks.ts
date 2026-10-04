import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import type { Task, TaskInput, TaskPatch } from '~/lib/types'

interface TaskQuery {
  from?: string
  to?: string
  projectId?: string
  scope?: 'inbox' | 'overdue'
}

export const TASK_CREATE_KEY = ['tasks', 'create'] as const

const keyFor = (query: TaskQuery) => ['tasks', query] as const

export const useTaskList = (
  query: MaybeRefOrGetter<TaskQuery>,
  enabled: MaybeRefOrGetter<boolean> = true,
) => {
  const api = useApi()

  return useQuery({
    queryKey: computed(() => keyFor(toValue(query))),
    queryFn: () => api<Task[]>('/tasks', { query: toValue(query) }),
    enabled: computed(() => toValue(enabled)),
  })
}

export const useDayTasks = (date: MaybeRefOrGetter<string>) =>
  useTaskList(() => ({ from: toValue(date), to: toValue(date) }))

export const useRangeTasks = (from: MaybeRefOrGetter<string>, to: MaybeRefOrGetter<string>) =>
  useTaskList(() => ({ from: toValue(from), to: toValue(to) }))

export const useInboxTasks = () => useTaskList({ scope: 'inbox' })

export const useOverdueTasks = () => useTaskList({ scope: 'overdue' })

export const useProjectTasks = (projectId: MaybeRefOrGetter<string>) =>
  useTaskList(() => ({ projectId: toValue(projectId) }))

export const useTaskActions = () => {
  const api = useApi()
  const queryClient = useQueryClient()

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),
    ])

  const patchCached = (id: string, patch: Partial<Task>) => {
    queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (tasks) =>
      tasks?.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    )
  }

  const create = useMutation({
    mutationKey: TASK_CREATE_KEY,
    mutationFn: (input: TaskInput) => api<Task>('/tasks', { method: 'POST', body: input }),
    onSuccess: refresh,
  })

  const createMany = useMutation({
    mutationKey: TASK_CREATE_KEY,
    mutationFn: (tasks: TaskInput[]) =>
      api<Task[]>('/tasks/batch', { method: 'POST', body: { tasks } }),
    onSuccess: refresh,
  })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TaskPatch }) =>
      api<Task>(`/tasks/${id}`, { method: 'PATCH', body: patch }),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      patchCached(id, patch as Partial<Task>)
    },
    onSettled: refresh,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/tasks/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (tasks) =>
        tasks?.filter((task) => task.id !== id),
      )
    },
    onSettled: refresh,
  })

  const order = useMutation({
    mutationFn: (input: { date: string | null; taskIds: string[] }) =>
      api<Task[]>('/tasks/order', { method: 'PUT', body: input }),
    onSettled: refresh,
  })

  const schedule = useMutation({
    mutationFn: (input: {
      date: string
      items: { taskId: string; startMinutes: number; durationMinutes: number }[]
    }) => api<Task[]>('/tasks/schedule', { method: 'PUT', body: input }),
    onSettled: refresh,
  })

  const carryOver = useMutation({
    mutationFn: (to: string) =>
      api<{ moved: number }>('/tasks/carry-over', { method: 'POST', body: { to } }),
    onSettled: refresh,
  })

  const toggle = (task: Task) =>
    update.mutate({ id: task.id, patch: { status: task.status === 'DONE' ? 'OPEN' : 'DONE' } })

  return { create, createMany, update, remove, order, schedule, carryOver, toggle }
}
