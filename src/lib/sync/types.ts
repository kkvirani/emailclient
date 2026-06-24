import { Account } from '@prisma/client';

export interface SyncResult {
  success: boolean;
  emailsSynced: number;
  nextSyncToken: string | null;
  error?: string;
}

export interface EmailSyncProvider {
  sync(account: Account): Promise<SyncResult>;
}
