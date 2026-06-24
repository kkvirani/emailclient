/**
 * Centralized TanStack Query keys.
 * See docs/07-STATE-MANAGEMENT.md.
 */
export type MessageFilter = {
  accountId?: string;
  folder?: string;
  view?: string;
  q?: string;
  category?: string;
  isRead?: boolean;
};

export const qk = {
  me: () => ["me"] as const,
  accounts: () => ["accounts"] as const,
  folders: (accountId: string) => ["folders", accountId] as const,
  labels: () => ["labels"] as const,
  messages: (filter: MessageFilter) => ["messages", filter] as const,
  message: (id: string) => ["message", id] as const,
  thread: (id: string) => ["thread", id] as const,
  subscriptions: (filter: Record<string, unknown> = {}) =>
    ["subscriptions", filter] as const,
  rules: () => ["rules"] as const,
  views: () => ["views"] as const,
  analytics: (metric: string) => ["analytics", metric] as const,
  job: (id: string) => ["job", id] as const,
};
