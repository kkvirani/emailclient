import { db } from '@/server/db';
import { GmailSyncProvider } from './gmail';
import { EmailSyncProvider } from './types';

const providers: Record<string, EmailSyncProvider> = {
  gmail: new GmailSyncProvider()
};

/**
 * Triggers and manages the delta sync pipeline for a specific connected email account.
 */
export async function runSyncForAccount(accountId: string): Promise<{ success: boolean; emailsSynced: number; error?: string }> {
  const account = await db.account.findUnique({
    where: { id: accountId }
  });

  if (!account) {
    return { success: false, emailsSynced: 0, error: 'Connected account not found' };
  }

  const providerKey = account.provider.toLowerCase();
  const providerAdapter = providers[providerKey];
  if (!providerAdapter) {
    await db.account.update({
      where: { id: accountId },
      data: { status: 'error' }
    });
    return { success: false, emailsSynced: 0, error: `Unsupported sync provider: ${account.provider}` };
  }

  try {
    const result = await providerAdapter.sync(account);
    
    // Save updated connection success status
    await db.account.update({
      where: { id: accountId },
      data: {
        status: result.success ? 'active' : 'error'
      }
    });

    return {
      success: result.success,
      emailsSynced: result.emailsSynced,
      error: result.error
    };
  } catch (err: any) {
    await db.account.update({
      where: { id: accountId },
      data: { status: 'error' }
    });
    return {
      success: false,
      emailsSynced: 0,
      error: err.message || 'Unexpected sync executor exception'
    };
  }
}
