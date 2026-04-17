"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  WEBHOOK_EVENT_LABEL,
  type WebhookEventName,
} from "@/domain/webhook";
import { useWebhookEvents } from "@/application/hooks/useWebhooks";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRelative } from "@/lib/formatters";

export function EventsLog() {
  const query = useWebhookEvents(50);
  const events = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bitácora de eventos</CardTitle>
        <CardDescription>
          Historial en tiempo real (polling cada 5s) de cada entrega saliente y
          de cada lead entrante. Los 50 eventos más recientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay eventos. Crea o edita un lead (o simula un inbound) para
            ver el tráfico aquí.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Cuándo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>
                      {ev.direction === "outbound" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <ArrowUpFromLine className="size-3.5 text-sky-500" />
                          Saliente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <ArrowDownToLine className="size-3.5 text-emerald-500" />
                          Entrante
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {WEBHOOK_EVENT_LABEL[ev.event as WebhookEventName] ??
                          ev.event}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ev.status === "success" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          {ev.httpStatus ?? "ok"}
                        </span>
                      ) : ev.status === "skipped" ? (
                        <span className="text-xs text-muted-foreground">
                          ignorado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
                          <XCircle className="size-3.5" />
                          {ev.httpStatus ?? "error"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="truncate text-sm">{ev.summary}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {ev.message}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right text-xs text-muted-foreground"
                      title={formatDate(ev.attemptedAt)}
                    >
                      {formatRelative(ev.attemptedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
