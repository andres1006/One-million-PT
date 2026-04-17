"use client";

import { useState } from "react";
import { Webhook } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { EventsLog } from "./events-log";
import { InboundEndpointsCard } from "./inbound-endpoints-card";
import { WebhooksList } from "./webhooks-list";

type Tab = "inbound" | "outbound" | "log";

export function AutomationsView() {
  const [tab, setTab] = useState<Tab>("inbound");

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as Tab)}
      className="gap-6"
    >
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="size-4" /> Cómo funciona
          </CardTitle>
          <CardDescription>
            Los canales de tus funnels (CRM, ads, landings) envían leads por
            HTTP a los <strong>webhooks de entrada</strong>. Cada evento
            resultante (<code>lead.created</code>, <code>lead.updated</code>,
            <code>lead.deleted</code>, <code>lead.inbound</code>) se reparte a
            los <strong>webhooks de salida</strong> que estén habilitados, para
            sincronizar con tu CRM o disparar campañas. Todo queda registrado
            en la bitácora.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <StepCard
            n={1}
            title="Captura el lead"
            desc="Tu funnel hace POST al endpoint de entrada del canal (Instagram, Facebook, landing, CRM…)."
          />
          <StepCard
            n={2}
            title="Normaliza y persiste"
            desc="El servidor valida el payload (Zod), crea el lead y alimenta el dashboard con React Query."
          />
          <StepCard
            n={3}
            title="Dispara automatizaciones"
            desc="Cada webhook de salida habilitado recibe el evento con firma opcional y queda trazado en la bitácora."
          />
        </CardContent>
      </Card>

      <TabsList>
        <TabsTrigger value="inbound">Entrada</TabsTrigger>
        <TabsTrigger value="outbound">Salida</TabsTrigger>
        <TabsTrigger value="log">Bitácora</TabsTrigger>
      </TabsList>

      <TabsContent value="inbound" className="flex flex-col gap-4">
        <InboundEndpointsCard />
      </TabsContent>

      <TabsContent value="outbound" className="flex flex-col gap-4">
        <WebhooksList />
      </TabsContent>

      <TabsContent value="log" className="flex flex-col gap-4">
        <EventsLog />
      </TabsContent>
    </Tabs>
  );
}

function StepCard({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="accent-gradient grid size-6 place-items-center rounded-md text-[11px] font-semibold text-white">
          {n}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
