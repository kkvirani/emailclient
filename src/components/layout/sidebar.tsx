"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  ShieldAlert,
  Star,
  Tags,
  MailX,
  Sparkles,
  LayoutDashboard,
  Settings,
  CircleDot,
} from "lucide-react";
import { cn, initials, colorFromString } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  shortcut?: string;
};

const MAILBOXES: NavItem[] = [
  { href: "/inbox", label: "Inbox", icon: Inbox, count: 0, shortcut: "g i" },
  { href: "/starred", label: "Starred", icon: Star, shortcut: "g s" },
  { href: "/sent", label: "Sent", icon: Send, shortcut: "g t" },
  { href: "/drafts", label: "Drafts", icon: FileText, shortcut: "g d" },
  { href: "/archive", label: "Archive", icon: Archive, shortcut: "g e" },
  { href: "/spam", label: "Spam", icon: ShieldAlert },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

const TOOLS: NavItem[] = [
  { href: "/unsubscribe", label: "Unsubscribe", icon: MailX },
  { href: "/views", label: "Smart Views", icon: Sparkles },
  { href: "/rules", label: "Rules", icon: Tags },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </div>
  );
}

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.count ? (
        <span className="text-xs tabular-nums text-muted-foreground">
          {item.count}
        </span>
      ) : item.shortcut ? (
        <span className="hidden font-mono text-[10px] text-muted-foreground/60 group-hover:inline">
          {item.shortcut}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ user }: { user?: { name?: string | null; email?: string | null; image?: string | null } }) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  if (collapsed) return null;

  const accountEmail = user?.email || "you@example.com";
  const accountName = user?.name || "Postal";

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Account switcher */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        {user?.image ? (
          <img
            src={user.image}
            alt={accountName}
            className="size-7 rounded-md object-cover"
          />
        ) : (
          <div
            className="flex size-7 items-center justify-center rounded-md text-[11px] font-semibold text-white"
            style={{ backgroundColor: colorFromString(accountEmail) }}
          >
            {initials(accountEmail)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{accountName}</div>
          <div className="truncate text-xs text-muted-foreground">
            {accountEmail}
          </div>
        </div>
        <CircleDot className="size-3.5 text-success" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <SectionLabel>Mailbox</SectionLabel>
        <div className="space-y-0.5">
          {MAILBOXES.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={pathname?.startsWith(item.href) ?? false}
            />
          ))}
        </div>

        <SectionLabel>Tools</SectionLabel>
        <div className="space-y-0.5">
          {TOOLS.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={pathname?.startsWith(item.href) ?? false}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-2">
        <NavRow
          item={{ href: "/settings", label: "Settings", icon: Settings }}
          active={pathname?.startsWith("/settings") ?? false}
        />
      </div>
    </aside>
  );
}
