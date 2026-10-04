import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import type { Project, ProjectInput } from '~/lib/types'

export const useProjects = (includeArchived: MaybeRefOrGetter<boolean> = false) => {
  const api = useApi()

  return useQuery({
    queryKey: computed(() => ['projects', { includeArchived: toValue(includeArchived) }]),
    queryFn: () =>
      api<Project[]>('/projects', { query: { includeArchived: toValue(includeArchived) } }),
  })
}

export const useProjectMap = () => {
  const { data } = useProjects(true)
  return computed(() => new Map((data.value ?? []).map((project) => [project.id, project])))
}

export const useProjectActions = () => {
  const api = useApi()
  const queryClient = useQueryClient()

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),
    ])

  const create = useMutation({
    mutationFn: (input: ProjectInput) => api<Project>('/projects', { method: 'POST', body: input }),
    onSuccess: refresh,
  })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProjectInput> }) =>
      api<Project>(`/projects/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () =>
      Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: ['tasks'] })]),
  })

  return { create, update, remove }
}
