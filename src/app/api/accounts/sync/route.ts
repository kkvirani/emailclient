import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { runSyncForAccount } from "@/lib/sync/sync-queue";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email.toLowerCase() }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const accounts = await db.account.findMany({
    where: { userId: user.id }
  });

  let totalSynced = 0;
  const results = [];

  for (const account of accounts) {
    try {
      const res = await runSyncForAccount(account.id);
      results.push({
        email: account.emailAddress,
        success: res.success,
        emailsSynced: res.emailsSynced,
        error: res.error
      });
      if (res.success) {
        totalSynced += res.emailsSynced;
      }
    } catch (err: any) {
      results.push({
        email: account.emailAddress,
        success: false,
        emailsSynced: 0,
        error: err.message || "Failed running sync execution"
      });
    }
  }

  return NextResponse.json({ success: true, totalSynced, results });
}
