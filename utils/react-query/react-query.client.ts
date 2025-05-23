import { Mutation, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { captureError } from "@/utils/capture-error"
import { ReactQueryError } from "@/utils/error"
import { queryLogger } from "@/utils/logger/logger"
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from "./react-query.constants"

export const reactQueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (data, variables, context, mutation) => {
      queryLogger.debug(`Mutation success`, {
        ...(mutation.options.meta?.caller ? { caller: mutation.options.meta.caller } : {}),
        mutationKey: mutation.options.mutationKey,
        data,
        variables,
      })
    },
    onError: (
      error: Error,
      variables: unknown,
      context: unknown,
      mutation: Mutation<unknown, unknown, unknown, unknown>,
    ) => {
      const extra: Record<string, string | number> = {
        mutationKey: mutation.options.mutationKey
          ? JSON.stringify(mutation.options.mutationKey)
          : "",
        ...(error instanceof AxiosError && {
          apiErrorStatus: error.response?.status,
          apiErrorStatusText: error.response?.statusText,
          apiErrorData: JSON.stringify(error.response?.data),
          apiErrorParams: JSON.stringify(error.config?.params),
        }),
      }

      if (mutation.meta?.caller) {
        extra.caller = mutation.meta.caller as string
      }

      if (variables) {
        extra.variables = JSON.stringify(variables)
      }

      // Wrap the error in ReactQueryError
      const wrappedError = new ReactQueryError({
        error,
        additionalMessage: `Mutation failed`,
        extra,
      })

      captureError(wrappedError)
    },
  }),
  queryCache: new QueryCache({
    // Used to track which queries execute the queryFn which means will do a network request.
    // Carefull, this is also triggered when the query gets its data from the persister.
    onSuccess: (_, query) => {
      queryLogger.debug(
        `Success fetching ${JSON.stringify(query.queryKey)}${
          query.meta?.caller ? ` (caller: ${query.meta.caller})` : ""
        }`,
      )
    },
    onError: (error: Error, query) => {
      const extra: Record<string, string | number> = {
        queryKey: JSON.stringify(query.queryKey),
        ...(error instanceof AxiosError && {
          apiErrorStatus: error.response?.status,
          apiErrorStatusText: error.response?.statusText,
          apiErrorData: JSON.stringify(error.response?.data),
          apiErrorParams: JSON.stringify(error.config?.params),
        }),
      }

      if (query.meta?.caller) {
        extra.caller = query.meta.caller as string
      }

      // Wrap the error in ReactQueryError
      const wrappedError = new ReactQueryError({
        error,
        extra,
      })

      captureError(wrappedError)
    },
  }),

  defaultOptions: {
    queries: {
      gcTime: DEFAULT_GC_TIME,
      staleTime: DEFAULT_STALE_TIME,

      // For now let's control our retries
      retry: false,

      // For now let's control our retries
      retryOnMount: false,

      // Prevent infinite refetch loops by manually controlling when queries should refetch when components mount
      refetchOnMount: false,

      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      // Put this to "false" if we see sloweness with react-query but otherwise
      structuralSharing: true,

      // Handle errors during rehydration more gracefully
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
