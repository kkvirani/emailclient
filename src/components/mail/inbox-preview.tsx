"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Paperclip,
  Star,
  Archive,
  Trash2,
  MailOpen,
  Sparkles,
} from "lucide-react";
import { cn, initials, colorFromString, formatRelativeTime } from "@/lib/utils";
import { useSelectionStore } from "@/stores/selection";
import { Button } from "@/components/ui/button";

/**
 * Foundation-phase preview of the inbox surface. It demonstrates the design
 * system, density, selection model, and bulk action bar. Real, synced data
 * replaces this mock in Phase 3/4.
 */

type DemoCategory =
  | "personal"
  | "work"
  | "newsletter"
  | "receipt"
  | "promotion";

interface DemoMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  receivedAt: number;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  category: DemoCategory;
}

const now = Date.now();
const DEMO: DemoMessage[] = [
  {
    id: "1",
    fromName: "Linear",
    fromEmail: "team@linear.app",
    subject: "Your weekly project digest",
    snippet: "12 issues completed, 3 in review. Cycle 14 is on track to finish early…",
    receivedAt: now - 1000 * 60 * 12,
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    category: "work",
  },
  {
    id: "2",
    fromName: "Amazon",
    fromEmail: "auto-confirm@amazon.com",
    subject: "Your order has shipped",
    snippet: "Arriving tomorrow by 9 PM. Track your package and manage delivery…",
    receivedAt: now - 1000 * 60 * 60 * 3,
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    category: "receipt",
  },
  {
    id: "3",
    fromName: "Sarah Chen",
    fromEmail: "sarah@example.com",
    subject: "Re: Dinner this weekend?",
    snippet: "Saturday works great! Let's do the new place downtown. I'll book a table…",
    receivedAt: now - 1000 * 60 * 60 * 6,
    isRead: true,
    isStarred: true,
    hasAttachments: false,
    category: "personal",
  },
  {
    id: "4",
    fromName: "Stripe",
    fromEmail: "receipts@stripe.com",
    subject: "Your receipt from Acme Inc.",
    snippet: "Receipt #2049-1183. Amount: $29.00. Thank you for your business…",
    receivedAt: now - 1000 * 60 * 60 * 26,
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    category: "receipt",
  },
  {
    id: "5",
    fromName: "The Hustle",
    fromEmail: "news@thehustle.co",
    subject: "🔥 The AI gold rush nobody is talking about",
    snippet: "Plus: a 23-year-old just sold his startup for $50M. Here's how…",
    receivedAt: now - 1000 * 60 * 60 * 30,
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    category: "newsletter",
  },
  {
    id: "6",
    fromName: "Nike",
    fromEmail: "promo@notifications.nike.com",
    subject: "40% off ends tonight ⏰",
    snippet: "Your favorites are on sale. Don't miss out on members-only pricing…",
    receivedAt: now - 1000 * 60 * 60 * 48,
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    category: "promotion",
  },
];

const CATEGORY_STYLES: Record<DemoCategory, string> = {
  personal: "bg-blue-500/12 text-blue-500",
  work: "bg-violet-500/12 text-violet-500",
  newsletter: "bg-amber-500/12 text-amber-500",
  receipt: "bg-emerald-500/12 text-emerald-500",
  promotion: "bg-pink-500/12 text-pink-500",
};

function CategoryBadge({ category }: { category: DemoCategory }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
        CATEGORY_STYLES[category]
      )}
    >
      {category}
    </span>
  );
}

function MessageRow({ m, isActive, onSelect }: { m: any; isActive: boolean; onSelect: (id: string) => void }) {
  const isSelected = useSelectionStore((s) => s.isSelected(m.id));
  const toggle = useSelectionStore((s) => s.toggle);
  const receivedAtMs = typeof m.receivedAt === 'string' ? new Date(m.receivedAt).getTime() : m.receivedAt;
  const category = (["personal", "work", "newsletter", "receipt", "promotion"].includes(m.category) ? m.category : "personal") as DemoCategory;

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-3 border-b border-border/60 px-4 py-2.5 transition-colors",
        isSelected ? "bg-primary/5" : isActive ? "bg-primary/10" : "hover:bg-accent/40",
        !m.isRead && "bg-card"
      )}
      onClick={() => onSelect(m.id)}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggle(m.id)}
        onClick={(e) => e.stopPropagation()}
        className="size-4 shrink-0 rounded border-border accent-primary"
        aria-label={`Select email from ${m.fromName}`}
      />

      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: colorFromString(m.fromEmail) }}
      >
        {initials(m.fromName || "Unknown")}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              m.isRead ? "text-foreground/80" : "font-semibold text-foreground"
            )}
          >
            {m.fromName || m.fromEmail}
          </span>
          {!m.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          <CategoryBadge category={category} />
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(receivedAtMs)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              m.isRead ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {m.subject}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            — {m.snippet}
          </span>
        </div>
      </div>

      {/* Hover quick actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {m.hasAttachments && (
          <Paperclip className="size-3.5 text-muted-foreground" />
        )}
        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
          <Archive className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
          <Trash2 className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
          <Star className={cn("size-3.5", m.isStarred && "fill-amber-400 text-amber-400")} />
        </Button>
      </div>
    </div>
  );
}

function BulkActionBar() {
  const count = useSelectionStore((s) => s.count());
  const clear = useSelectionStore((s) => s.clear);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 12, opacity: 0 }}
      className="glass absolute inset-x-0 bottom-4 mx-auto flex w-fit items-center gap-2 rounded-full px-3 py-2 shadow-xl"
    >
      <span className="px-2 text-sm font-medium tabular-nums">
        {count} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm"><Archive className="size-4" />Archive</Button>
      <Button variant="ghost" size="sm"><Trash2 className="size-4" />Delete</Button>
      <Button variant="ghost" size="sm"><MailOpen className="size-4" />Read</Button>
      <Button variant="ghost" size="sm"><Sparkles className="size-4" />AI</Button>
      <div className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
    </motion.div>
  );
}

export function InboxPreview() {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeMessage, setActiveMessage] = React.useState<any | null>(null);
  const [bodyLoading, setBodyLoading] = React.useState(false);

  const fetchMessages = React.useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Check database for new emails every 15 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Fetch full body when activeId changes
  React.useEffect(() => {
    if (!activeId) {
      setActiveMessage(null);
      return;
    }

    const demoMsg = DEMO.find(m => m.id === activeId);
    if (demoMsg) {
      setActiveMessage({
        ...demoMsg,
        body: {
          html: `<div style="font-family: sans-serif; color: #333; line-height: 1.6; padding: 20px;">
            <h3 style="color: var(--primary, #6d28d9); margin-top: 0;">Postal Premium Preview</h3>
            <p>${demoMsg.snippet}</p>
            <p style="color: #666; font-size: 13px;">This is a demonstration mockup email. Complete your Google Client verification on Google Cloud Console and sign in with Google to sync and read real email content.</p>
          </div>`
        }
      });
      return;
    }

    const fetchBody = async () => {
      setBodyLoading(true);
      try {
        const res = await fetch(`/api/messages/${activeId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveMessage(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBodyLoading(false);
      }
    };

    fetchBody();
  }, [activeId]);

  const handleSync = React.useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/accounts/sync", { method: "POST" });
      if (res.ok) {
        await fetchMessages();
      }
    } catch (e) {
      console.error("Failed to sync:", e);
    } finally {
      setSyncing(false);
    }
  }, [fetchMessages]);

  // Trigger background Google API sync every 60 seconds (1 minute)
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!syncing) {
        handleSync();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [handleSync, syncing]);

  const getHtmlWithBaseTarget = (htmlString: string) => {
    if (!htmlString) return "";
    // Inject <base target="_blank"> to force all links to open in a new tab
    if (htmlString.toLowerCase().includes("<head>")) {
      return htmlString.replace(/<head>/i, "<head><base target=\"_blank\">");
    }
    return `<base target="_blank">${htmlString}`;
  };

  const listToRender = messages.length > 0 ? messages : DEMO;

  return (
    <div className="relative flex h-full w-full flex-row overflow-hidden">
      {/* List Pane */}
      <div className={cn(
        "flex h-full flex-col border-r border-border transition-all duration-300",
        activeId ? "w-[40%] min-w-[360px]" : "w-full"
      )}>
        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            {messages.length > 0 
              ? `Showing ${messages.length} real synced email(s)` 
              : "No synced emails yet. Showing demo emails. Click Sync to fetch."}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="h-6 rounded px-2.5 text-[10px] font-semibold bg-transparent hover:bg-muted"
          >
            {syncing ? "Syncing..." : "Sync (Refresh)"}
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground animate-pulse">
              Loading inbox items...
            </div>
          ) : (
            listToRender.map((m) => (
              <MessageRow 
                key={m.id} 
                m={m} 
                isActive={activeId === m.id}
                onSelect={(id) => {
                  setActiveId(id);
                  // Optimistically update read state in UI list
                  setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
                  // Call API to persist read state if not a demo item
                  if (!DEMO.some(d => d.id === id)) {
                    fetch(`/api/messages/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isRead: true })
                    }).catch(err => console.error("Failed to mark as read:", err));
                  }
                }}
              />
            ))
          )}
        </div>
        <BulkActionBar />
      </div>

      {/* Reading Pane */}
      {activeId && (
        <div className="flex flex-1 flex-col h-full bg-card overflow-hidden">
          {/* Header toolbar */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 bg-muted/20">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (activeMessage && !activeMessage.isRead) {
                    activeMessage.isRead = true;
                    setMessages(prev => prev.map(m => m.id === activeId ? { ...m, isRead: true } : m));
                  }
                }}
              >
                Mark Read
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveId(null)}
              className="text-xs"
            >
              Close (Esc)
            </Button>
          </div>

          {/* Mail Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {bodyLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">
                Loading email body...
              </div>
            ) : activeMessage ? (
              <div className="flex flex-col h-full">
                <h2 className="text-xl font-bold mb-4 tracking-tight text-foreground animate-in fade-in slide-in-from-top-1 duration-200">
                  {activeMessage.subject || "(No Subject)"}
                </h2>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: colorFromString(activeMessage.fromEmail) }}
                  >
                    {initials(activeMessage.fromName || "Unknown")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{activeMessage.fromName || activeMessage.fromEmail}</div>
                    <div className="text-xs text-muted-foreground">{activeMessage.fromEmail}</div>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {new Date(activeMessage.receivedAt).toLocaleString()}
                  </div>
                </div>
                
                {/* Render body inside a clean sandboxed iframe */}
                <div className="flex-1 border border-border/40 rounded-xl overflow-hidden bg-white min-h-[300px] shadow-sm">
                  <iframe
                    srcDoc={activeMessage.body?.html ? getHtmlWithBaseTarget(activeMessage.body.html) : `<pre style="font-family: sans-serif; padding: 20px; margin: 0; white-space: pre-wrap; word-break: break-all; color: #333; line-height: 1.6;">${activeMessage.body?.text || activeMessage.snippet}</pre>`}
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts"
                    title="Email Body"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select an email to read.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
