import { FetchError } from 'ofetch'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
  ) {
    super(message)
  }
}

interface ApiErrorBody {
  code?: string
  message?: string | string[]
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: object
  query?: object
}

export interface ApiClientOptions {
  baseURL: string
  getToken: () => string | null
  refresh: () => Promise<boolean>
}

export type ApiRequest = <T = void>(path: string, options?: ApiRequestOptions) => Promise<T>

const toApiError = (error: unknown): ApiError => {
  if (error instanceof FetchError) {
    const body = (error.data ?? {}) as ApiErrorBody
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    return new ApiError(error.statusCode ?? 0, body.code ?? null, message ?? error.message)
  }

  return new ApiError(0, null, error instanceof Error ? error.message : String(error))
}

export const createApiClient = (options: ApiClientOptions): ApiRequest => {
  const send = <T>(path: string, request: ApiRequestOptions) => {
    const token = options.getToken()

    return $fetch<T>(path, {
      method: request.method ?? 'GET',
      body: request.body,
      query: request.query as Record<string, unknown> | undefined,
      baseURL: options.baseURL,
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }

  return async <T>(path: string, request: ApiRequestOptions = {}) => {
    try {
      return await send<T>(path, request)
    } catch (error) {
      const apiError = toApiError(error)

      if (apiError.status === 401 && options.getToken() && (await options.refresh())) {
        try {
          return await send<T>(path, request)
        } catch (retryError) {
          throw toApiError(retryError)
        }
      }

      throw apiError
    }
  }
}
