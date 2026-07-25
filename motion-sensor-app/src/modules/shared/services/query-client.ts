import { QueryClient, UseMutationOptions, QueryKey } from '@tanstack/react-query';
import type { ApiError } from '../lib/util';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server
    return makeQueryClient();
  } else {
    // Browser
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export const queryClient = getQueryClient(); // Export the singleton for places that can't use the hook

export interface QueryKeyFactory<TKey extends string> {
  all: readonly [TKey];
  lists: () => readonly [TKey, 'list'];
  list: (query: Record<string, any>) => readonly [TKey, 'list', Record<string, any>];
  details: () => readonly [TKey, 'detail'];
  detail: (id: string | number) => readonly [TKey, 'detail', string | number];
}

export const queryKeysFactory = <TKey extends string>(key: TKey): QueryKeyFactory<TKey> => ({
  all: [key] as const,
  lists: () => [key, 'list'] as const,
  list: (query) => [key, 'list', query] as const,
  details: () => [key, 'detail'] as const,
  detail: (id) => [key, 'detail', id] as const,
});

export const buildMutationOptions = <
  TData = unknown,
  TError = ApiError,
  TVariables = void,
  TContext = unknown
>(
  queryKey?: QueryKey,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationOptions<TData, TError, TVariables, TContext> => ({
  ...options,
  onSuccess: async (data, variables, context) => {
    // @ts-ignore - The types expect 4 arguments in some versions
    await options?.onSuccess?.(data, variables, context);

    if (!queryKey) return;

    queryClient.invalidateQueries({ queryKey });
  },
});
