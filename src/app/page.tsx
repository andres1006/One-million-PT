import Link from "next/link";
import { ArrowRight, Sparkles, Users, LineChart } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Users,
    title: "Gestión de leads",
    description:
      "CRUD completo con filtros, búsqueda y paginación sobre la tabla.",
    href: "/leads",
  },
  {
    icon: LineChart,
    title: "Dashboard",
    description:
      "Métricas clave: total, promedio de presupuesto, últimos 7 días, fuente top.",
    href: "/",
  },
  {
    icon: Sparkles,
    title: "Resumen con IA",
    description:
      "Genera un análisis ejecutivo con recomendaciones accionables.",
    href: "/ai-summary",
  },
] as const;

export default function HomePage() {
  return (
    <AppShell title="Dashboard">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <section className="flex flex-col gap-3">
          <span className="w-fit rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground">
            Fase 0 · scaffold listo
          </span>
          <h2 className="text-3xl font-semibold tracking-tight">
            Panel de leads de One Million Copy
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Interfaz 100% frontend para visualizar, filtrar y gestionar los
            leads provenientes de los embudos de marketing. Esta pantalla se
            reemplazará en la Fase 4 por el dashboard con métricas reales.
          </p>
          <div className="flex gap-3">
            <Link href="/leads" className={cn(buttonVariants())}>
              Ver leads <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/ai-summary"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Resumen con IA
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, href }) => (
            <Card key={title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={href}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Abrir
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
