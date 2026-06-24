import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query defaults.
 * See docs/07-STATE-MANAGEMENT.md for caching strategy.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
