-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('gmail', 'outlook', 'imap');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'error', 'disconnected');

-- CreateEnum
CREATE TYPE "FolderType" AS ENUM ('inbox', 'sent', 'drafts', 'archive', 'spam', 'trash', 'custom');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('personal', 'work', 'newsletter', 'receipt', 'invoice', 'finance', 'travel', 'social', 'promotion', 'spam', 'other');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'unsubscribed', 'blocked', 'failed');

-- CreateEnum
CREATE TYPE "PostUnsubscribeAction" AS ENUM ('none', 'archive', 'delete', 'label');

-- CreateEnum
CREATE TYPE "RuleMatchType" AS ENUM ('all', 'any');

-- CreateEnum
CREATE TYPE "RuleConditionField" AS ENUM ('from', 'to', 'subject', 'body', 'has_attachment', 'list_id', 'category');

-- CreateEnum
CREATE TYPE "RuleOperator" AS ENUM ('contains', 'equals', 'matches', 'gt', 'lt');

-- CreateEnum
CREATE TYPE "RuleActionType" AS ENUM ('move', 'archive', 'delete', 'label', 'tag', 'mark_important', 'mark_read');

-- CreateEnum
CREATE TYPE "LabelType" AS ENUM ('system', 'user');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('idle', 'syncing', 'error');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "AuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "color" TEXT,
    "isUnifiedDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImapCredential" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImapCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerFolderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FolderType" NOT NULL DEFAULT 'custom',
    "parentId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerLabelId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "type" "LabelType" NOT NULL DEFAULT 'user',

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "subject" TEXT,
    "snippet" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 1,
    "hasUnread" BOOLEAN NOT NULL DEFAULT true,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "participants" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "threadId" TEXT,
    "providerMessageId" TEXT NOT NULL,
    "folderId" TEXT,
    "fromName" TEXT,
    "fromEmail" TEXT NOT NULL,
    "to" JSONB NOT NULL DEFAULT '[]',
    "cc" JSONB NOT NULL DEFAULT '[]',
    "bcc" JSONB NOT NULL DEFAULT '[]',
    "subject" TEXT,
    "snippet" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "listUnsubscribe" TEXT,
    "listUnsubscribePost" TEXT,
    "listId" TEXT,
    "category" "Category",
    "categoryConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageBody" (
    "messageId" TEXT NOT NULL,
    "html" TEXT,
    "text" TEXT,

    CONSTRAINT "MessageBody_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "MessageEmbedding" (
    "messageId" TEXT NOT NULL,
    "embedding" vector(1536),
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageEmbedding_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "providerAttachmentId" TEXT,
    "contentId" TEXT,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLabel" (
    "messageId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "MessageLabel_pkey" PRIMARY KEY ("messageId","labelId")
);

-- CreateTable
CREATE TABLE "MessageTag" (
    "messageId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MessageTag_pkey" PRIMARY KEY ("messageId","tagId")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderDomain" TEXT NOT NULL,
    "senderName" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "firstReceivedAt" TIMESTAMP(3),
    "lastReceivedAt" TIMESTAMP(3),
    "estMonthlyVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isNewsletter" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unsubscribeUrl" TEXT,
    "unsubscribeMailto" TEXT,
    "supportsOneClick" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "postUnsubscribeAction" "PostUnsubscribeAction" NOT NULL DEFAULT 'none',
    "labelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "matchType" "RuleMatchType" NOT NULL DEFAULT 'all',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleCondition" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "field" "RuleConditionField" NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "RuleCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleAction" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "type" "RuleActionType" NOT NULL,
    "value" TEXT,

    CONSTRAINT "RuleAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "query" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SmartView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "folderId" TEXT,
    "cursor" TEXT,
    "uidValidity" TEXT,
    "modSeq" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'idle',
    "error" TEXT,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" JSONB NOT NULL DEFAULT '{}',
    "result" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthAccount_provider_providerAccountId_key" ON "AuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_emailAddress_key" ON "Account"("userId", "emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_accountId_key" ON "OAuthToken"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ImapCredential_accountId_key" ON "ImapCredential"("accountId");

-- CreateIndex
CREATE INDEX "Folder_accountId_type_idx" ON "Folder"("accountId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_accountId_providerFolderId_key" ON "Folder"("accountId", "providerFolderId");

-- CreateIndex
CREATE INDEX "Label_accountId_idx" ON "Label"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_accountId_name_key" ON "Label"("accountId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Thread_accountId_lastMessageAt_idx" ON "Thread"("accountId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_accountId_folderId_receivedAt_idx" ON "Message"("accountId", "folderId", "receivedAt");

-- CreateIndex
CREATE INDEX "Message_accountId_isRead_idx" ON "Message"("accountId", "isRead");

-- CreateIndex
CREATE INDEX "Message_accountId_fromEmail_idx" ON "Message"("accountId", "fromEmail");

-- CreateIndex
CREATE INDEX "Message_accountId_category_idx" ON "Message"("accountId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Message_accountId_providerMessageId_key" ON "Message"("accountId", "providerMessageId");

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");

-- CreateIndex
CREATE INDEX "Subscription_accountId_status_idx" ON "Subscription"("accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_accountId_senderEmail_key" ON "Subscription"("accountId", "senderEmail");

-- CreateIndex
CREATE INDEX "Rule_accountId_idx" ON "Rule"("accountId");

-- CreateIndex
CREATE INDEX "RuleCondition_ruleId_idx" ON "RuleCondition"("ruleId");

-- CreateIndex
CREATE INDEX "RuleAction_ruleId_idx" ON "RuleAction"("ruleId");

-- CreateIndex
CREATE INDEX "SmartView_userId_idx" ON "SmartView"("userId");

-- CreateIndex
CREATE INDEX "SyncState_accountId_idx" ON "SyncState"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_accountId_folderId_key" ON "SyncState"("accountId", "folderId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthAccount" ADD CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD CONSTRAINT "OAuthToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImapCredential" ADD CONSTRAINT "ImapCredential_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBody" ADD CONSTRAINT "MessageBody_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageEmbedding" ADD CONSTRAINT "MessageEmbedding_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLabel" ADD CONSTRAINT "MessageLabel_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLabel" ADD CONSTRAINT "MessageLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTag" ADD CONSTRAINT "MessageTag_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTag" ADD CONSTRAINT "MessageTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCondition" ADD CONSTRAINT "RuleCondition_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAction" ADD CONSTRAINT "RuleAction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartView" ADD CONSTRAINT "SmartView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncState" ADD CONSTRAINT "SyncState_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
