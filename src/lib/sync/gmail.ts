import { google } from 'googleapis';
import { Account } from '@prisma/client';
import { db } from '@/server/db';
import { decrypt, encrypt } from '@/server/crypto';
import { EmailSyncProvider, SyncResult } from './types';

export class GmailSyncProvider implements EmailSyncProvider {
  private async getOAuthClient(account: Account) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.AUTH_URL || 'http://localhost:3001'}/api/auth/callback/google`
    );

    const oauthToken = await db.oAuthToken.findUnique({
      where: { accountId: account.id }
    });

    if (!oauthToken) {
      throw new Error(`OAuthToken not found for account: ${account.id}`);
    }

    const decryptedStr = decrypt({
      ciphertext: oauthToken.accessToken,
      iv: oauthToken.iv,
      authTag: oauthToken.authTag,
      keyVersion: oauthToken.keyVersion
    });

    const { accessToken, refreshToken } = JSON.parse(decryptedStr);

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
      expiry_date: oauthToken.expiresAt?.getTime()
    });

    // Handle token refresh automatic events
    oauth2Client.on('tokens', async (tokens) => {
      const oauthTokenRecord = await db.oAuthToken.findUnique({
        where: { accountId: account.id }
      });
      if (!oauthTokenRecord) return;

      const currentDecrypted = decrypt({
        ciphertext: oauthTokenRecord.accessToken,
        iv: oauthTokenRecord.iv,
        authTag: oauthTokenRecord.authTag,
        keyVersion: oauthTokenRecord.keyVersion
      });
      const parsed = JSON.parse(currentDecrypted);

      const updatedAccessToken = tokens.access_token || parsed.accessToken;
      const updatedRefreshToken = tokens.refresh_token || parsed.refreshToken;
      const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : oauthTokenRecord.expiresAt;

      const payloadToEncrypt = JSON.stringify({
        accessToken: updatedAccessToken,
        refreshToken: updatedRefreshToken
      });
      const encryptedPayload = encrypt(payloadToEncrypt);

      await db.oAuthToken.update({
        where: { accountId: account.id },
        data: {
          accessToken: encryptedPayload.ciphertext,
          refreshToken: updatedRefreshToken ? encrypt(updatedRefreshToken).ciphertext : null,
          iv: encryptedPayload.iv,
          authTag: encryptedPayload.authTag,
          keyVersion: encryptedPayload.keyVersion,
          expiresAt
        }
      });
    });

    return oauth2Client;
  }

  async sync(account: Account): Promise<SyncResult> {
    let auth;
    try {
      auth = await this.getOAuthClient(account);
    } catch (e: any) {
      console.error("Gmail Authentication failed:", e);
      return { success: false, emailsSynced: 0, nextSyncToken: null, error: e.message };
    }

    const gmail = google.gmail({ version: 'v1', auth });

    let emailsSyncedCount = 0;
    
    // Get cursor from SyncState
    const syncState = await db.syncState.findUnique({
      where: { accountId_folderId: { accountId: account.id, folderId: 'INBOX' } }
    });
    let nextSyncToken = syncState?.cursor || null;

    try {
      // Ensure folder cache exists
      let dbFolder = await db.folder.findFirst({
        where: { accountId: account.id, name: 'INBOX' }
      });

      if (!dbFolder) {
        dbFolder = await db.folder.create({
          data: {
            accountId: account.id,
            name: 'INBOX',
            type: 'inbox',
            providerFolderId: 'INBOX'
          }
        });
      }

      // If we have a nextSyncToken, it is the last historyId. We perform a delta sync.
      if (nextSyncToken) {
        try {
          const historyResponse = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: nextSyncToken
          });

          const history = historyResponse.data.history || [];
          const messageIdsToFetch = new Set<string>();

          for (const item of history) {
            const messagesAdded = item.messagesAdded || [];
            for (const addition of messagesAdded) {
              if (addition.message?.id) {
                messageIdsToFetch.add(addition.message.id);
              }
            }
          }

          if (messageIdsToFetch.size > 0) {
            for (const msgId of messageIdsToFetch) {
              await this.fetchAndStoreGmailMessage(gmail, account.id, msgId, dbFolder.id);
              emailsSyncedCount++;
            }
          }

          // Update sync token to new history ID
          const profileResponse = await gmail.users.getProfile({ userId: 'me' });
          nextSyncToken = profileResponse.data.historyId || nextSyncToken;

          await db.syncState.upsert({
            where: { accountId_folderId: { accountId: account.id, folderId: dbFolder.id } },
            create: { accountId: account.id, folderId: dbFolder.id, cursor: nextSyncToken, lastSyncedAt: new Date() },
            update: { cursor: nextSyncToken, lastSyncedAt: new Date() }
          });

          return { success: true, emailsSynced: emailsSyncedCount, nextSyncToken };
        } catch (err: any) {
          // If history expired (HTTP 404/410), fall back to full/partial message listing
          if (err.code === 404 || err.code === 410) {
            nextSyncToken = null; // Reset sync token and drop into listing below
          } else {
            throw err;
          }
        }
      }

      // Initial Sync or Full sync fallback (fetch last 100 messages)
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 50, // Keep list tight for testing
        q: 'label:INBOX'
      });

      const messages = listResponse.data.messages || [];
      for (const msg of messages) {
        if (msg.id) {
          await this.fetchAndStoreGmailMessage(gmail, account.id, msg.id, dbFolder.id);
          emailsSyncedCount++;
        }
      }

      const profileResponse = await gmail.users.getProfile({ userId: 'me' });
      nextSyncToken = profileResponse.data.historyId || null;

      await db.syncState.upsert({
        where: { accountId_folderId: { accountId: account.id, folderId: dbFolder.id } },
        create: { accountId: account.id, folderId: dbFolder.id, cursor: nextSyncToken, lastSyncedAt: new Date() },
        update: { cursor: nextSyncToken, lastSyncedAt: new Date() }
      });

      return { success: true, emailsSynced: emailsSyncedCount, nextSyncToken };
    } catch (err: any) {
      console.error('Gmail Sync error:', err);
      return { success: false, emailsSynced: emailsSyncedCount, nextSyncToken, error: err.message || 'Gmail API error' };
    }
  }

  private async fetchAndStoreGmailMessage(
    gmail: any,
    accountId: string,
    messageId: string,
    inboxFolderId: string
  ) {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const msg = response.data;
    const headers = msg.payload?.headers || [];
    
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('subject') || '(No Subject)';
    const from = getHeader('from') || '';
    const toHeader = getHeader('to') || '';
    const ccHeader = getHeader('cc') || '';
    const bccHeader = getHeader('bcc') || '';
    
    // Extract clean email from sender, e.g. "Name <email@domain.com>" or just "email@domain.com"
    const fromEmailMatch = from.match(/<([^>]+)>/);
    const fromEmail = fromEmailMatch ? fromEmailMatch[1] : from;
    const fromName = from.split('<')[0]?.replace(/"/g, '')?.trim() || fromEmail;
    
    const receivedAt = new Date(parseInt(msg.internalDate || String(Date.now()), 10));
    const snippet = msg.snippet || '';

    // Check for newsletter unsubscribe header
    const listUnsubscribe = getHeader('list-unsubscribe');
    const listUnsubscribePost = getHeader('list-unsubscribe-post');
    const listId = getHeader('list-id');

    // Parse standard multi-recipients
    const parseRecipientHeader = (headerVal: string) => {
      if (!headerVal) return [];
      return headerVal.split(',').map(s => {
        const emailMatch = s.match(/<([^>]+)>/);
        const email = emailMatch ? emailMatch[1] : s.trim();
        const name = s.split('<')[0]?.replace(/"/g, '')?.trim() || email;
        return { name, email };
      });
    };

    const to = parseRecipientHeader(toHeader);
    const cc = parseRecipientHeader(ccHeader);
    const bcc = parseRecipientHeader(bccHeader);

    // Retrieve HTML/Plain body
    let bodyText = '';
    let bodyHtml = '';

    const parseParts = (parts: any[]) => {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText = Buffer.from(part.body.data, 'base64').toString('utf8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf8');
        } else if (part.parts) {
          parseParts(part.parts);
        }
      }
    };

    if (msg.payload?.parts) {
      parseParts(msg.payload.parts);
    } else if (msg.payload?.body?.data) {
      const data = Buffer.from(msg.payload.body.data, 'base64').toString('utf8');
      if (msg.payload.mimeType === 'text/html') {
        bodyHtml = data;
      } else {
        bodyText = data;
      }
    }

    const hasAttachments = !!(msg.payload?.parts && msg.payload.parts.some((p: any) => p.filename && p.filename.length > 0));

    // 1. Create or align Thread record
    const threadId = msg.threadId || messageId;
    await db.thread.upsert({
      where: { id: threadId },
      create: {
        id: threadId,
        accountId,
        subject,
        snippet,
        lastMessageAt: receivedAt,
        messageCount: 1,
        hasUnread: msg.labelIds?.includes('UNREAD') || false,
        isStarred: msg.labelIds?.includes('STARRED') || false,
        participants: JSON.stringify([{ name: fromName, email: fromEmail }])
      },
      update: {
        lastMessageAt: receivedAt,
        messageCount: { increment: 1 },
        hasUnread: msg.labelIds?.includes('UNREAD') ? true : undefined,
        isStarred: msg.labelIds?.includes('STARRED') ? true : undefined
      }
    });

    // 2. Upsert Message record
    const messageRecord = await db.message.upsert({
      where: { accountId_providerMessageId: { accountId, providerMessageId: messageId } },
      create: {
        id: messageId,
        accountId,
        threadId,
        providerMessageId: messageId,
        folderId: inboxFolderId,
        fromName,
        fromEmail,
        to: to as any,
        cc: cc as any,
        bcc: bcc as any,
        subject,
        snippet,
        receivedAt,
        sentAt: receivedAt,
        isRead: !msg.labelIds?.includes('UNREAD'),
        isStarred: msg.labelIds?.includes('STARRED') || false,
        hasAttachments,
        listUnsubscribe,
        listUnsubscribePost,
        listId
      },
      update: {
        isRead: !msg.labelIds?.includes('UNREAD'),
        isStarred: msg.labelIds?.includes('STARRED') || false
      }
    });

    // 3. Upsert Message Body record
    await db.messageBody.upsert({
      where: { messageId: messageRecord.id },
      create: {
        messageId: messageRecord.id,
        html: bodyHtml || bodyText || snippet,
        text: bodyText || snippet
      },
      update: {
        html: bodyHtml || bodyText || snippet,
        text: bodyText || snippet
      }
    });

    // 4. Handle Newsletter Tracking
    if (listUnsubscribe) {
      const senderName = from.split('<')[0]?.replace(/"/g, '')?.trim() || from;
      await db.subscription.upsert({
        where: {
          accountId_senderEmail: {
            accountId,
            senderEmail: fromEmail
          }
        },
        create: {
          accountId,
          senderEmail: fromEmail,
          senderDomain: fromEmail.split('@')[1] || '',
          senderName,
          messageCount: 1,
          lastReceivedAt: receivedAt,
          unsubscribeUrl: listUnsubscribe,
          status: 'active'
        },
        update: {
          messageCount: { increment: 1 },
          lastReceivedAt: receivedAt,
          unsubscribeUrl: listUnsubscribe
        }
      });
    }
  }
}
