import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { encrypt } from "@/server/crypto";
import { isOwner } from "@/server/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send",
          access_type: "offline",
          prompt: "consent",
        }
      }
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Mock Sign In",
      credentials: {},
      async authorize() {
        // Enforce mock details matching owner email to bypass auth checks locally
        const email = (process.env.OWNER_EMAIL || "k3vin.virani@gmail.com").toLowerCase();
        
        const dbUser = await db.user.upsert({
          where: { email },
          create: {
            email,
            name: "Kevin Virani (Mock)",
          },
          update: {
            name: "Kevin Virani (Mock)",
          }
        });

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
        };
      }
    })
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && account.access_token && user.email) {
        // Enforce single-user owner policy
        if (!isOwner(user.email)) {
          console.warn(`Sign-in rejected: ${user.email} is not the owner.`);
          return false;
        }

        // 1. Create or update user details
        const dbUser = await db.user.upsert({
          where: { email: user.email.toLowerCase() },
          create: {
            email: user.email.toLowerCase(),
            name: user.name,
            image: user.image,
          },
          update: {
            name: user.name,
            image: user.image,
          }
        });

        // 2. Save AuthAccount mapping for NextAuth session verification
        await db.authAccount.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
            id_token: account.id_token,
          }
        });

        // 3. Connect mailbox connection Account record
        const mailboxAccount = await db.account.upsert({
          where: {
            userId_emailAddress: {
              userId: dbUser.id,
              emailAddress: user.email.toLowerCase()
            }
          },
          create: {
            userId: dbUser.id,
            provider: 'gmail',
            emailAddress: user.email.toLowerCase(),
            displayName: user.name || 'Primary Gmail',
            status: 'active'
          },
          update: {
            status: 'active'
          }
        });

        // 4. Encrypt access and refresh tokens. 
        // We pack both tokens together to save securely using the single iv/authTag columns.
        const payloadToEncrypt = JSON.stringify({
          accessToken: account.access_token,
          refreshToken: account.refresh_token || ''
        });
        
        const encryptedPayload = encrypt(payloadToEncrypt);
        
        await db.oAuthToken.upsert({
          where: { accountId: mailboxAccount.id },
          create: {
            accountId: mailboxAccount.id,
            accessToken: encryptedPayload.ciphertext,
            refreshToken: account.refresh_token ? encrypt(account.refresh_token).ciphertext : null,
            iv: encryptedPayload.iv,
            authTag: encryptedPayload.authTag,
            keyVersion: encryptedPayload.keyVersion,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            scope: account.scope
          },
          update: {
            accessToken: encryptedPayload.ciphertext,
            refreshToken: account.refresh_token ? encrypt(account.refresh_token).ciphertext : null,
            iv: encryptedPayload.iv,
            authTag: encryptedPayload.authTag,
            keyVersion: encryptedPayload.keyVersion,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            scope: account.scope
          }
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && session.user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email.toLowerCase() }
        });
        if (dbUser) {
          (session.user as any).id = dbUser.id;
        }
      }
      return session;
    }
  }
});
