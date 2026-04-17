"use client";

import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { createQueryClient } from "@/lib/query-client";

/**
 * Opt-in MSW bootstrap.
 *
 * The app ships real Next.js route handlers under `/api/*` (see
 * `src/app/api/leads` and `src/app/api/webhooks`), so by default the
 * client talks to the server directly via React Query + fetch. MSW is
 * kept as an optional offline mode (`NEXT_PUBLIC_MOCKS=on`) for local
 * demos or when the server is intentionally unavailable.
 */
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
