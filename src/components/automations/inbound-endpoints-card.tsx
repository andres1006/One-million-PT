"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Check, Copy, Link2, PlayCircle } from "lucide-react";

import {
  INBOUND_SOURCES,
  type InboundSource,
} from "@/domain/webhook";
import { useQueryClient } from "@tanstack/react-query";
import { leadQueryKeys } from "@/application/hooks/useLeads";
import { webhookQueryKeys } from "@/application/hooks/useWebhooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Returns `window.location.origin` on the client, empty string while SSR'ing.
 * Implemented with `useSyncExternalStore` so we don't trigger the
 * `react-hooks/set-state-in-effect` lint rule (and to avoid hydration jitter).
 */
function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

interface Props {
  onSimulated?: () => void;
}

/**
 * Dedicated card for the inbound webhook endpoints.
 *
 * It renders the copy-paste URL (one per channel) plus a “Simular” button
 * that POSTs a synthetic lead to the endpoint, so the user can see the full
 * loop (inbound → lead created → outbound fan-out → delivery log) without
 * leaving the browser.
 */
export function InboundEndpointsCard({ onSimulated }: Props) {
  const origin = useOrigin();
  const qc = useQueryClient();
  const [source, setSource] = useState<InboundSource>("instagram");
  const [copied, setCopied] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const endpoint = origin
    ? `${origin}/api/webhooks/inbound/${source}`
    : `/api/webhooks/inbound/${source}`;

  async function simulateInbound() {
    setSimulating(true);
    try {
      const payload = {
        name: "Lead simulado",
        email: `sim-${Math.random().toString(36).slice(2, 7)}@example.com`,
        phone: "+57 300 000 0000",
        product: "Demo funnel",
        budget: 500,
      };
      const res = await fetch(`/api/webhooks/inbound/${source}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success(`Lead entrante registrado desde ${source}`);
      qc.invalidateQueries({ queryKey: leadQueryKeys.all });
      qc.invalidateQueries({ queryKey: webhookQueryKeys.all });
      onSimulated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo simular el evento",
      );
    } finally {
      setSimulating(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopied(source);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="size-4" />
          Webhooks de entrada
        </CardTitle>
        <CardDescription>
          Cada canal de funnel (CRM, campañas, landings) puede enviar leads por
          HTTP POST a estas URLs. El payload se normaliza, el lead se crea y se
          dispara el evento <code>lead.inbound</code> + <code>lead.created</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="inbound-source"
              className="text-xs font-medium text-muted-foreground"
            >
              Canal
            </label>
            <Select
              value={source}
              onValueChange={(v) => setSource(v as InboundSource)}
            >
              <SelectTrigger id="inbound-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INBOUND_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="inbound-url"
              className="text-xs font-medium text-muted-foreground"
            >
              Endpoint
            </label>
            <div className="flex items-center gap-2">
              <code
                id="inbound-url"
                className="flex-1 truncate rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs"
              >
                {endpoint}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copiar URL"
                title="Copiar URL"
                onClick={copy}
              >
                {copied === source ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border/50 bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ejemplo curl
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted-foreground">
{`curl -X POST ${endpoint} \\
  -H 'content-type: application/json' \\
  -d '{"name":"María","email":"maria@example.com","phone":"+57 300 111 2233","product":"Curso","budget":450}'`}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            ¿Quieres ver cómo se ve en la app? Enviamos un lead de prueba al
            endpoint actual y puedes observar la trazabilidad en la bitácora.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={simulateInbound}
            disabled={simulating}
          >
            <PlayCircle className="size-4" />
            {simulating ? "Simulando…" : "Simular evento entrante"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
