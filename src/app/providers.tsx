"use client";

import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { createQueryClient } from "@/lib/query-client";

async function bootstrapMocks() {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_MOCKS !== "on") return;
  const { worker } = await import("@/infrastructure/mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createQueryClient());
  const [ready, setReady] = useState(
    process.env.NEXT_PUBLIC_MOCKS !== "on",
  );

  useEffect(() => {
    if (ready) return;
    bootstrapMocks().finally(() => setReady(true));
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={client}>
        {children}
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools buttonPosition="bottom-right" />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
