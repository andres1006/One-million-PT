import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { LeadsView } from "@/components/leads/leads-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsPage() {
  return (
    <AppShell title="Leads">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Gestión de leads
          </h2>
          <p className="text-sm text-muted-foreground">
            Busca, filtra, edita o registra nuevos leads. Los cambios se
            sincronizan con la API mock.
          </p>
        </header>

        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <LeadsView />
        </Suspense>
      </div>
    </AppShell>
  );
}
