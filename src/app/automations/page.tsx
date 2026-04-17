import { AppShell } from "@/components/layout/app-shell";
import { AutomationsView } from "@/components/automations/automations-view";

export default function AutomationsPage() {
  return (
    <AppShell title="Automatizaciones">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Automatizaciones · Webhooks
          </h2>
          <p className="text-sm text-muted-foreground">
            Conecta tus canales de funnel con tu CRM y tus plataformas de
            campañas. Entrada y salida, con trazabilidad en tiempo real.
          </p>
        </header>
        <AutomationsView />
      </div>
    </AppShell>
  );
}
