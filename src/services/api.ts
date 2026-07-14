import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { auth } from './firebase'

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
})

// Same pattern as stafy-mobile's api.ts interceptor — getIdToken() returns the
// cached token unless it's near expiry, in which case the SDK refreshes it silently.
AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser

  if (currentUser) {
    const idToken = await currentUser.getIdToken()
    config.headers.Authorization = `Bearer ${idToken}`
  }

  return config
})

// Orval custom-instance mutator (see orval.config.ts `override.mutator`) — every
// generated endpoint function calls this instead of a bare axios instance, so
// auth stays wired through one place.
export const api = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source()
  const promise = AXIOS_INSTANCE({ ...config, cancelToken: source.token }).then(
    (response) => response.data,
  )

  // @ts-expect-error orval expects `.cancel` on the returned promise for react-query
  promise.cancel = () => source.cancel('Query was cancelled')

  return promise
}

export type ErrorType<Error> = AxiosError<Error>
