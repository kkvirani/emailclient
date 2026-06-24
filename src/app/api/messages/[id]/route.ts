import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { google } from "googleapis";
import { decrypt } from "@/server/crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Retrieve full message detail including text/HTML body
  const message = await db.message.findUnique({
    where: { id },
    include: {
      body: true,
      attachments: true
    }
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(message);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json();

  const message = await db.message.findUnique({
    where: { id },
    include: {
      account: true
    }
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (typeof json.isRead === "boolean") updateData.isRead = json.isRead;
  if (typeof json.isStarred === "boolean") updateData.isStarred = json.isStarred;

  // 1. Update local database
  const updatedMessage = await db.message.update({
    where: { id },
    data: updateData
  });

  // 2. Propagate updates back to Google (Gmail)
  if (message.account.provider === "gmail") {
    try {
      const oauthToken = await db.oAuthToken.findUnique({
        where: { accountId: message.accountId }
      });
      
      if (oauthToken) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.AUTH_URL || 'http://localhost:3001'}/api/auth/callback/google`
        );

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

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        
        // Sync Read/Unread status
        if (typeof json.isRead === "boolean") {
          await gmail.users.messages.modify({
            userId: "me",
            id: message.providerMessageId,
            requestBody: {
              removeLabelIds: json.isRead ? ["UNREAD"] : [],
              addLabelIds: json.isRead ? [] : ["UNREAD"]
            }
          });
        }

        // Sync Starred status
        if (typeof json.isStarred === "boolean") {
          await gmail.users.messages.modify({
            userId: "me",
            id: message.providerMessageId,
            requestBody: {
              removeLabelIds: json.isStarred ? [] : ["STARRED"],
              addLabelIds: json.isStarred ? ["STARRED"] : []
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to sync read/starred status back to Gmail:", err);
    }
  }

  return NextResponse.json(updatedMessage);
}
