import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import type {
  AiProvider,
  AiProviderCheck,
  AiProviderInput,
  CatalogProvider,
  ProviderModels,
} from '~/lib/types'

const PROVIDER_KEY = ['ai-provider'] as const
const CATALOG_KEY = ['ai-provider', 'catalog'] as const
const MODELS_KEY = ['ai-provider', 'models'] as const

export const useAiProvider = () => {
  const api = useApi()
  const auth = useAuthStore()

  return useQuery({
    queryKey: PROVIDER_KEY,
    queryFn: () => api<AiProvider>('/ai-provider'),
    enabled: computed(() => auth.isAuthenticated),
    staleTime: Infinity,
  })
}

export const useProviderCatalog = () => {
  const api = useApi()

  return useQuery({
    queryKey: CATALOG_KEY,
    queryFn: () => api<CatalogProvider[]>('/ai-provider/catalog'),
    staleTime: Infinity,
  })
}

export const useProviderModels = (enabled: Ref<boolean>) => {
  const api = useApi()

  return useQuery({
    queryKey: MODELS_KEY,
    queryFn: () => api<ProviderModels>('/ai-provider/models'),
    enabled,
    retry: false,
    staleTime: Infinity,
  })
}

export const useAiProviderMutations = () => {
  const api = useApi()
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: (input: AiProviderInput) =>
      api<AiProvider>('/ai-provider', { method: 'PUT', body: input }),
    onSuccess: (provider, input) => {
      queryClient.setQueryData(PROVIDER_KEY, provider)
      if (input.apiKey) {
        queryClient.removeQueries({ queryKey: MODELS_KEY })
      }
    },
  })

  const remove = useMutation({
    mutationFn: () => api('/ai-provider', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: MODELS_KEY })
      queryClient.setQueryData<AiProvider>(PROVIDER_KEY, {
        isConfigured: false,
        baseUrl: null,
        modelName: null,
        apiKeyHint: null,
      })
    },
  })

  const refreshModels = useMutation({
    mutationFn: () => api<ProviderModels>('/ai-provider/models/refresh', { method: 'POST' }),
    onSuccess: (models) => queryClient.setQueryData(MODELS_KEY, models),
  })

  const previewModels = useMutation({
    mutationFn: (input: { baseUrl: string; apiKey?: string }) =>
      api<ProviderModels>('/ai-provider/models/preview', { method: 'POST', body: input }),
  })

  const check = useMutation({
    mutationFn: () => api<AiProviderCheck>('/ai-provider/check', { method: 'POST' }),
  })

  return { save, remove, refreshModels, previewModels, check }
}
