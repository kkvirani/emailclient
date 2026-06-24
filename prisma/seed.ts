/**
 * Database seed — creates the single owner user and a few system smart views.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL ?? "you@example.com";

  const user = await db.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: "Owner",
      settings: { theme: "dark", density: "comfortable" },
    },
  });

  const systemViews = [
    { name: "Requires Reply", icon: "reply", query: { requiresReply: true } },
    { name: "VIP Contacts", icon: "star", query: { vip: true } },
    { name: "Newsletters", icon: "newspaper", query: { category: "newsletter" } },
    { name: "Receipts", icon: "receipt", query: { category: "receipt" } },
    { name: "Invoices", icon: "file", query: { category: "invoice" } },
    { name: "Travel", icon: "plane", query: { category: "travel" } },
    { name: "Unread", icon: "mail", query: { isRead: false } },
    { name: "Attachments", icon: "paperclip", query: { hasAttachments: true } },
  ];

  for (let i = 0; i < systemViews.length; i++) {
    const v = systemViews[i];
    await db.smartView.upsert({
      where: { id: `system-${i}` },
      update: { name: v.name, icon: v.icon, query: v.query, order: i },
      create: {
        id: `system-${i}`,
        userId: user.id,
        name: v.name,
        icon: v.icon,
        query: v.query,
        order: i,
        isSystem: true,
      },
    });
  }

  console.log(`Seeded owner user ${user.email} and ${systemViews.length} smart views.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
