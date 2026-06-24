"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal CSS-only tooltip for the foundation phase.
 * (Will be swapped for the Radix-based shadcn Tooltip when @radix-ui is added.)
 */
export function Tooltip({
  content,
  children,
  side = "bottom",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const pos = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[side];

  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover/tooltip:block",
          pos
        )}
      >
        {content}
      </span>
    </span>
  );
}
