"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Keep a stable client across re-renders.
  const [client] = React.useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
