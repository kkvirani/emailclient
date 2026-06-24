import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";

export async function GET() {
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

  // Retrieve emails normalized into db Messages for the authenticated user
  const messages = await db.message.findMany({
    where: {
      account: {
        userId: user.id
      }
    },
    include: {
      account: {
        select: {
          emailAddress: true
        }
      }
    },
    orderBy: {
      receivedAt: "desc"
    },
    take: 50
  });

  return NextResponse.json(messages);
}
