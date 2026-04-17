import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function HomePage() {
  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Panel de leads
          </h2>
          <p className="text-sm text-muted-foreground">
            Resumen ejecutivo del estado actual de la base de leads: volumen,
            presupuesto promedio, tendencia reciente y canal dominante.
          </p>
        </header>

        <DashboardView />
      </div>
    </AppShell>
  );
}
