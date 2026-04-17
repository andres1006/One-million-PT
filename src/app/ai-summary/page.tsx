import { AppShell } from "@/components/layout/app-shell";
import { AiSummaryView } from "@/components/ai/ai-summary-view";

export default function AiSummaryPage() {
  return (
    <AppShell title="Resumen con IA">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Resumen inteligente
          </h2>
          <p className="text-sm text-muted-foreground">
            Genera un análisis ejecutivo de los leads aplicando filtros por
            fuente y rango de fechas. Si hay <code>OPENAI_API_KEY</code>{" "}
            configurada usa OpenAI, de lo contrario cae automáticamente al
            motor heurístico local.
          </p>
        </header>

        <AiSummaryView />
      </div>
    </AppShell>
  );
}
