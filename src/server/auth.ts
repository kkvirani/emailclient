import "server-only";

/**
 * Auth.js (NextAuth v5) configuration skeleton.
 *
 * Full provider wiring (Google / Microsoft) and the Prisma adapter land in
 * Phase 2 (see docs/10-ROADMAP.md). This module defines the single-user policy
 * and the shape we'll export, so the rest of the app can depend on it now.
 *
 * Single-user policy: only OWNER_EMAIL may sign in.
 */

export function isOwner(email: string | null | undefined): boolean {
  const owner = process.env.OWNER_EMAIL?.toLowerCase();
  if (!owner || !email) return false;
  return email.toLowerCase() === owner;
}

export const authConfig = {
  // Providers, adapter, callbacks, and session strategy are added in Phase 2.
  // Kept intentionally minimal to avoid pulling provider SDKs into the
  // foundation build before they're configured.
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "database" as const,
  },
};
